import os
import shutil
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db, engine
from app.db.base import Base
from app.core.config import settings
from sqlalchemy import text

router = APIRouter()

@router.delete("/purge")
def purge_system(db: Session = Depends(get_db)):
    """
    DANGER: Wipes all data.
    1. Truncates all database tables.
    2. Deletes all files in storage (datasets, models, artifacts).
    """
    try:
        # 1. Truncate Tables
        # We use a raw SQL command to disable constraints temporarily for a clean wipe
        full_reset_sql = """
        PRAGMA foreign_keys = OFF;
        DELETE FROM training_runs;
        DELETE FROM feature_definitions;
        DELETE FROM datasets;
        DELETE FROM cleaning_ops;
        PRAGMA foreign_keys = ON;
        """
        # Note: Adjust table names if they differ in your models. 
        # For a generic approach in SQLite:
        with engine.connect() as conn:
            trans = conn.begin()
            try:
                # Reflect current tables to be safe, or just nuke known ones
                # Simpler: Drop all tables and recreate
                Base.metadata.drop_all(bind=engine)
                Base.metadata.create_all(bind=engine)
                trans.commit()
            except Exception as e:
                trans.rollback()
                raise e

        # 2. Delete Storage Files
        storage_roots = [
            os.path.join(settings.STORAGE_DIR, "datasets"),
            os.path.join(settings.STORAGE_DIR, "models"),
            os.path.join(settings.STORAGE_DIR, "artifacts"),
            # Add other dirs if needed
        ]

        for root in storage_roots:
            if os.path.exists(root):
                for filename in os.listdir(root):
                    file_path = os.path.join(root, filename)
                    try:
                        if os.path.isfile(file_path) or os.path.islink(file_path):
                            os.unlink(file_path)
                        elif os.path.isdir(file_path):
                            # Keep the directory structure, just empty it? 
                            # Or delete subdirs. Let's delete subdirs.
                            shutil.rmtree(file_path)
                    except Exception as e:
                        print(f"Failed to delete {file_path}. Reason: {e}")

        return {"status": "success", "message": "System purged successfully."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
