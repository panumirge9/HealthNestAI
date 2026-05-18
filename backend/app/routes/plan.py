"""Monetization / plan routes."""
from fastapi import APIRouter, Depends
from datetime import date, timedelta

from app.models.schemas import UsageStatus, UpgradeRequest
from app.core.security import verify_token
from app.core.usage_limiter import get_usage_status
from app.core.db import db_cursor

router = APIRouter(prefix="/api/plan", tags=["plan"])


@router.get("/status", response_model=UsageStatus)
def status(user: dict = Depends(verify_token)):
    return UsageStatus(**get_usage_status(user["id"]))


@router.get("/pricing", response_model=dict)
def pricing():
    return {
        "free": {
            "name": "Free",
            "price": 0,
            "features": [
                "5 AI symptom analyses/day",
                "5 health reports/day",
                "5 AI chats/day",
                "Unlimited medicine reminders",
            ],
        },
        "pro": {
            "name": "Pro",
            "monthly": {"price": 199, "currency": "INR"},
            "yearly": {"price": 1499, "currency": "INR", "save_percent": 37},
            "features": [
                "Unlimited AI analyses",
                "No daily limits",
                "PDF report downloads",
                "Priority AI responses",
                "Email support",
            ],
        },
    }


@router.post("/upgrade", response_model=dict)
def upgrade(req: UpgradeRequest, user: dict = Depends(verify_token)):
    """
    Activate Pro plan. In production: verify payment_id with Razorpay first.
    """
    days = 365 if req.plan_type == "yearly" else 30
    expires = (date.today() + timedelta(days=days)).isoformat()
    with db_cursor() as c:
        c.execute("UPDATE users SET plan = 'pro', plan_expires = ? WHERE id = ?", (expires, user["id"]))
    return {"success": True, "plan": "pro", "expires": expires}
