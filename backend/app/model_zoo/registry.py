from sklearn.linear_model import LinearRegression, LogisticRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.svm import SVR, SVC
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier

class ModelRegistry:
    """
    Central repository of available algorithms.
    """
    
    MODELS = {
        # --- REGRESSION ---
        "linear_regression": {
            "name": "Linear Regression",
            "type": "regression",
            "class": LinearRegression,
            "params": {},
            "param_meta": {}
        },
        "ridge_regression": {
            "name": "Ridge Regression",
            "type": "regression",
            "class": Ridge,
            "params": {"alpha": 1.0},
            "param_meta": {
                "alpha": {"type": "number", "min": 0.01, "max": 10.0, "step": 0.1, "label": "Regularization Strength"}
            }
        },
        "rf_regressor": {
            "name": "Random Forest Regressor",
            "type": "regression",
            "class": RandomForestRegressor,
            "params": {"n_estimators": 100, "max_depth": None},
            "param_meta": {
                "n_estimators": {"type": "number", "min": 10, "max": 500, "step": 10, "label": "Tree Count"},
                "max_depth": {"type": "number", "min": 1, "max": 50, "step": 1, "label": "Max Depth", "nullable": True}
            }
        },
        "svr": {
            "name": "Support Vector Regressor (SVR)",
            "type": "regression",
            "class": SVR,
            "params": {"C": 1.0, "kernel": "rbf"},
            "param_meta": {
                "C": {"type": "number", "min": 0.1, "max": 100.0, "step": 0.5, "label": "Penalty Cost (C)"},
                "kernel": {"type": "select", "options": ["linear", "poly", "rbf", "sigmoid"], "label": "Kernel Logic"}
            }
        },

        # --- CLASSIFICATION ---
        "logistic_regression": {
            "name": "Logistic Regression",
            "type": "classification",
            "class": LogisticRegression,
            "params": {"max_iter": 1000},
            "param_meta": {
                "max_iter": {"type": "number", "min": 100, "max": 5000, "step": 100, "label": "Max Iterations"}
            }
        },
        "rf_classifier": {
            "name": "Random Forest Classifier",
            "type": "classification",
            "class": RandomForestClassifier,
            "params": {"n_estimators": 100, "max_depth": None},
            "param_meta": {
                "n_estimators": {"type": "number", "min": 10, "max": 500, "step": 10, "label": "Tree Count"},
                "max_depth": {"type": "number", "min": 1, "max": 50, "step": 1, "label": "Max Depth", "nullable": True}
            }
        },
        "svc": {
            "name": "Support Vector Classifier (SVC)",
            "type": "classification",
            "class": SVC,
            "params": {"C": 1.0, "kernel": "rbf", "probability": True},
            "param_meta": {
                "C": {"type": "number", "min": 0.1, "max": 100.0, "step": 0.5, "label": "Penalty Cost (C)"},
                "kernel": {"type": "select", "options": ["linear", "poly", "rbf", "sigmoid"], "label": "Kernel Logic"}
            }
        },
        "knn_classifier": {
            "name": "K-Nearest Neighbors",
            "type": "classification",
            "class": KNeighborsClassifier,
            "params": {"n_neighbors": 5},
            "param_meta": {
                "n_neighbors": {"type": "number", "min": 1, "max": 50, "step": 1, "label": "Neighbors (K)"}
            }
        }
    }

    @classmethod
    def get_model(cls, model_key):
        return cls.MODELS.get(model_key)

    @classmethod
    def list_models(cls):
        return [
            {
                "key": k, 
                "name": v["name"], 
                "type": v["type"], 
                "default_params": v["params"],
                "param_meta": v.get("param_meta", {})
            }
            for k, v in cls.MODELS.items()
        ]