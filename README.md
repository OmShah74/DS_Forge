# DS-FORGE v1.1
### The Comprehensive Data Science Operating System

![Status](https://img.shields.io/badge/Status-Beta-blue)
![Stack](https://img.shields.io/badge/Stack-Next.js_|_FastAPI_|_Docker-black)
![License](https://img.shields.io/badge/License-MIT-green)

**DS-Forge** is an end-to-end platform tailored for data scientists and engineers to visually manage the entire machine learning lifecycle—from raw data ingestion to production-grade deployment. Version 1.1 transforms the platform into a robust "No-Code / Low-Code" studio, offering precise control over every data point while automating complex pipelines.

---

## 🚀 Key Functionalities

### 1. Intelligent Data Ingestion
*Effortlessly load and standardize your raw datasets.*
- **Universal File Support**: Drag-and-drop `.csv`, `.json`, or `.xlsx` files.
- **Smart Parsing**: Automatically detects delimiters, headers, and data types.
- **Raw Input**: Direct pasted text support for quick prototyping.
- **Auto-Schema**: Instantly validates and locks data schemas upon upload.

### 2. Advanced Data Cleaning Studio (v1.1 Enhanced)
*Sanitize and prepare your data with surgical precision.*
- **25+ Atomic Operations**: From basic missing value imputation (Mean, Median, Mode) to advanced transformations like Winsorization and Z-Score outlier removal.
- **Manual Data Grid**: A spreadsheet-like interface allowing you to manually edit specific cells, rows, or columns when automated rules aren't enough.
- **Universal Column Selection**: Apply any operation—sorting, shuffling, title-casing, or dropping—to specific target columns or the entire dataset.
- **Smart Recommendations**: The system analyzes your dataframe and suggests the most impactful cleaning steps (marked with a Star ✦) to improve data quality.

### 3. Feature Engineering Suite
*Transform raw signals into powerful predictive features.*
- **28+ Transformation Tools**: Complete suite including PCA, t-SNE, Isomap, Polynomial Features, and Robust Scaling.
- **Automated Encoding**: Intelligent handling of categorical variables via One-Hot, Label, or Binary encoding.
- **Dimensionality Reduction**: Visual techniques to compress high-dimensional data while preserving structure.
- **Pipeline Preservation**: All transformations are recorded to ensure the exact same logic is applied during inference.

### 4. Machine Learning & Model Zoo
*Train, Tune, and Compare models without writing code.*
- **Curated Model Library**:
    - **Regression**: Random Forest, Gradient Boosting, SVR, Linear Regression.
    - **Classification**: SVM, Logistic Regression, Decision Trees, AdaBoost.
- **Hyperparameter Tuning**: Interactive controls for Learning Rate, Estimators, and Max Depth with built-in guidance.
- **Performance Architecture**: optimized for multi-core CPU execution for efficient training on standard hardware.

### 5. Deployment & Production
*From experiment to API in one click.*
- **Instant REST API**: Successfully trained models are automatically containerized and exposed via a standard `/predict` endpoint.
- **Inference Engine**: Handles all pre-processing automatically. Send raw data (e.g., "Red", "Large") and the system applies the exact cleaning and encoding steps used during training.
- **Live Playground**: Built-in JSON tester to validate model predictions in real-time.

---

## 🛠️ Technology Stack

DS-Forge is built on a modern, high-performance stack designed for scalability and developer experience.

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | **Next.js 14** | React-based framework for a responsive, interactive UI. |
| **Styling** | **Tailwind CSS** | Utility-first CSS for a premium, dark-mode aesthetic. |
| **Backend** | **FastAPI** | High-performance Python framework for async API handling. |
| **Data Engine** | **Pandas & NumPy** | The industry standard for efficient data manipulation. |
| **ML Core** | **Scikit-Learn** | Robust algorithms for classification, regression, and processing. |
| **Container** | **Docker** | Ensures consistent environments across development and production. |

---

## ⚡ Getting Started

You do **not** need to install Python or Node.js manually. The entire system is containerized.

### Method 1: Docker Compose (Recommended)
This is the easiest way to run the full app with persistent storage. 

1. Create a file named `docker-compose.yml` and paste the following:
```yaml
version: '3.8'
services:
  backend:
    image: omshah74/dsforge-backend:v1.1
    container_name: ds-forge-backend
    ports: ["8000:8000"]
    volumes:
      - dsforge_storage:/app/app/storage
      - dsforge_db:/app/app/db
    restart: always

  frontend:
    image: omshah74/dsforge-frontend:v1.1
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
  omshah74/dsforge-backend:v1.1
```

**3. Start Frontend**
```bash
docker run -d \
  --name dsforge-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 \
  omshah74/dsforge-frontend:v1.1
```

### Access the System
- **Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛡️ License

This project is licensed under the MIT License.

---
**Built by Om Shah**
