import pandas as pd
import numpy as np
import joblib
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, f1_score, mean_squared_error, mean_absolute_error, r2_score,
    confusion_matrix, roc_curve, auc, precision_score, recall_score, log_loss,
    matthews_corrcoef, cohen_kappa_score, balanced_accuracy_score,
    explained_variance_score, max_error, median_absolute_error, mean_absolute_percentage_error
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
            log_event("Applying Advanced Preprocessing (Imputation + Encoding)...")
            db.commit()

            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.impute import SimpleImputer

            # 4a. Handle Missing Values
            # Numeric Imputation
            num_cols = X.select_dtypes(include=['int64', 'float64']).columns
            if len(num_cols) > 0:
                imp = SimpleImputer(strategy='median')
                X[num_cols] = imp.fit_transform(X[num_cols])

            # Categorical Imputation
            cat_cols = X.select_dtypes(include=['object', 'category']).columns
            if len(cat_cols) > 0:
                imp_cat = SimpleImputer(strategy='constant', fill_value='Unknown')
                X[cat_cols] = imp_cat.fit_transform(X[cat_cols])

            # 4b. Feature Encoding
            encoders = {}
            new_X_parts = []
            
            # Keep Numeric Columns as is
            if len(num_cols) > 0:
                new_X_parts.append(X[num_cols].reset_index(drop=True))

            # Process Categorical / Text
            for col in cat_cols:
                # Heuristic: If unique values > 20 and average length > 10, treat as Text (TF-IDF)
                # Otherwise treat as Categorical (Label/OneHot)
                is_text = False
                try:
                    if X[col].nunique() > 20:
                        # Check avg string length
                        avg_len = X[col].astype(str).str.len().mean()
                        if avg_len > 15:
                            is_text = True
                except:
                    pass

                if is_text:
                    log_event(f"Detected text column '{col}' - Applying TF-IDF Vectorization...")
                    tfidf = TfidfVectorizer(max_features=50, stop_words='english')
                    text_matrix = tfidf.fit_transform(X[col].astype(str)).toarray()
                    # Create DF for these features
                    tfidf_cols = [f"{col}_tfidf_{i}" for i in range(text_matrix.shape[1])]
                    new_X_parts.append(pd.DataFrame(text_matrix, columns=tfidf_cols))
                    encoders[col] = tfidf
                else:
                    # Standard Label Encoding
                    le = LabelEncoder()
                    # Fit transform returns numpy array, wrap in Series/DF? 
                    # Actually standardizing on concatenation of DataFrames
                    encoded_col = le.fit_transform(X[col].astype(str))
                    new_X_parts.append(pd.DataFrame(encoded_col, columns=[col]))
                    encoders[col] = le
            
            # Reconstruct X
            if new_X_parts:
                X = pd.concat(new_X_parts, axis=1)
            
            # Ensure Feature Names are clean strings via columns
            # (Pandas concat handles this, but index reset is crucial above)

            y_is_categorical = False
            model_info = ModelRegistry.get_model(run.model_name)
            if y.dtype == 'object' or model_info["type"] == "classification":
                y_is_categorical = True
                log_event(f"Target is categorical. Mapping classes: {y.unique()[:3]}...")
                le_target = LabelEncoder()
                y = le_target.fit_transform(y.astype(str))
                target_classes = [str(c) for c in le_target.classes_]
                encoders["__target__"] = le_target
            else:
                target_classes = []

            # Split Data
            log_event("Performing 80/20 train-test split. 80% of data is used to teach the model, 20% is hidden to test its knowledge later.")
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

            # 5. Training
            run.stage = "fitting"
            run.progress = 50
            log_event(f"Fitting model architecture: {model_info['name']}")
            log_event(f"Algorithm Type: {model_info['type'].upper()} - optimizing for {'accuracy/F1' if model_info['type'] == 'classification' else 'error minimization (RMSE)'}.")
            log_event("Hyperparameters: " + str(run.parameters or "Optimized Defaults"))
            log_event("Explanation: The model is now iteratively learning the patterns mapping your features (X) to the target (Y).")
            db.commit()

            params = run.parameters or {}
            
            # --- PARAMETER SANITIZATION ---
            # Only allow parameters that are explicitly defined in the Model Registry for this algorithm.
            # This prevents frontend 'ghost' parameters (e.g. n_estimators from a previous RF run) 
            # from crashing models that don't support them (e.g. Ridge).
            default_params = model_info.get("params", {})
            valid_keys = set(default_params.keys())
            
            # Always allow random_state if the model supports it (most do, but checking defaults is safest)
            # If 'random_state' is in defaults, it's already covered.
            
            clean_params = {k: v for k, v in params.items() if k in valid_keys}
            
            # Log specific dropped keys for debugging
            dropped_keys = set(params.keys()) - set(clean_params.keys())
            if dropped_keys:
                log_event(f"Sanitized parameters. Dropped invalid keys: {dropped_keys}")

            clf = model_info["class"](**clean_params)
            clf.fit(X_train, y_train)
            log_event("Core weights calculation complete. The mathematical function has been defined.")

            # 6. Evaluation
            run.stage = "scoring"
            run.progress = 80
            log_event("Scoring model against held-out validation set...")
            db.commit()

            preds = clf.predict(X_test)
            metrics = {}
            report = {}

            if model_info["type"] == "classification":
                # --- CLASSIFICATION METRICS (10+) ---
                metrics["accuracy"] = float(accuracy_score(y_test, preds))
                metrics["f1_weighted"] = float(f1_score(y_test, preds, average='weighted'))
                metrics["f1_macro"] = float(f1_score(y_test, preds, average='macro'))
                metrics["precision_weighted"] = float(precision_score(y_test, preds, average='weighted', zero_division=0))
                metrics["recall_weighted"] = float(recall_score(y_test, preds, average='weighted', zero_division=0))
                metrics["balanced_accuracy"] = float(balanced_accuracy_score(y_test, preds))
                metrics["mcc"] = float(matthews_corrcoef(y_test, preds))
                metrics["cohen_kappa"] = float(cohen_kappa_score(y_test, preds))
                
                # Log Loss (needs probabilities)
                if hasattr(clf, "predict_proba"):
                    try:
                        probs = clf.predict_proba(X_test)
                        metrics["log_loss"] = float(log_loss(y_test, probs))
                        
                        # ROC AUC (Handle Binary vs Multi-class)
                        if len(target_classes) == 2:
                            # Binary case rely on probs of positive class
                            fpr, tpr, _ = roc_curve(y_test, probs[:, 1])
                            metrics["roc_auc"] = float(auc(fpr, tpr))
                            report["roc"] = {"fpr": fpr.tolist(), "tpr": tpr.tolist(), "auc": metrics["roc_auc"]}
                        else:
                            # Multi-class One-vs-Rest strategy for AUC could be added here
                            pass
                    except Exception as e:
                        print(f"Log loss calculation skipped: {e}")

                # Detailed Report: Confusion Matrix
                cm = confusion_matrix(y_test, preds)
                report["type"] = "classification"
                report["confusion_matrix"] = cm.tolist()
                report["classes"] = target_classes

                # Feature Importance
                importances = None
                if hasattr(clf, "feature_importances_"):
                    importances = clf.feature_importances_
                elif hasattr(clf, "coef_"):
                    importances = np.abs(clf.coef_[0])
                
                if importances is not None:
                    report["feature_importance"] = dict(zip(X.columns, importances.tolist()))

            else:
                # --- REGRESSION METRICS (7+) ---
                metrics["rmse"] = float(np.sqrt(mean_squared_error(y_test, preds)))
                metrics["mae"] = float(mean_absolute_error(y_test, preds))
                metrics["r2"] = float(r2_score(y_test, preds))
                metrics["explained_variance"] = float(explained_variance_score(y_test, preds))
                metrics["max_error"] = float(max_error(y_test, preds))
                metrics["median_absolute_error"] = float(median_absolute_error(y_test, preds))
                try:
                    # Safe MAPE calculation (handling division by zero)
                    # Convert to numpy arrays to ensure masking works
                    y_true_safe = np.array(y_test)
                    y_pred_safe = np.array(preds)
                    
                    # Create mask for non-zero values to avoid infinity
                    mask = y_true_safe != 0
                    
                    if np.sum(mask) > 0:
                        mape = np.mean(np.abs((y_true_safe[mask] - y_pred_safe[mask]) / y_true_safe[mask]))
                        metrics["mape"] = float(mape)
                    else:
                        metrics["mape"] = 0.0 # All targets are zero
                except:
                    metrics["mape"] = -1.0 # Fallback error value
                
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
            
            # Save Encoders
            if encoders:
                encoder_filename = model_filename.replace('.joblib', '_encoders.joblib')
                encoder_path = os.path.join(settings.MODEL_DIR, encoder_filename)
                joblib.dump(encoders, encoder_path)

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
