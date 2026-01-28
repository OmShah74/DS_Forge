from sqlalchemy import Column, Integer, String, DateTime, Float
from datetime import datetime
from app.db.base import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)  # Path to the .parquet file
    source_type = Column(String) # csv, json, xlsx
    
    # Metadata
    size_bytes = Column(Integer)
    row_count = Column(Integer)
    column_count = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)