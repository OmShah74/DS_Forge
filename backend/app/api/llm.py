from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Dict, Any, Optional
import requests
import json
import logging

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter()

class EvaluationRequest(BaseModel):
    provider: str
    api_key: str
    model: str
    context: Dict[str, Any]

class RecommendationRequest(BaseModel):
    provider: str
    api_key: str
    model: str
    dataset_profile: Dict[str, Any]

# --- SHARED GENERATION LOGIC ---
def _generate_text(provider: str, api_key: str, model: str, prompt: str) -> str:
    """
    Unified interface for calling various LLM providers.
    """
    try:
        if provider == "openai":
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": model, 
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7
            }
            r = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
            
        elif provider == "groq":
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": model, 
                "messages": [{"role": "user", "content": prompt}]
            }
            r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
            
        elif provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            r = requests.post(url, headers={"Content-Type": "application/json"}, json=payload)
            r.raise_for_status()
            return r.json()["candidates"][0]["content"]["parts"][0]["text"]
            
        elif provider == "openrouter":
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": model, 
                "messages": [{"role": "user", "content": prompt}]
            }
            r = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
            
        else:
            raise ValueError(f"Unsupported provider: {provider}")
            
    except requests.exceptions.HTTPError as e:
        logger.error(f"LLM API Error: {e.response.text}")
        raise ValueError(f"Provider API Error: {e.response.text}")
    except Exception as e:
        logger.error(f"LLM General Error: {str(e)}")
        raise ValueError(f"Generation failed: {str(e)}")

# --- ENDPOINTS ---

@router.post("/evaluate")
async def evaluate_run(req: EvaluationRequest):
    """
    Stateless Proxy for LLM Evaluation.
    """
    if not req.api_key:
        raise HTTPException(status_code=400, detail="Missing API Key")

    prompt = _construct_eval_prompt(req.context)
    
    try:
        analysis = _generate_text(req.provider, req.api_key, req.model, prompt)
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommend")
async def recommend_models(req: RecommendationRequest):
    """
    Analyzes dataset profile and returns top model recommendations.
    """
    if not req.api_key:
        return _heuristic_fallback(req.dataset_profile)

    prompt = _construct_recommendation_prompt(req.dataset_profile)
    
    try:
        # Request JSON format if possible (though we parse loosely)
        response_text = _generate_text(req.provider, req.api_key, req.model, prompt)
        
        # Parse the response (assuming LLM follows instructions to return JSON)
        # We wrap in try/catch for parsing
        import re
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
        else:
            # Fallback if LLM didn't output JSON
            return _heuristic_fallback(req.dataset_profile)
            
    except Exception as e:
        print(f"LLM Recommendation failed: {e}. using fallback.")
        return _heuristic_fallback(req.dataset_profile)

# --- PROMPTS ---

def _construct_eval_prompt(ctx: Dict[str, Any]) -> str:
    # 1. Hardware/Data Context
    metrics = ctx.get("metrics", {})
    metrics_str = "\n".join([f"- {k.replace('_', ' ').title()}: {v:.4f}" if isinstance(v, float) else f"- {k}: {v}" for k, v in metrics.items()])
    
    # 2. Features
    features = ctx.get("detailed_report", {}).get("feature_importance", {})
    top_features = sorted(features.items(), key=lambda x: x[1], reverse=True)[:5]
    features_str = ", ".join([f"{k} ({v:.1%})" for k, v in top_features])

    model_name = ctx.get('model_name', 'Unknown Model')
    params = ctx.get('parameters', {})
    param_str = ", ".join([f"{k}={v}" for k, v in params.items()])
    
    return f"""
    You are a Senior Lead Data Scientist. A junior data scientist has trained a model and needs your rigorous, high-level feedback.
    
    ### 1. MODEL CONFIGURATION
    - **Algorithm**: {model_name}
    - **Hyperparameter Settings**: {param_str if param_str else "Default optimized parameters used."}
    - **Dataset Context**: {ctx.get('status', 'Unknown')}
    - **Key Drivers (Features)**: {features_str}

    ### 2. PERFORMANCE METRICS
    {metrics_str}

    ### 3. YOUR ASSIGNMENT
    Analyze the above run and provide a structured report in Markdown. 
    (Same strict rules as before: Executive Verdict, Deep Dive, Strategic Recommendations).
    """

