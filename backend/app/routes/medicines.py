"""Medicine reminder routes."""
import json
from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.models.schemas import MedicineReminderRequest, MedicineReminderOut
from app.core.security import verify_token
from app.core.db import db_cursor

router = APIRouter(prefix="/api/medicines", tags=["medicines"])


@router.post("/reminder", response_model=MedicineReminderOut)
def create_reminder(req: MedicineReminderRequest, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute(
            """INSERT INTO medicine_reminders 
               (user_id, name, dosage, times_json, days_json, start_date, end_date, notes, active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)""",
            (user["id"], req.name, req.dosage, json.dumps(req.times), json.dumps(req.days_of_week),
             req.start_date, req.end_date, req.notes),
        )
        rid = c.lastrowid
        return MedicineReminderOut(
            id=rid, name=req.name, dosage=req.dosage or "",
            times=req.times, days_of_week=req.days_of_week,
            start_date=req.start_date, end_date=req.end_date,
            notes=req.notes or "", active=True,
        )


@router.get("/reminders", response_model=dict)
def list_reminders(user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute(
            "SELECT * FROM medicine_reminders WHERE user_id = ? AND active = 1 ORDER BY created_at DESC",
            (user["id"],),
        )
        rows = c.fetchall()
        return {
            "reminders": [
                {
                    "id": r["id"], "name": r["name"], "dosage": r["dosage"] or "",
                    "times": json.loads(r["times_json"]),
                    "days_of_week": json.loads(r["days_json"]),
                    "start_date": r["start_date"], "end_date": r["end_date"],
                    "notes": r["notes"] or "", "active": bool(r["active"]),
                }
                for r in rows
            ]
        }


@router.delete("/reminder/{reminder_id}", response_model=dict)
def delete_reminder(reminder_id: int, user: dict = Depends(verify_token)):
    with db_cursor() as c:
        c.execute("UPDATE medicine_reminders SET active = 0 WHERE id = ? AND user_id = ?",
                  (reminder_id, user["id"]))
        return {"success": True}
