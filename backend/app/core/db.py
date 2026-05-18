"""
SQLite database — production-ready with WAL mode.
"""
import sqlite3
import os
from contextlib import contextmanager
from pathlib import Path

DB_PATH = os.getenv("DB_PATH", str(Path(__file__).parent.parent.parent / "data" / "healthnest.db"))
Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)


def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def db_cursor():
    """Context manager — auto commit/rollback."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initialize all tables."""
    with db_cursor() as c:
        c.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                age INTEGER,
                gender TEXT,
                blood_group TEXT,
                allergies TEXT,
                existing_conditions TEXT,
                plan TEXT DEFAULT 'free',
                plan_expires TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME
            );

            CREATE TABLE IF NOT EXISTS symptom_analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                symptoms_json TEXT NOT NULL,
                age INTEGER NOT NULL,
                gender TEXT,
                duration_days INTEGER NOT NULL,
                intensity INTEGER NOT NULL,
                severity TEXT NOT NULL,
                response_json TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS health_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                input_json TEXT NOT NULL,
                score INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                bmi REAL,
                response_json TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS medicine_reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                dosage TEXT,
                times_json TEXT NOT NULL,
                days_json TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT,
                notes TEXT,
                active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS usage_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                feature TEXT NOT NULL,
                used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_symptoms_user ON symptom_analyses(user_id);
            CREATE INDEX IF NOT EXISTS idx_reports_user ON health_reports(user_id);
            CREATE INDEX IF NOT EXISTS idx_reminders_user ON medicine_reminders(user_id);
            CREATE INDEX IF NOT EXISTS idx_usage_user_feature ON usage_logs(user_id, feature, used_at);
        """)
    print(f"[DB] Initialized at {DB_PATH}")


def extend_db():
    """Add Phase 2 tables — health goals, medical history, lab results, insurance, emergency card."""
    with db_cursor() as c:
        c.executescript("""
            -- Health Goals
            CREATE TABLE IF NOT EXISTS health_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                category TEXT NOT NULL,   -- weight|steps|sleep|hydration|custom
                title TEXT NOT NULL,
                target_value REAL NOT NULL,
                current_value REAL DEFAULT 0,
                unit TEXT NOT NULL,
                start_date TEXT NOT NULL,
                target_date TEXT,
                streak_days INTEGER DEFAULT 0,
                last_logged TEXT,
                active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Goal daily logs
            CREATE TABLE IF NOT EXISTS goal_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                value REAL NOT NULL,
                logged_date TEXT NOT NULL,
                note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (goal_id) REFERENCES health_goals(id) ON DELETE CASCADE
            );

            -- Medical History
            CREATE TABLE IF NOT EXISTS medical_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                category TEXT NOT NULL,  -- surgery|condition|vaccination|allergy|hospitalization
                title TEXT NOT NULL,
                description TEXT,
                date_occurred TEXT NOT NULL,
                doctor TEXT,
                hospital TEXT,
                documents_json TEXT,
                severity TEXT,           -- mild|moderate|severe
                resolved INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Lab Results
            CREATE TABLE IF NOT EXISTS lab_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                test_name TEXT NOT NULL,
                test_date TEXT NOT NULL,
                lab_name TEXT,
                results_json TEXT NOT NULL, -- [{name, value, unit, normal_min, normal_max, status}]
                ai_summary TEXT,
                overall_status TEXT,        -- normal|borderline|abnormal
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Insurance
            CREATE TABLE IF NOT EXISTS insurance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                provider TEXT NOT NULL,
                plan_name TEXT,
                policy_number TEXT,
                deductible REAL DEFAULT 0,
                deductible_met REAL DEFAULT 0,
                copay REAL DEFAULT 0,
                out_of_pocket_max REAL DEFAULT 0,
                out_of_pocket_met REAL DEFAULT 0,
                total_billed REAL DEFAULT 0,
                total_covered REAL DEFAULT 0,
                expiry_date TEXT,
                active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Insurance claims
            CREATE TABLE IF NOT EXISTS insurance_claims (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                insurance_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                description TEXT NOT NULL,
                date TEXT NOT NULL,
                amount_billed REAL DEFAULT 0,
                amount_covered REAL DEFAULT 0,
                status TEXT DEFAULT 'pending', -- pending|approved|denied|processing
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (insurance_id) REFERENCES insurance(id) ON DELETE CASCADE
            );

            -- Appointments / Reminders
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                type TEXT NOT NULL,       -- medicine|appointment|checkup|custom
                due_datetime TEXT NOT NULL,
                notes TEXT,
                repeat_type TEXT,         -- none|daily|weekly|monthly
                status TEXT DEFAULT 'pending', -- pending|completed|overdue
                related_id INTEGER,       -- medicine_id or other
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Emergency profile
            CREATE TABLE IF NOT EXISTS emergency_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                blood_type TEXT,
                allergies_json TEXT DEFAULT '[]',
                conditions_json TEXT DEFAULT '[]',
                medications_json TEXT DEFAULT '[]',
                emergency_contacts_json TEXT DEFAULT '[]',
                organ_donor INTEGER DEFAULT 0,
                advance_directive TEXT,
                notes TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Medication Inventory (extends reminders)
            CREATE TABLE IF NOT EXISTS medication_inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                dosage TEXT,
                quantity INTEGER DEFAULT 0,
                low_stock_threshold INTEGER DEFAULT 5,
                expiry_date TEXT,
                refill_reminder_days INTEGER DEFAULT 7,
                notes TEXT,
                active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_goals_user ON health_goals(user_id);
            CREATE INDEX IF NOT EXISTS idx_medical_user ON medical_history(user_id);
            CREATE INDEX IF NOT EXISTS idx_labs_user ON lab_results(user_id);
            CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id, status);
        """)
    print("[DB] Phase 2 tables initialized")
