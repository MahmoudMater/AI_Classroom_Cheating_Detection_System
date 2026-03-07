"""Bootstrap path so 'app' package is found when run as python app/main.py from ai-service root."""
import sys
from pathlib import Path

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from flask import Flask

from app.api.routes_health import health_bp
from app.api.routes_infer import infer_bp
from app.api.routes_monitor import monitor_bp
from app.core.config import Config


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(health_bp)
    app.register_blueprint(monitor_bp)
    app.register_blueprint(infer_bp)
    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT, debug=True)
