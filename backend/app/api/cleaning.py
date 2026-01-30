from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np
import os
import uuid

from app.db.session import get_db
from app.db.models import Dataset, SystemActivity
from app.data.cleaning.engine import CleaningEngine
from app.core.config import settings

router = APIRouter()

# --- Schemas ---
class CleaningRequest(BaseModel):
    dataset_id: int
    operation: str
    params: Dict[str, Any]

class PreviewResponse(BaseModel):
    columns: list
    data: list
    total_rows: int

# --- Endpoints ---

@router.get("/preview/{dataset_id}", response_model=PreviewResponse)
def get_dataset_preview(dataset_id: int, limit: int = 10, db: Session = Depends(get_db)):
    """Load first N rows of a dataset for preview"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        # Read parquet efficiently
        df = pd.read_parquet(dataset.file_path)
        
        # Handle nan values for JSON response (NaN -> None)
        df = df.replace({np.nan: None})
        
        return {
            "columns": list(df.columns),
            "data": df.head(limit).to_dict(orient="records"),
            "total_rows": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

@router.post("/apply")
def apply_cleaning(request: CleaningRequest, db: Session = Depends(get_db)):
    """
    1. Load Dataset
    2. Apply Cleaning Operation
    3. Save as NEW Dataset (Immutable)
    """
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
    cleaned_df = CleaningEngine.apply_operation(df, request.operation, request.params)

    # 4. Save New Artifact
    new_filename = f"{uuid.uuid4()}.parquet"
    new_path = os.path.join(settings.DATASET_DIR, new_filename)
    cleaned_df.to_parquet(new_path, index=False)

    # 5. Create DB Entry
    new_ds_name = f"{source_ds.filename.split('.')[0]}_cleaned_{request.operation}"
    
    new_dataset = Dataset(
        filename=new_ds_name,
        file_path=new_path,
        source_type="cleaned",
        parent_id=source_ds.id,
        cleaning_operation=f"{request.operation}: {request.params}",
        size_bytes=os.path.getsize(new_path),
        row_count=len(cleaned_df),
        column_count=len(cleaned_df.columns)
    )
    
    db.add(new_dataset)
    
    # 6. Log Activity
    activity = SystemActivity(
        dataset_id=new_dataset.id,
        operation="cleaning",
        status="success",
        message=f"Applied {request.operation} to {source_ds.filename}",
        metadata_json={
            "operation": request.operation,
            "params": request.params,
            "rows": len(cleaned_df),
            "cols": len(cleaned_df.columns),
            "output_dataset": new_ds_name
        }
    )
    db.add(activity)
    
    db.commit()
    db.refresh(new_dataset)

    return {"message": "Cleaning applied successfully", "new_dataset_id": new_dataset.id}