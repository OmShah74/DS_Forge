import joblib
import pandas as pd
import os
from fastapi import HTTPException
from app.db.models import TrainingRun
from sqlalchemy.orm import Session

class InferenceService:
    @staticmethod
    def predict(run_id: int, input_data: list, db: Session):
        """
        Loads model and predicts.
        input_data: List of dicts (records) e.g. [{"feature1": 1, "feature2": 0.5}]
        """
        # 1. Fetch Model Info
        run = db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Model not found")
        
        if run.status != "completed" or not run.artifact_path:
             raise HTTPException(status_code=400, detail="Model is not ready for inference")

        # 2. Load Model & Encoders
        if not os.path.exists(run.artifact_path):
             raise HTTPException(status_code=500, detail="Model artifact missing")
             
        model = joblib.load(run.artifact_path)
        
        # Check for encoders
        model_dir = os.path.dirname(run.artifact_path)
        encoder_path = os.path.join(model_dir, "encoders.joblib")
        encoders = {}
        if os.path.exists(encoder_path):
            encoders = joblib.load(encoder_path)

        # 3. Prepare Input
        try:
            df = pd.DataFrame(input_data)
            
            # Apply Encoders to categorical columns if they exist in input
            for col, le in encoders.items():
                if col in df.columns:
                    # Handle unseen labels carefully or just convert to string and try transform
                    # Ideally we should handle unknown labels gracefully, but for now we try/catch or map
                    df[col] = df[col].astype(str).map(lambda x: le.transform([x])[0] if x in le.classes_ else -1)
            
            predictions = model.predict(df)
            return predictions.tolist()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Inference failed: {str(e)}")