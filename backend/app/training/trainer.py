import pandas as pd
import numpy as np
import joblib
import os
import uuid
from sqlalchemy.orm import Session
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, r2_score, confusion_matrix
from sklearn.preprocessing import LabelEncoder

from app.db.models import TrainingRun, Dataset
from app.model_zoo.registry import ModelRegistry
from app.core.config import settings

class TrainingEngine:
    @staticmethod
    def run_training_job(run_id: int, db: Session):
        """
        Background task to execute training AND detailed evaluation.
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
                raise ValueError(f"Target column '{target}' not found")

            X = df.drop(columns=[target])
            y = df[target]

            # 4. Preprocessing (Simple Label Encoding for V1)
            # Save encoders in V2 for inference safety
            for col in X.select_dtypes(include=['object', 'category']).columns:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
            
            y_is_categorical = False
            if y.dtype == 'object' or ModelRegistry.get_model(run.model_name)["type"] == "classification":
                y_is_categorical = True
                le_target = LabelEncoder()
                y = le_target.fit_transform(y)
                target_classes = [str(c) for c in le_target.classes_]
            else:
                target_classes = []

            # 5. Split Data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

            # 6. Initialize Model
            model_info = ModelRegistry.get_model(run.model_name)
            params = run.parameters or {}
            clf = model_info["class"](**params)

            # 7. Train
            clf.fit(X_train, y_train)

            # 8. Evaluate & Generate Detailed Report
            preds = clf.predict(X_test)
            metrics = {}
            report = {}

            if model_info["type"] == "classification":
                # Metrics
                metrics["accuracy"] = float(accuracy_score(y_test, preds))
                metrics["f1_weighted"] = float(f1_score(y_test, preds, average='weighted'))
                
                # Detailed Report: Confusion Matrix
                cm = confusion_matrix(y_test, preds)
                report["type"] = "classification"
                report["confusion_matrix"] = cm.tolist() # Convert to list for JSON
                report["classes"] = target_classes
                
                # Feature Importance (if supported)
                if hasattr(clf, "feature_importances_"):
                    report["feature_importance"] = dict(zip(X.columns, clf.feature_importances_.tolist()))

            else:
                # Metrics
                metrics["rmse"] = float(np.sqrt(mean_squared_error(y_test, preds)))
                metrics["r2"] = float(r2_score(y_test, preds))
                
                # Detailed Report: Residuals for Plotting
                # We limit points to 100 to keep JSON light
                limit = 100
                report["type"] = "regression"
                report["actual"] = y_test[:limit].tolist()
                report["predicted"] = preds[:limit].tolist()
                
                if hasattr(clf, "feature_importances_"):
                    report["feature_importance"] = dict(zip(X.columns, clf.feature_importances_.tolist()))

            # 9. Save Artifact
            model_filename = f"{uuid.uuid4()}.joblib"
            save_path = os.path.join(settings.MODEL_DIR, model_filename)
            joblib.dump(clf, save_path)

            # 10. Complete Run
            run.status = "completed"
            run.metrics = metrics
            run.detailed_report = report
            run.artifact_path = save_path
            db.commit()

        except Exception as e:
            db.rollback()
            run.status = "failed"
            run.error_message = str(e)
            db.commit()
            print(f"Training Failed: {e}")