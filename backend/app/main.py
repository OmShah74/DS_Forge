from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

# Import Routers
from app.api import datasets, cleaning, models, training, deployment, features, activities

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
origins = ["http://localhost", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routes
app.include_router(datasets.router, prefix=f"{settings.API_V1_STR}/datasets", tags=["datasets"])
app.include_router(cleaning.router, prefix=f"{settings.API_V1_STR}/cleaning", tags=["cleaning"])
app.include_router(models.router, prefix=f"{settings.API_V1_STR}/models", tags=["models"])
app.include_router(training.router, prefix=f"{settings.API_V1_STR}/training", tags=["training"])
app.include_router(deployment.router, prefix=f"{settings.API_V1_STR}/deployment", tags=["deployment"])
app.include_router(features.router, prefix=f"{settings.API_V1_STR}/features", tags=["features"])
app.include_router(activities.router, prefix=f"{settings.API_V1_STR}/activities", tags=["activities"])
# Register LLM Router
from app.api import llm, system
app.include_router(llm.router, prefix=f"{settings.API_V1_STR}/llm", tags=["llm"])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["system"])
# Register Analysis Router
from app.api import analysis
app.include_router(analysis.router, prefix=f"{settings.API_V1_STR}/analysis", tags=["analysis"])

@app.get(f"{settings.API_V1_STR}/test")
def test_api():
    return {
        "status": "ok",
        "message": "Backend is connected to Frontend successfully!"
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "DS-Forge V1",
        "health": "healthy"
    }
