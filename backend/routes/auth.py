from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash

from models import get_db

auth_bp = Blueprint("auth", __name__)


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------
# Public endpoint — anyone can create an account.
# Role is ALWAYS forced to "patient" here, regardless of what the client sends.
# Physician accounts are pre-created via seed.py and never through this route.
# ---------------------------------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    email     = (data.get("email") or "").strip().lower()
    password  = (data.get("password") or "").strip()
    full_name = (data.get("full_name") or "").strip()

    # --- validation -------------------------------------------------------
    errors = {}
    if not email:
        errors["email"] = "Email is required."
    if not password or len(password) < 6:
        errors["password"] = "Password must be at least 6 characters."
    if not full_name:
        errors["full_name"] = "Full name is required."
    if errors:
        return jsonify({"error": "Validation failed.", "fields": errors}), 422

    # --- insert -----------------------------------------------------------
    conn = get_db()
    try:
        conn.execute(
            """
            INSERT INTO users (email, password_hash, role, full_name)
            VALUES (?, ?, 'patient', ?)
            """,
            (email, generate_password_hash(password), full_name),
        )
        conn.commit()

        user = conn.execute(
            "SELECT id, email, role, full_name FROM users WHERE email = ?",
            (email,),
        ).fetchone()

    except Exception:
        # UNIQUE constraint on email will trigger this
        return jsonify({"error": "An account with that email already exists."}), 409
    finally:
        conn.close()

    token = create_access_token(identity=str(user["id"]), additional_claims={
        "email": user["email"],
        "role":  user["role"],
        "name":  user["full_name"],
    })

    return jsonify({
        "token": token,
        "user": {
            "id":    user["id"],
            "email": user["email"],
            "role":  user["role"],
            "name":  user["full_name"],
        },
    }), 201


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------
# Works for both patients and physicians.
# The role in the JWT comes from the database row — the client never controls it.
# ---------------------------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    email    = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    conn = get_db()
    user = conn.execute(
        "SELECT id, email, password_hash, role, full_name FROM users WHERE email = ?",
        (email,),
    ).fetchone()
    conn.close()

    # Deliberate vague error — don't reveal whether the email exists
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = create_access_token(identity=str(user["id"]), additional_claims={
        "email": user["email"],
        "role":  user["role"],
        "name":  user["full_name"],
    })

    return jsonify({
        "token": token,
        "user": {
            "id":    user["id"],
            "email": user["email"],
            "role":  user["role"],
            "name":  user["full_name"],
        },
    }), 200