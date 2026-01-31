import pandas as pd
import numpy as np
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
            # --- helper to get columns from 'columns' or 'subset' ---
            def get_target_cols(params, df):
                cols = params.get('columns') or params.get('subset') or []
                if not cols and 'column' in params: # fallback for single col legacy
                    cols = [params['column']]
                return [c for c in cols if c in df.columns]

            # --- 1. HANDLING MISSING DATA ---
            if operation == "drop_missing":
                # params: {'axis': 0/1, 'threshold': int, 'subset': [cols]}
                target_subset = get_target_cols(params, df)
                # If no subset is selected, we default to checking ALL columns (unsafe?) 
                # OR we default to checking NO columns (safer).
                # Given user feedback, we should be explicit. 
                # If target_subset is empty, let's assume they want to do nothing (safe).
                
                # If target_subset is empty [], passing it to subset will cause dropna to check NO columns. 
                # This is the safe default: if user selects nothing, drop nothing.
                # If they want to drop based on all columns, they must select all columns (or we add a 'Global' toggle).
                
                df.dropna(
                    axis=int(params.get('axis', 0)),
                    thresh=params.get('threshold', None),
                    subset=target_subset, 
                    inplace=True
                )
            
            elif operation == "fill_missing":
                # params: {'method': 'mean'...'constant', 'value': any, 'subset': []}
                cols = get_target_cols(params, df)
                if not cols: cols = df.columns
                
                method = params.get('method', 'value')
                fill_val = params.get('value')
                
                for col in cols:
                    if method == "mean" and pd.api.types.is_numeric_dtype(df[col]):
                        df[col] = df[col].fillna(df[col].mean())
                    elif method == "median" and pd.api.types.is_numeric_dtype(df[col]):
                        df[col] = df[col].fillna(df[col].median())
                    elif method == "mode":
                        mode_series = df[col].mode()
                        if not mode_series.empty:
                            df[col] = df[col].fillna(mode_series[0])
                    elif method in ["value", "constant"]:
                        df[col] = df[col].fillna(fill_val)
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
                # params: {'columns': [], 'type': 'numeric'...}
                cols = get_target_cols(params, df)
                target_type = params.get('type')
                
                for col in cols:
                    if target_type == "int64":
                        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype('int64')
                    elif target_type == "float64":
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                    elif target_type == "datetime64[ns]":
                        df[col] = pd.to_datetime(df[col], errors='coerce')
                    elif target_type == "string":
                        df[col] = df[col].astype(str)
                    elif target_type == "category":
                        df[col] = df[col].astype('category')

            # --- 4. OUTLIER REMOVAL ---
            elif operation == "remove_outliers_zscore":
                cols = get_target_cols(params, df)
                if not cols: cols = df.select_dtypes(include=[np.number]).columns.tolist()
                
                threshold = float(params.get('threshold', 3.0))
                
                numeric_df = df[cols].select_dtypes(include=[np.number])
                if not numeric_df.empty:
                    # Manual Z-score calculation to avoid scipy dependency
                    z_scores = (numeric_df - numeric_df.mean()) / numeric_df.std(ddof=0)
                    z_scores = z_scores.abs()
                    # Keep rows where all z-scores are < threshold
                    df = df[(z_scores < threshold).all(axis=1)]

            elif operation == "remove_outliers_iqr":
                cols = get_target_cols(params, df)
                if not cols: cols = df.select_dtypes(include=[np.number]).columns.tolist()

                for col in cols:
                    if pd.api.types.is_numeric_dtype(df[col]):
                        Q1 = df[col].quantile(0.25)
                        Q3 = df[col].quantile(0.75)
                        IQR = Q3 - Q1
                        df = df[~((df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR)))]

            # --- 5. TEXT CLEANING ---
            elif operation == "text_clean":
                cols = get_target_cols(params, df)
                action = params.get('action')
                
                for col in cols:
                    if pd.api.types.is_string_dtype(df[col]) or pd.api.types.is_object_dtype(df[col]):
                        s = df[col].astype(str)
                        if action == "lower":
                            df[col] = s.str.lower()
                        elif action == "upper":
                            df[col] = s.str.upper()
                        elif action == "strip":
                            df[col] = s.str.strip()
                        elif action == "title":
                            df[col] = s.str.title()

            # --- 6. ADVANCED CELL EDITING ---
            elif operation == "find_replace":
                # params: {'columns': [], 'find': val, 'replace': val, 'regex': bool}
                cols = get_target_cols(params, df)
                find_val = params.get('find')
                replace_val = params.get('replace')
                use_regex = params.get('regex', False)
                
                for col in cols:
                    df[col] = df[col].replace(to_replace=find_val, value=replace_val, regex=use_regex)

            elif operation == "winsorize":
                # params: {'columns': [], 'limits': [0.05, 0.05]} -> Cap top/bottom 5%
                cols = get_target_cols(params, df)
                limits = params.get('limits', [0.05, 0.05])
                
                for col in cols:
                    if pd.api.types.is_numeric_dtype(df[col]):
                         lower = df[col].quantile(limits[0])
                         upper = df[col].quantile(1.0 - limits[1])
                         df[col] = df[col].clip(lower=lower, upper=upper)

            else:
                raise HTTPException(status_code=400, detail=f"Unknown operation: {operation}")

            return df

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cleaning failed: {str(e)}")