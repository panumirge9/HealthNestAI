"""Health Report routes."""
from fastapi import APIRouter, Depends

from app.models.schemas import HealthReportRequest, HealthReportResponse
from app.core.security import verify_token
from app.core.usage_limiter import check_usage
from app.services import health_report_service

router = APIRouter(prefix="/api/report", tags=["report"])


@router.post("/generate", response_model=HealthReportResponse)
def generate_report(req: HealthReportRequest, user: dict = Depends(verify_token)):
    check_usage(user["id"], "health-report")
    return health_report_service.generate_report(req, user["id"])


@router.get("/history", response_model=dict)
def history(user: dict = Depends(verify_token)):
    return {"reports": health_report_service.get_user_reports(user["id"])}
