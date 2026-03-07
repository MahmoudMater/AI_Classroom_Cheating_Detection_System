import requests
from app.core.config import Config


def send_alert_to_backend(payload: dict) -> tuple[int, dict]:
    url = f"{Config.BACKEND_BASE_URL.rstrip('/')}{Config.ALERT_CALLBACK_PATH}"

    try:
        response = requests.post(url, json=payload, timeout=5)
        try:
            data = response.json()
        except ValueError:
            data = {"raw": response.text}
        return response.status_code, data
    except requests.RequestException as exc:
        return 503, {"error": "callback_failed", "details": str(exc), "url": url}
