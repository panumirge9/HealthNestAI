"""
Free-tier rate limiting per feature per day.
"""
from fastapi import HTTPException
from datetime import date
from app.core.db import db_cursor

FREE_LIMITS = {
    "symptom-analysis": 5,
    "health-report": 5,
    "ai-chat": 5,
}


def check_usage(user_id: int, feature: str) -> dict:
    """Check if user can use this feature. Raises 429 if limit exceeded."""
    with db_cursor() as c:
        # Get user plan
        c.execute("SELECT plan, plan_expires FROM users WHERE id = ?", (user_id,))
        user = c.fetchone()
        if not user:
            raise HTTPException(404, detail={"error": True, "message": "User not found", "code": "USER_NOT_FOUND"})

        plan = user["plan"] or "free"
        # Check pro expiry
        if plan == "pro" and user["plan_expires"]:
            if user["plan_expires"] < date.today().isoformat():
                c.execute("UPDATE users SET plan = 'free' WHERE id = ?", (user_id,))
                plan = "free"

        # Pro users — unlimited
        if plan == "pro":
            c.execute("INSERT INTO usage_logs (user_id, feature) VALUES (?, ?)", (user_id, feature))
            return {"plan": "pro", "unlimited": True}

        # Free users — check daily count
        limit = FREE_LIMITS.get(feature, 5)
        today = date.today().isoformat()
        c.execute(
            "SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND feature = ? AND date(used_at) = ?",
            (user_id, feature, today),
        )
        used = c.fetchone()["cnt"]

        if used >= limit:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": True,
                    "message": f"You've used your {limit} free {feature.replace('-', ' ')} for today. Upgrade to Pro for unlimited access.",
                    "code": "USAGE_LIMIT",
                    "feature": feature,
                    "used": used,
                    "limit": limit,
                    "upgrade": {"monthly": 199, "yearly": 1499, "currency": "INR"},
                },
            )

        # Log usage
        c.execute("INSERT INTO usage_logs (user_id, feature) VALUES (?, ?)", (user_id, feature))
        return {"plan": "free", "used": used + 1, "limit": limit, "remaining": limit - used - 1}


def get_usage_status(user_id: int) -> dict:
    """Get current usage status across all features."""
    with db_cursor() as c:
        c.execute("SELECT plan, plan_expires FROM users WHERE id = ?", (user_id,))
        user = c.fetchone()
        plan = user["plan"] if user else "free"

        today = date.today().isoformat()
        features = {}
        for feature, limit in FREE_LIMITS.items():
            c.execute(
                "SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND feature = ? AND date(used_at) = ?",
                (user_id, feature, today),
            )
            used = c.fetchone()["cnt"]
            features[feature] = {
                "used": used,
                "limit": -1 if plan == "pro" else limit,
                "remaining": -1 if plan == "pro" else max(0, limit - used),
                "unlimited": plan == "pro",
            }

        return {
            "plan": plan,
            "features": features,
            "plan_expires": user["plan_expires"] if user else None,
        }
