import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_tokens_used INTEGER DEFAULT 0;"))
    conn.commit()

print("Migration complete: trial_tokens_used added to users.")