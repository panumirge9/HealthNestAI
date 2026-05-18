"""
HealthNestAI FastAPI app — main entry point.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import os
from dotenv import load_dotenv

load_dotenv()

from app.core.db import init_db, extend_db
from app.routes import auth, symptoms, health_report, medicines, profile, plan, symptom_chat, phase2

app = FastAPI(
    title="HealthNestAI API",
    description="AI-powered health intelligence — structured symptom analysis",
    version="6.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Initialize DB on startup
@app.on_event("startup")
def startup():
    init_db()
    extend_db()

# CORS
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:19006").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard error format for validation errors
@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    first_error = exc.errors()[0] if exc.errors() else {"msg": "Validation failed"}
    return JSONResponse(
        status_code=422,
        content={"error": True, "message": first_error.get("msg", "Validation failed"), "code": "VALIDATION_ERROR"},
    )

# Health check
@app.get("/api/health-check")
def health_check():
    return {"status": "ok", "version": "6.0.0", "service": "HealthNestAI"}

# Mount routes
app.include_router(auth.router)
app.include_router(symptoms.router)
app.include_router(health_report.router)
app.include_router(medicines.router)
app.include_router(profile.router)
app.include_router(plan.router)
app.include_router(symptom_chat.router)
app.include_router(phase2.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
