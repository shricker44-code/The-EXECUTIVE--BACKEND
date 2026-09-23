import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS waitlist_entries (
            id VARCHAR PRIMARY KEY,
            email VARCHAR UNIQUE NOT NULL,
            tiktok_handle VARCHAR,
            status VARCHAR DEFAULT 'waiting',
            created_at TIMESTAMP DEFAULT NOW(),
            invited_at TIMESTAMP
        )
    """))
    conn.commit()
    print("Waitlist table created.")