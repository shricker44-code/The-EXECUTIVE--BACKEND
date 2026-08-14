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
from models import User, DeviceRecord, PhoneRecord
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

class DeviceCheckRequest(BaseModel):
    device_fingerprint: str

@router.post("/signup")
async def signup(request: SignUpRequest, db: Session = Depends(get_db)):
    # Check device fingerprint
    device = db.query(DeviceRecord).filter(
        DeviceRecord.fingerprint == request.device_fingerprint
    ).first()

    if device and device.trial_used:
        return {
            "blocked": True,
            "message": "Looks like you've already experienced The Executive. Ready to commit? Your strategy is waiting."
        }

    try:
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
        })

        user_id = str(uuid.uuid4())
        new_user = User(
            id=user_id,
            email=request.email,
            first_name=request.first_name,
            device_fingerprint=request.device_fingerprint,
            phone_number=request.phone_number,
            trial_start_date=datetime.utcnow(),
            trial_active=True,
            is_paid=False,
        )
        db.add(new_user)

        if not device:
            device_record = DeviceRecord(
                id=str(uuid.uuid4()),
                fingerprint=request.device_fingerprint,
                user_id=user_id,
                trial_used=True,
            )
            db.add(device_record)
        else:
            device.trial_used = True
            device.user_id = user_id

        if request.phone_number:
            phone_record = PhoneRecord(
                id=str(uuid.uuid4()),
                phone_number=request.phone_number,
                user_id=user_id,
                trial_used=True,
            )
            db.add(phone_record)

        db.commit()

        return {
            "success": True,
            "user_id": user_id,
            "first_name": request.first_name,
            "is_paid": False,
            "trial_active": True,
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

        return {
            "success": True,
            "user_id": user.id,
            "first_name": user.first_name,
            "is_paid": user.is_paid,
            "trial_active": user.trial_active,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/check-device")
async def check_device(request: DeviceCheckRequest, db: Session = Depends(get_db)):
    device = db.query(DeviceRecord).filter(
        DeviceRecord.fingerprint == request.device_fingerprint
    ).first()

    if device and device.trial_used:
        return {
            "trial_used": True,
            "message": "Looks like you've already experienced The Executive. Ready to commit? Your strategy is waiting."
        }

    return {"trial_used": False}