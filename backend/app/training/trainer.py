import pandas as pd
import numpy as np
import joblib
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, f1_score, mean_squared_error, 
    r2_score, confusion_matrix, roc_curve, auc
)
from sklearn.preprocessing import LabelEncoder

from app.db.models import TrainingRun, Dataset
from app.model_zoo.registry import ModelRegistry
from app.core.config import settings

class TrainingEngine:
    @staticmethod
    def run_training_job(run_id: int, db: Session):
        run = db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
        if not run:
            return

        def log_event(message):
            timestamp = datetime.now().strftime("%H:%M:%S")
            full_msg = f"[{timestamp}] {message}"
            # Ensure list exists
            current_logs = list(run.logs or [])
            current_logs.append(full_msg)
            run.logs = current_logs
            db.commit()

        try:
            log_event(f"Initializing Compute Engine for {run.model_name}...")
            # 1. Update Status: Loading
            run.status = "running"
            run.stage = "loading"
            run.progress = 10
            log_event("Fetching source artifact from registry...")
            db.commit()

            # 2. Load Dataset
            dataset = db.query(Dataset).filter(Dataset.id == run.dataset_id).first()
            df = pd.read_parquet(dataset.file_path)
            log_event(f"Loaded {len(df)} records into memory.")

            # 3. Prepare X (Features) and y (Target)
            target = run.target_column
            log_event(f"Isolating target vector: '{target}'")
            if target not in df.columns:
                raise ValueError(f"Target column '{target}' not found")

            # Selection Logic
            if run.feature_columns:
                existing_features = [c for c in run.feature_columns if c in df.columns]
                log_event(f"Filtering feature matrix: {len(existing_features)} columns explicitly selected.")
                X = df[existing_features]
            else:
                log_event("No selection filter applied. Using all columns except target.")
                X = df.drop(columns=[target])
            
            y = df[target]

            # 4. Preprocessing
            run.stage = "preprocessing"
            run.progress = 30
            log_event("Applying Label Encoding to categorical dimensions...")
            db.commit()

            # Simple Label Encoding for categorical features
            for col in X.select_dtypes(include=['object', 'category']).columns:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
            
            y_is_categorical = False
            model_info = ModelRegistry.get_model(run.model_name)
            if y.dtype == 'object' or model_info["type"] == "classification":
                y_is_categorical = True
                log_event(f"Target is categorical. Mapping classes: {y.unique()[:3]}...")
                le_target = LabelEncoder()
                y = le_target.fit_transform(y)
                target_classes = [str(c) for c in le_target.classes_]
            else:
                target_classes = []

            # Split Data
            log_event("Performing 80/20 train-test split.")
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

            # 5. Training
            run.stage = "fitting"
            run.progress = 50
            log_event(f"Fitting model architecture: {model_info['name']}")
            log_event("Hyperparameters: " + str(run.parameters or "Optimized Defaults"))
            db.commit()

            params = run.parameters or {}
            clf = model_info["class"](**params)
            clf.fit(X_train, y_train)
            log_event("Core weights calculation complete.")

            # 6. Evaluation
            run.stage = "scoring"
            run.progress = 80
            log_event("Scoring model against held-out validation set...")
            db.commit()

            preds = clf.predict(X_test)
            metrics = {}
            report = {}

            if model_info["type"] == "classification":
                metrics["accuracy"] = float(accuracy_score(y_test, preds))
                metrics["f1_weighted"] = float(f1_score(y_test, preds, average='weighted'))
                
                # Detailed Report: Confusion Matrix
                cm = confusion_matrix(y_test, preds)
                report["type"] = "classification"
                report["confusion_matrix"] = cm.tolist()
                report["classes"] = target_classes
                
                # ROC Curve for binary/multi
                if hasattr(clf, "predict_proba"):
                    probs = clf.predict_proba(X_test)
                    if len(target_classes) == 2:
                        fpr, tpr, _ = roc_curve(y_test, probs[:, 1])
                        report["roc"] = {"fpr": fpr.tolist(), "tpr": tpr.tolist(), "auc": auc(fpr, tpr)}

                # Feature Importance
                importances = None
                if hasattr(clf, "feature_importances_"):
                    importances = clf.feature_importances_
                elif hasattr(clf, "coef_"):
                    importances = np.abs(clf.coef_[0])
                
                if importances is not None:
                    report["feature_importance"] = dict(zip(X.columns, importances.tolist()))

            else:
                metrics["rmse"] = float(np.sqrt(mean_squared_error(y_test, preds)))
                metrics["r2"] = float(r2_score(y_test, preds))
                
                limit = 100
                report["type"] = "regression"
                report["actual"] = y_test[:limit].tolist()
                report["predicted"] = preds[:limit].tolist()
                
                # Feature Importance
                importances = None
                if hasattr(clf, "feature_importances_"):
                    importances = clf.feature_importances_
                elif hasattr(clf, "coef_"):
                    importances = np.abs(clf.coef_)
                
                if importances is not None:
                    report["feature_importance"] = dict(zip(X.columns, importances.tolist()))

            # 9. Save Artifact
            model_filename = f"{uuid.uuid4()}.joblib"
            save_path = os.path.join(settings.MODEL_DIR, model_filename)
            joblib.dump(clf, save_path)

            # 10. Complete Run
            run.status = "completed"
            run.stage = "finalized"
            run.progress = 100
            run.metrics = metrics
            run.detailed_report = report
            run.artifact_path = save_path
            log_event(f"Training Complete. Artifact captured: {model_filename}")
            db.commit()

        except Exception as e:
            db.rollback()
            run.status = "failed"
            run.stage = "error"
            run.error_message = str(e)
            log_event(f"CRITICAL ERROR: {str(e)}")
            db.commit()
            print(f"Training Failed: {e}")
