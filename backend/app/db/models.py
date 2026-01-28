from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)  # Path to the .parquet file
    source_type = Column(String) # csv, json, xlsx, cleaned
    
    # Lineage (New in Phase 3)
    parent_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    cleaning_operation = Column(String, nullable=True) # Description of what created this
    
    # Metadata
    size_bytes = Column(Integer)
    row_count = Column(Integer)
    column_count = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    children = relationship("Dataset", backref="parent", remote_side=[id])