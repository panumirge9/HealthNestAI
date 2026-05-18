"""
HealthNestAI — Pydantic models (strict API contracts)
All request/response schemas live here.
"""
from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Literal
from datetime import datetime


# ─── Auth ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)

    class Config:
        json_schema_extra = {
            "example": {"name": "Arjun Sharma", "email": "arjun@example.com", "password": "secret123"}
        }


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    plan: Literal["free", "pro"] = "free"
    created_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    token: str
    user: UserOut


# ─── Symptom Analysis (the CORE feature) ───────────────
class SymptomRequest(BaseModel):
    symptoms: List[str] = Field(..., min_items=1, max_items=15)
    age: int = Field(..., ge=1, le=120)
    gender: Literal["male", "female", "other", "not_specified"] = "not_specified"
    duration_days: int = Field(default=1, ge=1, le=365)
    intensity: int = Field(default=5, ge=1, le=10)
    additional_context: Optional[str] = Field(default="", max_length=500)

    @validator("symptoms")
    def normalize_symptoms(cls, v):
        return [s.strip().lower() for s in v if s.strip()]

    class Config:
        json_schema_extra = {
            "example": {
                "symptoms": ["fever", "headache", "fatigue"],
                "age": 28,
                "gender": "male",
                "duration_days": 3,
                "intensity": 6,
                "additional_context": "Started after a long day at work"
            }
        }


class PossibleCause(BaseModel):
    name: str
    confidence: Literal["high", "moderate", "low"]
    explanation: str


class SymptomResponse(BaseModel):
    """Strict structured response — no raw AI text exposed."""
    severity: Literal["Mild", "Moderate", "Severe"]
    severity_color: str  # "#16a34a" | "#d97706" | "#dc2626"
    causes: List[PossibleCause]
    advice: str
    recommended_action: str
    red_flags: List[str]
    disclaimer: str = "This is not a medical diagnosis. Always consult a qualified healthcare professional."
    analysis_id: Optional[int] = None
    created_at: Optional[datetime] = None


# ─── Health Report ─────────────────────────────────────
class HealthReportRequest(BaseModel):
    age: int = Field(..., ge=10, le=120)
    gender: Literal["male", "female", "other", "not_specified"] = "not_specified"
    weight_kg: float = Field(..., ge=20, le=300)
    height_cm: float = Field(..., ge=100, le=250)
    systolic_bp: int = Field(..., ge=60, le=260)
    diastolic_bp: Optional[int] = Field(default=80, ge=40, le=160)
    sugar_mgdl: Optional[float] = Field(default=None, ge=40, le=600)
    sleep_hours: Optional[float] = Field(default=None, ge=0, le=24)
    water_glasses: Optional[int] = Field(default=None, ge=0, le=20)
    exercise_days_per_week: int = Field(default=0, ge=0, le=7)
    smoking: bool = False


class HealthScoreInsight(BaseModel):
    category: Literal["sleep", "hydration", "activity", "weight", "blood_pressure", "blood_sugar"]
    score: int  # 0-100
    status: Literal["excellent", "good", "fair", "poor"]
    message: str


class HealthReportResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    risk_level: Literal["low", "moderate", "high", "critical"]
    bmi: float
    insights: List[HealthScoreInsight]
    recommendations: List[str]
    summary: str
    report_id: Optional[int] = None
    created_at: Optional[datetime] = None


# ─── Medicine Reminder ─────────────────────────────────
class MedicineReminderRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    dosage: Optional[str] = Field(default="", max_length=50)
    times: List[str] = Field(..., min_items=1, max_items=6)  # ["08:00", "20:00"]
    days_of_week: List[int] = Field(default=[0, 1, 2, 3, 4, 5, 6])
    start_date: str  # YYYY-MM-DD
    end_date: Optional[str] = None
    notes: Optional[str] = Field(default="", max_length=300)


class MedicineReminderOut(BaseModel):
    id: int
    name: str
    dosage: str
    times: List[str]
    days_of_week: List[int]
    start_date: str
    end_date: Optional[str] = None
    notes: str
    active: bool = True
    created_at: Optional[datetime] = None


