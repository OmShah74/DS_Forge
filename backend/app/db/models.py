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
    model_name = Column(String)      # e.g., "RandomForestClassifier"
    target_column = Column(String)
    parameters = Column(JSON)        # Hyperparameters used
    
    # State
    status = Column(String, default="pending") # pending, running, completed, failed
    error_message = Column(String, nullable=True)
    
    # Results
    metrics = Column(JSON, nullable=True)    # {"accuracy": 0.95, "f1": 0.94}
    artifact_path = Column(String, nullable=True) # Path to .joblib file
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    dataset = relationship("Dataset", back_populates="training_runs")