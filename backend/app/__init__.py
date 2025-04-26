from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.routes.context_engine import bp as context_bp
from app.routes.resume import bp as resume_bp

def create_app():
    app = Flask(__name__)

    # Load config
    app.config.from_object(Config)

    # Enable CORS
    CORS(app)

    # Register blueprints
    app.register_blueprint(context_bp)
    app.register_blueprint(resume_bp)

    return app
