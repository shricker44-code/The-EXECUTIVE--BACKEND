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
from models import User, Account
from datetime import datetime
import stripe

router = APIRouter()

supabase = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

supabase_admin = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_SERVICE_KEY")
)

class SignUpRequest(BaseModel):
    email: str
    password: str
    first_name: str
    device_fingerprint: str
    phone_number: Optional[str] = None
    consented: bool = False

class SignInRequest(BaseModel):
    email: str
    password: str
    device_fingerprint: str

@router.post("/signup")
async def signup(request: SignUpRequest, db: Session = Depends(get_db)):
    try:
        if not request.consented:
            raise HTTPException(status_code=400, detail="You must consent to sharing analytics screenshots to create an account.")

        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "email_redirect_to": "https://theexecutive.app/verify.html"
            }
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
            consented_at=datetime.utcnow(),
        )
        db.add(new_user)
        db.commit()

        default_account = Account(
            id=str(uuid.uuid4()),
            user_id=user_id,
            label="Main",
            created_at=datetime.utcnow(),
        )
        db.add(default_account)
        db.commit()

        return {
            "success": True,
            "needs_verification": True,
            "email": request.email,
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

        if user.is_deleted:
            raise HTTPException(status_code=403, detail="This account has been deleted.")

        if not user.email_verified:
            return {"success": False, "needs_verification": True, "detail": "Please verify your email before signing in. Check your inbox."}

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
            "language": user.language or "en",
            "theme": {
                "accent": user.theme_accent,
                "background": user.theme_background,
                "text_primary": user.theme_text_primary,
                "text_secondary": user.theme_text_secondary,
                "bubble_user": user.theme_bubble_user,
                "bubble_assistant": user.theme_bubble_assistant,
            },
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

class UpdateNameRequest(BaseModel):
    user_id: str
    first_name: str

@router.post("/update-name")
async def update_name(request: UpdateNameRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.first_name = request.first_name.strip()
    db.commit()

    return {"success": True, "first_name": user.first_name}

class UpdateLanguageRequest(BaseModel):
    user_id: str
    language: str

@router.post("/update-language")
async def update_language(request: UpdateLanguageRequest, db: Session = Depends(get_db)):
    if request.language not in ("en", "fr", "pt", "hi"):
        raise HTTPException(status_code=400, detail="Unsupported language")

    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.language = request.language
    db.commit()

    return {"success": True, "language": user.language}

class UpdateThemeRequest(BaseModel):
    user_id: str
    theme_accent: Optional[str] = None
    theme_background: Optional[str] = None
    theme_text_primary: Optional[str] = None
    theme_text_secondary: Optional[str] = None
    theme_bubble_user: Optional[str] = None
    theme_bubble_assistant: Optional[str] = None

@router.post("/update-theme")
async def update_theme(request: UpdateThemeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.theme_accent = request.theme_accent
    user.theme_background = request.theme_background
    user.theme_text_primary = request.theme_text_primary
    user.theme_text_secondary = request.theme_text_secondary
    user.theme_bubble_user = request.theme_bubble_user
    user.theme_bubble_assistant = request.theme_bubble_assistant
    db.commit()

    return {
        "success": True,
        "theme": {
            "accent": user.theme_accent,
            "background": user.theme_background,
            "text_primary": user.theme_text_primary,
            "text_secondary": user.theme_text_secondary,
            "bubble_user": user.theme_bubble_user,
            "bubble_assistant": user.theme_bubble_assistant,
        }
    }

class DeleteAccountRequest(BaseModel):
    user_id: str

@router.post("/delete-account")
async def delete_account_request(request: DeleteAccountRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.stripe_subscription_id and user.is_paid:
        try:
            stripe.Subscription.delete(user.stripe_subscription_id)
        except Exception:
            pass

    user.is_deleted = True
    user.deleted_at = datetime.utcnow()
    user.is_paid = False
    user.session_token = None
    db.commit()

    return {"success": True}

class ConfirmEmailRequest(BaseModel):
    email: str

@router.post("/confirm-email")
async def confirm_email(request: ConfirmEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.email_verified = True
    db.commit()

    return {"success": True}

class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    try:
        supabase.auth.reset_password_for_email(
            request.email,
            {"redirect_to": "https://theexecutive.app/reset-password.html"}
        )
        return {"success": True}
    except Exception as e:
        return {"success": True}  # never reveal whether the email exists


class ResetPasswordRequest(BaseModel):
    user_id: str
    new_password: str

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    try:
        supabase_admin.auth.admin.update_user_by_id(
            request.user_id,
            {"password": request.new_password}
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class ConfirmEmailRequest(BaseModel):
    email: str

@router.post("/confirm-email")
async def confirm_email(request: ConfirmEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.email_verified = True
    db.commit()

    return {"success": True}