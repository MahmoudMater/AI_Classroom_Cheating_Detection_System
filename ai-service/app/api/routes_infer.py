from flask import Blueprint, jsonify, request

from app.services.backend_client import send_alert_to_backend
from app.services.inference import run_mock_inference

infer_bp = Blueprint("infer", __name__)


@infer_bp.post("/infer/frame")
def infer_frame():
    payload = request.get_json(silent=True) or {}
    session_id = payload.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    result = run_mock_inference(session_id)

    callback = payload.get("send_to_backend", True)
    backend_result = None

    if callback:
        status_code, response = send_alert_to_backend(result)
        backend_result = {
            "status_code": status_code,
            "response": response
        }

    return jsonify({
        "inference": result,
        "backend_callback": backend_result
    })
