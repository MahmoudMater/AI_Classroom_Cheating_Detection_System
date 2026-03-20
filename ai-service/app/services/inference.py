"""Inference orchestration layer (stream start/stop + status)."""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any

from app.core.state import app_state
from app.services.pipeline import StreamWorker, models_ready

logger = logging.getLogger(__name__)


# ── public stream orchestration ────────────────────────────────────────────


def start_stream(camera_id: str, source: str, seat_map: dict[str, dict[str, float]]) -> tuple[bool, str]:
    if not models_ready():
        return False, "Models not loaded yet, retry in a moment."

    if app_state.get_stream(camera_id) is not None:
        return False, f"Stream '{camera_id}' already running."

    worker = StreamWorker(camera_id=camera_id, source=source, seat_map=seat_map)
    app_state.register_stream(camera_id, worker)
    worker.start()
    return True, f"Stream '{camera_id}' started."


def stop_stream(camera_id: str) -> tuple[bool, str]:
    worker = app_state.get_stream(camera_id)
    if worker is None:
        return False, f"No active stream for '{camera_id}'."

    worker.stop()
    # `app_state.unregister_stream()` is called inside `StreamWorker._run()` finally block.
    return True, f"Stream '{camera_id}' stopped."


def get_stream_status() -> dict[str, Any]:
    streams: list[dict[str, Any]] = []
    for cam_id in app_state.list_streams():
        worker = app_state.get_stream(cam_id)
        streams.append(
            {
                "camera_id": cam_id,
                "running": worker.is_running if worker else False,
                "fps": app_state.fps_stats.get(cam_id, 0.0),
                "total_frames": app_state.frame_counters.get(cam_id, 0),
            }
        )

    return {
        "active_streams": len(streams),
        "streams": streams,
        "retry_queue_size": app_state.retry_queue_size(),
        "models_ready": models_ready(),
    }


# ── legacy single-shot mock inference (compat for current routes) ─────────


def run_mock_inference(session_id: str) -> dict[str, Any]:
    """Legacy endpoint compatibility: keep the old mock response."""
    # Placeholder for YOLOv8, head pose, and movement tracker integrations.
    return {
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "detections": {
            "phone_detected": True,
            "head_direction": "left",
            "movement_level": "medium",
        },
        "suspicious_events": [
            {"type": "phone_detected", "confidence": 0.91},
            {"type": "looking_away", "confidence": 0.84},
        ],
        "snapshot_url": f"/snapshots/{session_id}/frame_mock.jpg",
        "mock_ts": time.time(),
    }

