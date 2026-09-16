import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ["DATABASE_URL"]
TEST_EMAIL = "cnbookkeepers17@gmail.com"  # <-- replace with the real one you tested with

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(
        text("UPDATE users SET email_verified = true WHERE email = :email"),
        {"email": TEST_EMAIL}
    )
    conn.commit()
    print(f"Rows updated: {result.rowcount}")