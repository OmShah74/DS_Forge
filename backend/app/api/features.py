from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any
import os
import uuid
import pandas as pd

from app.db.session import get_db
from app.db.models import Dataset, SystemActivity
from app.data.feature_engineering.engine import FeatureEngine
from app.core.config import settings

router = APIRouter()

class FeatureRequest(BaseModel):
    dataset_id: int
    operation: str
    params: Dict[str, Any]

@router.post("/apply")
def apply_feature_engineering(request: FeatureRequest, db: Session = Depends(get_db)):
    # 1. Fetch Source
    source_ds = db.query(Dataset).filter(Dataset.id == request.dataset_id).first()
    if not source_ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # 2. Load Data
    try:
        df = pd.read_parquet(source_ds.file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not read source file")

    # 3. Apply Engine
    processed_df = FeatureEngine.apply_feature_engineering(df, request.operation, request.params)

    # 4. Save New Artifact
    new_filename = f"{uuid.uuid4()}.parquet"
    new_path = os.path.join(settings.DATASET_DIR, new_filename)
    processed_df.to_parquet(new_path, index=False)

    # 5. Create DB Entry
    new_ds_name = f"{source_ds.filename.split('.')[0]}_FE_{request.operation}"
    
    new_dataset = Dataset(
        filename=new_ds_name,
        file_path=new_path,
        source_type="feature_engineered",
        parent_id=source_ds.id,
        cleaning_operation=f"FE: {request.operation}", # Reusing this column for log
        size_bytes=os.path.getsize(new_path),
        row_count=len(processed_df),
        column_count=len(processed_df.columns)
    )
    
    db.add(new_dataset)
    
    # 6. Log Activity
    activity = SystemActivity(
        dataset_id=new_dataset.id,
        operation="feature_eng",
        status="success",
        message=f"Applied mutation '{request.operation}' to {source_ds.filename}",
        metadata_json={
            "operation": request.operation,
            "params": request.params,
            "rows": len(processed_df),
            "cols": len(processed_df.columns),
            "output_dataset": new_ds_name
        }
    )
    db.add(activity)

    db.commit()
    db.refresh(new_dataset)

    return {"message": "Feature Engineering applied", "new_dataset_id": new_dataset.id}

@router.get("/recommend/{dataset_id}")
def get_recommendations(dataset_id: int, db: Session = Depends(get_db)):
    """
    Analyze dataset and return a list of recommended feature engineering operations.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        df = pd.read_parquet(dataset.file_path)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not read source file")
    
    recommendations = FeatureEngine.get_recommendations(df)
    return {"recommendations": recommendations}