"""
seed.py — populate the database with demo accounts.

Physician accounts are NOT created through the public signup flow.
They are pre-created here, simulating what a clinic admin would do
in a real system.

Run once:
    python seed.py

Safe to re-run — skips any email that already exists.
"""

from werkzeug.security import generate_password_hash
from models import get_db, init_db

PHYSICIANS = [
    {
        "email": "sarah.chen@medbook.dev",
        "password": "123123",
        "full_name": "Dr. Sarah Chen",
        "role": "physician",
        "specialty": "Family Medicine",
        "description": "General checkups, common concerns, preventive care, and ongoing health management.",
        "location": "MediBook Clinic · Room 204",
        "rating": 4.9,
        "slots": [
            ("2026-05-13", "May 13, 2026", "9:00 AM"),
            ("2026-05-13", "May 13, 2026", "11:00 AM"),
            ("2026-05-13", "May 13, 2026", "2:00 PM"),
            ("2026-05-14", "May 14, 2026", "10:30 AM"),
            ("2026-05-14", "May 14, 2026", "1:00 PM"),
            ("2026-05-14", "May 14, 2026", "3:30 PM"),
            ("2026-05-15", "May 15, 2026", "9:00 AM"),   
            ("2026-05-15", "May 15, 2026", "11:00 AM"),  
            ("2026-05-16", "May 16, 2026", "2:00 PM"),   
            ("2026-05-16", "May 16, 2026", "4:30 PM"),
            ("2026-05-17", "May 17, 2026", "9:00 AM"),
            ("2026-05-17", "May 17, 2026", "10:30 AM"),
            ("2026-05-18", "May 18, 2026", "1:00 PM"),
            ("2026-05-18", "May 18, 2026", "10:30 AM"),
            ("2026-05-19", "May 19, 2026", "12:30 PM"),
            ("2026-05-19", "May 19, 2026", "3:30 PM"),
            ("2026-05-20", "May 20, 2026", "9:00 AM"),
            ("2026-05-20", "May 20, 2026", "10:30 AM"),
            ("2026-05-21", "May 21, 2026", "1:00 PM"),
            ("2026-05-21", "May 21, 2026", "10:30 AM"),
            ("2026-05-22", "May 22, 2026", "12:30 PM"),
            ("2026-05-22", "May 22, 2026", "3:30 PM"),


        ],
    },
    {
        "email": "james.okafor@medbook.dev",
        "password": "123123",
        "full_name": "Dr. James Okafor",
        "role": "physician",
        "specialty": "Internal Medicine",
        "description": "Adult primary care, chronic condition management, and follow-up visits.",
        "location": "MediBook Clinic · Room 118",
        "rating": 4.8,
        "slots": [
            ("2026-05-13", "May 13, 2026", "9:00 AM"),
            ("2026-05-13", "May 13, 2026", "11:00 AM"),
            ("2026-05-13", "May 13, 2026", "2:00 PM"),
            ("2026-05-14", "May 14, 2026", "10:30 AM"),
            ("2026-05-14", "May 14, 2026", "1:00 PM"),
            ("2026-05-15", "May 15, 2026", "10:00 AM"),
            ("2026-05-15", "May 15, 2026", "11:30 AM"),
            ("2026-05-15", "May 15, 2026", "2:00 PM"),
            ("2026-05-15", "May 15, 2026", "4:00 PM"),
            ("2026-05-15", "May 15, 2026", "9:00 AM"),   
            ("2026-05-15", "May 15, 2026", "11:00 AM"),  
            ("2026-05-16", "May 16, 2026", "2:00 PM"),   
            ("2026-05-16", "May 16, 2026", "4:30 PM"),
             ("2026-05-14", "May 14, 2026", "2:00 PM"),
            ("2026-05-12", "May 12, 2026", "2:00 PM"),
            ("2026-05-13", "May 13, 2026", "4:30 PM"),
            ("2026-05-14", "May 14, 2026", "4:30 PM"),
            ("2026-05-17", "May 17, 2026", "9:00 AM"),
            ("2026-05-17", "May 17, 2026", "10:30 AM"),
            ("2026-05-18", "May 18, 2026", "1:00 PM"),
            ("2026-05-18", "May 18, 2026", "10:30 AM"),
            ("2026-05-19", "May 19, 2026", "12:30 PM"),
            ("2026-05-19", "May 19, 2026", "3:30 PM"),
            ("2026-05-20", "May 20, 2026", "9:00 AM"),
            ("2026-05-20", "May 20, 2026", "10:30 AM"),
            ("2026-05-21", "May 21, 2026", "1:00 PM"),
            ("2026-05-21", "May 21, 2026", "10:30 AM"),
            ("2026-05-22", "May 22, 2026", "12:30 PM"),
            ("2026-05-22", "May 22, 2026", "3:30 PM"),
        ],

     },
    {
        "email": "emily.wilson@medbook.dev",
        "password": "123123",
        "full_name": "Dr. Emily Wilson",
        "role": "physician",
        "specialty": "Pediatrics",
        "description": "Care for children, routine visits, minor illnesses, and parent consultations.",
        "location": "MediBook Clinic · Room 310",
        "rating": 4.9,
        "slots": [
            ("2026-05-16", "May 16, 2026", "8:30 AM"),
            ("2026-05-16", "May 16, 2026", "10:00 AM"),
            ("2026-05-16", "May 16, 2026", "2:30 PM"),
            ("2026-05-16", "May 16, 2026", "5:00 PM"),
            ("2026-05-15", "May 15, 2026", "9:00 AM"),   
            ("2026-05-15", "May 15, 2026", "11:00 AM"),  
            ("2026-05-14", "May 14, 2026", "2:00 PM"),
            ("2026-05-12", "May 12, 2026", "2:00 PM"),
            ("2026-05-13", "May 13, 2026", "4:30 PM"),
            ("2026-05-14", "May 14, 2026", "4:30 PM"),
            ("2026-05-17", "May 17, 2026", "9:00 AM"),
            ("2026-05-17", "May 17, 2026", "10:30 AM"),
            ("2026-05-18", "May 18, 2026", "1:00 PM"),
            ("2026-05-18", "May 18, 2026", "10:30 AM"),
            ("2026-05-19", "May 19, 2026", "12:30 PM"),
            ("2026-05-19", "May 19, 2026", "3:30 PM"),
            ("2026-05-20", "May 20, 2026", "9:00 AM"),
            ("2026-05-20", "May 20, 2026", "10:30 AM"),
            ("2026-05-21", "May 21, 2026", "1:00 PM"),
            ("2026-05-21", "May 21, 2026", "10:30 AM"),
            ("2026-05-22", "May 22, 2026", "12:30 PM"),
            ("2026-05-22", "May 22, 2026", "3:30 PM"),
        ],
    },
]

