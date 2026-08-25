"""
One-off migration: adds push_subscription, daily_report_time, and timezone
columns to the users table.
"""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS push_subscription TEXT,
        ADD COLUMN IF NOT EXISTS daily_report_time VARCHAR(5),
        ADD COLUMN IF NOT EXISTS timezone VARCHAR(64)
    """))
    conn.commit()

print("Migration complete.")