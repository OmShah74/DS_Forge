from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Dataset
from app.model_zoo.registry import ModelRegistry
import pandas as pd

router = APIRouter()

class RecommendationRequest(BaseModel):
    dataset_id: int
    target_column: str
    task_type: Optional[str] = None # "regression" or "classification"

class ModelRecommendation(BaseModel):
    key: str
    name: str
    match_score: int # 0-100
    reason: str
    badge: Optional[str] = None # "Best Value", "Fastest", etc.

@router.post("/recommend", response_model=List[ModelRecommendation])
def recommend_models(req: RecommendationRequest, db: Session = Depends(get_db)):
    """
    Analyzes dataset metadata to suggest the best models.
    """
    dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Load minimal info (we need target dtype and uniqueness)
    try:
        # Optimization: Just read the target column if possible, or head
        # For now, read full to be safe on types, but can optimize later
        df = pd.read_parquet(dataset.file_path)
    except:
        raise HTTPException(status_code=500, detail="Could not read dataset for analysis")

    target = df[req.target_column]
    row_count = len(df)
    is_numeric = pd.api.types.is_numeric_dtype(target)
    
    # Determine Task Type (User Override or Auto-Detect)
    if req.task_type:
        task_type = req.task_type.lower()
    else:
        task_type = "regression" if is_numeric and target.nunique() > 20 else "classification"
        if not is_numeric:
            task_type = "classification" # Force classification for non-numeric

    recs = []
    
    # --- LOGIC ENGINE ---
    
    if task_type == "regression":
        # 1. Linear Regression (Baseline)
        score = 80
        reason = "Solid baseline model. Fast and interpretable."
        if row_count < 1000: 
            score += 10
            reason += " Excellent for small datasets."
        recs.append({"key": "linear_regression", "name": "Linear Regression", "match_score": score, "reason": reason})

        # 2. Random Forest
        score = 85
        reason = "Robust to outliers and non-linear data."
        if row_count > 10000:
            score += 5
            reason = "High accuracy on large datasets."
        elif row_count < 200:
            score -= 20
            reason = "Risk of overfitting on very small data."
        recs.append({"key": "rf_regressor", "name": "Random Forest", "match_score": score, "reason": reason})

        # 3. XGBoost
        score = 90
        reason = "State-of-the-art accuracy."
        if row_count < 500:
            score -= 30
            reason = "Overkill for small data; likely to overfit."
        else:
            reason += " Captures complex patterns best."
        recs.append({"key": "xgboost_regressor", "name": "XGBoost", "match_score": score, "reason": reason})

    else: # Classification
        # 1. Logistic Regression
        score = 85
        reason = "Great baseline for binary classification."
        if target.nunique() > 2:
            score -= 10
            reason = "Less effective for multi-class problems."
        recs.append({"key": "logistic_regression", "name": "Logistic Regression", "match_score": score, "reason": reason})

        # 2. Random Forest
        score = 90
        reason = "Handles complex boundaries well."
        recs.append({"key": "rf_classifier", "name": "Random Forest", "match_score": score, "reason": reason})

        # 3. Decision Tree (Not in list but effectively handled by RF) but let's add KNN
        score = 70
        reason = "Simple, distance-based classification."
        if row_count > 5000:
            score -= 20
            reason = "Very slow on large datasets."
        recs.append({"key": "knn_classifier", "name": "K-Nearest Neighbors", "match_score": score, "reason": reason})

    # Sort
    recs.sort(key=lambda x: x['match_score'], reverse=True)
    
    # Add Badges
    if recs:
        recs[0]['badge'] = "✨ Recommended"
    
    return recs

@router.get("/")
def list_models():
    """Return list of available ML models"""
    return ModelRegistry.list_models()