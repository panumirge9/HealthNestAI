"""
AI Service — wraps Groq LLM with structured output.
Handles: prompts, parsing, fallback.
"""
import os
import json
import re
from typing import Dict, List, Optional
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

_client = None


def get_client() -> Groq:
    """Lazy client initialization."""
    global _client
    if _client is None:
        if not GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not set")
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


def _call_ai_json(system: str, prompt: str, max_tokens: int = 700, temperature: float = 0.2) -> Optional[Dict]:
    """Call AI and parse JSON. Returns None if parsing fails."""
    try:
        client = get_client()
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no extra text."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        raw = completion.choices[0].message.content or ""

        # Strip markdown code fences if AI added them
        cleaned = re.sub(r"```json\s*", "", raw, flags=re.IGNORECASE)
        cleaned = re.sub(r"```\s*", "", cleaned)
        cleaned = cleaned.strip()

        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        print(f"[AI Service] JSON parse failed: {e}")
        return None
    except Exception as e:
        print(f"[AI Service] AI call failed: {e}")
        return None


def analyze_symptoms_ai(
    symptoms: List[str],
    age: int,
    gender: str,
    duration_days: int,
    intensity: int,
    rule_based_conditions: List[Dict],
    additional_context: str = "",
) -> Optional[Dict]:
    """
    Get AI structured analysis. Returns dict matching SymptomResponse shape.
    Falls back to None — caller handles default.
    """
    system = """You are a clinical health assessment system. You provide structured medical-grade wellness guidance — NOT diagnosis. Your tone is professional, measured, and evidence-based. 
You NEVER say "you have X disease" — say "this pattern may suggest X and warrants evaluation".
You output ONLY structured JSON. No prose, no markdown."""

    prompt = f"""PATIENT PRESENTATION:
- Symptoms: {', '.join(symptoms)}
- Age: {age}
- Gender: {gender}
- Duration: {duration_days} day(s)
- Self-rated intensity: {intensity}/10
{f'- Context: {additional_context}' if additional_context else ''}

Rule-based candidate conditions (for reference): {', '.join(c['name'] for c in rule_based_conditions[:5])}

Return JSON with EXACT keys:
{{
  "severity": "Mild" | "Moderate" | "Severe",
  "causes": [
    {{"name": "condition name", "confidence": "high|moderate|low", "explanation": "one sentence why this is likely"}}
  ],
  "advice": "2-3 sentence advice in calm clinical tone — what to do at home in the next 24-48 hours",
  "recommended_action": "ONE clear action sentence — e.g. 'Rest and monitor; see a doctor if fever persists beyond 3 days.'",
  "red_flags": ["specific symptom or change that means seek immediate care"]
}}

Return 3-5 causes ranked by confidence. Keep total under 350 words."""

    return _call_ai_json(system, prompt, max_tokens=700, temperature=0.2)


def generate_health_report_ai(
    age: int,
    gender: str,
    bmi: float,
    systolic_bp: int,
    diastolic_bp: int,
    sugar_mgdl: Optional[float],
    sleep_hours: Optional[float],
    water_glasses: Optional[int],
    exercise_days: int,
    smoking: bool,
    issues: List[str],
    score: int,
) -> Optional[Dict]:
    """Generate structured health report."""
    system = "You are a clinical health reporting system. Generate professional, evidence-based health summaries in structured JSON. Never diagnose."

    prompt = f"""PATIENT VITALS:
Age: {age}, Gender: {gender}
BMI: {bmi}
BP: {systolic_bp}/{diastolic_bp} mmHg
Glucose: {sugar_mgdl or 'not provided'} mg/dL
Sleep: {sleep_hours or 'not specified'} hours/night
Water: {water_glasses or 'not specified'} glasses/day
Exercise: {exercise_days} days/week
Smoking: {'Yes' if smoking else 'No'}
Score: {score}/100
Issues: {', '.join(issues) or 'none'}

Return JSON:
{{
  "summary": "3-4 sentence overall assessment",
  "recommendations": ["specific action 1", "action 2", "action 3", "action 4"]
}}

Keep under 200 words. Tone: professional, encouraging."""

    return _call_ai_json(system, prompt, max_tokens=500, temperature=0.3)
