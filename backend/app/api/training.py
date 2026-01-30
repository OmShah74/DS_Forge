from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
import os

from app.db.session import get_db
from app.db.models import TrainingRun, Dataset
from app.training.trainer import TrainingEngine

router = APIRouter()

# --- Schemas ---
class TrainingConfig(BaseModel):
    dataset_id: int
    target_column: str
    feature_columns: Optional[List[str]] = None
    model_key: str
    parameters: Dict[str, Any] = {}

class TrainingRunResponse(BaseModel):
    id: int
    model_name: str
    target_column: Optional[str]
    feature_columns: Optional[List[str]]
    status: str
    progress: int
    stage: Optional[str]
    metrics: Optional[Dict[str, Any]]
    detailed_report: Optional[Dict[str, Any]]
    logs: List[str] = []
    created_at: datetime
    error_message: Optional[str]

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.post("/start", response_model=TrainingRunResponse)
def start_training(
    config: TrainingConfig, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # 1. Validate Dataset
    dataset = db.query(Dataset).filter(Dataset.id == config.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # 2. Create Training Record
    new_run = TrainingRun(
        dataset_id=config.dataset_id,
        model_name=config.model_key,
        target_column=config.target_column,
        feature_columns=config.feature_columns,
        parameters=config.parameters,
        status="pending",
        progress=0,
        stage="queued"
    )
    db.add(new_run)
    db.commit()
    db.refresh(new_run)

    # 3. Launch Background Task
    background_tasks.add_task(TrainingEngine.run_training_job, new_run.id, db)

    return new_run

@router.get("/runs", response_model=List[TrainingRunResponse])
def list_runs(db: Session = Depends(get_db)):
    return db.query(TrainingRun).order_by(TrainingRun.created_at.desc()).all()

@router.get("/runs/{run_id}", response_model=TrainingRunResponse)
def get_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

@router.delete("/runs/{run_id}")
def delete_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # 1. Delete artifact if exists
    if run.artifact_path and os.path.exists(run.artifact_path):
        os.remove(run.artifact_path)
    
    # 2. Delete DB record
    db.delete(run)
    db.commit()
    return {"message": "Run and artifact purged successfully"}

@router.get("/runs/{run_id}/download")
def download_model(run_id: int, db: Session = Depends(get_db)):
    run = db.query(TrainingRun).filter(TrainingRun.id == run_id).first()
    if not run or not run.artifact_path:
        raise HTTPException(status_code=404, detail="Model artifact not found")
    
    if not os.path.exists(run.artifact_path):
        raise HTTPException(status_code=404, detail="Artifact file missing from storage")

    filename = f"{run.model_name}_id{run.id}.joblib"
    return FileResponse(
        path=run.artifact_path, 
        filename=filename,
        media_type='application/octet-stream'
    )
