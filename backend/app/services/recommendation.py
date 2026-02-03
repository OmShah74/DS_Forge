import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.api.llm import _generate_text, _construct_recommendation_prompt, _heuristic_fallback

class RecommendationService:
    """
    Service to analyze datasets and recommend the best model algorithms.
    Uses a hybrid approach:
    1. Heuristic Engine: Fast, rule-based filtering based on data shape/type.
    2. LLM Engine: Deep reasoning based on data nuances (if API key available).
    """

    @staticmethod
    def analyze_dataset(df: pd.DataFrame, target_col: str = None) -> Dict[str, Any]:
        """
        Generates a concise profile of the dataset for the LLM.
        """
        profile = {
            "rows": len(df),
            "cols": len(df.columns),
            "target": target_col,
            "feature_types": df.dtypes.apply(lambda x: str(x)).value_counts().to_dict(),
            "missing_ratio": df.isnull().mean().mean(),
            "task_type": "unknown"
        }

        # Infer Task Type
        if target_col and target_col in df.columns:
            target_data = df[target_col]
            unique_count = target_data.nunique()
            dtype = target_data.dtype
            
            if pd.api.types.is_numeric_dtype(dtype) and unique_count > 20:
                profile["task_type"] = "regression"
            else:
                profile["task_type"] = "classification"
        else:
            profile["task_type"] = "clustering"

        return profile

    @staticmethod
    def get_recommendations(profile: Dict[str, Any], provider: str = None, api_key: str = None, model: str = None) -> Dict[str, Any]:
        """
        Orchestrates the recommendation flow.
        """
        # 1. Fallback if no LLM config
        if not api_key:
            return _heuristic_fallback(profile)

        # 2. Try LLM
        try:
            prompt = _construct_recommendation_prompt(profile)
            response_text = _generate_text(provider, api_key, model, prompt)
            
            import json
            import re
            
            # Robust JSON extraction
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                print("LLM received non-JSON response. Using fallback.")
                return _heuristic_fallback(profile)
                
        except Exception as e:
            print(f"LLM Recommendation failed: {e}. Reverting to heuristics.")
            return _heuristic_fallback(profile)
