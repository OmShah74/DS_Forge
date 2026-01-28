import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DS-Forge"
    API_V1_STR: str = "/api/v1"
    
    # Base Path finding
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Storage Paths
    STORAGE_DIR: str = os.path.join(BASE_DIR, "storage")
    DATASET_DIR: str = os.path.join(STORAGE_DIR, "datasets")
    MODEL_DIR: str = os.path.join(STORAGE_DIR, "models")
    ARTIFACT_DIR: str = os.path.join(STORAGE_DIR, "artifacts")
    
    # Database
    DATABASE_URL: str = "sqlite:///./app/db/ds-forge.sqlite"

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist (Critical for Windows permissions)
os.makedirs(settings.DATASET_DIR, exist_ok=True)
os.makedirs(settings.MODEL_DIR, exist_ok=True)
os.makedirs(settings.ARTIFACT_DIR, exist_ok=True)