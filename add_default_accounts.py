"""
One-off migration: gives every existing user a real Account row to replace
the special-cased "Default" (account_id=None) behavior. Existing verdicts
with account_id=None get reassigned to this new account, so history isn't lost.
"""
import os
import uuid
from datetime import datetime
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    users = conn.execute(text("SELECT id, email, default_account_label FROM users")).fetchall()

    for user_id, email, default_label in users:
        # Skip if this user already has an account with no prior account_id verdicts to migrate
        existing = conn.execute(
            text("SELECT id FROM accounts WHERE user_id = :uid ORDER BY created_at LIMIT 1"),
            {"uid": user_id}
        ).fetchone()

        if existing:
            new_account_id = existing[0]
        else:
            new_account_id = str(uuid.uuid4())
            label = default_label or "Main"
            conn.execute(
                text("""
                    INSERT INTO accounts (id, user_id, label, created_at)
                    VALUES (:id, :uid, :label, :created_at)
                """),
                {"id": new_account_id, "uid": user_id, "label": label, "created_at": datetime.utcnow()}
            )

        # Reassign any verdicts that were using the old account_id=None convention
        conn.execute(
            text("""
                UPDATE verdicts
                SET account_id = :new_id
                WHERE user_id = :uid AND account_id IS NULL
            """),
            {"new_id": new_account_id, "uid": user_id}
        )

    conn.commit()

print(f"Migrated {len(users)} users to real Default accounts.")