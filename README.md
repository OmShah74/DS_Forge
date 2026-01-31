# DS-FORGE: The Data Science Operating System

![Status](https://img.shields.io/badge/Status-Beta-blue)
![Stack](https://img.shields.io/badge/Stack-Next.js_|_FastAPI_|_Docker-black)
![License](https://img.shields.io/badge/License-MIT-green)

## Table of Contents

- [Features](#features)
- [Pipeline Architecture](#pipeline-architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Roadmap](#roadmap)
- [License](#license)

## Getting Started

You do **not** need to clone the repository or have a Docker account to use DS-Forge. You only need **Docker Desktop** installed on your machine.

### Method 1: Docker Compose (Recommended)
This is the easiest way to run the full app with persistent storage. 

1. Create a file named `docker-compose.yml` and paste the following:
```yaml
version: '3.8'
services:
  backend:
    image: omshah74/dsforge-backend:v1.0
    container_name: ds-forge-backend
    ports: ["8000:8000"]
    volumes:
      - dsforge_storage:/app/app/storage
      - dsforge_db:/app/app/db
    restart: always

  frontend:
    image: omshah74/dsforge-frontend:v1.0
    container_name: ds-forge-frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    depends_on: [backend]
    restart: always

volumes:
  dsforge_storage:
  dsforge_db:
```

2. Open your terminal in that folder and run:
```bash
docker-compose up -d
```

### Method 2: Standalone Docker Commands
Use this if you prefer running containers individually. Note that you must specify volumes to keep your data after restart.

**1. Create Volumes**
```bash
docker volume create dsforge_storage
docker volume create dsforge_db
```

**2. Start Backend**
```bash
docker run -d \
  --name dsforge-backend \
  -p 8000:8000 \
  -v dsforge_storage:/app/app/storage \
  -v dsforge_db:/app/app/db \
  omshah74/dsforge-backend:v1.0
```

**3. Start Frontend**
```bash
docker run -d \
  --name dsforge-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 \
  omshah74/dsforge-frontend:v1.0
```

### Access the System
- **Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

## Usage Guide

### 1. Data Ingestion
*Objective: Load and standardize raw input.*
- **File Support**: Drag and drop `.csv`, `.json`, or `.xlsx` files.
- **Raw Input**: Paste raw text data directly into the parser.
- **Validation**: System automatically creates a standardized schema and saves the dataset to the `storage/datasets` volume.

### 2. Cleaning Engine
*Objective: Sanitize and preprocess data.*
- **Control Console**: Access 25+ atomic cleaning operations.
    - *Missing Values*: Impute (Mean, Median, Mode) or Drop.
    - *Outliers*: Detect and clamp/remove.
    - *Columns*: Rename, Drop, or Retype.
- **Stream Visualization**: See real-time "Before/After" snapshots of your data as you apply operations.
- **Download**: Export the cleaned dataset at any stage.

### 3. Feature Engineering
*Objective: Transform data for Machine Learning.*
- **Encoding**: Automatically detects categorical columns and applies Label/One-Hot encoding.
- **Scaling**: Normalize (MinMax) or Standardize (Z-Score) numerical features.
- **Preparation**: Splits data into Training and Validation sets ensuring no leakage.

### 4. Model Training
*Objective: Generate predictive artifacts.*
- **Model Zoo**: Select from a curated library of algorithms:
    - *Regression*: Linear Regression, Random Forest, SVR, Gradient Boosting.
    - *Classification*: Logistic Regression, SVM, Decision Trees, AdaBoost.
- **Hyperparameters**: Fine-tune Learning Rate, Estimators, and Depth with built-in formula references.
- **Execution**: Runs entirely on the CPU, utilizing multi-core processing for speed.

### 5. Evaluation & AI Analytics
*Objective: Validate and audit performance.*
- **Metrics Grid**: Precision, Recall, F1-Score, ROC-AUC, MAE, MSE, RMSE.
- **Visuals**: Radar Charts for metric balance and Residual Plots for error distribution.
- **AI Analyst**: Click "Generate Report" to send metrics to an LLM (GPT-4/Llama-3). It reads the results and generates a qualitative report suggesting specific improvements (e.g., "High variance detected, try increasing regularization").

### 6. Deployment
*Objective: Expose model as a service.*
- **One-Click Deploy**: Move a successfully trained model to the `production` slot.
- **REST API**: Auto-generates a `/predict` endpoint for the model.
- **Auto-Encoding**: The inference engine remembers the encodings from Step 3, allowing you to send raw string data (e.g., "Red", "Large") which it automatically converts to numbers for the model.

### 7. Monitoring
*Objective: Track real-world usage.*
- **Live Inference Tester**: A built-in JSON playground to test the API in real-time.
- **Health Checks**: System monitors API latency and error rates.
- *(Version 2 Feature)*: Advanced Grafana dashboards and drift detection are planned for the next release.

## Roadmap

**Version 2.0 (Agentic Era)** will introduce:
- **Agflow Integration**: Orchestrate complex AI agents using visual nodes.
- **Auto-Cleaning Agent**: LLM that plans and executes the entire cleaning pipeline automatically.
- **RAG for Recommendations**: Vector-based search to recommend the best model for your specific dataset.
- **Advanced Monitoring**: LangSmith/Grafana integration for full observability.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by Om Shah**
*Data Science Mega Project - Production Edition*
