import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE verdicts
        ADD COLUMN IF NOT EXISTS example_asset VARCHAR;
    """))
    conn.commit()

print("example_asset column added.")