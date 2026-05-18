"""
Rule-based symptom → condition mapping engine.
Deterministic, instant, works offline. AI enriches this.
"""
from typing import List, Dict


SYMPTOM_CONDITIONS: Dict[str, List[str]] = {
    "fever": ["viral infection", "flu", "COVID-19", "dengue", "malaria", "typhoid", "UTI"],
    "headache": ["tension headache", "migraine", "dehydration", "hypertension", "sinusitis", "eye strain"],
    "cough": ["common cold", "bronchitis", "asthma", "COVID-19", "GERD", "allergies", "pneumonia"],
    "sore throat": ["viral pharyngitis", "strep throat", "tonsillitis", "allergies", "GERD"],
    "fatigue": ["anemia", "vitamin D deficiency", "thyroid disorder", "diabetes", "poor sleep", "depression"],
    "body pain": ["viral infection", "flu", "fibromyalgia", "vitamin D deficiency", "dengue"],
    "nausea": ["gastritis", "food poisoning", "migraine", "pregnancy", "motion sickness", "anxiety"],
    "vomiting": ["food poisoning", "gastroenteritis", "appendicitis", "migraine", "pregnancy"],
    "diarrhea": ["food poisoning", "IBS", "gastroenteritis", "lactose intolerance", "infection"],
    "chest pain": ["GERD", "anxiety", "muscle strain", "angina", "pneumonia", "heart attack"],
    "shortness of breath": ["asthma", "anxiety", "anemia", "pneumonia", "heart issue", "COVID-19"],
    "dizziness": ["dehydration", "low BP", "anemia", "vertigo", "low blood sugar", "anxiety"],
    "rash": ["allergy", "eczema", "viral rash", "contact dermatitis", "fungal infection"],
    "stomach pain": ["gastritis", "IBS", "appendicitis", "UTI", "food poisoning", "gallstones"],
    "back pain": ["muscle strain", "poor posture", "kidney stone", "sciatica", "disc issue"],
    "runny nose": ["common cold", "allergies", "sinusitis", "flu"],
    "joint pain": ["arthritis", "gout", "viral infection", "vitamin D deficiency", "lupus"],
    "insomnia": ["anxiety", "stress", "sleep apnea", "caffeine excess", "depression"],
    "anxiety": ["generalized anxiety", "stress", "thyroid disorder", "caffeine excess"],
    "weight loss": ["thyroid disorder", "diabetes", "malnutrition", "depression", "cancer"],
    "hair loss": ["stress", "anemia", "thyroid disorder", "nutrient deficiency", "PCOS"],
    "frequent urination": ["UTI", "diabetes", "overactive bladder", "kidney issue", "pregnancy"],
}

# Red flag symptoms that always indicate urgent care
RED_FLAG_SYMPTOMS = {
    "chest pain": "Could indicate heart attack — especially with arm/jaw pain or shortness of breath",
    "shortness of breath": "Severe breathing difficulty needs immediate medical attention",
    "vomiting": "Persistent vomiting with severe abdominal pain may indicate appendicitis",
}


def find_conditions(symptoms: List[str], age: int, gender: str) -> List[Dict]:
    """
    Map symptoms to weighted conditions.
    Returns list of (condition, confidence) ranked by overlap.
    """
    symptoms_normalized = [s.lower().strip() for s in symptoms]
    condition_scores: Dict[str, int] = {}

    for symptom in symptoms_normalized:
        if symptom in SYMPTOM_CONDITIONS:
            for condition in SYMPTOM_CONDITIONS[symptom]:
                condition_scores[condition] = condition_scores.get(condition, 0) + 1

    # Sort by frequency (most overlap = highest confidence)
    sorted_conditions = sorted(condition_scores.items(), key=lambda x: x[1], reverse=True)

    results = []
    for condition, score in sorted_conditions[:5]:
        if score >= 3:
            confidence = "high"
        elif score >= 2:
            confidence = "moderate"
        else:
            confidence = "low"
        results.append({
            "name": condition,
            "confidence": confidence,
            "match_score": score,
        })

    return results


def calculate_severity(symptoms: List[str], duration_days: int, intensity: int) -> Dict:
    """
    Deterministic severity calculation.
    Returns: { level: 'Mild'|'Moderate'|'Severe', color: '#...', score: 0-100 }
    """
    symptoms_normalized = [s.lower().strip() for s in symptoms]
    severity_score = 0

    # Intensity (0-40 points)
    severity_score += intensity * 4

    # Duration (0-20 points)
    if duration_days >= 14:
        severity_score += 20
    elif duration_days >= 7:
        severity_score += 12
    elif duration_days >= 3:
        severity_score += 6

    # Number of symptoms (0-20 points)
    severity_score += min(20, len(symptoms) * 4)

    # Red flag symptoms (0-30 points)
    for sym in symptoms_normalized:
        if sym in RED_FLAG_SYMPTOMS:
            severity_score += 15

    severity_score = min(100, severity_score)

    if severity_score >= 70:
        return {"level": "Severe", "color": "#dc2626", "score": severity_score}
    elif severity_score >= 40:
        return {"level": "Moderate", "color": "#d97706", "score": severity_score}
    else:
        return {"level": "Mild", "color": "#16a34a", "score": severity_score}


def get_red_flags(symptoms: List[str]) -> List[str]:
    """Get list of red-flag warnings based on symptoms."""
    symptoms_normalized = [s.lower().strip() for s in symptoms]
    flags = []
    for sym in symptoms_normalized:
        if sym in RED_FLAG_SYMPTOMS:
            flags.append(RED_FLAG_SYMPTOMS[sym])
    return flags


def get_all_symptoms() -> List[str]:
    """Return all known symptoms for frontend dropdown."""
    return sorted(SYMPTOM_CONDITIONS.keys())
