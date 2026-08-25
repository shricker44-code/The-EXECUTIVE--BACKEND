"""
One-off migration: creates the accounts table, adds has_multi_account
to users, and adds account_id to verdicts — foundation for the
multi-account upgrade tier (up to 3 TikTok accounts per user).
"""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS accounts (
            id VARCHAR PRIMARY KEY,
            user_id VARCHAR REFERENCES users(id),
            label VARCHAR NOT NULL,
            last_follower_count INTEGER,
            last_engagement_rate FLOAT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """))
    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS has_multi_account BOOLEAN DEFAULT FALSE
    """))
    conn.execute(text("""
        ALTER TABLE verdicts
        ADD COLUMN IF NOT EXISTS account_id VARCHAR REFERENCES accounts(id)
    """))
    conn.commit()

print("Migration complete: accounts table created, has_multi_account and account_id added.")