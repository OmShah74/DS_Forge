import pandas as pd
import numpy as np
import joblib
import os
import uuid
from sqlalchemy.orm import Session
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder

from app.db.models import TrainingRun, Dataset
from app.model_zoo.registry import ModelRegistry
from app.core.config import settings

class TrainingEngine:
    @staticmethod
    def run_training_job(run_id: int, db: Session):
        """
        Background task to execute training.
        """
        run = db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
        if not run:
            return

        try:
            # 1. Update Status
            run.status = "running"
            db.commit()

            # 2. Load Dataset
            dataset = db.query(Dataset).filter(Dataset.id == run.dataset_id).first()
            df = pd.read_parquet(dataset.file_path)

            # 3. Prepare X (Features) and y (Target)
            target = run.target_column
            if target not in df.columns:
                raise ValueError(f"Target column '{target}' not found in dataset")

            X = df.drop(columns=[target])
            y = df[target]

            # 4. Basic Preprocessing (Handle Text for V1)
            # In V2, this will be more robust. For now, we LabelEncode object columns.
            for col in X.select_dtypes(include=['object', 'category']).columns:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
            
            if y.dtype == 'object':
                y = LabelEncoder().fit_transform(y)

            # 5. Split Data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

            # 6. Initialize Model
            model_info = ModelRegistry.get_model(run.model_name)
            if not model_info:
                raise ValueError(f"Model '{run.model_name}' not found in registry")

            # Merge default params with user params
            params = run.parameters or {}
            clf = model_info["class"](**params)

            # 7. Train
            clf.fit(X_train, y_train)

            # 8. Evaluate
            preds = clf.predict(X_test)
            metrics = {}

            if model_info["type"] == "classification":
                metrics["accuracy"] = float(accuracy_score(y_test, preds))
                metrics["f1_weighted"] = float(f1_score(y_test, preds, average='weighted'))
            else:
                metrics["rmse"] = float(np.sqrt(mean_squared_error(y_test, preds)))
                metrics["r2"] = float(r2_score(y_test, preds))

            # 9. Save Artifact
            model_filename = f"{uuid.uuid4()}.joblib"
            save_path = os.path.join(settings.MODEL_DIR, model_filename)
            joblib.dump(clf, save_path)

            # 10. Complete Run
            run.status = "completed"
            run.metrics = metrics
            run.artifact_path = save_path
            db.commit()

        except Exception as e:
            run.status = "failed"
            run.error_message = str(e)
            db.commit()
            print(f"Training Failed: {e}")