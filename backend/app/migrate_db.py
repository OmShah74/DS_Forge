import sqlite3
import os

# Relative to the script location in app/
db_path = "app/db/ds-forge.sqlite"

def migrate():
    if not os.path.exists(db_path):
        # Try absolute path within container
        db_path_alt = "/app/app/db/ds-forge.sqlite"
        if os.path.exists(db_path_alt):
            actual_path = db_path_alt
        else:
            print(f"Database not found at {db_path} or {db_path_alt}")
            return
    else:
        actual_path = db_path

    print(f"Using database at {actual_path}")
    conn = sqlite3.connect(actual_path)
    cursor = conn.cursor()

    # Get existing columns
    cursor.execute("PRAGMA table_info(training_runs)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Current columns: {columns}")

    # Add missing columns
    new_columns = [
        ("feature_columns", "JSON"),
        ("progress", "INTEGER DEFAULT 0"),
        ("stage", "TEXT")
    ]

    for col_name, col_type in new_columns:
        if col_name not in columns:
            print(f"Adding column {col_name}...")
            try:
                cursor.execute(f"ALTER TABLE training_runs ADD COLUMN {col_name} {col_type}")
                print(f"Successfully added {col_name}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
