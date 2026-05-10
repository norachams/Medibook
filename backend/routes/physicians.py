from flask import Blueprint, jsonify
from models import get_db

physicians_bp = Blueprint("physicians", __name__)


# ---------------------------------------------------------------------------
# GET /api/physicians
# Returns all physicians with their profile and available slots
# ---------------------------------------------------------------------------
@physicians_bp.route("/", methods=["GET"])
def get_physicians():
    conn = get_db()

    physicians = conn.execute("""
        SELECT
            pp.id,
            u.full_name   AS name,
            pp.specialty,
            pp.description,
            pp.location,
            pp.rating
        FROM physician_profiles pp
        JOIN users u ON u.id = pp.user_id
    """).fetchall()

    result = []
    for p in physicians:
        slots = conn.execute("""
            SELECT id, date, display_date, time
            FROM appointment_slots
            WHERE physician_id = ? AND is_available = 1
            ORDER BY date, time
        """, (p["id"],)).fetchall()

        # Derive availability label from the first available slot's date
        availability_label = "No availability"
        if slots:
            from datetime import date
            today = date.today().isoformat()
            first_date = slots[0]["date"]
            if first_date == today:
                availability_label = "Available today"
            else:
                availability_label = "Next available " + slots[0]["display_date"]

        result.append({
            "id":                p["id"],
            "name":              p["name"],
            "specialty":         p["specialty"],
            "description":       p["description"],
            "location":          p["location"],
            "rating":            p["rating"],
            "availabilityLabel": availability_label,
            "slots": [
                {
                    "id":           s["id"],
                    "date":         s["date"],
                    "display_date": s["display_date"],
                    "time":         s["time"],
                }
                for s in slots
            ],
        })

    conn.close()
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# GET /api/physicians/<id>
# Returns a single physician by their physician_profile id
# ---------------------------------------------------------------------------
@physicians_bp.route("/<int:physician_id>", methods=["GET"])
def get_physician(physician_id):
    conn = get_db()

    p = conn.execute("""
        SELECT
            pp.id,
            u.full_name   AS name,
            pp.specialty,
            pp.description,
            pp.location,
            pp.rating
        FROM physician_profiles pp
        JOIN users u ON u.id = pp.user_id
        WHERE pp.id = ?
    """, (physician_id,)).fetchone()

    if not p:
        conn.close()
        return jsonify({"error": "Physician not found."}), 404

    slots = conn.execute("""
        SELECT id, date, display_date, time
        FROM appointment_slots
        WHERE physician_id = ? AND is_available = 1
        ORDER BY date, time
    """, (p["id"],)).fetchall()

    from datetime import date
    today = date.today().isoformat()
    availability_label = "No availability"
    if slots:
        first_date = slots[0]["date"]
        if first_date == today:
            availability_label = "Available today"
        else:
            availability_label = "Next available " + slots[0]["display_date"]

    conn.close()
    return jsonify({
        "id":                p["id"],
        "name":              p["name"],
        "specialty":         p["specialty"],
        "description":       p["description"],
        "location":          p["location"],
        "rating":            p["rating"],
        "availabilityLabel": availability_label,
        "slots": [
            {
                "id":           s["id"],
                "date":         s["date"],
                "display_date": s["display_date"],
                "time":         s["time"],
            }
            for s in slots
        ],
    }), 200