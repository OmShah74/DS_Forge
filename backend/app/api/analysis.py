from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import numpy as np

from app.db.session import get_db
from app.db.models import Dataset

router = APIRouter()

class FeatureAnalysisRequest(BaseModel):
    dataset_id: int
    target_column: str

class FeatureRelevance(BaseModel):
    feature: str
    score: float
    relevance: str  # "High", "Medium", "Low"
    reason: str 

@router.post("/features", response_model=List[FeatureRelevance])
def analyze_features(req: FeatureAnalysisRequest, db: Session = Depends(get_db)):
    """
    Calculates the relevance of each feature column to the target column.
    Uses Pearson correlation for numerical targets/features.
    """
    # 1. Load Dataset
    dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    print(f"[DEBUG] Analyzing Dataset ID: {req.dataset_id}")
    print(f"[DEBUG] DB File Path: {dataset.file_path}")
    
    # Handle potential Windows/Linux path mismatch
    # If path is relative like 'app/storage/...' ensure it works
    import os
    if not os.path.exists(dataset.file_path):
        print(f"[ERROR] File does not exist at: {dataset.file_path}")
        # Try a fallback if standard relative path
        fallback = f"/app/{dataset.file_path}"
        if os.path.exists(fallback):
             print(f"[DEBUG] Found at fallback: {fallback}")
             dataset.file_path = fallback
        else:
             print(f"[ERROR] Fallback also failed: {fallback}")

    try:
        df = pd.read_parquet(dataset.file_path)
    except Exception as e:
        print(f"[ERROR] Read Parquet Failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to load dataset: {str(e)}")

    if req.target_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{req.target_column}' not found")

    target = df[req.target_column]
    results = []

    # 2. Analyze Correlations
    # Basic logic: 
    # - If target is numerical, use correlation.
    # - If target is categorical, this simple MVP might fail or need fallback.
    # For MVP transparency, we'll try to convert target to codes if not numeric.
    
    is_target_numeric = pd.api.types.is_numeric_dtype(target)
    
    if not is_target_numeric:
        # Convert to codes for a rough correlation check
        target_encoded = target.astype('category').cat.codes
    else:
        target_encoded = target

    for col in df.columns:
        if col == req.target_column:
            continue
        
        try:
            # Skip if column is extremely high cardinality (like IDs)
            if df[col].nunique() > len(df) * 0.95:
                 results.append({
                    "feature": col,
                    "score": 0.0,
                    "relevance": "Low",
                    "reason": "High cardinality (likely ID)"
                })
                 continue

            col_data = df[col]
            if not pd.api.types.is_numeric_dtype(col_data):
                col_data = col_data.astype('category').cat.codes

            # Calculate Correlation
            corr = np.abs(col_data.corr(target_encoded))
            if pd.isna(corr):
                corr = 0.0
            
            # Determine Verdict
            if corr > 0.5:
                relevance = "High"
                reason = "Strong statistical relationship"
            elif corr > 0.1:
                relevance = "Medium"
                reason = "Moderate correlation"
            else:
                relevance = "Low"
                reason = "Weak or non-linear relationship"

            results.append({
                "feature": col,
                "score": float(corr),
                "relevance": relevance,
                "reason": reason
            })

        except Exception:
             results.append({
                "feature": col,
                "score": 0.0,
                "relevance": "Unknown",
                "reason": "Analysis failed (incompatible types)"
            })
    
    # Sort by score descending
    results.sort(key=lambda x: x['score'], reverse=True)
    return results
