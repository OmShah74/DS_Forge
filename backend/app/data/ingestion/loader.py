import pandas as pd
import io
from fastapi import UploadFile, HTTPException
import os
from app.core.config import settings
import uuid

class IngestionEngine:
    @staticmethod
    async def process_upload(file: UploadFile) -> dict:
        """
        Reads a file upload, converts to DataFrame, saves as Parquet,
        and returns metadata.
        """
        # 1. Read file into Pandas
        content = await file.read()
        df = None
        
        try:
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content))
            elif file.filename.endswith('.json'):
                df = pd.read_json(io.BytesIO(content))
            elif file.filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(io.BytesIO(content))
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

        # 2. Clean basic column names (strip whitespace)
        df.columns = df.columns.astype(str).str.strip()

        # 3. Generate internal filename (UUID to prevent collisions)
        internal_filename = f"{uuid.uuid4()}.parquet"
        save_path = os.path.join(settings.DATASET_DIR, internal_filename)

        # 4. Save as Parquet (Internal Format)
        df.to_parquet(save_path, index=False)

        # 5. Return Metadata
        return {
            "filename": file.filename,
            "file_path": save_path,
            "source_type": file.filename.split('.')[-1],
            "size_bytes": len(content),
            "row_count": len(df),
            "column_count": len(df.columns)
        }