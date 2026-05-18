# HealthNestAI Backend (FastAPI)

## Run locally

```bash
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your GROQ_API_KEY

uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/api/docs

## Architecture

```
app/
├── main.py              FastAPI app entry
├── core/                Infrastructure
│   ├── db.py            SQLite + context manager
│   ├── security.py      JWT + bcrypt
│   └── usage_limiter.py Free-tier limits
├── models/
│   └── schemas.py       Pydantic — strict API contracts
├── services/            Business logic
│   ├── symptom_engine.py        Rule-based symptom matching
│   ├── ai_service.py             Groq LLM wrapper
│   ├── analysis_service.py       Rule + AI orchestration
│   └── health_report_service.py  Health scoring
└── routes/              HTTP endpoints
    ├── auth.py
    ├── symptoms.py      ⭐ THE CORE
    ├── health_report.py
    ├── medicines.py
    ├── profile.py
    └── plan.py
```
