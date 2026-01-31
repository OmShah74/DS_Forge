# DS-FORGE: The Data Science Operating System

DS-Forge is a premium, local-first **Data Science Operating System** designed to streamline the end-to-end ML lifecycle. It unifies data ingestion, cleaning, training, evaluation, AI analysis, and deployment into a single, cohesive, "Glassmorphic" interface.

Built for privacy and performance, DS-Forge runs completely locally via Docker, ensuring your sensitive data never leaves your machine unless you explicitly configure the AI Analyst.

![DS-Forge Dashboard](https://via.placeholder.com/800x400.png?text=DS-Forge+Dashboard+Preview)

---

## 🚀 Key Features

### 1. 📂 Data Ingestion
- **Universal Import**: Drag-and-drop support for CSV, Excel (XLSX), and JSON files.
- **Smart Parsing**: Automatically detects delimiters and headers.
- **Persistence**: Datasets are stored securely in the local `storage/datasets` volume.

### 2. 🧼 Cleaning Engine (3-Column UI)
A professional workspace for data wrangling:
- **Registry (Left)**: Select and preview raw datasets.
- **Control Console (Center)**: Apply transformation operations:
    - *Rename Columns*
    - *Handle Missing Values (Mean/Median/Mode)*
    - *Drop Duplicates/Columns*
    - *Normalize/Scale Data*
- **Stream Analysis (Right)**: Real-time preview of your data transformation pipeline.

### 3. 🧠 Model Training
- **Algorithm Suite**: Logistic Regression, Random Forest, XGBoost, SVM, AdaBoost, Gradient Boosting.
- **Hyperparameter Tuning**: Fully customizable parameters (Learning Rate, n_estimators, etc.) with tooltip formulas.
- **Auto-Encoding**: Automatically detects categorical columns and saves LabelEncoders for robust inference.

### 4. 📊 Evaluation & AI Analyst
- **Deep Metrics**: Precision, Recall, F1-Score (Weighted/Macro), MCC, ROC-AUC, MAE, RMSE.
- **Visual Diagnostics**:
    - **Radar Charts**: Compare model "shape" across metrics.
    - **Residual Plots**: Analyze regression error distribution.
    - **Feature Importance**: Identify key drivers of prediction.
- **AI Analyst**: (New) Integrated LLM agent.
    - Configure your own API Key (OpenAI, Groq, Gemini) in **Settings**.
    - Generates qualitative reports ("Good/Bad/Overfitting") and suggests improvements.
    - **Privacy**: Keys stored locally in browser; requests are stateless proxy.

### 5. 🚀 Production Deployment
- **Real Inference**: Deploys trained models to a REST API.
- **Robust Pipeline**: Loads saved encoders to handle raw string inputs (business data) automatically.
- **Test Interface**: Built-in JSON tester to verify model API responses.

### 6. ⚙️ System Management
- **Factory Reset**: "Danger Zone" purge functionality to wipe the database and storage for a fresh start.

---

## 🏗️ Architecture

DS-Forge follows a modern, containerized microservices architecture:

### **Frontend (Port 3000)**
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS + Framer Motion (Glassmorphism Design System)
- **State Management**: Zustand (Persisted Config Store)
- **Visualization**: Recharts

### **Backend (Port 8000)**
- **Framework**: FastAPI (Python 3.10)
- **Database**: SQLite (Local file-based persistence)
- **ML Engine**: Scikit-Learn, XGBoost, Pandas, Numpy, Joblib
- **API**: RESTful endpoints with Pydantic validation

### **Infrastructure**
- **Docker**: Containerized environment for consistent execution.
- **Volumes**:
    - `backend/app/storage`: Persists models and datasets on host.
    - `backend/app/db`: Persists SQLite database.

---

## 🛠️ Setup & Installation

### Prerequisites
- Docker Desktop installed & running.
- (Optional) OpenAI/Groq API Key for AI features.

### Quick Start
1. **Clone the Repository**
   ```bash
   git clone https://github.com/OmShah74/DS_Forge.git
   cd ds-forge
   ```

2. **Launch System**
   ```bash
   docker-compose up --build
   ```
   *Note: First run may take a few minutes to build the Python environment.*

3. **Access OS**
   - **Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📖 Deployment Guide

### Making Predictions
Once a model is trained and "Deployed":

**Endpoint**: `POST /api/v1/deployment/predict`

**Payload**:
```json
{
  "run_id": 1,
  "input_data": [
    {
      "SepalLengthCm": 5.1,
      "Species": "Iris-setosa" // Encoders handle strings automatically!
    }
  ]
}
```

---

## ⚠️ Troubleshooting

**"Network Error"**
- The backend container is restarting. Wait 30s and refresh.

**"Module Not Found"** (React Markdown)
- Run `docker-compose down -v` followed by `docker-compose up --build` to refresh dependencies.

---

**Developed for Advanced Agentic Coding by Google Deepmind.**
*Om Shah (User) | Antigravity (Agent)*