def _construct_recommendation_prompt(profile: Dict[str, Any]) -> str:
    return f"""
    You are an expert AutoML Architect. Return a JSON object recommending the best 3 machine learning algorithms for this dataset.
    
    ### DATASET PROFILE
    - **Task Type**: {profile.get('task_type', 'Unknown')} (Regression/Classification/Clustering)
    - **Rows**: {profile.get('rows', 0)}
    - **Columns**: {profile.get('cols', 0)}
    - **Target Column**: {profile.get('target', 'None')}
    - **Feature Types**: {profile.get('feature_types', {})}
    - **Missing Values**: {profile.get('missing_ratio', 0):.1%}
    
    ### INSTRUCTIONS
    1. Select 3 diverse models from this available list:
       [Linear Regression, Ridge, Lasso, ElasticNet, SGD, Random Forest, Extra Trees, Gradient Boosting, XGBoost, Histogram GB, SVM/SVR, KNN, Neural Network (MLP), Naive Bayes]
    2. Rank them by suitability (1 = Best).
    3. Return ONLY valid JSON in this format:
    
    {{
      "recommendations": [
        {{
          "model_key": "rf_regressor",  // Must match standard keys (e.g. snake_case of algorithm)
          "name": "Random Forest",
          "reason": "Robust to outliers and handles mixed feature types well.",
          "score": 95
        }},
        ...
      ]
    }}
    
    Do not include markdown formatting or explanations outside the JSON.
    """

def _heuristic_fallback(profile):
    """
    Fast rule-based recommendations if LLM fails or is offline.
    """
    task = profile.get('task_type', 'regression')
    rows = profile.get('rows', 0)
    
    recs = []
    
    if task == 'regression':
        if rows < 1000:
            recs.append({"model_key": "linear_regression", "name": "Linear Regression", "reason": "Simple baseline for small data.", "score": 85})
            recs.append({"model_key": "ridge_regression", "name": "Ridge Regression", "reason": "Regularization helps prevent overfitting on small data.", "score": 88})
            recs.append({"model_key": "rf_regressor", "name": "Random Forest", "reason": "Captures non-linear patterns effectively.", "score": 90})
        else:
            recs.append({"model_key": "xgboost_regressor", "name": "XGBoost", "reason": "Standard industrial choice for medium/large tabular data.", "score": 95})
            recs.append({"model_key": "hist_gb_regressor", "name": "Histogram GB", "reason": "Optimized for speed on larger datasets.", "score": 92})
            recs.append({"model_key": "mlp_regressor", "name": "Neural Network", "reason": "Can model complex interactions given enough data.", "score": 88})
            
    elif task == 'classification':
        if rows < 1000:
            recs.append({"model_key": "logistic_regression", "name": "Logistic Regression", "reason": "Good baseline interpretable model.", "score": 85})
            recs.append({"model_key": "svc", "name": "Support Vector Machine", "reason": "Effective in high-dimensional spaces for smaller datasets.", "score": 90})
            recs.append({"model_key": "rf_classifier", "name": "Random Forest", "reason": "Robust default choice.", "score": 89})
        else:
            recs.append({"model_key": "xgboost_classifier", "name": "XGBoost", "reason": "State-of-the-art performance on tabular classification.", "score": 96})
            recs.append({"model_key": "rf_classifier", "name": "Random Forest", "reason": "Reliable and parallelizable.", "score": 90})
            recs.append({"model_key": "sgd_classifier", "name": "SGD Classifier", "reason": "Efficient linear classifier for very large datasets.", "score": 87})
            
    elif task == 'clustering':
        recs.append({"model_key": "kmeans", "name": "K-Means", "reason": "Fast and interpretable general purpose clustering.", "score": 90})
        recs.append({"model_key": "dbscan", "name": "DBSCAN", "reason": "Good for arbitrary shapes and detecting outliers.", "score": 88})
        recs.append({"model_key": "agglomerative", "name": "Agglomerative", "reason": "Useful hierarchical structure.", "score": 85})

    return {"recommendations": recs}
