from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.db.models import Dataset
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