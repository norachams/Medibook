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
            b.patient_name,
            b.patient_email,
            b.patient_phone,
            b.created_at,
            u.full_name        AS physician_name,
            pp.id              AS physician_id,
            pp.specialty,
            s.display_date,
            s.time
        FROM bookings b
        JOIN physician_profiles pp ON pp.id = b.physician_id
        JOIN users u               ON u.id  = pp.user_id
        JOIN appointment_slots s   ON s.id  = b.slot_id
        WHERE b.patient_id = ?
        AND b.status != 'cancelled'
        AND b.status != 'completed'
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
            "patient_name":   r["patient_name"],
            "patient_email":  r["patient_email"],
            "patient_phone":  r["patient_phone"],
            "created_at":     r["created_at"],
            "physician_name": r["physician_name"],
            "physician_id":   r["physician_id"],   # needed for reschedule navigation
            "specialty":      r["specialty"],
            "display_date":   r["display_date"],
            "time":           r["time"],
        }
        for r in rows
    ]), 200


# ---------------------------------------------------------------------------
# GET /api/bookings/past
# Patient sees completed appointments and physician notes
# ---------------------------------------------------------------------------
@bookings_bp.route("/past", methods=["GET"])
@jwt_required()
def get_past_bookings():
    patient_id = int(get_jwt_identity())
    claims = get_jwt()

    if claims.get("role") != "patient":
        return jsonify({"error": "Only patients can view past appointments."}), 403

    conn = get_db()

    rows = conn.execute(
        """
        SELECT
            b.id,
            b.status,
            b.reason,
            b.patient_name,
            b.patient_email,
            b.patient_phone,
            b.created_at,
            b.physician_notes,
            b.completed_at,
            u.full_name AS physician_name,
            pp.id AS physician_id,
            pp.specialty,
            s.display_date,
            s.date,
            s.time
        FROM bookings b
        JOIN physician_profiles pp ON pp.id = b.physician_id
        JOIN users u ON u.id = pp.user_id
        JOIN appointment_slots s ON s.id = b.slot_id
        WHERE b.patient_id = ?
          AND b.status = 'completed'
        ORDER BY s.date DESC, s.time DESC
        """,
        (patient_id,),
    ).fetchall()

    conn.close()

    return jsonify([
        {
            "id": r["id"],
            "status": r["status"],
            "reason": r["reason"],
            "patient_name": r["patient_name"],
            "patient_email": r["patient_email"],
            "patient_phone": r["patient_phone"],
            "created_at": r["created_at"],
            "physician_notes": r["physician_notes"] or "",
            "completed_at": r["completed_at"] or "",
            "physician_name": r["physician_name"],
            "physician_id": r["physician_id"],
            "specialty": r["specialty"],
            "display_date": r["display_date"],
            "date": r["date"],
            "time": r["time"],
        }
        for r in rows
    ]), 200