PATIENTS = [
    {
        "email": "patient@medbook.dev",
        "password": "patient123",
        "full_name": "Alex Rivera",
        "role": "patient",
    },
]


def seed():
    init_db()  # make sure tables exist first
    conn = get_db()
    cursor = conn.cursor()

    created = 0
    skipped = 0

    for user in PHYSICIANS + PATIENTS:
        existing = cursor.execute(
            "SELECT id FROM users WHERE email = ?", (user["email"],)
        ).fetchone()

        if existing:
            print(f"  skip   {user['email']}  (already exists)")
            skipped += 1
            continue

        cursor.execute(
            """
            INSERT INTO users (email, password_hash, role, full_name)
            VALUES (?, ?, ?, ?)
            """,
            (
                user["email"],
                generate_password_hash(user["password"]),
                user["role"],
                user["full_name"],
            ),
        )
        print(f"  create [{user['role']:>9}]  {user['email']}")
        created += 1

    # Create physician profiles and appointment slots
    for physician in PHYSICIANS:
        user_row = cursor.execute(
            "SELECT id FROM users WHERE email = ?",
            (physician["email"],),
        ).fetchone()

        if not user_row:
            continue

        user_id = user_row["id"]

        existing_profile = cursor.execute(
            "SELECT id FROM physician_profiles WHERE user_id = ?",
            (user_id,),
        ).fetchone()

        if existing_profile:
            physician_profile_id = existing_profile["id"]
            print(f"  skip   profile for {physician['email']}  (already exists)")
        else:
            cursor.execute(
                """
                INSERT INTO physician_profiles
                    (user_id, specialty, description, location, rating)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    physician["specialty"],
                    physician["description"],
                    physician["location"],
                    physician["rating"],
                ),
            )

            physician_profile_id = cursor.lastrowid
            print(f"  create profile for {physician['email']}")

        # Create appointment slots for this physician
        for date, display_date, time in physician["slots"]:
            existing_slot = cursor.execute(
                """
                SELECT id FROM appointment_slots
                WHERE physician_id = ? AND date = ? AND time = ?
                """,
                (physician_profile_id, date, time),
            ).fetchone()

            if existing_slot:
                print(f"  skip   slot {display_date} {time}")
                continue

            cursor.execute(
                """
                INSERT INTO appointment_slots
                    (physician_id, date, display_date, time, is_available)
                VALUES (?, ?, ?, ?, 1)
                """,
                (physician_profile_id, date, display_date, time),
            )

            print(f"  create slot {display_date} {time}")


    conn.commit()
    conn.close()
    print(f"\nDone — {created} created, {skipped} skipped.")


if __name__ == "__main__":
    seed()