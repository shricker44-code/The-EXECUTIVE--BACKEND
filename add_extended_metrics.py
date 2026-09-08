import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE verdicts
        ADD COLUMN IF NOT EXISTS watch_time_snapshot FLOAT,
        ADD COLUMN IF NOT EXISTS completion_rate_snapshot FLOAT,
        ADD COLUMN IF NOT EXISTS profile_visits_snapshot INTEGER
    """))
    conn.commit()

print("Migration complete: watch_time, completion_rate, profile_visits snapshots added to verdicts.")