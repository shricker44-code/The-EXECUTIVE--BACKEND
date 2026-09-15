"""
Purges accounts that were soft-deleted more than 30 days ago —
permanently removes the user and all associated data.
Run manually or set up as a Render Cron Job, similar to daily-briefings-cron.
"""
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

PURGE_AFTER_DAYS = 30

with engine.connect() as conn:
    cutoff = datetime.utcnow() - timedelta(days=PURGE_AFTER_DAYS)

    users_to_purge = conn.execute(
        text("SELECT id FROM users WHERE is_deleted = TRUE AND deleted_at < :cutoff"),
        {"cutoff": cutoff}
    ).fetchall()

    for (user_id,) in users_to_purge:
        conn.execute(text("DELETE FROM verdicts WHERE user_id = :uid"), {"uid": user_id})
        conn.execute(text("DELETE FROM accounts WHERE user_id = :uid"), {"uid": user_id})
        conn.execute(text("DELETE FROM chat_sessions WHERE user_id = :uid"), {"uid": user_id})
        conn.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})

    conn.commit()

print(f"Purged {len(users_to_purge)} accounts deleted more than {PURGE_AFTER_DAYS} days ago.")