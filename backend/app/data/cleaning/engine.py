import pandas as pd
import numpy as np
from scipy import stats
from fastapi import HTTPException

class CleaningEngine:
    @staticmethod
    def apply_operation(df: pd.DataFrame, operation: str, params: dict) -> pd.DataFrame:
        """
        Applies a specific cleaning operation to the DataFrame.
        Returns a NEW DataFrame (does not modify in place).
        """
        df = df.copy()
        
        try:
            # --- 1. HANDLING MISSING DATA ---
            if operation == "drop_missing":
                # params: {'axis': 0/1, 'threshold': float, 'subset': [cols]}
                df.dropna(
                    axis=params.get('axis', 0),
                    thresh=params.get('threshold', None),
                    subset=params.get('subset', None),
                    inplace=True
                )
            
            elif operation == "fill_missing":
                # params: {'method': 'mean'/'median'/'mode'/'value'/'ffill'/'bfill', 'value': any, 'columns': []}
                cols = params.get('columns', df.columns)
                method = params.get('method', 'value')
                
                for col in cols:
                    if col not in df.columns: continue
                    
                    if method == "mean" and pd.api.types.is_numeric_dtype(df[col]):
                        df[col] = df[col].fillna(df[col].mean())
                    elif method == "median" and pd.api.types.is_numeric_dtype(df[col]):
                        df[col] = df[col].fillna(df[col].median())
                    elif method == "mode":
                        df[col] = df[col].fillna(df[col].mode()[0])
                    elif method == "value":
                        df[col] = df[col].fillna(params.get('value'))
                    elif method == "ffill":
                        df[col] = df[col].ffill()
                    elif method == "bfill":
                        df[col] = df[col].bfill()

            # --- 2. COLUMN OPERATIONS ---
            elif operation == "drop_columns":
                # params: {'columns': ['col1', 'col2']}
                df.drop(columns=params.get('columns', []), inplace=True, errors='ignore')
            
            elif operation == "rename_columns":
                # params: {'mapping': {'old': 'new'}}
                df.rename(columns=params.get('mapping', {}), inplace=True)
            
            elif operation == "drop_duplicates":
                # params: {'subset': [], 'keep': 'first'/'last'/False}
                df.drop_duplicates(
                    subset=params.get('subset', None),
                    keep=params.get('keep', 'first'),
                    inplace=True
                )

            # --- 3. TYPE CONVERSION ---
            elif operation == "convert_type":
                # params: {'column': 'name', 'type': 'numeric'/'datetime'/'string'/'category'}
                col = params.get('column')
                target_type = params.get('type')
                
                if col in df.columns:
                    if target_type == "numeric":
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                    elif target_type == "datetime":
                        df[col] = pd.to_datetime(df[col], errors='coerce')
                    elif target_type == "string":
                        df[col] = df[col].astype(str)
                    elif target_type == "category":
                        df[col] = df[col].astype('category')

            # --- 4. OUTLIER REMOVAL ---
            elif operation == "remove_outliers_zscore":
                # params: {'columns': [], 'threshold': 3.0}
                cols = params.get('columns', df.select_dtypes(include=[np.number]).columns)
                threshold = float(params.get('threshold', 3.0))
                
                # Calculate Z-scores only for numeric columns
                numeric_df = df[cols].select_dtypes(include=[np.number])
                if not numeric_df.empty:
                    z_scores = np.abs(stats.zscore(numeric_df, nan_policy='omit'))
                    # Keep rows where all z-scores are < threshold
                    df = df[(z_scores < threshold).all(axis=1)]

            elif operation == "remove_outliers_iqr":
                 # params: {'columns': []}
                cols = params.get('columns', df.select_dtypes(include=[np.number]).columns)
                for col in cols:
                    if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                        Q1 = df[col].quantile(0.25)
                        Q3 = df[col].quantile(0.75)
                        IQR = Q3 - Q1
                        df = df[~((df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR)))]

            # --- 5. TEXT CLEANING ---
            elif operation == "text_clean":
                # params: {'column': 'name', 'action': 'lower'/'upper'/'strip'}
                col = params.get('column')
                action = params.get('action')
                if col in df.columns and pd.api.types.is_string_dtype(df[col]):
                    if action == "lower":
                        df[col] = df[col].str.lower()
                    elif action == "upper":
                        df[col] = df[col].str.upper()
                    elif action == "strip":
                        df[col] = df[col].str.strip()

            else:
                raise HTTPException(status_code=400, detail=f"Unknown operation: {operation}")

            return df

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cleaning failed: {str(e)}")