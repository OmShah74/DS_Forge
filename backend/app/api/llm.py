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
    # 4. Construct Narrative Prompt
    return f"""
    You are a Senior Lead Data Scientist. A junior data scientist has trained a model and needs your rigorous, high-level feedback.
    
    ### 1. MODEL CONFIGURATION
    - **Algorithm**: {model_name}
    - **Hyperparameter Settings**: 
      {param_str if param_str else "Default optimized parameters used."}
    - **Dataset Context**: {ctx.get('status', 'Unknown')}
    - **Key Drivers (Features)**: {features_str}

    ### 2. PERFORMANCE METRICS
    {metrics_str}

    ### 3. YOUR ASSIGNMENT
    Analyze the above run and provide a structured report in Markdown. Strict rules:
    
    **1. Executive Verdict (Pass/Fail)**
    - START with one of: "✅ PRODUCTION READY", "⚠️ NEEDS TUNING", or "❌ FAILED EXP".
    - Explain WHY in 1 sentence citing the specific primary metric (e.g., "RMSE of 1.54 is too high given the target range...").

    **2. Deep Dive Analysis**
    - **Feature Logic**: Do the top features ({features_str}) make sense? Are there potential data leaks?
    - **Hyperparameter Critique**: Look at the settings above. Are they aggressive (high likelihood of overfitting) or conservative? Critique them specifically.
    - **Error Analysis**: 
        - If Regression: Discuss RMSE vs MAE. Is the model making large errors on outliers?
        - If Classification: Discuss Precision/Recall balance.
    
    **3. Strategic Recommendations**
    - Provide 2 concrete, technical next steps. 
    - BAD: "Tune hyperparameters."
    - GOOD: "Reduce `learning_rate` to 0.05 and increase `n_estimators` to 500 to capture fine-grained patterns."
    - GOOD: "Feature Engineer a 'log_duration' column to handle the skew in the 'duration' feature."

    **Tone**: Authoritative, precise, and educational. No filler words.
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