# ─── Profile ───────────────────────────────────────────
class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    age: Optional[int] = Field(default=None, ge=10, le=120)
    gender: Optional[Literal["male", "female", "other", "not_specified"]] = None
    blood_group: Optional[Literal["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "unknown"]] = None
    allergies: Optional[str] = Field(default=None, max_length=500)
    existing_conditions: Optional[str] = Field(default=None, max_length=500)


class ProfileResponse(BaseModel):
    user: UserOut
    stats: dict = {}


# ─── Plan / Monetization ───────────────────────────────
class UsageStatus(BaseModel):
    plan: Literal["free", "pro"]
    features: dict  # { "symptom-analysis": { used, limit, remaining } }
    plan_expires: Optional[str] = None


class UpgradeRequest(BaseModel):
    plan_type: Literal["monthly", "yearly"]
    payment_id: Optional[str] = None  # Razorpay payment ID


# ─── Standard Error Response ───────────────────────────
class ErrorResponse(BaseModel):
    error: bool = True
    message: str
    code: str = "SERVER_ERROR"


# ─── Success Wrapper ───────────────────────────────────
class SuccessResponse(BaseModel):
    success: bool = True
    data: dict


# ─── Health Goals ──────────────────────────────────────
class GoalCreateRequest(BaseModel):
    category: Literal["weight", "steps", "sleep", "hydration", "custom"]
    title: str = Field(..., min_length=1, max_length=100)
    target_value: float
    current_value: float = 0
    unit: str = Field(..., max_length=20)
    start_date: str
    target_date: Optional[str] = None

class GoalLogRequest(BaseModel):
    value: float
    logged_date: str
    note: Optional[str] = None

class GoalOut(BaseModel):
    id: int
    category: str
    title: str
    target_value: float
    current_value: float
    unit: str
    start_date: str
    target_date: Optional[str] = None
    streak_days: int
    progress_pct: float
    active: bool
    created_at: Optional[datetime] = None


# ─── Medical History ───────────────────────────────────
class MedicalHistoryRequest(BaseModel):
    category: Literal["surgery", "condition", "vaccination", "allergy", "hospitalization"]
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default="", max_length=1000)
    date_occurred: str
    doctor: Optional[str] = Field(default="", max_length=100)
    hospital: Optional[str] = Field(default="", max_length=200)
    severity: Optional[Literal["mild", "moderate", "severe"]] = None
    resolved: bool = False

class MedicalHistoryOut(BaseModel):
    id: int
    category: str
    title: str
    description: Optional[str]
    date_occurred: str
    doctor: Optional[str]
    hospital: Optional[str]
    severity: Optional[str]
    resolved: bool
    created_at: Optional[datetime] = None


# ─── Lab Results ───────────────────────────────────────
class LabTestItem(BaseModel):
    name: str
    value: float
    unit: str
    normal_min: Optional[float] = None
    normal_max: Optional[float] = None

class LabResultRequest(BaseModel):
    test_name: str = Field(..., min_length=1, max_length=200)
    test_date: str
    lab_name: Optional[str] = Field(default="", max_length=200)
    results: List[LabTestItem]

class LabResultOut(BaseModel):
    id: int
    test_name: str
    test_date: str
    lab_name: Optional[str]
    results: List[dict]
    ai_summary: Optional[str]
    overall_status: str
    created_at: Optional[datetime] = None


# ─── Insurance ─────────────────────────────────────────
class InsuranceRequest(BaseModel):
    provider: str = Field(..., min_length=1, max_length=100)
    plan_name: Optional[str] = Field(default="", max_length=100)
    policy_number: Optional[str] = Field(default="", max_length=100)
    deductible: float = 0
    copay: float = 0
    out_of_pocket_max: float = 0
    expiry_date: Optional[str] = None

class InsuranceClaimRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=300)
    date: str
    amount_billed: float = 0
    amount_covered: float = 0
    status: Literal["pending", "approved", "denied", "processing"] = "pending"


# ─── Reminders ─────────────────────────────────────────
class ReminderRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    type: Literal["medicine", "appointment", "checkup", "custom"]
    due_datetime: str
    notes: Optional[str] = Field(default="", max_length=500)
    repeat_type: Optional[Literal["none", "daily", "weekly", "monthly"]] = "none"


# ─── Emergency Profile ─────────────────────────────────
class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str

class EmergencyProfileRequest(BaseModel):
    blood_type: Optional[str] = None
    allergies: List[str] = []
    conditions: List[str] = []
    medications: List[str] = []
    emergency_contacts: List[EmergencyContact] = []
    organ_donor: bool = False
    advance_directive: Optional[str] = None
    notes: Optional[str] = None


# ─── Medication Inventory ──────────────────────────────
class MedInventoryRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    dosage: Optional[str] = Field(default="", max_length=50)
    quantity: int = 0
    low_stock_threshold: int = 5
    expiry_date: Optional[str] = None
    refill_reminder_days: int = 7
    notes: Optional[str] = Field(default="", max_length=300)
