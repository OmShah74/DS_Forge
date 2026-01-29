import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder
from sklearn.decomposition import PCA
from fastapi import HTTPException

class FeatureEngine:
    @staticmethod
    def apply_feature_engineering(df: pd.DataFrame, operation: str, params: dict) -> pd.DataFrame:
        df = df.copy()
        try:
            # --- SCALING ---
            if operation == "standard_scaler":
                # params: { "columns": ["col1", "col2"] }
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                scaler = StandardScaler()
                df[cols] = scaler.fit_transform(df[cols])
            
            elif operation == "minmax_scaler":
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                scaler = MinMaxScaler()
                df[cols] = scaler.fit_transform(df[cols])

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

            # --- DIMENSIONALITY REDUCTION ---
            elif operation == "pca":
                # params: { "n_components": 2, "columns": [...] }
                n_components = int(params.get("n_components", 2))
                cols = params.get("columns", df.select_dtypes(include=[np.number]).columns)
                
                # PCA requires clean numeric data
                features = df[cols].dropna() 
                if len(features) < len(df):
                    # For V1 simplicity, if NaNs exist, we fail. In V2, we auto-impute.
                    raise ValueError("PCA requires data without NaNs. Clean data first.")

                pca = PCA(n_components=n_components)
                principal_components = pca.fit_transform(features)
                
                # Create new DF with PCs
                pc_df = pd.DataFrame(data=principal_components, columns=[f'PC{i+1}' for i in range(n_components)])
                
                # Concatenate with non-PCA columns (if any logic requires, but usually PCA replaces features)
                # For this implementation, we REPLACE the selected columns with PCs
                df = df.drop(columns=cols)
                df = pd.concat([df.reset_index(drop=True), pc_df], axis=1)

            else:
                raise ValueError(f"Unknown operation: {operation}")

            return df

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Feature Engineering Failed: {str(e)}")