# ---------------------------------------------------------------------------
# GET /api/bookings
# Physician sees bookings for their own profile
# Requires: JWT token (physician only)
# ---------------------------------------------------------------------------
@bookings_bp.route("", methods=["GET"])
@bookings_bp.route("/", methods=["GET"])
@jwt_required()
def get_physician_bookings():
    user_id = int(get_jwt_identity())
    claims = get_jwt()

    if claims.get("role") != "physician":
        return jsonify({"error": "Only physicians can view this dashboard."}), 403

    conn = get_db()

    physician = conn.execute(
        """
        SELECT id
        FROM physician_profiles
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchone()

    if not physician:
        conn.close()
        return jsonify({"error": "Physician profile not found."}), 404

    rows = conn.execute(
        """
        SELECT
            b.id,
            b.status,
            b.reason,
            b.patient_name,
            b.patient_email,
            b.patient_phone,
            b.created_at,
            u.full_name AS physician_name,
            pp.id AS physician_id,
            pp.specialty,
            s.display_date,
            s.date,
            s.time
        FROM bookings b
        JOIN physician_profiles pp ON pp.id = b.physician_id
        JOIN users u ON u.id = pp.user_id
        JOIN appointment_slots s ON s.id = b.slot_id
        WHERE b.physician_id = ?
        AND b.status != 'cancelled'
        AND b.status != 'completed'
        ORDER BY s.date ASC, s.time ASC
        """,
        (physician["id"],),
    ).fetchall()

    conn.close()

    return jsonify([
        {
            "id": r["id"],
            "status": r["status"],
            "reason": r["reason"],
            "patient_name": r["patient_name"],
            "patient_email": r["patient_email"],
            "patient_phone": r["patient_phone"],
            "created_at": r["created_at"],
            "physician_name": r["physician_name"],
            "physician_id": r["physician_id"],
            "specialty": r["specialty"],
            "display_date": r["display_date"],
            "date": r["date"],
            "time": r["time"],
        }
        for r in rows
    ]), 200


# ---------------------------------------------------------------------------
# GET /api/bookings/<id>/patient-detail
# Physician views patient profile + past visits for a specific appointment
# ---------------------------------------------------------------------------
@bookings_bp.route("/<int:booking_id>/patient-detail", methods=["GET"])
@jwt_required()
def get_patient_detail_for_booking(booking_id):
    user_id = int(get_jwt_identity())
    claims = get_jwt()

    if claims.get("role") != "physician":
        return jsonify({"error": "Only physicians can view patient details."}), 403

    conn = get_db()

    physician = conn.execute(
        """
        SELECT id
        FROM physician_profiles
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchone()

    if not physician:
        conn.close()
        return jsonify({"error": "Physician profile not found."}), 404

    booking = conn.execute(
        """
        SELECT
            b.id,
            b.patient_id,
            b.patient_name,
            b.patient_email,
            b.patient_phone,
            b.reason,
            b.status,
            b.physician_notes,
            s.display_date,
            s.date,
            s.time
        FROM bookings b
        JOIN appointment_slots s ON s.id = b.slot_id
        WHERE b.id = ?
          AND b.physician_id = ?
        """,
        (booking_id, physician["id"]),
    ).fetchone()

    if not booking:
        conn.close()
        return jsonify({"error": "Booking not found."}), 404

    patient_user = conn.execute(
        """
        SELECT full_name, email
        FROM users
        WHERE id = ?
        """,
        (booking["patient_id"],),
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
        (booking["patient_id"],),
    ).fetchone()

    past_visits = conn.execute(
        """
        SELECT
            b.id,
            b.reason,
            b.physician_notes,
            b.completed_at,
            s.display_date,
            s.date,
            s.time
        FROM bookings b
        JOIN appointment_slots s ON s.id = b.slot_id
        WHERE b.patient_id = ?
          AND b.physician_id = ?
          AND b.status = 'completed'
          AND b.id != ?
        ORDER BY s.date DESC, s.time DESC
        """,
        (booking["patient_id"], physician["id"], booking_id),
    ).fetchall()

    conn.close()

    return jsonify({
        "current_booking": {
            "id": booking["id"],
            "status": booking["status"],
            "reason": booking["reason"],
            "display_date": booking["display_date"],
            "date": booking["date"],
            "time": booking["time"],
            "physician_notes": booking["physician_notes"] or "",
        },
        "patient": {
            "full_name": patient_user["full_name"] if patient_user else booking["patient_name"],
            "email": patient_user["email"] if patient_user else booking["patient_email"],
            "phone": profile["phone"] if profile else booking["patient_phone"],
            "date_of_birth": profile["date_of_birth"] if profile else "",
            "allergies": profile["allergies"] if profile else "",
            "medications": profile["medications"] if profile else "",
            "medical_conditions": profile["medical_conditions"] if profile else "",
            "medical_notes": profile["medical_notes"] if profile else "",
            "emergency_contact_name": profile["emergency_contact_name"] if profile else "",
            "emergency_contact_phone": profile["emergency_contact_phone"] if profile else "",
        },
        "past_visits": [
            {
                "id": r["id"],
                "reason": r["reason"],
                "physician_notes": r["physician_notes"] or "",
                "completed_at": r["completed_at"] or "",
                "display_date": r["display_date"],
                "date": r["date"],
                "time": r["time"],
            }
            for r in past_visits
        ],
    }), 200


# ---------------------------------------------------------------------------
# PATCH /api/bookings/<id>/complete
# Physician adds notes and marks the appointment as completed
# ---------------------------------------------------------------------------
@bookings_bp.route("/<int:booking_id>/complete", methods=["PATCH"])
@jwt_required()
def complete_booking(booking_id):
    user_id = int(get_jwt_identity())
    claims = get_jwt()

    if claims.get("role") != "physician":
        return jsonify({"error": "Only physicians can complete appointments."}), 403

    data = request.get_json(silent=True) or {}
    physician_notes = (data.get("physician_notes") or "").strip()

    conn = get_db()

    physician = conn.execute(
        """
        SELECT id
        FROM physician_profiles
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchone()

    if not physician:
        conn.close()
        return jsonify({"error": "Physician profile not found."}), 404

    booking = conn.execute(
        """
        SELECT *
        FROM bookings
        WHERE id = ?
          AND physician_id = ?
        """,
        (booking_id, physician["id"]),
    ).fetchone()

    if not booking:
        conn.close()
        return jsonify({"error": "Booking not found."}), 404

    if booking["status"] == "cancelled":
        conn.close()
        return jsonify({"error": "Cannot complete a cancelled appointment."}), 409

    conn.execute(
        """
        UPDATE bookings
        SET status = 'completed',
            physician_notes = ?,
            completed_at = ?
        WHERE id = ?
        """,
        (physician_notes, datetime.utcnow().isoformat(), booking_id),
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Appointment marked as completed."}), 200


# ---------------------------------------------------------------------------
# PATCH /api/bookings/<id>/status
# Physician accepts or declines a booking request
# Requires: JWT token (physician only)
# ---------------------------------------------------------------------------
@bookings_bp.route("/<int:booking_id>/status", methods=["PATCH"])
@jwt_required()
def update_booking_status(booking_id):
    user_id = int(get_jwt_identity())
    claims = get_jwt()

    if claims.get("role") != "physician":
        return jsonify({"error": "Only physicians can update booking statuses."}), 403

    data = request.get_json(silent=True)
    new_status = data.get("status") if data else None

    if new_status not in ["pending", "confirmed", "cancelled", "completed"]:
        return jsonify({"error": "Invalid status."}), 422

    conn = get_db()

    physician = conn.execute(
        """
        SELECT id
        FROM physician_profiles
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchone()

    if not physician:
        conn.close()
        return jsonify({"error": "Physician profile not found."}), 404

    booking = conn.execute(
        """
        SELECT *
        FROM bookings
        WHERE id = ? AND physician_id = ?
        """,
        (booking_id, physician["id"]),
    ).fetchone()

    if not booking:
        conn.close()
        return jsonify({"error": "Booking not found."}), 404

    conn.execute(
        """
        UPDATE bookings
        SET status = ?
        WHERE id = ?
        """,
        (new_status, booking_id),
    )

    # If the physician cancels/declines it, free the slot again.
    if new_status == "cancelled":
        conn.execute(
            """
            UPDATE appointment_slots
            SET is_available = 1
            WHERE id = ?
            """,
            (booking["slot_id"],),
        )

    conn.commit()

    updated = conn.execute(
        """
        SELECT
            b.id,
            b.status,
            b.reason,
            b.patient_name,
            b.patient_email,
            b.patient_phone,
            b.created_at,
            u.full_name AS physician_name,
            pp.id AS physician_id,
            pp.specialty,
            s.display_date,
            s.date,
            s.time
        FROM bookings b
        JOIN physician_profiles pp ON pp.id = b.physician_id
        JOIN users u ON u.id = pp.user_id
        JOIN appointment_slots s ON s.id = b.slot_id
        WHERE b.id = ?
        """,
        (booking_id,),
    ).fetchone()

    conn.close()

    return jsonify({
        "id": updated["id"],
        "status": updated["status"],
        "reason": updated["reason"],
        "patient_name": updated["patient_name"],
        "patient_email": updated["patient_email"],
        "patient_phone": updated["patient_phone"],
        "created_at": updated["created_at"],
        "physician_name": updated["physician_name"],
        "physician_id": updated["physician_id"],
        "specialty": updated["specialty"],
        "display_date": updated["display_date"],
        "date": updated["date"],
        "time": updated["time"],
    }), 200

# ---------------------------------------------------------------------------
# GET /api/bookings/check/<physician_id>
# Checks if the logged-in patient already has an active booking with this physician
# ---------------------------------------------------------------------------
@bookings_bp.route("/check/<int:physician_id>", methods=["GET"])
@jwt_required()
def check_active_booking(physician_id):
    patient_id = int(get_jwt_identity())

    conn = get_db()
    booking = conn.execute(
        """
        SELECT id
        FROM bookings
        WHERE patient_id = ?
          AND physician_id = ?
          AND status != 'cancelled'
        LIMIT 1
        """,
        (patient_id, physician_id),
    ).fetchone()
    conn.close()

    return jsonify({
        "has_active_booking": booking is not None
    }), 200


# ---------------------------------------------------------------------------
# PATCH /api/bookings/<id>/cancel
# Patient cancels their own booking — frees the slot back up
# ---------------------------------------------------------------------------
@bookings_bp.route("/<int:booking_id>/cancel", methods=["PATCH"])
@jwt_required()
def cancel_booking(booking_id):
    patient_id = int(get_jwt_identity())
    conn = get_db()

    # Confirm the booking belongs to this patient
    booking = conn.execute(
        "SELECT * FROM bookings WHERE id = ? AND patient_id = ?",
        (booking_id, patient_id),
    ).fetchone()

    if not booking:
        conn.close()
        return jsonify({"error": "Booking not found."}), 404

    if booking["status"] == "cancelled":
        conn.close()
        return jsonify({"error": "Booking is already cancelled."}), 409

    # Cancel the booking and free the slot so others can book it
    conn.execute(
        "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
        (booking_id,),
    )
    conn.execute(
        "UPDATE appointment_slots SET is_available = 1 WHERE id = ?",
        (booking["slot_id"],),
    )

    conn.commit()
    conn.close()
    return jsonify({"message": "Booking cancelled."}), 200


# ---------------------------------------------------------------------------
# PATCH /api/bookings/<id>/reschedule
# Cancels the current booking + frees old slot, then creates a new booking
# on the new slot — all in one atomic transaction
# ---------------------------------------------------------------------------
@bookings_bp.route("/<int:booking_id>/reschedule", methods=["PATCH"])
@jwt_required()
def reschedule_booking(booking_id):
    patient_id = int(get_jwt_identity())
    data = request.get_json(silent=True)

    new_slot_id = data.get("slot_id") if data else None
    if not new_slot_id:
        return jsonify({"error": "slot_id is required."}), 422

    conn = get_db()

    # Confirm booking belongs to this patient and is still active
    booking = conn.execute(
        "SELECT * FROM bookings WHERE id = ? AND patient_id = ?",
        (booking_id, patient_id),
    ).fetchone()

    if not booking:
        conn.close()
        return jsonify({"error": "Booking not found."}), 404

    if booking["status"] == "cancelled":
        conn.close()
        return jsonify({"error": "Cannot reschedule a cancelled booking."}), 409

    # Confirm the new slot is available
    new_slot = conn.execute(
        "SELECT * FROM appointment_slots WHERE id = ? AND is_available = 1",
        (new_slot_id,),
    ).fetchone()

    if not new_slot:
        conn.close()
        return jsonify({"error": "This slot is no longer available."}), 409

    # Free the old slot, take the new one, update the booking
    conn.execute(
        "UPDATE appointment_slots SET is_available = 1 WHERE id = ?",
        (booking["slot_id"],),
    )
    conn.execute(
        "UPDATE appointment_slots SET is_available = 0 WHERE id = ?",
        (new_slot_id,),
    )
    conn.execute(
        "UPDATE bookings SET slot_id = ?, status = 'pending' WHERE id = ?",
        (new_slot_id, booking_id),
    )

    conn.commit()
    conn.close()
    return jsonify({"message": "Booking rescheduled."}), 200