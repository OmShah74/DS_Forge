from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from fastapi.responses import StreamingResponse
import io
import pandas as pd
import numpy as np
from app.db.session import get_db
from app.db.models import Dataset, SystemActivity
from app.data.ingestion.loader import IngestionEngine
import os

router = APIRouter()

# --- Pydantic Schemas (Response Models) ---
class DatasetSchema(BaseModel):
    id: int
    filename: str
    source_type: str
    row_count: int
    column_count: int
    size_bytes: int
    created_at: datetime

    class Config:
        from_attributes = True

class PreviewResponse(BaseModel):
    columns: list
    data: list
    total_rows: int

# --- Endpoints ---

@router.post("/upload", response_model=DatasetSchema)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Process file using Ingestion Engine
    metadata = await IngestionEngine.process_upload(file)
    
    # 2. Save metadata to DB
    db_dataset = Dataset(
        filename=metadata['filename'],
        file_path=metadata['file_path'],
        source_type=metadata['source_type'],
        size_bytes=metadata['size_bytes'],
        row_count=metadata['row_count'],
        column_count=metadata['column_count']
    )
    db.add(db_dataset)
    
    # 3. Log Activity
    activity = SystemActivity(
        dataset_id=db_dataset.id,
        operation="upload",
        status="success",
        message=f"Ingested new artifact: {db_dataset.filename}",
        metadata_json={
            "source_type": db_dataset.source_type,
            "rows": db_dataset.row_count,
            "cols": db_dataset.column_count,
            "size_kb": round(db_dataset.size_bytes / 1024, 2)
        }
    )
    db.add(activity)
    
    db.commit()
    db.refresh(db_dataset)
    
    return db_dataset

@router.get("/", response_model=List[DatasetSchema])
def list_datasets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    datasets = db.query(Dataset).offset(skip).limit(limit).all()
    return datasets

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Delete physical file
    if os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)
    
    # Delete DB record
    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully"}


@router.get("/{dataset_id}/download")
def download_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Read Parquet
    try:
        df = pd.read_parquet(dataset.file_path)
        
        # Stream as CSV
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename={dataset.filename}.csv"
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/{dataset_id}/preview", response_model=PreviewResponse)
def get_dataset_preview(dataset_id: int, limit: int = 100, db: Session = Depends(get_db)):
    """Load first N rows of a dataset for inspection"""
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
