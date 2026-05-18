"""
Phase 2 routes — Health Goals, Medical History, Lab Results,
Insurance, Reminders, Emergency Profile, Medication Inventory, Export
"""
import json, csv, io
from datetime import date, datetime
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.core.security import verify_token
from app.core.db import db_cursor
from app.models.schemas import (
    GoalCreateRequest, GoalLogRequest,
    MedicalHistoryRequest, LabResultRequest,
    InsuranceRequest, InsuranceClaimRequest,
    ReminderRequest, EmergencyProfileRequest, MedInventoryRequest,
)
from app.services import ai_service

router = APIRouter(prefix="/api/v2", tags=["phase2"])


# ═══════════════════════════════════════════
# HEALTH GOALS
# ═══════════════════════════════════════════
@router.post("/goals", response_model=dict)
def create_goal(req: GoalCreateRequest, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("""INSERT INTO health_goals
            (user_id, category, title, target_value, current_value, unit, start_date, target_date)
            VALUES (?,?,?,?,?,?,?,?)""",
            (user["id"], req.category, req.title, req.target_value,
             req.current_value, req.unit, req.start_date, req.target_date))
        return {"success": True, "id": c.lastrowid}


@router.get("/goals", response_model=dict)
def list_goals(user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("SELECT * FROM health_goals WHERE user_id=? AND active=1 ORDER BY created_at DESC", (user["id"],))
        rows = c.fetchall()
        goals = []
        for r in rows:
            pct = min(100, round((r["current_value"] / max(1, r["target_value"])) * 100, 1))
            goals.append({
                "id": r["id"], "category": r["category"], "title": r["title"],
                "target_value": r["target_value"], "current_value": r["current_value"],
                "unit": r["unit"], "start_date": r["start_date"], "target_date": r["target_date"],
                "streak_days": r["streak_days"], "progress_pct": pct,
                "active": bool(r["active"]), "created_at": r["created_at"],
            })
        return {"goals": goals}


@router.post("/goals/{goal_id}/log", response_model=dict)
def log_goal(goal_id: int, req: GoalLogRequest, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("SELECT * FROM health_goals WHERE id=? AND user_id=?", (goal_id, user["id"]))
        goal = c.fetchone()
        if not goal:
            from fastapi import HTTPException
            raise HTTPException(404, detail={"error": True, "message": "Goal not found"})

        # Insert log
        c.execute("INSERT INTO goal_logs (goal_id, user_id, value, logged_date, note) VALUES (?,?,?,?,?)",
                  (goal_id, user["id"], req.value, req.logged_date, req.note))

        # Update current value
        c.execute("UPDATE health_goals SET current_value=?, last_logged=? WHERE id=?",
                  (req.value, req.logged_date, goal_id))

        # Update streak
        today = date.today().isoformat()
        yesterday = date.fromordinal(date.today().toordinal() - 1).isoformat()
        last = goal["last_logged"]
        new_streak = goal["streak_days"]
        if last == yesterday:
            new_streak += 1
        elif last != today:
            new_streak = 1
        c.execute("UPDATE health_goals SET streak_days=? WHERE id=?", (new_streak, goal_id))

        return {"success": True, "streak_days": new_streak}


@router.delete("/goals/{goal_id}", response_model=dict)
def delete_goal(goal_id: int, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("UPDATE health_goals SET active=0 WHERE id=? AND user_id=?", (goal_id, user["id"]))
        return {"success": True}


# ═══════════════════════════════════════════
# MEDICAL HISTORY
# ═══════════════════════════════════════════
@router.post("/medical-history", response_model=dict)
def add_medical_record(req: MedicalHistoryRequest, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("""INSERT INTO medical_history
            (user_id, category, title, description, date_occurred, doctor, hospital, severity, resolved)
            VALUES (?,?,?,?,?,?,?,?,?)""",
            (user["id"], req.category, req.title, req.description, req.date_occurred,
             req.doctor, req.hospital, req.severity, int(req.resolved)))
        return {"success": True, "id": c.lastrowid}


@router.get("/medical-history", response_model=dict)
def list_medical_history(user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("SELECT * FROM medical_history WHERE user_id=? ORDER BY date_occurred DESC", (user["id"],))
        rows = c.fetchall()
        records = [dict(r) for r in rows]
        for r in records:
            r["resolved"] = bool(r["resolved"])
        return {"records": records}


@router.delete("/medical-history/{record_id}", response_model=dict)
def delete_medical_record(record_id: int, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("DELETE FROM medical_history WHERE id=? AND user_id=?", (record_id, user["id"]))
        return {"success": True}


# ═══════════════════════════════════════════
# LAB RESULTS
# ═══════════════════════════════════════════
@router.post("/lab-results", response_model=dict)
def add_lab_result(req: LabResultRequest, user: dict = Depends(verify_token)):
    # Classify each test item
    results_with_status = []
    abnormal_items = []
    for item in req.results:
        status = "normal"
        if item.normal_min is not None and item.value < item.normal_min:
            status = "low"; abnormal_items.append(f"{item.name} is LOW ({item.value} {item.unit})")
        elif item.normal_max is not None and item.value > item.normal_max:
            status = "high"; abnormal_items.append(f"{item.name} is HIGH ({item.value} {item.unit})")
        results_with_status.append({**item.model_dump(), "status": status})

    overall = "abnormal" if abnormal_items else "normal"

    # AI summary
    ai_summary = None
    try:
        system = "You are a medical report interpreter. Explain lab results in simple, plain language for a patient. Never diagnose."
        prompt = f"Lab test: {req.test_name}\nDate: {req.test_date}\nResults: {json.dumps(results_with_status)}\n\nProvide a 2-3 sentence patient-friendly summary. Mention any abnormal values clearly."
        ai_data = ai_service._call_ai_json(system, prompt, max_tokens=300)
        if ai_data and isinstance(ai_data, dict):
            ai_summary = ai_data.get("summary") or str(ai_data)
        elif isinstance(ai_data, str):
            ai_summary = ai_data
    except:
        ai_summary = ('All values within normal range.' if not abnormal_items else f"Abnormal values found: {', '.join(abnormal_items[:3])}. Please consult your doctor.")

    with db_cursor() as c:
        c.execute("""INSERT INTO lab_results
            (user_id, test_name, test_date, lab_name, results_json, ai_summary, overall_status)
            VALUES (?,?,?,?,?,?,?)""",
            (user["id"], req.test_name, req.test_date, req.lab_name,
             json.dumps(results_with_status), ai_summary, overall))
        return {"success": True, "id": c.lastrowid, "overall_status": overall, "ai_summary": ai_summary}


@router.get("/lab-results", response_model=dict)
def list_lab_results(user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("SELECT * FROM lab_results WHERE user_id=? ORDER BY test_date DESC", (user["id"],))
        rows = c.fetchall()
        return {"results": [
            {**dict(r), "results": json.loads(r["results_json"])} for r in rows
        ]}


@router.delete("/lab-results/{result_id}", response_model=dict)
def delete_lab_result(result_id: int, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("DELETE FROM lab_results WHERE id=? AND user_id=?", (result_id, user["id"]))
        return {"success": True}


# ═══════════════════════════════════════════
# INSURANCE
# ═══════════════════════════════════════════
@router.post("/insurance", response_model=dict)
def add_insurance(req: InsuranceRequest, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("""INSERT INTO insurance
            (user_id, provider, plan_name, policy_number, deductible, copay, out_of_pocket_max, expiry_date)
            VALUES (?,?,?,?,?,?,?,?)""",
            (user["id"], req.provider, req.plan_name, req.policy_number,
             req.deductible, req.copay, req.out_of_pocket_max, req.expiry_date))
        return {"success": True, "id": c.lastrowid}


@router.get("/insurance", response_model=dict)
def get_insurance(user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("SELECT * FROM insurance WHERE user_id=? AND active=1 ORDER BY created_at DESC LIMIT 1", (user["id"],))
        ins = c.fetchone()
        if not ins:
            return {"insurance": None, "claims": [], "summary": None}

        c.execute("SELECT * FROM insurance_claims WHERE insurance_id=? ORDER BY date DESC", (ins["id"],))
        claims = [dict(r) for r in c.fetchall()]

        total_billed = sum(cl["amount_billed"] for cl in claims)
        total_covered = sum(cl["amount_covered"] for cl in claims)
        summary = {
            "deductible_pct": round(min(100, (ins["deductible_met"] / max(1, ins["deductible"])) * 100), 1),
            "oop_pct": round(min(100, (ins["out_of_pocket_met"] / max(1, ins["out_of_pocket_max"])) * 100), 1) if ins["out_of_pocket_max"] else 0,
            "total_billed": total_billed,
            "total_covered": total_covered,
            "out_of_pocket": total_billed - total_covered,
        }
        return {"insurance": dict(ins), "claims": claims, "summary": summary}


@router.post("/insurance/{insurance_id}/claims", response_model=dict)
def add_claim(insurance_id: int, req: InsuranceClaimRequest, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("INSERT INTO insurance_claims (insurance_id, user_id, description, date, amount_billed, amount_covered, status) VALUES (?,?,?,?,?,?,?)",
                  (insurance_id, user["id"], req.description, req.date, req.amount_billed, req.amount_covered, req.status))
        # Update totals on insurance row
        c.execute("UPDATE insurance SET total_billed=total_billed+?, total_covered=total_covered+?, deductible_met=MIN(deductible, deductible_met+?) WHERE id=?",
                  (req.amount_billed, req.amount_covered, req.amount_billed - req.amount_covered, insurance_id))
        return {"success": True, "id": c.lastrowid}


# ═══════════════════════════════════════════
# REMINDERS
# ═══════════════════════════════════════════
@router.post("/reminders", response_model=dict)
def create_reminder(req: ReminderRequest, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("INSERT INTO reminders (user_id, title, type, due_datetime, notes, repeat_type) VALUES (?,?,?,?,?,?)",
                  (user["id"], req.title, req.type, req.due_datetime, req.notes, req.repeat_type))
        return {"success": True, "id": c.lastrowid}


@router.get("/reminders", response_model=dict)
def list_reminders(user: dict = Depends(verify_token)):
    now = datetime.now().isoformat()
    with db_cursor() as c:
        # Auto-mark overdue
        c.execute("UPDATE reminders SET status='overdue' WHERE user_id=? AND status='pending' AND due_datetime < ?",
                  (user["id"], now))
        c.execute("SELECT * FROM reminders WHERE user_id=? ORDER BY due_datetime ASC", (user["id"],))
        rows = c.fetchall()
        by_status = {"pending": [], "overdue": [], "completed": []}
        for r in rows:
            s = r["status"]
            if s in by_status:
                by_status[s].append(dict(r))
        return by_status


@router.patch("/reminders/{reminder_id}/complete", response_model=dict)
def complete_reminder(reminder_id: int, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("UPDATE reminders SET status='completed' WHERE id=? AND user_id=?", (reminder_id, user["id"]))
        return {"success": True}


@router.delete("/reminders/{reminder_id}", response_model=dict)
def delete_reminder(reminder_id: int, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("DELETE FROM reminders WHERE id=? AND user_id=?", (reminder_id, user["id"]))
        return {"success": True}


# ═══════════════════════════════════════════
# EMERGENCY PROFILE
# ═══════════════════════════════════════════
@router.put("/emergency-profile", response_model=dict)
def upsert_emergency_profile(req: EmergencyProfileRequest, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("""INSERT INTO emergency_profiles
            (user_id, blood_type, allergies_json, conditions_json, medications_json, emergency_contacts_json, organ_donor, advance_directive, notes, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
            blood_type=excluded.blood_type, allergies_json=excluded.allergies_json,
            conditions_json=excluded.conditions_json, medications_json=excluded.medications_json,
            emergency_contacts_json=excluded.emergency_contacts_json,
            organ_donor=excluded.organ_donor, advance_directive=excluded.advance_directive,
            notes=excluded.notes, updated_at=CURRENT_TIMESTAMP""",
            (user["id"], req.blood_type, json.dumps(req.allergies), json.dumps(req.conditions),
             json.dumps(req.medications), json.dumps([c.model_dump() for c in req.emergency_contacts]),
             int(req.organ_donor), req.advance_directive, req.notes))
        return {"success": True}


@router.get("/emergency-profile", response_model=dict)
def get_emergency_profile(user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("SELECT * FROM emergency_profiles WHERE user_id=?", (user["id"],))
        row = c.fetchone()
        if not row:
            return {"profile": None}
        d = dict(row)
        for key in ["allergies_json", "conditions_json", "medications_json", "emergency_contacts_json"]:
            short = key.replace("_json", "")
            d[short] = json.loads(d.pop(key, "[]") or "[]")
        d["organ_donor"] = bool(d["organ_donor"])
        return {"profile": d}


# ═══════════════════════════════════════════
# MEDICATION INVENTORY
# ═══════════════════════════════════════════
@router.post("/medication-inventory", response_model=dict)
def add_medication(req: MedInventoryRequest, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("""INSERT INTO medication_inventory
            (user_id, name, dosage, quantity, low_stock_threshold, expiry_date, refill_reminder_days, notes)
            VALUES (?,?,?,?,?,?,?,?)""",
            (user["id"], req.name, req.dosage, req.quantity, req.low_stock_threshold,
             req.expiry_date, req.refill_reminder_days, req.notes))
        return {"success": True, "id": c.lastrowid}


@router.get("/medication-inventory", response_model=dict)
def list_medications(user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("SELECT * FROM medication_inventory WHERE user_id=? AND active=1 ORDER BY name", (user["id"],))
        rows = c.fetchall()
        today = date.today().isoformat()
        meds = []
        for r in rows:
            d = dict(r)
            d["low_stock"] = r["quantity"] <= r["low_stock_threshold"]
            d["expired"] = bool(r["expiry_date"] and r["expiry_date"] < today)
            d["expiring_soon"] = bool(
                r["expiry_date"] and not d["expired"] and
                r["expiry_date"] <= date.fromordinal(date.today().toordinal() + 30).isoformat()
            )
            meds.append(d)
        alerts = [m for m in meds if m["low_stock"] or m["expired"] or m["expiring_soon"]]
        return {"medications": meds, "alerts": alerts}


@router.patch("/medication-inventory/{med_id}/restock", response_model=dict)
def restock_medication(med_id: int, quantity: int, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("UPDATE medication_inventory SET quantity=quantity+? WHERE id=? AND user_id=?",
                  (quantity, med_id, user["id"]))
        return {"success": True}


@router.delete("/medication-inventory/{med_id}", response_model=dict)
def delete_medication(med_id: int, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("UPDATE medication_inventory SET active=0 WHERE id=? AND user_id=?", (med_id, user["id"]))
        return {"success": True}


# ═══════════════════════════════════════════
# EXPORT DATA
# ═══════════════════════════════════════════
@router.get("/export")
def export_data(modules: str = "all", user: dict = Depends(verify_token)):
    """Export user data as CSV. modules = comma-separated list or 'all'"""
    uid = user["id"]
    selected = modules.split(",") if modules != "all" else ["symptoms", "health_reports", "goals", "medical_history", "lab_results", "medications", "reminders"]

    output = io.StringIO()
    writer = csv.writer(output)

    with db_cursor() as c:
        if "symptoms" in selected:
            writer.writerow(["=== SYMPTOM ANALYSES ==="])
            writer.writerow(["Date", "Symptoms", "Severity", "Age", "Duration Days"])
            c.execute("SELECT created_at, symptoms_json, severity, age, duration_days FROM symptom_analyses WHERE user_id=? ORDER BY created_at DESC", (uid,))
            for r in c.fetchall():
                writer.writerow([r["created_at"], ", ".join(json.loads(r["symptoms_json"])), r["severity"], r["age"], r["duration_days"]])
            writer.writerow([])

        if "health_reports" in selected:
            writer.writerow(["=== HEALTH REPORTS ==="])
            writer.writerow(["Date", "Score", "Risk Level", "BMI"])
            c.execute("SELECT created_at, score, risk_level, bmi FROM health_reports WHERE user_id=? ORDER BY created_at DESC", (uid,))
            for r in c.fetchall():
                writer.writerow([r["created_at"], r["score"], r["risk_level"], r["bmi"]])
            writer.writerow([])

        if "goals" in selected:
            writer.writerow(["=== HEALTH GOALS ==="])
            writer.writerow(["Title", "Category", "Target", "Current", "Unit", "Streak"])
            c.execute("SELECT title, category, target_value, current_value, unit, streak_days FROM health_goals WHERE user_id=?", (uid,))
            for r in c.fetchall():
                writer.writerow(list(r))
            writer.writerow([])

        if "medical_history" in selected:
            writer.writerow(["=== MEDICAL HISTORY ==="])
            writer.writerow(["Date", "Category", "Title", "Doctor", "Severity"])
            c.execute("SELECT date_occurred, category, title, doctor, severity FROM medical_history WHERE user_id=? ORDER BY date_occurred DESC", (uid,))
            for r in c.fetchall():
                writer.writerow(list(r))
            writer.writerow([])

        if "lab_results" in selected:
            writer.writerow(["=== LAB RESULTS ==="])
            writer.writerow(["Date", "Test", "Overall Status", "Lab"])
            c.execute("SELECT test_date, test_name, overall_status, lab_name FROM lab_results WHERE user_id=? ORDER BY test_date DESC", (uid,))
            for r in c.fetchall():
                writer.writerow(list(r))
            writer.writerow([])

        if "medications" in selected:
            writer.writerow(["=== MEDICATION INVENTORY ==="])
            writer.writerow(["Name", "Dosage", "Quantity", "Expiry"])
            c.execute("SELECT name, dosage, quantity, expiry_date FROM medication_inventory WHERE user_id=? AND active=1", (uid,))
            for r in c.fetchall():
                writer.writerow(list(r))
            writer.writerow([])

        if "reminders" in selected:
            writer.writerow(["=== REMINDERS ==="])
            writer.writerow(["Title", "Type", "Due", "Status"])
            c.execute("SELECT title, type, due_datetime, status FROM reminders WHERE user_id=? ORDER BY due_datetime", (uid,))
            for r in c.fetchall():
                writer.writerow(list(r))

    output.seek(0)
    filename = f"healthnest_export_{date.today().isoformat()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
