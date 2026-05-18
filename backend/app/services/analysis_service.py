"""
Analysis Service — orchestrates rule-based + AI for symptom analysis.
This is the heart of HealthNestAI.
"""
import json
from typing import Dict, List
from datetime import datetime

from app.services import symptom_engine, ai_service
from app.core.db import db_cursor
from app.models.schemas import SymptomRequest, SymptomResponse


def analyze_symptoms(req: SymptomRequest, user_id: int) -> SymptomResponse:
    """
    Two-layer analysis:
    1. Rule engine for deterministic baseline (always works)
    2. AI for enrichment (better quality but optional)
    """
    # Layer 1: Rule-based (always succeeds)
    rule_conditions = symptom_engine.find_conditions(req.symptoms, req.age, req.gender)
    rule_severity = symptom_engine.calculate_severity(req.symptoms, req.duration_days, req.intensity)
    rule_red_flags = symptom_engine.get_red_flags(req.symptoms)

    # Layer 2: AI enrichment (may fail — we have fallback)
    ai_result = ai_service.analyze_symptoms_ai(
        symptoms=req.symptoms,
        age=req.age,
        gender=req.gender,
        duration_days=req.duration_days,
        intensity=req.intensity,
        rule_based_conditions=rule_conditions,
        additional_context=req.additional_context or "",
    )

    # Merge results — AI takes precedence, rules fallback
    if ai_result and "causes" in ai_result and len(ai_result["causes"]) > 0:
        # Use AI structured output
        severity = ai_result.get("severity", rule_severity["level"])
        severity_color = {"Mild": "#16a34a", "Moderate": "#d97706", "Severe": "#dc2626"}.get(severity, "#6b7280")
        causes = ai_result["causes"][:5]
        advice = ai_result.get("advice", _default_advice(severity, req.duration_days))
        recommended_action = ai_result.get("recommended_action", _default_action(severity))
        red_flags = ai_result.get("red_flags", []) + [f for f in rule_red_flags if f not in ai_result.get("red_flags", [])]
    else:
        # Fallback to rule-based only
        severity = rule_severity["level"]
        severity_color = rule_severity["color"]
        causes = [
            {
                "name": c["name"],
                "confidence": c["confidence"],
                "explanation": f"This condition commonly presents with {len([s for s in req.symptoms if s in symptom_engine.SYMPTOM_CONDITIONS and c['name'] in symptom_engine.SYMPTOM_CONDITIONS[s]])} of your reported symptoms.",
            }
            for c in rule_conditions[:5]
        ]
        advice = _default_advice(severity, req.duration_days)
        recommended_action = _default_action(severity)
        red_flags = rule_red_flags

    # Build response
    response = {
        "severity": severity,
        "severity_color": severity_color,
        "causes": causes,
        "advice": advice,
        "recommended_action": recommended_action,
        "red_flags": red_flags[:5],
        "disclaimer": "This is not a medical diagnosis. Always consult a qualified healthcare professional.",
    }

    # Save to DB
    analysis_id = _save_analysis(user_id, req, response)
    response["analysis_id"] = analysis_id
    response["created_at"] = datetime.now()

    return SymptomResponse(**response)


def _default_advice(severity: str, duration_days: int) -> str:
    if severity == "Severe":
        return "Your symptoms suggest you should seek medical evaluation soon. While waiting, stay hydrated, rest, and avoid strenuous activity."
    elif severity == "Moderate":
        return f"Your symptoms have persisted for {duration_days} day(s). Monitor closely, rest well, stay hydrated, and consider seeing a doctor if symptoms worsen or persist beyond 3 more days."
    else:
        return "Your symptoms appear mild. Rest, stay hydrated, and use appropriate over-the-counter remedies. Monitor for any worsening."


def _default_action(severity: str) -> str:
    if severity == "Severe":
        return "Consult a doctor within 24 hours, or visit the nearest emergency department if symptoms worsen."
    elif severity == "Moderate":
        return "Monitor for 2-3 days. See a doctor if there is no improvement or if symptoms worsen."
    else:
        return "Self-care at home should suffice. Consult a doctor only if symptoms persist beyond 5-7 days."


def _save_analysis(user_id: int, req: SymptomRequest, response: Dict) -> int:
    with db_cursor() as c:
        c.execute(
            """INSERT INTO symptom_analyses 
               (user_id, symptoms_json, age, gender, duration_days, intensity, severity, response_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                json.dumps(req.symptoms),
                req.age,
                req.gender,
                req.duration_days,
                req.intensity,
                response["severity"],
                json.dumps(response, default=str),
            ),
        )
        return c.lastrowid


def get_user_analyses(user_id: int, limit: int = 20) -> List[Dict]:
    """Get user's symptom analysis history."""
    with db_cursor() as c:
        c.execute(
            """SELECT id, symptoms_json, age, gender, duration_days, intensity, severity, response_json, created_at
               FROM symptom_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT ?""",
            (user_id, limit),
        )
        rows = c.fetchall()
        return [
            {
                "id": r["id"],
                "symptoms": json.loads(r["symptoms_json"]),
                "age": r["age"],
                "gender": r["gender"],
                "duration_days": r["duration_days"],
                "intensity": r["intensity"],
                "severity": r["severity"],
                "response": json.loads(r["response_json"]),
                "created_at": r["created_at"],
            }
            for r in rows
        ]
