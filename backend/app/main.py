from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

# Import Routers
from app.api import datasets, cleaning, models, training

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

@app.get(f"{settings.API_V1_STR}/test")
def test_api():
    return {"message": "Backend is connected to Frontend successfully!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "project": "DS-Forge V1"}