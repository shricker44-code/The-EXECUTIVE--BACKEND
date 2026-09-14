import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS theme_accent VARCHAR,
        ADD COLUMN IF NOT EXISTS theme_background VARCHAR,
        ADD COLUMN IF NOT EXISTS theme_text_primary VARCHAR,
        ADD COLUMN IF NOT EXISTS theme_text_secondary VARCHAR,
        ADD COLUMN IF NOT EXISTS theme_bubble_user VARCHAR,
        ADD COLUMN IF NOT EXISTS theme_bubble_assistant VARCHAR
    """))
    conn.commit()

print("Migration complete: theme color columns added to users.")