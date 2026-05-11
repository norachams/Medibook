import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "medbook.db")


def get_db():
    """Return a connection to the database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # rows behave like dicts
    return conn


def init_db():
    """Create tables if they don't exist yet."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            email         TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL,
            role          TEXT    NOT NULL CHECK(role IN ('patient', 'physician')),
            full_name     TEXT    NOT NULL,
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        );
 
        CREATE TABLE IF NOT EXISTS physician_profiles (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL UNIQUE,
            specialty   TEXT    NOT NULL,
            description TEXT,
            location    TEXT,
            rating      REAL    DEFAULT 4.8,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
 
        CREATE TABLE IF NOT EXISTS appointment_slots (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            physician_id INTEGER NOT NULL,
            date         TEXT    NOT NULL,
            display_date TEXT    NOT NULL,
            time         TEXT    NOT NULL,
            is_available INTEGER DEFAULT 1,
            FOREIGN KEY (physician_id) REFERENCES physician_profiles (id)
        );
 
        CREATE TABLE IF NOT EXISTS bookings (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id     INTEGER NOT NULL,
            physician_id   INTEGER NOT NULL,
            slot_id        INTEGER NOT NULL,
            patient_name   TEXT    NOT NULL,
            patient_email  TEXT    NOT NULL,
            patient_phone  TEXT,
            reason         TEXT    NOT NULL,
            status         TEXT    DEFAULT 'pending'
                                   CHECK(status IN ('pending', 'confirmed', 'cancelled')),
            created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id)   REFERENCES users (id),
            FOREIGN KEY (physician_id) REFERENCES physician_profiles (id),
            FOREIGN KEY (slot_id)      REFERENCES appointment_slots (id)
        );
                         
        CREATE TABLE IF NOT EXISTS patient_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            phone TEXT DEFAULT '',
            date_of_birth TEXT DEFAULT '',
            allergies TEXT DEFAULT '',
            medications TEXT DEFAULT '',
            medical_conditions TEXT DEFAULT '',
            medical_notes TEXT DEFAULT '',
            emergency_contact_name TEXT DEFAULT '',
            emergency_contact_phone TEXT DEFAULT '',
            FOREIGN KEY (user_id) REFERENCES users(id)
);
    """)
 

    conn.commit()
    conn.close()




if __name__ == "__main__":
    init_db()
    print(f"Database initialised at {DB_PATH}")