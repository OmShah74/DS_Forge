from sklearn.linear_model import LinearRegression, LogisticRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor, GradientBoostingClassifier, AdaBoostRegressor, AdaBoostClassifier
from sklearn.svm import SVR, SVC
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
import xgboost as xgb

class ModelRegistry:
    """
    Central repository of available algorithms with detailed metadata and optimized default parameters.
    """
    
    MODELS = {
        # --- REGRESSION ---
        "linear_regression": {
            "name": "Linear Regression",
            "type": "regression",
            "class": LinearRegression,
            "params": {},
            "description": "The fundamental regression algorithm that models the relationship between a scalar response and one or more explanatory variables using a linear equation.",
            "formula": "y = β₀ + β₁x₁ + ... + βₙxₙ + ε",
            "param_meta": {}
        },
        "ridge_regression": {
            "name": "Ridge Regression (L2)",
            "type": "regression",
            "class": Ridge,
            "params": {"alpha": 1.0},
            "description": "Linear regression with L2 regularization. It minimizes the squared magnitude of coefficients to prevent overfitting, making it suitable for data with multicollinearity.",
            "formula": "Loss = RSS + α * ||β||²",
            "param_meta": {
                "alpha": {
                    "type": "number", "min": 0.01, "max": 10.0, "step": 0.1, "label": "Regularization Strength (Alpha)",
                    "help": "Controls how much we penalize large coefficients. Higher values result in simpler models (less overfitting) but may cause underfitting."
                }
            }
        },
        "lasso_regression": {
            "name": "Lasso Regression (L1)",
            "type": "regression",
            "class": Lasso,
            "params": {"alpha": 1.0},
            "description": "Linear regression with L1 regularization. It encourages sparse models by forcing some coefficients to become zero, effectively performing feature selection.",
            "formula": "Loss = RSS + α * ||β||₁",
            "param_meta": {
                "alpha": {
                    "type": "number", "min": 0.01, "max": 10.0, "step": 0.1, "label": "Regularization Strength (Alpha)",
                    "help": "Controls sparsity. Higher values force more features to have zero influence, effectively selecting only the most important features."
                }
            }
        },
        "rf_regressor": {
            "name": "Random Forest Regressor",
            "type": "regression",
            "class": RandomForestRegressor,
            "params": {"n_estimators": 100, "max_depth": 20, "random_state": 42},
            "description": "An ensemble method that operates by constructing a multitude of decision trees at training time and outputting the mean prediction of the individual trees.",
            "formula": "y = (1/N) * Σ Tree_i(x)",
            "param_meta": {
                "n_estimators": {
                    "type": "number", "min": 50, "max": 500, "step": 50, "label": "Number of Trees",
                    "help": "The total number of decision trees in the forest. More trees generally improve accuracy and stability but increase training time."
                },
                "max_depth": {
                    "type": "number", "min": 5, "max": 50, "step": 5, "label": "Max Depth", "nullable": True,
                    "help": "The maximum depth of each tree. Deeper trees capture more complex patterns but are more prone to overfitting."
                }
            }
        },
        "svr": {
            "name": "Support Vector Regressor (SVR)",
            "type": "regression",
            "class": SVR,
            "params": {"C": 1.0, "kernel": "rbf", "epsilon": 0.1},
            "description": "Applies the principles of Support Vector Machines to regression problems. It tries to fit the error within a certain threshold (epsilon).",
            "formula": "min ½||w||² + C Σ(ξ+ξ*) subject to |y - <w,x> - b| ≤ ε + ξ",
            "param_meta": {
                "C": {
                    "type": "number", "min": 0.1, "max": 100.0, "step": 0.5, "label": "Penalty Parameter (C)",
                    "help": "Controls the trade-off between achieving a low error on the training data and minimizing the model complexity. High C aims for low training error."
                },
                "kernel": {
                    "type": "select", "options": ["linear", "poly", "rbf", "sigmoid"], "label": "Kernel Function",
                    "help": "The mathematical function used to map data into a higher-dimensional space. 'rbf' is good for non-linear data."
                },
                "epsilon": {
                    "type": "number", "min": 0.01, "max": 1.0, "step": 0.01, "label": "Epsilon (Margin of Tolerance)",
                    "help": "Defines a margin of tolerance where no penalty is given to errors. Larger epsilon allows more errors to be ignored."
                }
            }
        },
        "xgboost_regressor": {
            "name": "XGBoost Regressor",
            "type": "regression",
            "class": xgb.XGBRegressor,
            "params": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 6, "random_state": 42},
            "description": "Extreme Gradient Boosting. A scalable distributed gradient-boosted decision tree algorithm known for high performance and speed.",
            "formula": "y = Σ f_k(x), where f_k are regression trees optimizing specific loss functions.",
            "param_meta": {
                "n_estimators": {
                    "type": "number", "min": 50, "max": 1000, "step": 50, "label": "Number of Boosting Rounds",
                    "help": "Number of boosting stages to perform. Gradient boosting is fairly robust to over-fitting so a large number usually results in better performance."
                },
                "learning_rate": {
                    "type": "number", "min": 0.001, "max": 0.5, "step": 0.005, "label": "Learning Rate (Eta)",
                    "help": "Step size shrinkage used in update to prevents overfitting. Lower eta requires more boosting rounds."
                },
                "max_depth": {
                    "type": "number", "min": 3, "max": 15, "step": 1, "label": "Max Tree Depth",
                    "help": "Maximum depth of a tree. Increasing this value will make the model more complex and more likely to overfit."
                }
            }
        },
        "adaboost_regressor": {
            "name": "AdaBoost Regressor",
            "type": "regression",
            "class": AdaBoostRegressor,
            "params": {"n_estimators": 50, "learning_rate": 1.0, "random_state": 42},
            "description": "Adaptive Boosting. Meta-algorithm that begins by fitting a regressor on the original dataset and then fits additional copies of the regressor but where the weights of instances are adjusted according to the error of the current prediction.",
            "formula": "H(x) = weighted sum of weak learners",
            "param_meta": {
                "n_estimators": {
                    "type": "number", "min": 10, "max": 200, "step": 10, "label": "Number of Estimators",
                    "help": "The maximum number of estimators at which boosting is terminated."
                },
                "learning_rate": {
                    "type": "number", "min": 0.01, "max": 2.0, "step": 0.05, "label": "Learning Rate",
                    "help": "Weight applied to each regressor at each boosting iteration. A higher learning rate increases the contribution of each regressor."
                }
            }
        },

        # --- CLASSIFICATION ---
        "logistic_regression": {
            "name": "Logistic Regression",
            "type": "classification",
            "class": LogisticRegression,
            "params": {"max_iter": 1000, "solver": "lbfgs", "random_state": 42},
            "description": "A statistical method for predicting binary classes. It measures the relationship between the categorical dependent variable and one or more independent variables using probability scores.",
            "formula": "P(y=1) = 1 / (1 + e^-(β₀ + β₁x))",
            "param_meta": {
                "max_iter": {
                    "type": "number", "min": 100, "max": 5000, "step": 100, "label": "Max Iterations",
                    "help": "Maximum number of iterations taken for the solvers to converge."
                }
            }
        },
        "rf_classifier": {
            "name": "Random Forest Classifier",
            "type": "classification",
            "class": RandomForestClassifier,
            "params": {"n_estimators": 100, "max_depth": None, "criterion": "gini", "random_state": 42},
            "description": "A meta estimator that fits a number of decision tree classifiers on various sub-samples of the dataset and uses averaging to improve the predictive accuracy and control over-fitting.",
            "formula": "Class = Mode of classes output by individual trees",
            "param_meta": {
                "n_estimators": {
                    "type": "number", "min": 10, "max": 500, "step": 10, "label": "Number of Trees",
                    "help": "The number of trees in the forest. Generally, more trees give better performance but retain more memory."
                },
                "max_depth": {
                    "type": "number", "min": 1, "max": 50, "step": 1, "label": "Max Depth", "nullable": True,
                    "help": "The maximum depth of the tree. Unconstrained depth allows the tree to grow until all leaves are pure."
                },
                "criterion": {
                    "type": "select", "options": ["gini", "entropy", "log_loss"], "label": "Split Criterion",
                    "help": "The function to measure the quality of a split. 'Gini' for Gini impurity and 'entropy' for information gain."
                }
            }
        },
        "svc": {
            "name": "Support Vector Classifier (SVC)",
            "type": "classification",
            "class": SVC,
            "params": {"C": 1.0, "kernel": "rbf", "probability": True, "random_state": 42},
            "description": "Finds the hyperplane that best separates the classes in the vector space. High effectiveness in high dimensional spaces.",
            "formula": "Maximize margin between classes utilizing kernel tricks.",
            "param_meta": {
                "C": {
                    "type": "number", "min": 0.1, "max": 100.0, "step": 0.5, "label": "Penalty Cost (C)",
                    "help": "Regularization parameter. The strength of the regularization is inversely proportional to C."
                },
                "kernel": {
                    "type": "select", "options": ["linear", "poly", "rbf", "sigmoid"], "label": "Kernel Function",
                    "help": "Specifies the kernel type to be used in the algorithm. 'rbf' is a safe default for non-linear problems."
                }
            }
        },
        "knn_classifier": {
            "name": "K-Nearest Neighbors",
            "type": "classification",
            "class": KNeighborsClassifier,
            "params": {"n_neighbors": 5, "weights": "uniform"},
            "description": "Instance-based learning where specific new cases are classified based on a majority vote of their K nearest neighbors measured by distance.",
            "formula": "Class assigned based on majority class of k-nearest neighbors.",
            "param_meta": {
                "n_neighbors": {
                    "type": "number", "min": 1, "max": 50, "step": 1, "label": "Neighbors (K)",
                    "help": "Number of neighbors to use. Smaller K is noise-sensitive, while larger K smooths the decision boundary."
                },
                "weights": {
                    "type": "select", "options": ["uniform", "distance"], "label": "Weight Function",
                    "help": "'uniform' weights all neighbors equally. 'distance' weights points by the inverse of their distance (closer points count more)."
                }
            }
        },
        "xgboost_classifier": {
            "name": "XGBoost Classifier",
            "type": "classification",
            "class": xgb.XGBClassifier,
            "params": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 6, "use_label_encoder": False, "eval_metric": "logloss", "random_state": 42},
            "description": "Implementation of gradient boosted decision trees designed for speed and performance. Dominates structured data problems.",
            "formula": "P(y) obtained by transforming the ensemble output score via logistic function.",
            "param_meta": {
                "n_estimators": {
                    "type": "number", "min": 50, "max": 1000, "step": 50, "label": "Number of Boosting Rounds",
                    "help": "Number of gradient boosted trees. Equivalent to number of boosting rounds."
                },
                "learning_rate": {
                    "type": "number", "min": 0.001, "max": 0.5, "step": 0.005, "label": "Learning Rate",
                    "help": "Boosting learning rate (step size shrinkage). Controls update magnitude to prevent overfitting."
                },
                "max_depth": {
                    "type": "number", "min": 3, "max": 15, "step": 1, "label": "Max Tree Depth",
                    "help": "Maximum depth of a tree. Deeper trees can model more complex interactions."
                }
            }
        },
         "gb_classifier": {
            "name": "Gradient Boosting Classifier",
            "type": "classification",
            "class": GradientBoostingClassifier,
            "params": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 3, "random_state": 42},
            "description": "Builds an additive model in a forward stage-wise fashion; it allows for the optimization of arbitrary differentiable loss functions.",
            "formula": "Sequential correction of residual errors by new weak learners.",
            "param_meta": {
                "n_estimators": {
                    "type": "number", "min": 50, "max": 500, "step": 50, "label": "Estimators",
                    "help": "The number of boosting stages to perform."
                },
                "learning_rate": {
                    "type": "number", "min": 0.01, "max": 1.0, "step": 0.01, "label": "Learning Rate",
                    "help": "Shrinks the contribution of each tree by learning_rate. There is a trade-off between learning_rate and n_estimators."
                },
                "max_depth": {
                    "type": "number", "min": 2, "max": 10, "step": 1, "label": "Max Depth",
                    "help": "Maximum depth of the individual regression estimators. Limits the number of nodes in the tree."
                }
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
                "description": v.get("description", ""),
                "formula": v.get("formula", ""),
                "param_meta": v.get("param_meta", {})
            }
            for k, v in cls.MODELS.items()
        ]