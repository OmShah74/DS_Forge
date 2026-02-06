import pandas as pd
import numpy as np
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler, MaxAbsScaler, 
    LabelEncoder, OneHotEncoder, PowerTransformer, QuantileTransformer,
    Normalizer, Binarizer, PolynomialFeatures, KBinsDiscretizer, FunctionTransformer
)
from sklearn.decomposition import PCA
from fastapi import HTTPException

class FeatureEngine:
    @staticmethod
    def get_recommendations(df: pd.DataFrame) -> list:
        """
        Analyzes the dataframe and returns a list of recommended operation keys.
        """
        recommendations = []
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        
        # 1. Scaling Recommendations
        if len(numeric_cols) > 0:
            # Check for outliers (basic check: mean vs median) -> RobustScaler
            for col in numeric_cols:
                if df[col].std() > 0: # Avoid constant columns
                    mean_val = df[col].mean()
                    median_val = df[col].median()
                    # If mean differs significantly from median, distribution is skewed/has outliers
                    if abs(mean_val - median_val) / (df[col].std()) > 0.5:
                        recommendations.append("robust_scaler")
                        recommendations.append("log_transform")
                        break
            
            # Default to StandardScaler if no specific outlier issues found yet, or as general rec
            if "robust_scaler" not in recommendations:
                recommendations.append("standard_scaler")

        # 2. Encoding Recommendations
        if len(categorical_cols) > 0:
            for col in categorical_cols:
                unique_count = df[col].nunique()
                if unique_count <= 10:
                    recommendations.append("one_hot_encoding")
                else:
                    recommendations.append("label_encoding")
                    recommendations.append("frequency_encoding")
                break # Just add generic recs once
        
        # 3. Dimensionality Reduction
        if len(numeric_cols) > 5:
            recommendations.append("pca")
            
        return list(set(recommendations))

    @staticmethod
    def apply_feature_engineering(df: pd.DataFrame, operation: str, params: dict) -> pd.DataFrame:
        df = df.copy()
        try:
            # --- SCALING ---
            if operation == "standard_scaler":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                if len(cols) > 0: df[cols] = StandardScaler().fit_transform(df[cols].fillna(0))
            
            elif operation == "minmax_scaler":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                if len(cols) > 0: df[cols] = MinMaxScaler().fit_transform(df[cols].fillna(0))
                
            elif operation == "robust_scaler":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                if len(cols) > 0: df[cols] = RobustScaler().fit_transform(df[cols].fillna(0))
                
            elif operation == "maxabs_scaler":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                if len(cols) > 0: df[cols] = MaxAbsScaler().fit_transform(df[cols].fillna(0))

            # --- TRANSFORMS (DISTRIBUTION) ---
            elif operation == "log_transform":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                for col in cols:
                    # np.log1p is safer for 0 values, but still needs non-negative or handling
                    # We take abs to avoid errors, or clip.
                    df[col] = np.log1p(np.abs(df[col]))

            elif operation == "sqrt_transform":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                df[cols] = np.sqrt(np.abs(df[cols]))

            elif operation == "yeo_johnson":
                # Handles positive and negative values
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                pt = PowerTransformer(method='yeo-johnson')
                if len(cols) > 0: df[cols] = pt.fit_transform(df[cols].fillna(0))
                
            elif operation == "box_cox":
                # Requires strictly positive input
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                pt = PowerTransformer(method='box-cox')
                # Shift data to be positive if needed
                for col in cols:
                    min_val = df[col].min()
                    if min_val <= 0:
                        df[col] = df[col] - min_val + 1e-6
                if len(cols) > 0: df[cols] = pt.fit_transform(df[cols].fillna(0))

            elif operation == "quantile_normal":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                qt = QuantileTransformer(output_distribution='normal')
                if len(cols) > 0: df[cols] = qt.fit_transform(df[cols].fillna(0))
                
            elif operation == "quantile_uniform":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                qt = QuantileTransformer(output_distribution='uniform')
                if len(cols) > 0: df[cols] = qt.fit_transform(df[cols].fillna(0))
                
            elif operation == "l2_normalization":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                norm = Normalizer(norm='l2')
                if len(cols) > 0: df[cols] = norm.fit_transform(df[cols].fillna(0))

            # --- ENCODING ---
            elif operation == "label_encoding":
                cols = params.get("columns", [])
                for col in cols:
                    if col in df.columns:
                        le = LabelEncoder()
                        df[col] = le.fit_transform(df[col].astype(str))

            elif operation == "one_hot_encoding":
                cols = params.get("columns", [])
                if cols:
                    df = pd.get_dummies(df, columns=cols, dummy_na=False)

            elif operation == "frequency_encoding":
                cols = params.get("columns", [])
                for col in cols:
                     freq_map = df[col].value_counts(normalize=True)
                     df[col] = df[col].map(freq_map)
            
            elif operation == "hash_encoding":
                # Simple native hash
                cols = params.get("columns", [])
                for col in cols:
                    df[col] = df[col].apply(lambda x: hash(str(x)) % 1000) # Bucket size 1000

            # --- GENERATION / INTERACTION ---
            elif operation == "polynomial_features":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                if len(cols) > 0:
                    poly = PolynomialFeatures(degree=2, include_bias=False)
                    poly_feats = poly.fit_transform(df[cols].fillna(0))
                    # Create DF for new features
                    new_cols = poly.get_feature_names_out(cols)
                    poly_df = pd.DataFrame(poly_feats, columns=new_cols, index=df.index)
                    # Join? Usually we replace or Append. Let's Append and Drop original to match user intent of 'transform'
                    # Or better: keep all. But 'columns' implies selection.
                    # Let's replace original with poly features to avoid explosion if they selected specific cols
                    df = df.drop(columns=cols)
                    df = pd.concat([df, poly_df], axis=1)

            elif operation == "interaction_only":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                if len(cols) > 0:
                    poly = PolynomialFeatures(degree=2, interaction_only=True, include_bias=False)
                    poly_feats = poly.fit_transform(df[cols].fillna(0))
                    new_cols = poly.get_feature_names_out(cols)
                    poly_df = pd.DataFrame(poly_feats, columns=new_cols, index=df.index)
                    df = df.drop(columns=cols)
                    df = pd.concat([df, poly_df], axis=1)

            # --- DISCRETIZATION ---
            elif operation == "kbins_uniform":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                kb = KBinsDiscretizer(n_bins=5, encode='ordinal', strategy='uniform')
                if len(cols) > 0: df[cols] = kb.fit_transform(df[cols].fillna(0))

            elif operation == "kbins_quantile":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                kb = KBinsDiscretizer(n_bins=5, encode='ordinal', strategy='quantile')
                if len(cols) > 0: df[cols] = kb.fit_transform(df[cols].fillna(0))
                
            elif operation == "kbins_kmeans":
                 cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                 kb = KBinsDiscretizer(n_bins=5, encode='ordinal', strategy='kmeans')
                 if len(cols) > 0: df[cols] = kb.fit_transform(df[cols].fillna(0))

            elif operation == "binarizer":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                threshold = params.get("threshold", 0.0)
                bn = Binarizer(threshold=threshold)
                if len(cols) > 0: df[cols] = bn.fit_transform(df[cols].fillna(0))

            # --- MISC ---
            elif operation == "sigmoid_transform":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                # Sigmoid = 1 / (1 + exp(-x))
                for col in cols:
                    df[col] = 1 / (1 + np.exp(-df[col].fillna(0)))

            elif operation == "percentile_rank":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                for col in cols:
                    df[col] = df[col].rank(pct=True)

            elif operation == "date_extraction":
                cols = params.get("columns", [])
                for col in cols:
                    if col in df.columns:
                        series = pd.to_datetime(df[col], errors='coerce')
                        df[f"{col}_year"] = series.dt.year
                        df[f"{col}_month"] = series.dt.month
                        df[f"{col}_day"] = series.dt.day
                        df[f"{col}_dow"] = series.dt.dayofweek
                        # Drop original? Keep for now or user can drop.

            # --- DIMENSIONALITY REDUCTION ---
            elif operation == "pca":
                # params: { "n_components": 2, "columns": [...] }
                n_components = int(params.get("n_components", 2))
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                
                # PCA requires clean numeric data
                features = df[cols].dropna() 
                if len(features) < len(df):
                     # Simple fill for now
                     features = df[cols].fillna(0)

                pca = PCA(n_components=n_components)
                principal_components = pca.fit_transform(features)
                
                # Create new DF with PCs
                pc_df = pd.DataFrame(data=principal_components, columns=[f'PC{i+1}' for i in range(n_components)])
                
                # Concatenate with non-PCA columns
                df = df.drop(columns=cols)
                df = pd.concat([df.reset_index(drop=True), pc_df], axis=1)

            else:
                raise ValueError(f"Unknown operation: {operation}")

            return df

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Feature Engineering Failed: {str(e)}")