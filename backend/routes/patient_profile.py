from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import get_db

patient_profile_bp = Blueprint("patient_profile", __name__)


@patient_profile_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_patient_profile():
    user_id = int(get_jwt_identity())
    claims = get_jwt()

    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can access this profile."}), 403

    conn = get_db()

    user = conn.execute(
        """
        SELECT full_name, email
        FROM users
        WHERE id = ?
        """,
        (user_id,),
    ).fetchone()

    profile = conn.execute(
        """
        SELECT
            phone,
            date_of_birth,
            allergies,
            medications,
            medical_conditions,
            medical_notes,
            emergency_contact_name,
            emergency_contact_phone
        FROM patient_profiles
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchone()

    if not profile:
        conn.execute(
            """
            INSERT INTO patient_profiles
                (user_id, phone, date_of_birth, allergies, medications,
                 medical_conditions, medical_notes, emergency_contact_name,
                 emergency_contact_phone)
            VALUES (?, '', '', '', '', '', '', '', '')
            """,
            (user_id,),
        )
        conn.commit()

        profile = conn.execute(
            """
            SELECT
                phone,
                date_of_birth,
                allergies,
                medications,
                medical_conditions,
                medical_notes,
                emergency_contact_name,
                emergency_contact_phone
            FROM patient_profiles
            WHERE user_id = ?
            """,
            (user_id,),
        ).fetchone()

    conn.close()

    return jsonify({
        "full_name": user["full_name"],
        "email": user["email"],
        "phone": profile["phone"],
        "date_of_birth": profile["date_of_birth"],
        "allergies": profile["allergies"],
        "medications": profile["medications"],
        "medical_conditions": profile["medical_conditions"],
        "medical_notes": profile["medical_notes"],
        "emergency_contact_name": profile["emergency_contact_name"],
        "emergency_contact_phone": profile["emergency_contact_phone"],
    }), 200


@patient_profile_bp.route("/profile", methods=["PATCH"])
@jwt_required()
def update_patient_profile():
    user_id = int(get_jwt_identity())
    claims = get_jwt()

    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can update this profile."}), 403

    data = request.get_json(silent=True) or {}

    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip()
    phone = (data.get("phone") or "").strip()
    date_of_birth = (data.get("date_of_birth") or "").strip()
    allergies = (data.get("allergies") or "").strip()
    medications = (data.get("medications") or "").strip()
    medical_conditions = (data.get("medical_conditions") or "").strip()
    medical_notes = (data.get("medical_notes") or "").strip()
    emergency_contact_name = (data.get("emergency_contact_name") or "").strip()
    emergency_contact_phone = (data.get("emergency_contact_phone") or "").strip()

    if not full_name or not email:
        return jsonify({"error": "Full name and email are required."}), 422

    conn = get_db()

    conn.execute(
        """
        UPDATE users
        SET full_name = ?, email = ?
        WHERE id = ?
        """,
        (full_name, email, user_id),
    )

    existing_profile = conn.execute(
        "SELECT id FROM patient_profiles WHERE user_id = ?",
        (user_id,),
    ).fetchone()

    if existing_profile:
        conn.execute(
            """
            UPDATE patient_profiles
            SET phone = ?,
                date_of_birth = ?,
                allergies = ?,
                medications = ?,
                medical_conditions = ?,
                medical_notes = ?,
                emergency_contact_name = ?,
                emergency_contact_phone = ?
            WHERE user_id = ?
            """,
            (
                phone,
                date_of_birth,
                allergies,
                medications,
                medical_conditions,
                medical_notes,
                emergency_contact_name,
                emergency_contact_phone,
                user_id,
            ),
        )
    else:
        conn.execute(
            """
            INSERT INTO patient_profiles
                (user_id, phone, date_of_birth, allergies, medications,
                 medical_conditions, medical_notes, emergency_contact_name,
                 emergency_contact_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                phone,
                date_of_birth,
                allergies,
                medications,
                medical_conditions,
                medical_notes,
                emergency_contact_name,
                emergency_contact_phone,
            ),
        )

    conn.commit()
    conn.close()

    return jsonify({"message": "Profile updated successfully."}), 200