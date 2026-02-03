from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Dataset
from app.model_zoo.registry import ModelRegistry
from app.services.recommendation import RecommendationService
import pandas as pd

router = APIRouter()

class RecommendationRequest(BaseModel):
    dataset_id: int
    target_column: Optional[str] = None
    task_type: Optional[str] = None
    
    # LLM Config (Optional)
    provider: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None

class ModelRecommendation(BaseModel):
    key: str
    name: str
    match_score: int # 0-100
    reason: str
    badge: Optional[str] = None

@router.post("/recommend", response_model=List[ModelRecommendation])
def recommend_models(req: RecommendationRequest, db: Session = Depends(get_db)):
    """
    Analyzes dataset and uses LLM (or heuristics) to suggest models.
    """
    # 1. Fetch Dataset
    dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        df = pd.read_parquet(dataset.file_path)
    except:
        raise HTTPException(status_code=500, detail="Could not read dataset")

    # 2. Profile Data
    profile = RecommendationService.analyze_dataset(df, req.target_column)
    
    # Override task type if provided
    if req.task_type:
        profile['task_type'] = req.task_type.lower()

    # 3. Get Recommendations (LLM or Heuristic)
    result = RecommendationService.get_recommendations(
        profile, 
        provider=req.provider, 
        api_key=req.api_key, 
        model=req.model
    )
    
    raw_recs = result.get("recommendations", [])
    valid_keys = ModelRegistry.MODELS.keys()
    
    # 4. Format for Response
    formatted_recs = []
    for r in raw_recs:
        key = r.get("model_key")
        
        # Validation: Skip hallucinations or invalid keys
        if key not in valid_keys:
            continue
            
        rec = ModelRecommendation(
            key=key,
            name=r.get("name"),
            match_score=r.get("score", 0),
            reason=r.get("reason", "No reason provided")
        )
        
        # Add Badge for top result
        if not formatted_recs:
             rec.badge = "✨ AI Top Pick"
             
        formatted_recs.append(rec)
        
    # fallback if all LLM keys are invalid OR service returned empty
    if not formatted_recs:
        # --- ORIGINAL HARDCODED LOGIC RESTORATION ---
        target = df[req.target_column] if req.target_column else None
        row_count = len(df)
        is_numeric = False
        if target is not None:
             is_numeric = pd.api.types.is_numeric_dtype(target)
        
        # Determine Task Type
        local_task_type = "regression"
        if req.task_type:
            local_task_type = req.task_type.lower()
        elif target is not None:
            local_task_type = "regression" if is_numeric and target.nunique() > 20 else "classification"
            if not is_numeric:
                local_task_type = "classification"

        # Hardcoded Fallback
        if local_task_type == "regression":
            # 1. Linear Regression
            score = 80
            reason = "Solid baseline model. Fast and interpretable."
            if row_count < 1000: 
                score += 10
                reason += " Excellent for small datasets."
            formatted_recs.append(ModelRecommendation(key="linear_regression", name="Linear Regression", match_score=score, reason=reason, badge="✨ Recommended"))

            # 2. Random Forest
            score = 85
            reason = "Robust to outliers and non-linear data."
            if row_count > 10000:
                score += 5
                reason = "High accuracy on large datasets."
            elif row_count < 200:
                score -= 20
                reason = "Risk of overfitting on very small data."
            formatted_recs.append(ModelRecommendation(key="rf_regressor", name="Random Forest", match_score=score, reason=reason))

            # 3. XGBoost
            score = 90
            reason = "State-of-the-art accuracy."
            if row_count < 500:
                score -= 30
                reason = "Overkill for small data; likely to overfit."
            else:
                reason += " Captures complex patterns best."
            formatted_recs.append(ModelRecommendation(key="xgboost_regressor", name="XGBoost", match_score=score, reason=reason))

        elif local_task_type == "classification":
            # 1. Logistic Regression
            score = 85
            reason = "Great baseline for binary classification."
            if target is not None and target.nunique() > 2:
                score -= 10
                reason = "Less effective for multi-class problems."
            formatted_recs.append(ModelRecommendation(key="logistic_regression", name="Logistic Regression", match_score=score, reason=reason, badge="✨ Recommended"))

            # 2. Random Forest
            score = 90
            reason = "Handles complex boundaries well."
            formatted_recs.append(ModelRecommendation(key="rf_classifier", name="Random Forest", match_score=score, reason=reason))

            # 3. KNN
            score = 70
            reason = "Simple, distance-based classification."
            if row_count > 5000:
                score -= 20
                reason = "Very slow on large datasets."
            formatted_recs.append(ModelRecommendation(key="knn_classifier", name="K-Nearest Neighbors", match_score=score, reason=reason))
        
        # Sort Fallback
        formatted_recs.sort(key=lambda x: x.match_score, reverse=True)

    return formatted_recs

@router.get("/")
def list_models():
    """Return list of available ML models"""
    return ModelRegistry.list_models()