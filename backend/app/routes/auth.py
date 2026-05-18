"""Auth routes — register, login, me."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from app.models.schemas import RegisterRequest, LoginRequest, AuthResponse, UserOut
from app.core.security import hash_password, verify_password, create_token, verify_token
from app.core.db import db_cursor

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    with db_cursor() as c:
        c.execute("SELECT id FROM users WHERE email = ?", (req.email,))
        if c.fetchone():
            raise HTTPException(409, detail={"error": True, "message": "Email already registered", "code": "EMAIL_EXISTS"})

        hashed = hash_password(req.password)
        c.execute(
            "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
            (req.email, hashed, req.name),
        )
        user_id = c.lastrowid
        token = create_token(user_id, req.email, req.name)

        return AuthResponse(
            token=token,
            user=UserOut(id=user_id, name=req.name, email=req.email, plan="free", created_at=datetime.now()),
        )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    with db_cursor() as c:
        c.execute("SELECT id, name, email, password_hash, plan, created_at FROM users WHERE email = ?", (req.email,))
        row = c.fetchone()
        if not row or not verify_password(req.password, row["password_hash"]):
            raise HTTPException(401, detail={"error": True, "message": "Invalid credentials", "code": "INVALID_CREDENTIALS"})

        c.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", (row["id"],))
        token = create_token(row["id"], row["email"], row["name"])

        return AuthResponse(
            token=token,
            user=UserOut(id=row["id"], name=row["name"], email=row["email"], plan=row["plan"] or "free", created_at=row["created_at"]),
        )


@router.get("/me", response_model=UserOut)
def me(user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("SELECT id, name, email, plan, created_at FROM users WHERE id = ?", (user["id"],))
        row = c.fetchone()
        if not row:
            raise HTTPException(404, detail={"error": True, "message": "User not found", "code": "USER_NOT_FOUND"})
        return UserOut(id=row["id"], name=row["name"], email=row["email"], plan=row["plan"] or "free", created_at=row["created_at"])
