"""
Conversational Symptom Chat — the CORE differentiator.
Transforms symptom checking from form → chat experience.

Stages:
  initial   → user describes symptom, AI asks follow-ups
  followup  → AI gathers duration, severity, related symptoms
  analysis  → AI delivers structured analysis
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import json

from app.core.security import verify_token
from app.core.usage_limiter import check_usage
from app.services import ai_service, symptom_engine, analysis_service
from app.models.schemas import SymptomRequest

router = APIRouter(prefix="/api/symptom", tags=["symptom-chat"])


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: List[ChatMessage] = []
    context: Optional[Dict] = None  # accumulated symptom data


class ChatResponse(BaseModel):
    reply: str
    stage: str  # "initial" | "followup" | "analysis"
    context: Dict  # accumulated data so far
    analysis: Optional[Dict] = None  # full analysis when stage=analysis
    suggestions: List[str] = []  # quick-reply suggestions


def _detect_stage(context: Dict) -> str:
    """Determine conversation stage from accumulated context."""
    symptoms = context.get("symptoms", [])
    has_duration = bool(context.get("duration"))
    has_severity = bool(context.get("severity"))
    has_age = bool(context.get("age"))

    if not symptoms:
        return "initial"
    if not has_duration or not has_severity:
        return "followup"
    if not has_age:
        return "followup"
    return "analysis"


def _extract_symptoms_from_text(text: str) -> List[str]:
    """Extract known symptoms from user's natural language input."""
    all_known = symptom_engine.get_all_symptoms()
    text_lower = text.lower()
    found = []
    for sym in all_known:
        if sym in text_lower:
            found.append(sym)
    # Also check common aliases
    aliases = {
        "headache": "headache", "head hurts": "headache", "head pain": "headache",
        "fever": "fever", "high temperature": "fever", "feeling hot": "fever",
        "cough": "cough", "coughing": "cough",
        "throat": "sore throat", "sore throat": "sore throat",
        "tired": "fatigue", "fatigue": "fatigue", "exhausted": "fatigue", "no energy": "fatigue",
        "body ache": "body pain", "body pain": "body pain", "muscle pain": "body pain",
        "nausea": "nausea", "feel sick": "nausea", "queasy": "nausea",
        "vomiting": "vomiting", "throwing up": "vomiting",
        "stomach": "stomach pain", "stomach pain": "stomach pain", "belly pain": "stomach pain",
        "diarrhea": "diarrhea", "loose motion": "diarrhea", "loose stool": "diarrhea",
        "dizzy": "dizziness", "dizziness": "dizziness", "lightheaded": "dizziness",
        "chest pain": "chest pain", "chest hurt": "chest pain",
        "rash": "rash", "skin rash": "rash", "itching": "rash",
        "runny nose": "runny nose", "stuffy nose": "runny nose", "blocked nose": "runny nose",
        "back pain": "back pain", "backache": "back pain",
        "joint pain": "joint pain", "joints hurt": "joint pain",
        "can't sleep": "insomnia", "insomnia": "insomnia",
        "anxious": "anxiety", "anxiety": "anxiety", "stressed": "anxiety", "worried": "anxiety",
    }
    for phrase, symptom in aliases.items():
        if phrase in text_lower and symptom not in found:
            found.append(symptom)
    return found


def _extract_duration(text: str) -> Optional[str]:
    """Try to extract duration from text."""
    text_lower = text.lower()
    import re
    # Match patterns like "2 days", "1 week", "since yesterday"
    patterns = [
        (r'(\d+)\s*day', lambda m: f"{m.group(1)} days"),
        (r'(\d+)\s*week', lambda m: f"{m.group(1)} weeks"),
        (r'(\d+)\s*hour', lambda m: f"{m.group(1)} hours"),
        (r'(\d+)\s*month', lambda m: f"{m.group(1)} months"),
        (r'since\s+yesterday', lambda m: "1 day"),
        (r'since\s+last\s+week', lambda m: "7 days"),
        (r'today|just\s+now|just\s+started', lambda m: "less than 1 day"),
        (r'few\s+days', lambda m: "3 days"),
        (r'a\s+week', lambda m: "7 days"),
    ]
    for pattern, extractor in patterns:
        match = re.search(pattern, text_lower)
        if match:
            return extractor(match)
    return None


def _extract_severity(text: str) -> Optional[str]:
    """Try to extract severity from text."""
    text_lower = text.lower()
    severe_words = ["very bad", "severe", "extreme", "unbearable", "worst", "10/10", "9/10", "8/10", "terrible", "excruciating"]
    moderate_words = ["moderate", "medium", "somewhat", "noticeable", "5/10", "6/10", "7/10", "kind of bad", "uncomfortable"]
    mild_words = ["mild", "slight", "a little", "not bad", "barely", "1/10", "2/10", "3/10", "4/10", "manageable", "okay"]

    for w in severe_words:
        if w in text_lower:
            return "severe"
    for w in moderate_words:
        if w in text_lower:
            return "moderate"
    for w in mild_words:
        if w in text_lower:
            return "mild"
    return None


