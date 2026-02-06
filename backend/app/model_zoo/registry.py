from sklearn.linear_model import (
    LinearRegression, LogisticRegression, Ridge, Lasso, ElasticNet, 
    SGDClassifier, SGDRegressor, BayesianRidge, HuberRegressor, 
    PassiveAggressiveClassifier, PassiveAggressiveRegressor, RidgeClassifier
)
from sklearn.ensemble import (
    RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor, 
    GradientBoostingClassifier, AdaBoostRegressor, AdaBoostClassifier, 
    ExtraTreesRegressor, ExtraTreesClassifier, BaggingRegressor, BaggingClassifier,
    HistGradientBoostingRegressor, HistGradientBoostingClassifier
)
from sklearn.svm import SVR, SVC, LinearSVC, NuSVC, LinearSVR, NuSVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB, MultinomialNB, BernoulliNB, ComplementNB
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering, SpectralClustering
from sklearn.mixture import GaussianMixture
import xgboost as xgb

class ModelRegistry:
    """
    Central repository of available algorithms with detailed metadata and optimized default parameters.
    Updated with 20+ advanced models across Regression, Classification, and Clustering.
    """
    
    MODELS = {
        # ==========================================
        #              REGRESSION
        # ==========================================
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
            "description": "Linear regression with L2 regularization. Minimizes squared coefficients to prevent overfitting.",
            "formula": "Loss = RSS + α * ||β||²",
            "param_meta": {
                "alpha": {"type": "number", "min": 0.01, "max": 10.0, "step": 0.1, "label": "Alpha", "help": "Regularization strength. Larger values specify stronger regularization."}
            }
        },
        "lasso_regression": {
            "name": "Lasso Regression (L1)",
            "type": "regression",
            "class": Lasso,
            "params": {"alpha": 1.0},
            "description": "Linear regression with L1 regularization. Encourages sparsity (feature selection).",
            "formula": "Loss = RSS + α * ||β||₁",
            "param_meta": {
                "alpha": {"type": "number", "min": 0.01, "max": 10.0, "step": 0.1, "label": "Alpha", "help": "Regularization strength. Can zero out coefficients, effectively selecting features."}
            }
        },
        "elastic_net": {
            "name": "ElasticNet Regression",
            "type": "regression",
            "class": ElasticNet,
            "params": {"alpha": 1.0, "l1_ratio": 0.5},
            "description": "Combines L1 and L2 regularization. Good for correlated features.",
            "formula": "Loss = RSS + α * L1 + β * L2",
            "param_meta": {
                "alpha": {"type": "number", "min": 0.01, "max": 10.0, "step": 0.1, "label": "Alpha", "help": "Total regularization penalty."},
                "l1_ratio": {"type": "number", "min": 0.0, "max": 1.0, "step": 0.1, "label": "L1 Ratio", "help": "Mix between L1 (Lasso) and L2 (Ridge). 0 is Ridge, 1 is Lasso."}
            }
        },
        "sgd_regressor": {
            "name": "SGD Regressor",
            "type": "regression",
            "class": SGDRegressor,
            "params": {"alpha": 0.0001, "max_iter": 1000, "penalty": "l2"},
            "description": "Linear model fitted by minimizing a regularized empirical loss with SGD. Efficient for large datasets.",
            "formula": "w ← w - η(∇Loss)",
            "param_meta": {
                 "alpha": {"type": "number", "min": 0.0001, "max": 0.1, "step": 0.0001, "label": "Alpha", "help": "Constant that multiplies the regularization term."},
                 "max_iter": {"type": "number", "min": 100, "max": 5000, "step": 100, "label": "Max Iter", "help": "Maximum number of passes over the training data."}
            }
        },
        "bayesian_ridge": {
            "name": "Bayesian Ridge",
            "type": "regression",
            "class": BayesianRidge,
            "params": {"n_iter": 300},
            "description": "Bayesian approach to Ridge Regression. Estimates regularization parameters from data.",
            "formula": "Probabilistic model with Gaussian priors",
            "param_meta": {
                "n_iter": {"type": "number", "min": 100, "max": 1000, "label": "Iterations", "help": "Maximum number of iterations suitable for convergence."}
            }
        },
        "huber_regressor": {
            "name": "Huber Regressor",
            "type": "regression",
            "class": HuberRegressor,
            "params": {"epsilon": 1.35, "max_iter": 100},
            "description": "Robust to outliers. Uses squared loss for small errors and linear loss for large errors.",
            "formula": "Robust Loss Function",
            "param_meta": {
                "epsilon": {"type": "number", "min": 1.0, "max": 2.0, "step": 0.1, "label": "Epsilon", "help": "The parameter epsilon controls the number of samples that should be classified as outliers."}
            }
        },
        "rf_regressor": {
            "name": "Random Forest Regressor",
            "type": "regression",
            "class": RandomForestRegressor,
            "params": {"n_estimators": 100, "max_depth": 20, "criterion": "squared_error", "random_state": 42},
            "description": "Ensemble of decision trees. Versatile and robust.",
            "formula": "Average of Tree Predictions",
            "param_meta": {
                "n_estimators": {"type": "number", "min": 50, "max": 500, "step": 50, "label": "Trees", "help": "The number of trees in the forest. More trees usually improve performance but are slower."},
                "max_depth": {"type": "number", "min": 5, "max": 50, "step": 5, "label": "Max Depth", "nullable": True, "help": "The maximum depth of the tree. Limits overfitting."},
                "criterion": {"type": "select", "options": ["squared_error", "absolute_error", "friedman_mse", "poisson"], "label": "Criterion", "help": "The function to measure the quality of a split."}
            }
        },
        "extra_trees_regressor": {
            "name": "Extra Trees Regressor",
            "type": "regression",
            "class": ExtraTreesRegressor,
            "params": {"n_estimators": 100, "max_depth": 20, "criterion": "squared_error", "random_state": 42},
            "description": "Similar to Random Forest but chooses split points completely at random. Often faster and reduces variance.",
            "formula": "Average of Randomized Trees",
            "param_meta": {
                "n_estimators": {"type": "number", "min": 50, "max": 500, "step": 50, "label": "Trees", "help": "Number of trees in the forest."},
                "max_depth": {"type": "number", "min": 5, "max": 50, "step": 5, "label": "Max Depth", "help": "Maximum depth of each tree."},
                "criterion": {"type": "select", "options": ["squared_error", "absolute_error", "friedman_mse", "poisson"], "label": "Criterion", "help": "The function to measure the quality of a split."}
            }
        },
        "gb_regressor": {
            "name": "Gradient Boosting Regressor",
            "type": "regression",
            "class": GradientBoostingRegressor,
            "params": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 3, "random_state": 42},
            "description": "Builds an additive model in a forward stage-wise fashion.",
            "formula": "Sequential Error Correction",
            "param_meta": {
                "n_estimators": {"type": "number", "min": 50, "max": 500, "label": "Estimators", "help": "Number of boosting stages to perform."},
                "learning_rate": {"type": "number", "min": 0.01, "max": 0.5, "step": 0.01, "label": "Learning Rate", "help": "Shrinks the contribution of each tree. Trade-off with n_estimators."}
            }
        },
        "hist_gb_regressor": {
            "name": "Histogram Gradient Boosting",
            "type": "regression",
            "class": HistGradientBoostingRegressor,
            "params": {"max_iter": 100, "learning_rate": 0.1},
            "description": "Much faster than standard GB for large datasets (n > 10,000). Inspired by LightGBM.",
            "formula": "Bin-based Gradient Boosting",
            "param_meta": {
                "max_iter": {"type": "number", "min": 50, "max": 500, "label": "Iterations", "help": "Maximum number of iterations of the boosting process."}
            }
        },
        "svr": {
            "name": "Support Vector Regressor (SVR)",
            "type": "regression",
            "class": SVR,
            "params": {"C": 1.0, "kernel": "rbf", "epsilon": 0.1},
            "description": "Epsilon-Support Vector Regression.",
            "formula": "Margin Maximization",
            "param_meta": {
                "C": {"type": "number", "min": 0.1, "max": 100.0, "label": "Penalty C", "help": "Regularization parameter. The strength of the regularization is inversely proportional to C."},
                "kernel": {"type": "select", "options": ["linear", "poly", "rbf"], "label": "Kernel", "help": "Specifies the kernel type to be used in the algorithm."}
            }
        },
        "knn_regressor": {
            "name": "K-Neighbors Regressor",
            "type": "regression",
            "class": KNeighborsRegressor,
            "params": {"n_neighbors": 5, "weights": "uniform"},
            "description": "Regression based on k-nearest neighbors.",
            "formula": "Average of Neighbors",
            "param_meta": {
                "n_neighbors": {"type": "number", "min": 1, "max": 20, "label": "Neighbors (K)", "help": "Number of neighbors to use."},
                "weights": {"type": "select", "options": ["uniform", "distance"], "label": "Weights", "help": "Weight function used in prediction."}
            }
        },
        "mlp_regressor": {
            "name": "Neural Network (MLP)",
            "type": "regression",
            "class": MLPRegressor,
            "params": {"hidden_layer_sizes": (100,), "activation": "relu", "solver": "adam", "max_iter": 500},
            "description": "Multi-layer Perceptron regressor.",
            "formula": "Feedforward Neural Network",
            "param_meta": {
                "max_iter": {"type": "number", "min": 100, "max": 1000, "label": "Max Epochs", "help": "Maximum number of iterations."},
                "activation": {"type": "select", "options": ["relu", "tanh", "logistic"], "label": "Activation", "help": "Activation function for the hidden layer."}
            }
        },
        "xgboost_regressor": {
            "name": "XGBoost Regressor",
            "type": "regression",
            "class": xgb.XGBRegressor,
            "params": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 6, "random_state": 42},
            "description": "Extreme Gradient Boosting. High performance.",
            "formula": "Gradient Boosted Trees",
            "param_meta": {
                "n_estimators": {"type": "number", "min": 50, "max": 1000, "label": "Estimators", "help": "Number of gradient boosted trees."},
                "learning_rate": {"type": "number", "min": 0.01, "max": 0.5, "label": "Learning Rate", "help": "Boosting learning rate."}
            }
        },

        # ==========================================
        #              CLASSIFICATION
        # ==========================================
        "logistic_regression": {
            "name": "Logistic Regression",
            "type": "classification",
            "class": LogisticRegression,
            "params": {"max_iter": 1000, "solver": "lbfgs", "random_state": 42},
            "description": "Standard binary classification benchmark.",
            "formula": "Sigmoid(Linear Combination)",
            "param_meta": {
                "max_iter": {"type": "number", "min": 100, "max": 5000, "label": "Max Iter", "help": "Maximum number of iterations taken for the solvers to converge."}
            }
        },
        "ridge_classifier": {
            "name": "Ridge Classifier",
            "type": "classification",
            "class": RidgeClassifier,
            "params": {"alpha": 1.0},
            "description": "Classifier using Ridge regression. Fast for multi-class.",
            "formula": "Ridge Regression -> Sign",
            "param_meta": {
                "alpha": {"type": "number", "min": 0.01, "max": 10.0, "label": "Alpha", "help": "Regularization strength."}
            }
        },
        "sgd_classifier": {
            "name": "SGD Classifier",
            "type": "classification",
            "class": SGDClassifier,
            "params": {"loss": "hinge", "penalty": "l2", "alpha": 0.0001, "max_iter": 1000},
            "description": "Linear classifier (SVM/LogReg) optimized by SGD. Key for massive datasets.",
            "formula": "SGD Optimization",
            "param_meta": {
                "loss": {"type": "select", "options": ["hinge", "log_loss", "modified_huber"], "label": "Loss Function", "help": "The loss function to be used. 'hinge' gives a linear SVM."},
                "alpha": {"type": "number", "min": 0.0001, "max": 0.1, "label": "Alpha", "help": "Constant that multiplies the regularization term."}
            }
        },
        "rf_classifier": {
            "name": "Random Forest Classifier",
            "type": "classification",
            "class": RandomForestClassifier,
            "params": {"n_estimators": 100, "max_depth": None, "criterion": "gini", "random_state": 42},
            "description": "Ensemble of decision trees for classification.",
            "formula": "Majority Vote",
            "param_meta": {
                "n_estimators": {"type": "number", "min": 50, "max": 500, "label": "Trees", "help": "The number of trees in the forest."},
                "criterion": {"type": "select", "options": ["gini", "entropy", "log_loss"], "label": "Criterion", "help": "The function to measure the quality of a split."}
            }
        },
        "extra_trees_classifier": {
            "name": "Extra Trees Classifier",
            "type": "classification",
            "class": ExtraTreesClassifier,
            "params": {"n_estimators": 100, "max_depth": None, "criterion": "gini", "random_state": 42},
            "description": "Extremely Randomized Trees. Lower variance than RF.",
            "formula": "Randomized Ensemble Vote",
            "param_meta": {
                "n_estimators": {"type": "number", "min": 50, "max": 500, "label": "Trees", "help": "The number of trees in the forest."}
            }
        },
        "gb_classifier": {
            "name": "Gradient Boosting Classifier",
            "type": "classification",
            "class": GradientBoostingClassifier,
            "params": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 3, "criterion": "friedman_mse", "random_state": 42},
            "description": "Sequential boosting for classification.",
            "formula": "Weighted Vote of Weak Learners",
            "param_meta": {
                "n_estimators": {"type": "number", "min": 50, "max": 500, "label": "Estimators", "help": "The number of boosting stages to perform."},
                "learning_rate": {"type": "number", "min": 0.01, "max": 1.0, "label": "Learning Rate", "help": "Shrinks the contribution of each tree."},
                "criterion": {"type": "select", "options": ["friedman_mse", "squared_error"], "label": "Criterion", "help": "The function to measure the quality of a split."}
            }
        },
        "hist_gb_classifier": {
            "name": "Histogram Gradient Boosting (Cls)",
            "type": "classification",
            "class": HistGradientBoostingClassifier,
            "params": {"max_iter": 100, "learning_rate": 0.1},
            "description": "High-performance GB for large datasets. Supports missing values natively.",
            "formula": "Histogram-based Boosting",
            "param_meta": {
                "max_iter": {"type": "number", "min": 50, "max": 500, "label": "Iterations", "help": "Maximum number of iterations."}
            }
        },
        "svc": {
            "name": "Support Vector Classifier (SVC)",
            "type": "classification",
            "class": SVC,
            "params": {"C": 1.0, "kernel": "rbf", "probability": True, "random_state": 42},
            "description": "Effective in high dimensional spaces. Good for complex boundaries.",
            "formula": "Hyperplane Margin Maximization",
            "param_meta": {
                "C": {"type": "number", "min": 0.1, "max": 100.0, "label": "Penalty C", "help": "Regularization parameter."},
                "kernel": {"type": "select", "options": ["linear", "rbf", "poly"], "label": "Kernel", "help": "Specifies the kernel type to be used."}
            }
        },
        "linear_svc": {
            "name": "Linear SVC",
            "type": "classification",
            "class": LinearSVC,
            "params": {"C": 1.0, "max_iter": 1000},
            "description": "Faster (Liblinear) implementation of SVC with linear kernel.",
            "formula": "Linear Hyperplane",
            "param_meta": {
                "C": {"type": "number", "min": 0.1, "max": 100.0, "label": "Penalty C", "help": "Regularization parameter."}
            }
        },
        "gaussian_nb": {
            "name": "Gaussian Naive Bayes",
            "type": "classification",
            "class": GaussianNB,
            "params": {},
            "description": "Probabilistic classifier based on Bayes' theorem. Assumes Gaussian distribution of features.",
            "formula": "P(c|x) ∝ P(x|c)P(c)",
            "param_meta": {}
        },
        "multinomial_nb": {
            "name": "Multinomial Naive Bayes",
            "type": "classification",
            "class": MultinomialNB,
            "params": {"alpha": 1.0},
            "description": "Naive Bayes for potential count data (e.g. text classification).",
            "formula": "P(c|x) based on multinomial distribution",
            "param_meta": {
                "alpha": {"type": "number", "min": 0.1, "max": 10.0, "label": "Smoothing", "help": "Additive (Laplace/Lidstone) smoothing parameter."}
            }
        },
        "bernoulli_nb": {
            "name": "Bernoulli Naive Bayes",
            "type": "classification",
            "class": BernoulliNB,
            "params": {"alpha": 1.0},
            "description": "Naive Bayes for binary/boolean features.",
            "formula": "Independent Bernoulli trials",
            "param_meta": {
                "alpha": {"type": "number", "min": 0.1, "max": 10.0, "label": "Smoothing", "help": "Additive (Laplace/Lidstone) smoothing parameter."}
            }
        },
        "knn_classifier": {
            "name": "K-Neighbors Classifier",
            "type": "classification",
            "class": KNeighborsClassifier,
            "params": {"n_neighbors": 5, "weights": "uniform"},
            "description": "Majority vote of nearest neighbors.",
            "formula": "Lazy Learning",
            "param_meta": {
                "n_neighbors": {"type": "number", "min": 1, "max": 20, "label": "Neighbors (K)", "help": "Number of neighbors to use."},
                "weights": {"type": "select", "options": ["uniform", "distance"], "label": "Weights", "help": "Weight function used in prediction."}
            }
        },
        "mlp_classifier": {
            "name": "Neural Network (MLP)",
            "type": "classification",
            "class": MLPClassifier,
            "params": {"hidden_layer_sizes": (100,), "activation": "relu", "solver": "adam", "max_iter": 500},
            "description": "Multi-layer Perceptron classifier.",
            "formula": "Deep Feedforward Network",
            "param_meta": {
                "max_iter": {"type": "number", "min": 100, "max": 1000, "label": "Max Epochs", "help": "Maximum number of iterations."},
                "activation": {"type": "select", "options": ["relu", "tanh", "logistic"], "label": "Activation", "help": "Activation function for the hidden layer."}
            }
        },
        "xgboost_classifier": {
            "name": "XGBoost Classifier",
            "type": "classification",
            "class": xgb.XGBClassifier,
            "params": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 6, "use_label_encoder": False, "eval_metric": "logloss", "random_state": 42},
            "description": "Optimized Gradient Boosting.",
            "formula": "Gradient Boosted Trees",
            "param_meta": {
                "n_estimators": {"type": "number", "min": 50, "max": 1000, "label": "Estimators", "help": "Number of gradient boosted trees."},
                "learning_rate": {"type": "number", "min": 0.01, "max": 0.5, "label": "Learning Rate", "help": "Boosting learning rate."}
            }
        },

        # ==========================================
        #              CLUSTERING
        # ==========================================
        "kmeans": {
            "name": "K-Means Clustering",
            "type": "clustering",
            "class": KMeans,
            "params": {"n_clusters": 3, "random_state": 42},
            "description": "Partitions data into K clusters by minimizing variance within each cluster",
            "formula": "Minimize Inertia",
            "param_meta": {
                "n_clusters": {"type": "number", "min": 2, "max": 20, "label": "Clusters (K)", "help": "The number of clusters to form as well as the number of centroids to generate."}
            }
        },
        "dbscan": {
            "name": "DBSCAN",
            "type": "clustering",
            "class": DBSCAN,
            "params": {"eps": 0.5, "min_samples": 5},
            "description": "Density-Based Spatial Clustering. Finds core samples of high density and expands clusters from them.",
            "formula": "Density Reachability",
            "param_meta": {
                "eps": {"type": "number", "min": 0.1, "max": 5.0, "step": 0.1, "label": "Epsilon (Radius)", "help": "The maximum distance between two samples for one to be considered as in the neighborhood of the other."},
                "min_samples": {"type": "number", "min": 2, "max": 20, "label": "Min Samples", "help": "The number of samples in a neighborhood for a point to be considered as a core point."}
            }
        },
        "agglomerative": {
            "name": "Agglomerative Clustering",
            "type": "clustering",
            "class": AgglomerativeClustering,
            "params": {"n_clusters": 3},
            "description": "Hierarchical clustering using a bottom-up approach.",
            "formula": "Hierarchical Merging",
            "param_meta": {
                "n_clusters": {"type": "number", "min": 2, "max": 20, "label": "Clusters (K)", "help": "The number of clusters to find."}
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