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
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print(f"Database initialised at {DB_PATH}")