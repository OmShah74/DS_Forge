from fastapi import APIRouter
from app.model_zoo.registry import ModelRegistry

router = APIRouter()

@router.get("/")
def list_models():
    """Return list of available ML models"""
    return ModelRegistry.list_models()