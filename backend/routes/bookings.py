from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import get_db
from datetime import datetime

bookings_bp = Blueprint("bookings", __name__)


# ---------------------------------------------------------------------------
# POST /api/bookings
# Patient submits a booking request — status starts as "pending"
# Requires: JWT token (patient only)
# ---------------------------------------------------------------------------
@bookings_bp.route("/", methods=["POST"])
@jwt_required()
def create_booking():
    # Pull the logged-in user's id and role from the JWT
    patient_id  = int(get_jwt_identity())
    claims      = get_jwt()

    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can create bookings."}), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    # Validate required fields
    physician_id   = data.get("physician_id")
    slot_id        = data.get("slot_id")
    patient_name   = (data.get("patient_name") or "").strip()
    patient_email  = (data.get("patient_email") or "").strip()
    patient_phone  = (data.get("patient_phone") or "").strip()
    reason         = (data.get("reason") or "").strip()

    if not all([physician_id, slot_id, patient_name, patient_email, reason]):
        return jsonify({"error": "Missing required fields."}), 422

    conn = get_db()

    # Confirm the slot exists and is still available
    slot = conn.execute(
        "SELECT * FROM appointment_slots WHERE id = ? AND physician_id = ? AND is_available = 1",
        (slot_id, physician_id),
    ).fetchone()

    if not slot:
        conn.close()
        return jsonify({"error": "This slot is no longer available."}), 409

    # Insert the booking
    conn.execute(
        """
        INSERT INTO bookings
            (patient_id, physician_id, slot_id, patient_name, patient_email,
             patient_phone, reason, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        """,
        (patient_id, physician_id, slot_id, patient_name, patient_email,
         patient_phone, reason, datetime.utcnow().isoformat()),
    )

    # Mark the slot as taken so no one else can book it
    conn.execute(
        "UPDATE appointment_slots SET is_available = 0 WHERE id = ?",
        (slot_id,),
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Booking created successfully."}), 201


# ---------------------------------------------------------------------------
# GET /api/bookings/my
# Returns all bookings for the logged-in patient
# Requires: JWT token
# ---------------------------------------------------------------------------
@bookings_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_bookings():
    patient_id = int(get_jwt_identity())

    conn = get_db()
    rows = conn.execute(
        """
        SELECT
            b.id,
            b.status,
            b.reason,
            b.created_at,
            u.full_name        AS physician_name,
            pp.specialty,
            s.display_date,
            s.time
        FROM bookings b
        JOIN physician_profiles pp ON pp.id = b.physician_id
        JOIN users u               ON u.id  = pp.user_id
        JOIN appointment_slots s   ON s.id  = b.slot_id
        WHERE b.patient_id = ?
        ORDER BY b.created_at DESC
        """,
        (patient_id,),
    ).fetchall()
    conn.close()

    return jsonify([
        {
            "id":             r["id"],
            "status":         r["status"],
            "reason":         r["reason"],
            "created_at":     r["created_at"],
            "physician_name": r["physician_name"],
            "specialty":      r["specialty"],
            "display_date":   r["display_date"],
            "time":           r["time"],
        }
        for r in rows
    ]), 200