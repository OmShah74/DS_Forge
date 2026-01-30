from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

from app.db.session import get_db
from app.db.models import SystemActivity

router = APIRouter()

class ActivityResponse(BaseModel):
    id: int
    operation: str
    status: str
    message: str
    metadata_json: Optional[Dict[str, Any]]
    created_at: datetime
    dataset_id: Optional[int]

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ActivityResponse])
def list_activities(db: Session = Depends(get_db)):
    """Fetch all system activities ordered by time"""
    return db.query(SystemActivity).order_by(SystemActivity.created_at.desc()).limit(50).all()
