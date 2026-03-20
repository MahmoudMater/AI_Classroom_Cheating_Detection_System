"""Thread-safe in-memory state for streams and alert retries."""

from __future__ import annotations

import logging
import threading
from collections import deque
from typing import Any, Deque, Dict

logger = logging.getLogger(__name__)

# ── legacy monitor endpoint state ───────────────────────────────────────────
#
# `routes_monitor.py` imports ACTIVE_MONITORS directly. Keep it for compatibility
# while the stream engine uses `app_state`.
ACTIVE_MONITORS: Dict[str, dict] = {}


# ── app state singleton ─────────────────────────────────────────────────────

AlertPayload = Dict[str, Any]


class AppState:
    """Thread-safe singleton holding shared in-memory state."""

    def __init__(self) -> None:
        self._lock: threading.Lock = threading.Lock()
        self.active_streams: Dict[str, Any] = {}
        self.alert_cooldown_tracker: Dict[str, float] = {}
        self.retry_queue: Deque[AlertPayload] = deque(maxlen=200)
        self.frame_counters: Dict[str, int] = {}
        self.fps_stats: Dict[str, float] = {}

    def register_stream(self, camera_id: str, worker: Any) -> None:
        """Register a stream worker and initialize counters."""
        with self._lock:
            self.active_streams[camera_id] = worker
            self.frame_counters[camera_id] = 0
            self.fps_stats[camera_id] = 0.0

    def unregister_stream(self, camera_id: str) -> None:
        """Unregister a stream worker and remove its counters."""
        with self._lock:
            self.active_streams.pop(camera_id, None)
            self.frame_counters.pop(camera_id, None)
            self.fps_stats.pop(camera_id, None)

    def get_stream(self, camera_id: str) -> Any | None:
        """Get worker for a camera stream (read-only lookup)."""
        return self.active_streams.get(camera_id)

    def list_streams(self) -> list[str]:
        """List active stream camera ids."""
        with self._lock:
            return list(self.active_streams.keys())

    def increment_frame(self, camera_id: str) -> int:
        """Increment total frames read for a camera."""
        with self._lock:
            if camera_id not in self.frame_counters:
                self.frame_counters[camera_id] = 1
                # Ensure fps_stats exists too.
                self.fps_stats.setdefault(camera_id, 0.0)
            else:
                self.frame_counters[camera_id] += 1
            return self.frame_counters[camera_id]

    def update_fps(self, camera_id: str, fps: float) -> None:
        """Update current FPS value for a camera."""
        self.fps_stats[camera_id] = round(fps, 1)

    def set_last_alert_time(self, camera_id: str, seat_block: str, ts: float) -> None:
        """Set cooldown timestamp for a given (camera, seat) pair."""
        key = f"{camera_id}::{seat_block}"
        with self._lock:
            self.alert_cooldown_tracker[key] = ts

    def get_last_alert_time(self, camera_id: str, seat_block: str) -> float:
        """Get cooldown timestamp for a given (camera, seat) pair."""
        key = f"{camera_id}::{seat_block}"
        return self.alert_cooldown_tracker.get(key, 0.0)

    def enqueue_retry(self, alert_payload: dict) -> None:
        """Add an alert payload to the retry queue."""
        self.retry_queue.append(alert_payload)

    def pop_retry(self) -> dict | None:
        """Pop the oldest alert payload from the retry queue."""
        try:
            return self.retry_queue.popleft()
        except IndexError:
            return None

    def retry_queue_size(self) -> int:
        """Return current retry queue size."""
        return len(self.retry_queue)


app_state = AppState()

