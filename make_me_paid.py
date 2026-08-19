import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

EMAIL = "shricker44@gmail.com"  # change this to whatever account you're testing with

with engine.connect() as conn:
    result = conn.execute(text("""
        UPDATE users SET is_paid = true WHERE email = :email
    """), {"email": EMAIL})
    conn.commit()
    print(f"Rows updated: {result.rowcount}")