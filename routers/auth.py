from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import hashlib
from supabase import create_client
from database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends
from models import User
from datetime import datetime

router = APIRouter()

supabase = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

class SignUpRequest(BaseModel):
    email: str
    password: str
    first_name: str
    device_fingerprint: str
    phone_number: Optional[str] = None

class SignInRequest(BaseModel):
    email: str
    password: str
    device_fingerprint: str

@router.post("/signup")
async def signup(request: SignUpRequest, db: Session = Depends(get_db)):
    try:
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
        })

        user_id = str(uuid.uuid4())
        session_token = str(uuid.uuid4())

        new_user = User(
            id=user_id,
            email=request.email,
            first_name=request.first_name,
            device_fingerprint=request.device_fingerprint,
            phone_number=request.phone_number,
            trial_start_date=datetime.utcnow(),
            trial_active=True,
            is_paid=False,
            session_token=session_token,
            session_device=request.device_fingerprint,
        )
        db.add(new_user)
        db.commit()

        return {
            "success": True,
            "user_id": user_id,
            "first_name": request.first_name,
            "is_paid": False,
            "trial_active": True,
            "session_token": session_token,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/signin")
async def signin(request: SignInRequest, db: Session = Depends(get_db)):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })

        user = db.query(User).filter(User.email == request.email).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        session_token = str(uuid.uuid4())
        user.session_token = session_token
        user.session_device = request.device_fingerprint
        db.commit()

        return {
            "success": True,
            "user_id": user.id,
            "first_name": user.first_name,
            "is_paid": user.is_paid,
            "trial_active": user.trial_active,
            "session_token": session_token,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class SessionCheckRequest(BaseModel):
    user_id: str
    device_fingerprint: str

@router.post("/check-session")
async def check_session(request: SessionCheckRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.session_device and user.session_device != request.device_fingerprint:
        return {
            "valid": False,
            "message": "You've been signed out because your account was used on another device."
        }

    return {"valid": True}