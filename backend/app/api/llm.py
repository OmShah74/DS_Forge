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
    # Safely extract metrics
    metrics = ctx.get("metrics", {})
    metrics_str = "\n".join([f"- {k}: {v}" for k, v in metrics.items()])
    
    # Feature Importance
    features = ctx.get("detailed_report", {}).get("feature_importance", {})
    top_features = sorted(features.items(), key=lambda x: x[1], reverse=True)[:5]
    features_str = ", ".join([f"{k} ({v:.3f})" for k, v in top_features])

    return f"""
    You are an expert Data Science AI Analyst. Analyze the following training run:
    
    **Model**: {ctx.get('model_name')}
    **Dataset**: {ctx.get('dataset_name', 'Unknown')}
    **Status**: {ctx.get('status')}
    
    **Performance Metrics**:
    {metrics_str}
    
    **Top Features**: {features_str}
    
    **Task**:
    1. Evaluate if this model is "Good", "Bad", or "Overfitting".
    2. Explain the metrics simply (what does the Accuracy/F1/MAE actually mean here?).
    3. Suggest 2 concrete improvements (e.g. data cleaning, hyperparams).
    
    Keep response concise (max 200 words). Use Markdown.
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
