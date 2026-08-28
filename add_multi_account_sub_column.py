"""
One-off migration: adds multi_account_subscription_id to users,
so the $30/month multi-account subscription can be tracked
separately from the base $15/month plan's subscription.
"""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS multi_account_subscription_id VARCHAR
    """))
    conn.commit()

print("Migration complete: multi_account_subscription_id added to users.")