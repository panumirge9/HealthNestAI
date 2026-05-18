"""
Health Report Service — vitals → score + insights.
"""
import json
from typing import Dict, List, Optional
from datetime import datetime

from app.services import ai_service
from app.core.db import db_cursor
from app.models.schemas import HealthReportRequest, HealthReportResponse, HealthScoreInsight


def generate_report(req: HealthReportRequest, user_id: int) -> HealthReportResponse:
    """Generate complete health report with score and insights."""
    bmi = round(req.weight_kg / ((req.height_cm / 100) ** 2), 1)

    # Calculate component scores
    insights = _calculate_insights(req, bmi)

    # Overall score = average of component scores
    score = int(sum(i.score for i in insights) / len(insights))

    # Risk level
    if score >= 80:
        risk = "low"
    elif score >= 60:
        risk = "moderate"
    elif score >= 40:
        risk = "high"
    else:
        risk = "critical"

    # Issues for AI
    issues = [i.message for i in insights if i.status in ("fair", "poor")]

    # AI-generated summary + recommendations
    ai_result = ai_service.generate_health_report_ai(
        age=req.age,
        gender=req.gender,
        bmi=bmi,
        systolic_bp=req.systolic_bp,
        diastolic_bp=req.diastolic_bp or 80,
        sugar_mgdl=req.sugar_mgdl,
        sleep_hours=req.sleep_hours,
        water_glasses=req.water_glasses,
        exercise_days=req.exercise_days_per_week,
        smoking=req.smoking,
        issues=issues,
        score=score,
    )

    summary = ai_result.get("summary") if ai_result else f"Your health score is {score}/100 ({risk} risk). {len(issues)} areas need attention."
    recommendations = ai_result.get("recommendations") if ai_result else _default_recommendations(insights)

    response = HealthReportResponse(
        score=score,
        risk_level=risk,
        bmi=bmi,
        insights=insights,
        recommendations=recommendations[:6],
        summary=summary,
        created_at=datetime.now(),
    )

    # Save to DB
    response.report_id = _save_report(user_id, req, response)
    return response


def _calculate_insights(req: HealthReportRequest, bmi: float) -> List[HealthScoreInsight]:
    """Compute deterministic scores for each component (0-100)."""
    insights = []

    # Weight (BMI)
    if 18.5 <= bmi < 25:
        insights.append(HealthScoreInsight(category="weight", score=95, status="excellent", message=f"Your BMI of {bmi} is in the healthy range."))
    elif 25 <= bmi < 30:
        insights.append(HealthScoreInsight(category="weight", score=60, status="fair", message=f"Your BMI of {bmi} indicates overweight."))
    elif bmi >= 30:
        insights.append(HealthScoreInsight(category="weight", score=30, status="poor", message=f"Your BMI of {bmi} indicates obesity, which raises health risks."))
    else:
        insights.append(HealthScoreInsight(category="weight", score=55, status="fair", message=f"Your BMI of {bmi} indicates being underweight."))

    # Blood pressure
    sys, dia = req.systolic_bp, req.diastolic_bp or 80
    if sys < 120 and dia < 80:
        insights.append(HealthScoreInsight(category="blood_pressure", score=95, status="excellent", message="Your blood pressure is normal."))
    elif sys < 130 and dia < 80:
        insights.append(HealthScoreInsight(category="blood_pressure", score=75, status="good", message="Your blood pressure is slightly elevated."))
    elif sys < 140 or dia < 90:
        insights.append(HealthScoreInsight(category="blood_pressure", score=50, status="fair", message="Stage 1 high blood pressure detected."))
    else:
        insights.append(HealthScoreInsight(category="blood_pressure", score=25, status="poor", message=f"BP {sys}/{dia} is high — consult a doctor."))

    # Sugar
    if req.sugar_mgdl:
        if req.sugar_mgdl < 100:
            insights.append(HealthScoreInsight(category="blood_sugar", score=95, status="excellent", message="Blood sugar is in normal range."))
        elif req.sugar_mgdl < 126:
            insights.append(HealthScoreInsight(category="blood_sugar", score=55, status="fair", message="Blood sugar suggests pre-diabetes."))
        else:
            insights.append(HealthScoreInsight(category="blood_sugar", score=25, status="poor", message=f"Blood sugar {req.sugar_mgdl} mg/dL is in diabetic range."))

    # Sleep
    if req.sleep_hours is not None:
        if 7 <= req.sleep_hours <= 9:
            insights.append(HealthScoreInsight(category="sleep", score=95, status="excellent", message=f"Sleeping {req.sleep_hours}h is ideal."))
        elif 6 <= req.sleep_hours < 7 or 9 < req.sleep_hours <= 10:
            insights.append(HealthScoreInsight(category="sleep", score=70, status="good", message=f"Sleeping {req.sleep_hours}h is acceptable."))
        else:
            insights.append(HealthScoreInsight(category="sleep", score=40, status="poor", message=f"Sleeping {req.sleep_hours}h is suboptimal."))

    # Hydration
    if req.water_glasses is not None:
        if req.water_glasses >= 8:
            insights.append(HealthScoreInsight(category="hydration", score=95, status="excellent", message=f"{req.water_glasses} glasses/day is excellent."))
        elif req.water_glasses >= 5:
            insights.append(HealthScoreInsight(category="hydration", score=70, status="good", message=f"{req.water_glasses} glasses/day is okay — aim for 8."))
        else:
            insights.append(HealthScoreInsight(category="hydration", score=40, status="poor", message=f"Only {req.water_glasses} glasses/day is too low."))

    # Activity
    if req.exercise_days_per_week >= 5:
        insights.append(HealthScoreInsight(category="activity", score=95, status="excellent", message=f"{req.exercise_days_per_week} days/week is excellent."))
    elif req.exercise_days_per_week >= 3:
        insights.append(HealthScoreInsight(category="activity", score=75, status="good", message=f"{req.exercise_days_per_week} days/week is good."))
    elif req.exercise_days_per_week >= 1:
        insights.append(HealthScoreInsight(category="activity", score=50, status="fair", message=f"Only {req.exercise_days_per_week} day/week — aim for 3-5."))
    else:
        insights.append(HealthScoreInsight(category="activity", score=25, status="poor", message="No regular exercise detected."))

    return insights


def _default_recommendations(insights: List[HealthScoreInsight]) -> List[str]:
    recs = []
    for insight in insights:
        if insight.status == "poor":
            recs.append(f"Address {insight.category.replace('_', ' ')}: {insight.message}")
    if not recs:
        recs = ["Continue your current healthy habits", "Schedule annual check-ups with your doctor"]
    return recs


def _save_report(user_id: int, req: HealthReportRequest, response: HealthReportResponse) -> int:
    with db_cursor() as c:
        c.execute(
            """INSERT INTO health_reports (user_id, input_json, score, risk_level, bmi, response_json)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                req.model_dump_json(),
                response.score,
                response.risk_level,
                response.bmi,
                response.model_dump_json(),
            ),
        )
        return c.lastrowid


def get_user_reports(user_id: int, limit: int = 20) -> List[Dict]:
    with db_cursor() as c:
        c.execute(
            "SELECT id, score, risk_level, bmi, response_json, created_at FROM health_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit),
        )
        rows = c.fetchall()
        return [
            {
                "id": r["id"],
                "score": r["score"],
                "risk_level": r["risk_level"],
                "bmi": r["bmi"],
                "response": json.loads(r["response_json"]),
                "created_at": r["created_at"],
            }
            for r in rows
        ]
