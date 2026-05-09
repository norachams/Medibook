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
    },
    {
        "email": "james.okafor@medbook.dev",
        "password": "123123",
        "full_name": "Dr. James Okafor",
        "role": "physician",
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

    conn.commit()
    conn.close()
    print(f"\nDone — {created} created, {skipped} skipped.")


if __name__ == "__main__":
    seed()