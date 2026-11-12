import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # CORS
    raw_cors = os.getenv("CORS_ORIGINS", '["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]')
    try:
        CORS_ORIGINS: list = json.loads(raw_cors)
    except Exception:
        CORS_ORIGINS: list = ["*"]

    # YOLOv8 Configuration
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", str(BASE_DIR / "models" / "yolov8n.pt"))
    EXTERNAL_YOLO_API_ENABLED: bool = os.getenv("EXTERNAL_YOLO_API_ENABLED", "false").lower() in ("true", "1", "yes")
    EXTERNAL_YOLO_API_URL: str = os.getenv("EXTERNAL_YOLO_API_URL", "")
    EXTERNAL_YOLO_API_KEY: str = os.getenv("EXTERNAL_YOLO_API_KEY", "")

    # Inspection Decision Logic Thresholds
    DAMAGE_CONFIDENCE_THRESHOLD: float = float(os.getenv("DAMAGE_CONFIDENCE_THRESHOLD", 0.35))
    MANUAL_REVIEW_LOW_THRESHOLD: float = float(os.getenv("MANUAL_REVIEW_LOW_THRESHOLD", 0.25))
    MANUAL_REVIEW_HIGH_THRESHOLD: float = float(os.getenv("MANUAL_REVIEW_HIGH_THRESHOLD", 0.45))

    # Allowed & Disqualifying Damage Classes
    raw_disqualifying = os.getenv("DISQUALIFYING_CLASSES", '["crack", "dent", "broken_parts", "frame_damage", "loose_cable"]')
    try:
        DISQUALIFYING_CLASSES: list = json.loads(raw_disqualifying)
    except Exception:
        DISQUALIFYING_CLASSES: list = ["crack", "dent", "broken_parts", "frame_damage", "loose_cable"]

    raw_minor = os.getenv("MINOR_DAMAGE_CLASSES", '["scratch", "paint_peel", "scuff"]')
    try:
        MINOR_DAMAGE_CLASSES: list = json.loads(raw_minor)
    except Exception:
        MINOR_DAMAGE_CLASSES: list = ["scratch", "paint_peel", "scuff"]

    MAX_ALLOWED_MINOR_SCRATCHES: int = int(os.getenv("MAX_ALLOWED_MINOR_SCRATCHES", 1))

    # Security & Provenance
    REQUIRE_MANDATORY_VIEWS: bool = os.getenv("REQUIRE_MANDATORY_VIEWS", "true").lower() in ("true", "1", "yes")
    raw_views = os.getenv("MANDATORY_VIEWS", '["front", "rear", "left", "right"]')
    try:
        MANDATORY_VIEWS: list = json.loads(raw_views)
    except Exception:
        MANDATORY_VIEWS: list = ["front", "rear", "left", "right"]

    OPTIONAL_VIEWS: list = ["damage_closeup"]

settings = Settings()
