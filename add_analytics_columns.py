"""
One-off migration: adds last_follower_count and last_engagement_rate
columns to the users table, used to detect duplicate/unchanged
analytics screenshots.
"""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS last_follower_count INTEGER,
        ADD COLUMN IF NOT EXISTS last_engagement_rate FLOAT
    """))
    conn.commit()

print("Migration complete: last_follower_count, last_engagement_rate added to users.")