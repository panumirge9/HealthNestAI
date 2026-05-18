"""Profile routes."""
from fastapi import APIRouter, Depends, HTTPException

from app.models.schemas import ProfileUpdateRequest, ProfileResponse, UserOut
from app.core.security import verify_token
from app.core.db import db_cursor

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=ProfileResponse)
def get_profile(user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute(
            "SELECT id, name, email, age, gender, blood_group, allergies, existing_conditions, plan, created_at FROM users WHERE id = ?",
            (user["id"],),
        )
        u = c.fetchone()
        if not u:
            raise HTTPException(404, detail={"error": True, "message": "User not found", "code": "USER_NOT_FOUND"})

        # Stats
        c.execute("SELECT COUNT(*) as cnt FROM symptom_analyses WHERE user_id = ?", (user["id"],))
        sym_count = c.fetchone()["cnt"]
        c.execute("SELECT COUNT(*) as cnt FROM health_reports WHERE user_id = ?", (user["id"],))
        rep_count = c.fetchone()["cnt"]

        return ProfileResponse(
            user=UserOut(id=u["id"], name=u["name"], email=u["email"], plan=u["plan"] or "free", created_at=u["created_at"]),
            stats={
                "symptom_analyses": sym_count,
                "health_reports": rep_count,
                "age": u["age"],
                "gender": u["gender"],
                "blood_group": u["blood_group"],
                "allergies": u["allergies"],
                "existing_conditions": u["existing_conditions"],
            },
        )


@router.put("", response_model=dict)
def update_profile(req: ProfileUpdateRequest, user: dict = Depends(verify_token)):
    fields = req.model_dump(exclude_unset=True)
    if not fields:
        return {"success": True, "message": "No changes"}

    with db_cursor() as c:
        for key, val in fields.items():
            db_col = "blood_group" if key == "blood_group" else key
            c.execute(f"UPDATE users SET {db_col} = ? WHERE id = ?", (val, user["id"]))

        return {"success": True, "message": "Profile updated"}
