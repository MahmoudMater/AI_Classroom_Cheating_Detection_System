"""Backend callback client with retry queue."""

from __future__ import annotations

import logging
import os
import threading
import time
from typing import Any

import requests

from app.core.config import Config
from app.core.state import app_state

logger = logging.getLogger(__name__)

# ── module-level constants ───────────────────────────────────────────────────

_ALERT_URL = f"{Config.BACKEND_BASE_URL.rstrip('/')}{Config.ALERT_CALLBACK_PATH}"
_HEADERS: dict[str, str] = {
    "Content-Type": "application/json",
}

_secret = os.getenv("BACKEND_SECRET", "")
if _secret:
    _HEADERS["x-service-secret"] = _secret


# ── public API ───────────────────────────────────────────────────────────────


def send_alert(payload: dict) -> None:
    """Send an alert payload to the backend; never raises exceptions."""
    try:
        response = requests.post(_ALERT_URL, json=payload, headers=_HEADERS, timeout=2)
        if response.status_code == 200:
            alert_id = payload.get("alert_id")
            logger.debug("Alert sent: %s", alert_id)
            return

        logger.warning("Alert callback non-200 (%s), enqueueing retry", response.status_code)
        app_state.enqueue_retry(payload)
    except requests.RequestException as exc:
        logger.warning("Alert callback request failed, enqueueing retry: %s", exc)
        app_state.enqueue_retry(payload)


def send_alert_to_backend(payload: dict) -> tuple[int, dict[str, Any]]:
    """Compatibility wrapper for older routes: returns (status_code, response_json)."""
    try:
        response = requests.post(_ALERT_URL, json=payload, headers=_HEADERS, timeout=2)
        try:
            data: dict[str, Any] = response.json()
        except ValueError:
            data = {"raw": response.text}

        if response.status_code != 200:
            app_state.enqueue_retry(payload)
        return response.status_code, data
    except requests.RequestException as exc:
        app_state.enqueue_retry(payload)
        return 503, {"error": "callback_failed", "details": str(exc), "url": _ALERT_URL}


def start_retry_worker() -> None:
    """Start a daemon thread that drains the retry queue forever."""
    t = threading.Thread(target=_retry_loop, daemon=True)
    t.start()
    logger.info("Retry worker started")


# ── retry loop ───────────────────────────────────────────────────────────────


def _retry_loop() -> None:
    """Infinite retry loop for failed alert callbacks."""
    while True:
        time.sleep(5)
        drained = 0

        while True:
            payload = app_state.pop_retry()
            if payload is None:
                break

            try:
                response = requests.post(
                    _ALERT_URL,
                    json=payload,
                    headers=_HEADERS,
                    timeout=2,
                )
                if response.status_code == 200:
                    drained += 1
                    continue

                app_state.enqueue_retry(payload)
                break
            except requests.RequestException:
                app_state.enqueue_retry(payload)
                break

        if drained > 0:
            logger.info("Retry worker drained %s alerts", drained)

