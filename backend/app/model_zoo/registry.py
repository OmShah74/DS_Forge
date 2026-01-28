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
            "params": {}
        },
        "ridge_regression": {
            "name": "Ridge Regression",
            "type": "regression",
            "class": Ridge,
            "params": {"alpha": 1.0}
        },
        "rf_regressor": {
            "name": "Random Forest Regressor",
            "type": "regression",
            "class": RandomForestRegressor,
            "params": {"n_estimators": 100, "max_depth": None}
        },
        "svr": {
            "name": "Support Vector Regressor (SVR)",
            "type": "regression",
            "class": SVR,
            "params": {"C": 1.0, "kernel": "rbf"}
        },

        # --- CLASSIFICATION ---
        "logistic_regression": {
            "name": "Logistic Regression",
            "type": "classification",
            "class": LogisticRegression,
            "params": {"max_iter": 1000}
        },
        "rf_classifier": {
            "name": "Random Forest Classifier",
            "type": "classification",
            "class": RandomForestClassifier,
            "params": {"n_estimators": 100, "max_depth": None}
        },
        "svc": {
            "name": "Support Vector Classifier (SVC)",
            "type": "classification",
            "class": SVC,
            "params": {"C": 1.0, "kernel": "rbf", "probability": True}
        },
        "knn_classifier": {
            "name": "K-Nearest Neighbors",
            "type": "classification",
            "class": KNeighborsClassifier,
            "params": {"n_neighbors": 5}
        }
    }

    @classmethod
    def get_model(cls, model_key):
        return cls.MODELS.get(model_key)

    @classmethod
    def list_models(cls):
        return [
            {"key": k, "name": v["name"], "type": v["type"], "default_params": v["params"]}
            for k, v in cls.MODELS.items()
        ]