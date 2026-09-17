import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ["DATABASE_URL"]

# Add any other pre-existing real accounts here (friends who signed up
# before we built email verification, your founder account, etc.)
EMAILS_TO_GRANDFATHER = [
    "shricker44@gmail.com",
    "jeszicaa@icloud.com",
    "teetrack17@gmail.com"
]

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(
        text("UPDATE users SET email_verified = true WHERE email = ANY(:emails)"),
        {"emails": EMAILS_TO_GRANDFATHER}
    )
    conn.commit()
    print(f"Rows updated: {result.rowcount}")