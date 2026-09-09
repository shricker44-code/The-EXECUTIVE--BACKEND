import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

FOUNDER_EMAIL = "shricker44@gmail.com"

with engine.connect() as conn:
    conn.execute(text("""
        UPDATE users
        SET trial_tokens_used = 0
        WHERE email = :email
    """), {"email": FOUNDER_EMAIL})

    conn.execute(text("""
        UPDATE chat_sessions
        SET tokens_used = 0
        WHERE user_id = (SELECT id FROM users WHERE email = :email)
        AND date = CAST(CURRENT_DATE AS TEXT)
    """), {"email": FOUNDER_EMAIL})

    conn.commit()

print(f"Founder account ({FOUNDER_EMAIL}) usage reset to 0 — trial tokens and today's session tokens.")