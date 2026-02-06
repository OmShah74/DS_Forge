import pandas as pd
import numpy as np
from fastapi import HTTPException
import re

class CleaningEngine:
    @staticmethod
    def get_recommendations(df: pd.DataFrame) -> list:
        recommendations = []
        
        # 1. Missing Values
        missing_count = df.isnull().sum().sum()
        if missing_count > 0:
            recommendations.append("drop_missing_rows")
            
            # Numeric missing?
            num_cols = df.select_dtypes(include=[np.number]).columns
            if df[num_cols].isnull().sum().sum() > 0:
                recommendations.append("fill_missing_mean")
                recommendations.append("fill_missing_median")
                
            # Categorical missing?
            cat_cols = df.select_dtypes(include=['object', 'category']).columns
            if df[cat_cols].isnull().sum().sum() > 0:
                recommendations.append("fill_missing_mode")
                recommendations.append("fill_missing_constant")

        # 2. Duplicates
        if df.duplicated().sum() > 0:
            recommendations.append("drop_duplicates")
            
        # 3. Text Consistency (Whitespace)
        obj_cols = df.select_dtypes(include=['object']).columns
        if len(obj_cols) > 0:
            recommendations.append("text_trim")
            
        # 4. Outliers (Numeric)
        num_cols = df.select_dtypes(include=[np.number]).columns
        for col in num_cols:
            if df[col].std() > 0:
                z_scores = ((df[col] - df[col].mean()) / df[col].std()).abs()
                if (z_scores > 3).any():
                    recommendations.append("remove_outliers_zscore")
                    recommendations.append("cap_outliers_winsorize")
                    break
        
        # 5. Type Issues
        for col in obj_cols:
             numeric_conversion = pd.to_numeric(df[col], errors='coerce')
             # If >80% can be numeric but it's object, suggest conversion
             if len(df) > 0 and numeric_conversion.notna().sum() / len(df) > 0.8:
                 recommendations.append("convert_to_float")
                 break

        return list(set(recommendations))

    @staticmethod
    def apply_operation(df: pd.DataFrame, operation: str, params: dict) -> pd.DataFrame:
        """
        Applies a specific cleaning operation to the DataFrame.
        Returns a NEW DataFrame (does not modify in place).
        """
        df = df.copy()
        
        try:
            # --- helper to get columns ---
            def get_target_cols(params, df):
                cols = params.get('columns') or params.get('subset') or []
                if not cols and 'column' in params: 
                    cols = [params['column']]
                return [c for c in cols if c in df.columns]

            cols = get_target_cols(params, df)

            # --- 1. HANDLING MISSING DATA ---
            if operation == "drop_missing_rows":
                df.dropna(axis=0, subset=cols if cols else None, inplace=True)
            
            elif operation == "drop_missing_cols":
                df.dropna(axis=1, inplace=True)

            elif operation == "fill_missing_mean":
                if not cols: cols = df.select_dtypes(include=[np.number]).columns
                for col in cols:
                    if pd.api.types.is_numeric_dtype(df[col]):
                         df[col] = df[col].fillna(df[col].mean())
            
            elif operation == "fill_missing_median":
                if not cols: cols = df.select_dtypes(include=[np.number]).columns
                for col in cols:
                    if pd.api.types.is_numeric_dtype(df[col]):
                         df[col] = df[col].fillna(df[col].median())

            elif operation == "fill_missing_mode":
                if not cols: cols = df.columns
                for col in cols:
                    mode_s = df[col].mode()
                    if not mode_s.empty:
                        df[col] = df[col].fillna(mode_s[0])

            elif operation == "fill_missing_constant":
                value = params.get('value', 'Missing')
                if not cols: cols = df.columns
                for col in cols:
                    df[col] = df[col].fillna(value)
            
            elif operation == "fill_missing_ffill":
                if not cols: cols = df.columns
                for col in cols:
                    df[col] = df[col].ffill()
            
            elif operation == "fill_missing_bfill":
                if not cols: cols = df.columns
                for col in cols:
                    df[col] = df[col].bfill()

            # --- 2. COLUMN OPERATIONS ---
            elif operation == "drop_columns":
                df.drop(columns=params.get('columns', []), inplace=True, errors='ignore')
            
            elif operation == "rename_columns":
                df.rename(columns=params.get('mapping', {}), inplace=True)
            
            elif operation == "drop_duplicates":
                df.drop_duplicates(subset=cols if cols else None, keep='first', inplace=True)

            # --- 3. TYPE CONVERSION ---
            elif operation == "convert_to_int":
                if not cols: cols = df.columns
                for col in cols:
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype('int64')

            elif operation == "convert_to_float":
                if not cols: cols = df.columns
                for col in cols:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            elif operation == "convert_to_datetime":
                if not cols: cols = df.columns
                for col in cols:
                    df[col] = pd.to_datetime(df[col], errors='coerce')

            elif operation == "convert_to_string":
                if not cols: cols = df.columns
                for col in cols:
                    df[col] = df[col].astype(str)
            
            elif operation == "convert_to_category":
                if not cols: cols = df.columns
                for col in cols:
                    df[col] = df[col].astype('category')

            # --- 4. OUTLIER REMOVAL ---
            elif operation == "remove_outliers_zscore":
                if not cols: cols = df.select_dtypes(include=[np.number]).columns
                threshold = float(params.get('threshold', 3.0))
                mask = pd.Series(True, index=df.index)
                for col in cols:
                     if pd.api.types.is_numeric_dtype(df[col]) and df[col].std() > 0:
                         z = ((df[col] - df[col].mean()) / df[col].std()).abs()
                         mask = mask & (z < threshold)
                df = df[mask]

            elif operation == "remove_outliers_iqr":
                if not cols: cols = df.select_dtypes(include=[np.number]).columns
                mask = pd.Series(True, index=df.index)
                for col in cols:
                    if pd.api.types.is_numeric_dtype(df[col]):
                        Q1 = df[col].quantile(0.25)
                        Q3 = df[col].quantile(0.75)
                        IQR = Q3 - Q1
                        col_mask = ~((df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR)))
                        mask = mask & col_mask
                df = df[mask]
            
            elif operation == "cap_outliers_winsorize":
                limits = params.get('limits', [0.05, 0.05])
                if not cols: cols = df.select_dtypes(include=[np.number]).columns
                for col in cols:
                     if pd.api.types.is_numeric_dtype(df[col]):
                          lower = df[col].quantile(limits[0])
                          upper = df[col].quantile(1.0 - limits[1])
                          df[col] = df[col].clip(lower=lower, upper=upper)

            # --- 5. TEXT CLEANING ---
            elif operation == "text_lowercase":
                if not cols: cols = df.select_dtypes(include=['object', 'string']).columns
                for col in cols:
                     df[col] = df[col].astype(str).str.lower()

            elif operation == "text_uppercase":
                if not cols: cols = df.select_dtypes(include=['object', 'string']).columns
                for col in cols:
                     df[col] = df[col].astype(str).str.upper()

            elif operation == "text_trim":
                if not cols: cols = df.select_dtypes(include=['object', 'string']).columns
                for col in cols:
                     df[col] = df[col].astype(str).str.strip()
            
            elif operation == "text_titlecase":
                if not cols: cols = df.select_dtypes(include=['object', 'string']).columns
                for col in cols:
                     df[col] = df[col].astype(str).str.title()
            
            elif operation == "find_replace_value":
                find_val = params.get('find')
                replace_val = params.get('replace')
                if not cols: cols = df.columns
                for col in cols:
                    df[col] = df[col].replace(find_val, replace_val)
            
            elif operation == "regex_replace":
                pattern = params.get('pattern')
                replace_val = params.get('replace', '')
                if not cols: cols = df.select_dtypes(include=['object', 'string']).columns
                for col in cols:
                    df[col] = df[col].astype(str).str.replace(pattern, replace_val, regex=True)

            # --- 7. MANUAL UPDATES ---
            elif operation == "manual_update":
                updates = params.get('updates', [])
                for update in updates:
                    idx = update.get('index')
                    col = update.get('column')
                    val = update.get('value')
                    
                    if idx is not None and col in df.columns:
                        if pd.api.types.is_numeric_dtype(df[col]):
                            try:
                                if val is None or val == "":
                                     val = np.nan
                                else:
                                     val = float(val) if pd.api.types.is_float_dtype(df[col]) else int(float(val))
                            except (ValueError, TypeError):
                                pass 
                        
                        if 0 <= idx < len(df):
                             col_idx = df.columns.get_loc(col)
                             df.iloc[idx, col_idx] = val

            else:
                # Basic fallback for legacy 'drop_missing' if needed, or error
                raise ValueError(f"Unknown operation: {operation}")

            return df

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cleaning Failed: {str(e)}")