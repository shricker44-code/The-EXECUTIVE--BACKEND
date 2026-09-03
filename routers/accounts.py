from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import User, Account
import uuid
from datetime import datetime

router = APIRouter()


class CreateAccountRequest(BaseModel):
    user_id: str
    label: str


@router.post("/")
async def create_account(request: CreateAccountRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_paid:
        raise HTTPException(
            status_code=403,
            detail="Multi-account access is included with the Executive plan. Upgrade to add accounts."
        )

    account = Account(
        id=str(uuid.uuid4()),
        user_id=user.id,
        label=request.label,
        created_at=datetime.utcnow(),
    )
    db.add(account)
    db.commit()

    return {
        "success": True,
        "account": {
            "id": account.id,
            "label": account.label,
        }
    }


@router.get("/{user_id}")
async def list_accounts(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    accounts = db.query(Account).filter(Account.user_id == user_id).order_by(Account.created_at).all()
    return {
        "has_multi_account": user.is_paid if user else False,
        "accounts": [
            {
                "id": a.id,
                "label": a.label,
                "last_follower_count": a.last_follower_count,
                "last_engagement_rate": a.last_engagement_rate,
            }
            for a in accounts
        ]
    }


@router.delete("/{account_id}")
async def delete_account(account_id: str, user_id: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == user_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(account)
    db.commit()

    return {"success": True}

class RenameAccountRequest(BaseModel):
    user_id: str
    label: str


@router.patch("/{account_id}")
async def rename_account(account_id: str, request: RenameAccountRequest, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id, Account.user_id == request.user_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    account.label = request.label
    db.commit()

    return {"success": True, "account": {"id": account.id, "label": account.label}}