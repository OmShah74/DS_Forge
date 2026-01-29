from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.session import get_db
from app.deployment.inference import InferenceService # Note: Check import path below

from app.deployment.inference import InferenceService

router = APIRouter()

@router.post("/{run_id}/predict")
def predict_endpoint(
    run_id: int, 
    payload: List[Dict[str, Any]] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Public Endpoint for Model Inference.
    Input: JSON Array of objects
    Output: Array of predictions
    """
    results = InferenceService.predict(run_id, payload, db)
    return {"run_id": run_id, "predictions": results}