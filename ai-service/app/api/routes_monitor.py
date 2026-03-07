from datetime import datetime, timezone
from flask import Blueprint, jsonify, request

from app.core.state import ACTIVE_MONITORS

monitor_bp = Blueprint("monitor", __name__)


@monitor_bp.post("/monitor/start")
def start_monitor():
    payload = request.get_json(silent=True) or {}
    session_id = payload.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    ACTIVE_MONITORS[session_id] = {
        "session_id": session_id,
        "student_id": payload.get("student_id"),
        "video_source": payload.get("video_source"),
        "started_at": datetime.now(timezone.utc).isoformat(),
        "status": "running"
    }
    return jsonify({"message": "monitoring_started", "monitor": ACTIVE_MONITORS[session_id]}), 201


@monitor_bp.post("/monitor/stop")
def stop_monitor():
    payload = request.get_json(silent=True) or {}
    session_id = payload.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    monitor = ACTIVE_MONITORS.get(session_id)
    if not monitor:
        return jsonify({"error": "monitor not found"}), 404

    monitor["status"] = "stopped"
    monitor["stopped_at"] = datetime.now(timezone.utc).isoformat()
    return jsonify({"message": "monitoring_stopped", "monitor": monitor})


@monitor_bp.get("/monitor/status/<session_id>")
def monitor_status(session_id: str):
    monitor = ACTIVE_MONITORS.get(session_id)
    if not monitor:
        return jsonify({"error": "monitor not found"}), 404

    return jsonify({"monitor": monitor})
