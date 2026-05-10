from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from routes.auth import auth_bp
from routes.physicians import physicians_bp
from routes.bookings import bookings_bp




def create_app():
    app = Flask(__name__)

    # --- config -----------------------------------------------------------
    # In production this would come from an env variable, never hardcoded.
    app.config["JWT_SECRET_KEY"] = "dev-secret-change-in-production"
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False  # no expiry for the demo

    # --- extensions -------------------------------------------------------
    CORS(app, resources={r"/api/*": {"origins": [
        "http://localhost:5173",
        "http://localhost:5174",
    ]}})
    JWTManager(app)

    # --- blueprints -------------------------------------------------------
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(physicians_bp,  url_prefix="/api/physicians")  
    app.register_blueprint(bookings_bp, url_prefix="/api/bookings")



    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=8000)