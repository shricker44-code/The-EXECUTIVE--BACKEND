from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import stripe

from database import get_db
from models import User

router = APIRouter()

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID = os.environ.get("STRIPE_PRICE_ID")
MULTI_ACCOUNT_PRICE_ID = os.environ.get("MULTI_ACCOUNT_PRICE_ID")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")


class CheckoutRequest(BaseModel):
    user_id: str


@router.post("/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.first_name,
                metadata={"user_id": user.id},
            )
            user.stripe_customer_id = customer.id
            db.commit()

        checkout_session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/success.html?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/upgrade.html",
            metadata={"user_id": user.id, "tier": "base"},
        )

        return {"checkout_url": checkout_session.url}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-multi-account-checkout-session")
async def create_multi_account_checkout_session(request: CheckoutRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.first_name,
                metadata={"user_id": user.id},
            )
            user.stripe_customer_id = customer.id
            db.commit()

        checkout_session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{"price": MULTI_ACCOUNT_PRICE_ID, "quantity": 1}],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/success.html?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/upgrade.html",
            metadata={"user_id": user.id, "tier": "multi_account"},
        )

        return {"checkout_url": checkout_session.url}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        user_id = data.get("metadata", {}).get("user_id")
        tier = data.get("metadata", {}).get("tier", "base")
        subscription_id = data.get("subscription")
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            if tier == "multi_account":
                user.multi_account_subscription_id = subscription_id
                user.has_multi_account = True
            else:
                user.stripe_subscription_id = subscription_id
                user.is_paid = True
                user.subscription_status = "active"
            db.commit()

    elif event_type in ("customer.subscription.updated", "customer.subscription.deleted"):
        subscription_id = data.get("id")
        status = data.get("status")

        # Check whether this subscription is the base plan or the multi-account tier
        user = db.query(User).filter(User.stripe_subscription_id == subscription_id).first()
        if user:
            user.subscription_status = status
            user.is_paid = status == "active"
            db.commit()
        else:
            user = db.query(User).filter(User.multi_account_subscription_id == subscription_id).first()
            if user:
                user.has_multi_account = status == "active"
                db.commit()

    return {"received": True}


@router.get("/subscription-status/{user_id}")
async def subscription_status(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "is_paid": user.is_paid,
        "subscription_status": user.subscription_status,
        "trial_active": user.trial_active,
        "has_multi_account": user.has_multi_account,
    }