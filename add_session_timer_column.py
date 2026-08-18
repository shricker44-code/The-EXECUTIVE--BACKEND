import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE chat_sessions
        ADD COLUMN IF NOT EXISTS session_start TIMESTAMP;
    """))
    conn.commit()

print("Session timer column added successfully.")