def _extract_age(text: str) -> Optional[int]:
    """Try to extract age from text."""
    import re
    patterns = [
        r"i'?m\s+(\d{1,3})",
        r"i\s+am\s+(\d{1,3})",
        r"age\s+(?:is\s+)?(\d{1,3})",
        r"(\d{1,3})\s*(?:years?\s+old|yrs?\s+old|yo\b)",
        r"^(\d{1,3})$",
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower().strip())
        if match:
            age = int(match.group(1))
            if 1 <= age <= 120:
                return age
    return None


def _generate_followup(context: Dict) -> tuple:
    """Generate the next follow-up question and suggestions."""
    symptoms = context.get("symptoms", [])
    has_duration = bool(context.get("duration"))
    has_severity = bool(context.get("severity"))
    has_age = bool(context.get("age"))

    if not symptoms:
        return (
            "Hello! I'm your health assistant. Tell me what symptoms you're experiencing — for example, \"I have a headache and fever.\"",
            ["I have headache", "I have fever and cough", "My stomach hurts"],
        )

    sym_text = ", ".join(symptoms)

    if not has_duration:
        return (
            f"I understand you're experiencing **{sym_text}**. How long have you had these symptoms?",
            ["Since today", "2-3 days", "About a week", "More than a week"],
        )

    if not has_severity:
        return (
            f"Thank you. On a scale of mild to severe, how would you rate the intensity?",
            ["Mild", "Moderate", "Severe"],
        )

    if not has_age:
        return (
            "Almost done. What is your age? This helps me provide more accurate guidance.",
            ["18-25", "25-35", "35-50", "50+"],
        )

    return ("", [])


@router.post("/chat", response_model=ChatResponse)
def symptom_chat(req: ChatRequest, user: dict = Depends(verify_token)):
    """
    Conversational symptom analysis.
    Progressively gathers info, then delivers structured analysis.
    """
    context = req.context or {"symptoms": [], "duration": None, "severity": None, "age": None, "additional": ""}

    # Parse user message for data
    new_symptoms = _extract_symptoms_from_text(req.message)
    if new_symptoms:
        existing = context.get("symptoms", [])
        context["symptoms"] = list(set(existing + new_symptoms))

    duration = _extract_duration(req.message)
    if duration:
        context["duration"] = duration

    severity = _extract_severity(req.message)
    if severity:
        context["severity"] = severity

    age = _extract_age(req.message)
    if age:
        context["age"] = age

    # Append as additional context if nothing specific was extracted
    if not new_symptoms and not duration and not severity and not age:
        context["additional"] = (context.get("additional", "") + " " + req.message).strip()

    # Determine stage
    stage = _detect_stage(context)

    if stage == "analysis":
        # All data collected — run full analysis
        check_usage(user["id"], "symptom-analysis")

        duration_days = 1
        dur = context.get("duration", "")
        if "week" in dur:
            duration_days = 7
        elif "month" in dur:
            duration_days = 30
        elif "day" in dur:
            import re
            m = re.search(r"(\d+)", dur)
            duration_days = int(m.group(1)) if m else 1

        intensity_map = {"mild": 3, "moderate": 6, "severe": 9}
        intensity = intensity_map.get(context.get("severity", "moderate"), 5)

        analysis_req = SymptomRequest(
            symptoms=context["symptoms"],
            age=context.get("age", 30),
            gender="not_specified",
            duration_days=duration_days,
            intensity=intensity,
            additional_context=context.get("additional", ""),
        )
        result = analysis_service.analyze_symptoms(analysis_req, user["id"])

        # Format reply
        causes_text = "\n".join([f"• **{c.name}** ({c.confidence} confidence) — {c.explanation}" for c in result.causes[:4]])
        flags_text = "\n".join([f"⚠️ {f}" for f in result.red_flags]) if result.red_flags else ""

        reply = f"""Here's your analysis:

**Severity: {result.severity}**

**Possible causes:**
{causes_text}

**Advice:**
{result.advice}

**Recommended action:**
{result.recommended_action}
{f'''
**Warning signs to watch for:**
{flags_text}''' if flags_text else ''}

_This is not a medical diagnosis. Always consult a qualified healthcare professional._"""

        return ChatResponse(
            reply=reply,
            stage="analysis",
            context=context,
            analysis=result.model_dump(),
            suggestions=["Check new symptoms", "View health report", "Save to history"],
        )

    else:
        # Generate follow-up
        reply, suggestions = _generate_followup(context)
        return ChatResponse(
            reply=reply,
            stage=stage,
            context=context,
            suggestions=suggestions,
        )
