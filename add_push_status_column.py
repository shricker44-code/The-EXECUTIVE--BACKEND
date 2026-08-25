"""
One-off migration: adds push_subscription_status column to users table,
used to track whether push subscribe actually succeeded (needed since
iOS silently fails if the PWA wasn't added to home screen).
"""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS push_subscription_status VARCHAR(20)
    """))
    conn.commit()

print("Migration complete: push_subscription_status added to users.")