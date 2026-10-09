"""
Assignments tab backend.

Assignments are not a separate table: every Verdict row that has an
`assignment` is one. The posting checklist for it is built lazily the first
time the user opens the tab (so chat latency is untouched) and cached in
Verdict.assignment_steps as JSON. Deleting a chat (account) already deletes
its Verdict rows in routers/accounts.py, so its assignments vanish with it.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import User, Verdict
from services.claude import get_assignment_checklist

router = APIRouter()


class OwnerPayload(BaseModel):
    user_id: str


class DonePayload(BaseModel):
    user_id: str
    done: bool = True


def _has_assignment(v: Verdict) -> bool:
    return bool(v.assignment) and v.assignment.strip().lower() != "none"


def _load_steps(v: Verdict):
    if not v.assignment_steps:
        return None
    try:
        return json.loads(v.assignment_steps)
    except Exception:
        return None


def _serialize(v: Verdict) -> dict:
    return {
        "id": v.id,
        "account_id": v.account_id,
        "assignment": v.assignment,
        "created_at": v.created_at.isoformat() if v.created_at else None,
        "posted_after": v.posted_after,
        "checklist": _load_steps(v),
    }


def _get_owned_verdict(verdict_id: str, user_id: str, db: Session) -> Verdict:
    v = db.query(Verdict).filter(Verdict.id == verdict_id, Verdict.user_id == user_id).first()
    if not v or not _has_assignment(v):
        raise HTTPException(status_code=404, detail="Assignment not found")
    return v


@router.get("/{user_id}")
async def list_assignments(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"assignments": []}
    rows = (
        db.query(Verdict)
        .filter(Verdict.user_id == user_id, Verdict.assignment.isnot(None))
        .order_by(Verdict.created_at.desc())
        .limit(100)
        .all()
    )
    return {"assignments": [_serialize(v) for v in rows if _has_assignment(v)]}


@router.post("/{verdict_id}/build")
async def build_checklist(verdict_id: str, payload: OwnerPayload, db: Session = Depends(get_db)):
    v = _get_owned_verdict(verdict_id, payload.user_id, db)
    existing = _load_steps(v)
    if existing:
        return {"success": True, "assignment": _serialize(v)}

    user = db.query(User).filter(User.id == payload.user_id).first()
    ctx_bits = []
    if user:
        for label, val in (("Niche", user.niche), ("Content style", user.content_style),
                           ("Goal", user.goal), ("Biggest challenge", user.biggest_challenge)):
            if val:
                ctx_bits.append(f"{label}: {val}")
    language = getattr(user, "language", None) or "en"

    try:
        checklist = await get_assignment_checklist(
            verdict_text=v.content or "",
            assignment=v.assignment,
            creator_context="\n".join(ctx_bits),
            language=language,
        )
    except Exception as e:
        print(f"Checklist build failed for {verdict_id}: {e}")
        checklist = None

    if not checklist:
        return {"success": False, "detail": "Could not build the checklist. Try again."}

    v.assignment_steps = json.dumps(checklist, ensure_ascii=False)
    db.commit()
    return {"success": True, "assignment": _serialize(v)}


@router.post("/{verdict_id}/done")
async def set_done(verdict_id: str, payload: DonePayload, db: Session = Depends(get_db)):
    v = _get_owned_verdict(verdict_id, payload.user_id, db)
    v.posted_after = True if payload.done else None
    db.commit()
    return {"success": True, "assignment": _serialize(v)}