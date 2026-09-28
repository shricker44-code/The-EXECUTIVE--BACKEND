import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
EMAIL = "shricker44@gmail.com"

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("""
        UPDATE users
        SET is_paid = true
        WHERE email = :email
        RETURNING id, email, is_paid;
    """), {"email": EMAIL})
    conn.commit()
    row = result.fetchone()
    print("Updated:", row)