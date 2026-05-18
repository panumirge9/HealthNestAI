"""
Symptom Analysis Routes — THE CORE FEATURE.
Strict request/response contracts via Pydantic.
"""
from fastapi import APIRouter, Depends
from typing import List

from app.models.schemas import SymptomRequest, SymptomResponse
from app.core.security import verify_token
from app.core.usage_limiter import check_usage
from app.services import analysis_service, symptom_engine

router = APIRouter(prefix="/api/symptoms", tags=["symptoms"])


@router.get("/list", response_model=dict)
def list_symptoms():
    """Get all known symptoms (for frontend dropdown)."""
    return {"symptoms": symptom_engine.get_all_symptoms()}


@router.post("/analyze", response_model=SymptomResponse)
def analyze(req: SymptomRequest, user: dict = Depends(verify_token)):
    """
    Analyze symptoms → return structured SymptomResponse.
    Rule engine + AI hybrid. Always returns valid response.
    """
    check_usage(user["id"], "symptom-analysis")
    return analysis_service.analyze_symptoms(req, user["id"])


@router.get("/history", response_model=dict)
def history(user: dict = Depends(verify_token)):
    """Get user's past symptom analyses."""
    return {"analyses": analysis_service.get_user_analyses(user["id"])}
