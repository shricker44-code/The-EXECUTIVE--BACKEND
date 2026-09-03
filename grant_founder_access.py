"""
One-off script: grants full paid access to the founder/testing account
so all features (TTS voice, uncapped tokens, multi-account, etc.) work
for internal testing.
"""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

FOUNDER_EMAIL = "shricker44@gmail.com"  # same account used in grant_multi_account.py

with engine.connect() as conn:
    conn.execute(text("""
        UPDATE users
        SET is_paid = true, subscription_status = 'active', has_multi_account = true
        WHERE email = :email
    """), {"email": FOUNDER_EMAIL})
    conn.commit()

print(f"Founder account ({FOUNDER_EMAIL}) granted full paid + multi-account access.")