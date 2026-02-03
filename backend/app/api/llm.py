from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Dict, Any, Optional
import requests
import json

router = APIRouter()

class EvaluationRequest(BaseModel):
    provider: str
    api_key: str
    model: str
    context: Dict[str, Any]

@router.post("/evaluate")
async def evaluate_run(req: EvaluationRequest):
    """
    Stateless Proxy for LLM Evaluation.
    Keys are not stored; they are used once to proxy the request.
    """
    if not req.api_key:
        raise HTTPException(status_code=400, detail="Missing API Key")

    prompt = _construct_prompt(req.context)
    
    try:
        if req.provider == "openai":
            return _call_openai(req.api_key, req.model, prompt)
        elif req.provider == "groq":
            return _call_groq(req.api_key, req.model, prompt)
        elif req.provider == "gemini":
            return _call_gemini(req.api_key, req.model, prompt)
        elif req.provider == "openrouter":
            return _call_openrouter(req.api_key, req.model, prompt)
        else:
            raise HTTPException(status_code=400, detail="Invalid Provider")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")

def _construct_prompt(ctx: Dict[str, Any]) -> str:
    # 1. Hardware/Data Context
    metrics = ctx.get("metrics", {})
    metrics_str = "\n".join([f"- {k.replace('_', ' ').title()}: {v:.4f}" if isinstance(v, float) else f"- {k}: {v}" for k, v in metrics.items()])
    
    # 2. Features
    features = ctx.get("detailed_report", {}).get("feature_importance", {})
    top_features = sorted(features.items(), key=lambda x: x[1], reverse=True)[:5]
    features_str = ", ".join([f"{k} ({v:.1%})" for k, v in top_features])

    # 3. Model Context
    model_name = ctx.get('model_name', 'Unknown Model')
    params = ctx.get('parameters', {})
    param_str = ", ".join([f"{k}={v}" for k, v in params.items()])
    
    # 4. Construct Narrative Prompt
    return f"""
    You are a Senior Data Science Consultant reviewing a training run. Your goal is to explain the results to a business user and suggest concrete improvements.

    ### 1. EXPERIMENT CONTEXT
    - **Algorithm**: {model_name}
    - **Hyperparameters**: {param_str}
    - **Dataset Status**: {ctx.get('status', 'Unknown')}
    - **Top Features**: {features_str}

    ### 2. PERFORMANCE METRICS
    {metrics_str}

    ### 3. YOUR TASK
    Provide a concise, 3-part analysis in Markdown:

    **1. Executive Summary (2-3 sentences)**
    - Is this model "Production Ready", "Promising but needs tuning", or "Unusable"? 
    - Why? (Cite the primary metric, e.g., Accuracy or RMSE).

    **2. Deep Dive & Interpretation**
    - **Feature Impact**: Explain which features drove the predictions and if that makes logical sense.
    - **Hyperparameter Critique**: Did the chosen settings (e.g., {param_str}) likely cause overfitting or underfitting?
    - **Metric Explanation**: Briefly explain *what* the key metric means in plain English (e.g., "An F1 score of 0.8 means...").

    **3. Actionable Recommendations**
    - Suggest 2 specific next steps.
    - Examples: "Increase n_estimators to reduce variance", "Drop feature X due to noise", "Collect more data".

    **Tone**: Professional, encouraging, and highly specific. Avoid generic advice.
    """

def _call_openai(key, model, prompt):
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {
        "model": model, 
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    r = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
    r.raise_for_status()
    return {"analysis": r.json()["choices"][0]["message"]["content"]}

def _call_groq(key, model, prompt):
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {
        "model": model, 
        "messages": [{"role": "user", "content": prompt}]
    }
    r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
    r.raise_for_status()
    return {"analysis": r.json()["choices"][0]["message"]["content"]}

def _call_gemini(key, model, prompt):
    # Gemini uses query param for key usually, or custom header
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    r = requests.post(url, headers={"Content-Type": "application/json"}, json=payload)
    r.raise_for_status()
    return {"analysis": r.json()["candidates"][0]["content"]["parts"][0]["text"]}

def _call_openrouter(key, model, prompt):
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {
        "model": model, 
        "messages": [{"role": "user", "content": prompt}]
    }
    r = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
    r.raise_for_status()
    return {"analysis": r.json()["choices"][0]["message"]["content"]}
