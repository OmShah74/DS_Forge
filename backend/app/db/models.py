from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)
    source_type = Column(String) 
    
    # Lineage
    parent_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    cleaning_operation = Column(String, nullable=True)
    
    # Metadata
    size_bytes = Column(Integer)
    row_count = Column(Integer)
    column_count = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    children = relationship("Dataset", backref="parent", remote_side=[id])
    training_runs = relationship("TrainingRun", back_populates="dataset")

class TrainingRun(Base):
    __tablename__ = "training_runs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    
    # Config
    model_name = Column(String)
    target_column = Column(String)
    feature_columns = Column(JSON, nullable=True) # Explicitly selected features
    parameters = Column(JSON)
    
    # State
    status = Column(String, default="pending") 
    progress = Column(Integer, default=0)         # 0-100
    stage = Column(String, nullable=True)         # "loading", "preprocessing", "fitting", "scoring"
    error_message = Column(String, nullable=True)
    
    # Results
    metrics = Column(JSON, nullable=True)    # Simple metrics (Accuracy, F1)
    detailed_report = Column(JSON, nullable=True) # Heavy data (Confusion Matrix, ROC points)
    artifact_path = Column(String, nullable=True) 
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    dataset = relationship("Dataset", back_populates="training_runs")