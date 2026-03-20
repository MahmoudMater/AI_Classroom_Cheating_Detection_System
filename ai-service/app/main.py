"""Flask application factory for the AI Classroom Cheating Detection service."""

from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

from flask import Flask

from app.api.routes_health import health_bp
from app.api.routes_infer import infer_bp
from app.api.routes_monitor import monitor_bp
from app.core.config import Config
from app.services.backend_client import start_retry_worker
from app.services.pipeline import load_models

logger = logging.getLogger(__name__)

# ── ensure imports resolve when running from ai-service root ───────────────

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))


class config:
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = Config.PORT
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in {"1", "true", "yes", "y", "on"}
    SNAPSHOT_DIR: str = os.getenv(
        "SNAPSHOT_DIR",
        str(Path(__file__).resolve().parents[1] / "snapshots"),
    )


logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    level=logging.DEBUG if config.DEBUG else logging.INFO,
)


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(health_bp)
    app.register_blueprint(monitor_bp)
    app.register_blueprint(infer_bp)

    with app.app_context():
        os.makedirs(config.SNAPSHOT_DIR, exist_ok=True)
        try:
            load_models()
        except Exception as exc:
            logger.critical("Model loading failed: %s", exc, exc_info=True)
        start_retry_worker()
        logger.info("AI Service ready — %s:%s", config.HOST, config.PORT)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(
        host=config.HOST,
        port=config.PORT,
        debug=config.DEBUG,
        use_reloader=False,
    )
