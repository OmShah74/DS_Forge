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

        # 2. Load Model (Cache this in production V2)
        if not os.path.exists(run.artifact_path):
             raise HTTPException(status_code=500, detail="Model artifact missing")
             
        model = joblib.load(run.artifact_path)

        # 3. Prepare Input
        try:
            df = pd.DataFrame(input_data)
            # Note: V1 assumes input JSON keys match training features exactly
            # and numerical values are passed correctly.
            
            predictions = model.predict(df)
            return predictions.tolist()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Inference failed: {str(e)}")