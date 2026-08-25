"""
One-off: manually grants has_multi_account=True to a specific user by email,
for testing the multi-account tier before Stripe billing is wired up for it.
"""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
USER_EMAIL = "shricker44@gmail.com"  # <-- change this to your account's email

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("""
        UPDATE users
        SET has_multi_account = TRUE
        WHERE email = :email
        RETURNING id, email
    """), {"email": USER_EMAIL})
    conn.commit()
    row = result.fetchone()
    if row:
        print(f"Granted multi-account access to: {row[1]} (id: {row[0]})")
    else:
        print(f"No user found with email: {USER_EMAIL}")