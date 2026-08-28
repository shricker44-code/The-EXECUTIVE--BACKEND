"""
One-off migration: adds follower_count_snapshot and engagement_rate_snapshot
to verdicts, so each scan's numbers are preserved as a historical data point
instead of being overwritten — this powers the real growth trend.
"""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE verdicts
        ADD COLUMN IF NOT EXISTS follower_count_snapshot INTEGER,
        ADD COLUMN IF NOT EXISTS engagement_rate_snapshot FLOAT
    """))
    conn.commit()

print("Migration complete: follower_count_snapshot and engagement_rate_snapshot added to verdicts.")