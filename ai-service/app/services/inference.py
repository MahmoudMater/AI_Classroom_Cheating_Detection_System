from datetime import datetime, timezone


def run_mock_inference(session_id: str) -> dict:
    # Placeholder for YOLOv8, head pose, and movement tracker integrations.
    return {
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "detections": {
            "phone_detected": True,
            "head_direction": "left",
            "movement_level": "medium"
        },
        "suspicious_events": [
            {"type": "phone_detected", "confidence": 0.91},
            {"type": "looking_away", "confidence": 0.84}
        ],
        "snapshot_url": f"/snapshots/{session_id}/frame_mock.jpg"
    }
