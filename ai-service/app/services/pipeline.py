"""Core streaming pipeline engine (YOLO Model 1 + alert dispatch)."""

from __future__ import annotations

import logging
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from app.core.state import app_state
from app.models.object_detector import ObjectDetectionResult, ObjectDetector

logger = logging.getLogger(__name__)

# ── config knobs (env-backed) ──────────────────────────────────────────────


class config:
    FRAME_SKIP: int = int(os.getenv("FRAME_SKIP", "5"))
    ALERT_COOLDOWN_SECONDS: float = float(os.getenv("ALERT_COOLDOWN_SECONDS", "3.0"))
    SAVE_SNAPSHOTS: bool = os.getenv("SAVE_SNAPSHOTS", "false").lower() in {"1", "true", "yes", "y", "on"}
    SNAPSHOT_DIR: str = os.getenv(
        "SNAPSHOT_DIR",
        str(Path(__file__).resolve().parents[2] / "snapshots"),
    )

    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
    YOLO_CONFIDENCE_THRESHOLD: float = float(os.getenv("YOLO_CONFIDENCE_THRESHOLD", "0.75"))
    YOLO_IOU_THRESHOLD: float = float(os.getenv("YOLO_IOU_THRESHOLD", "0.45"))
    YOLO_INPUT_SIZE: int = int(os.getenv("YOLO_INPUT_SIZE", "640"))


# ── module-level model singletons ───────────────────────────────────────────

_object_detector: ObjectDetector | None = None
_pose_estimator: Any | None = None
_models_lock = threading.Lock()


def load_models() -> None:
    """Load Model 1 (YOLO) into the module-level singleton."""
    global _object_detector
    with _models_lock:
        logger.info("Loading Model 1 — YOLO...")
        _object_detector = ObjectDetector(
            model_path=config.YOLO_MODEL_PATH,
            confidence_threshold=config.YOLO_CONFIDENCE_THRESHOLD,
            iou_threshold=config.YOLO_IOU_THRESHOLD,
            input_size=config.YOLO_INPUT_SIZE,
        )
        _object_detector.load()
        logger.info("Model 1 ready")

        # TODO: Model 2 pose loading will be added when pose_estimator.py integration is ready.
        _pose_estimator = None


def models_ready() -> bool:
    return _object_detector is not None and _object_detector.is_ready


# ── stream worker ───────────────────────────────────────────────────────────


class StreamWorker:
    def __init__(
        self,
        camera_id: str,
        source: str,
        seat_map: dict[str, dict[str, float]],
    ) -> None:
        self.camera_id = camera_id
        self.source = source
        self.seat_map = seat_map
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None
        self._fps_window: list[float] = []

    def start(self) -> None:
        self._thread = threading.Thread(target=self._run, daemon=True, name=f"stream-{self.camera_id}")
        self._thread.start()
        logger.info("Stream thread started: %s", self.camera_id)

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=8)
        logger.info("Stream stop requested: %s", self.camera_id)

    @property
    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def _run(self) -> None:
        cap = self._open_capture()
        if cap is None:
            app_state.unregister_stream(self.camera_id)
            return

        frame_count = 0
        try:
            while not self._stop_event.is_set():
                ret, frame = cap.read()
                if not ret:
                    time.sleep(0.05)
                    continue

                frame_count += 1
                app_state.increment_frame(self.camera_id)

                skip = max(1, config.FRAME_SKIP)
                if frame_count % skip != 0:
                    continue

                self._update_fps()
                self._process_frame(frame, frame_count)
        except Exception as exc:
            logger.error("Stream worker crashed for %s: %s", self.camera_id, exc, exc_info=True)
        finally:
            cap.release()
            app_state.unregister_stream(self.camera_id)
            logger.info("capture released for %s", self.camera_id)

    def _open_capture(self) -> cv2.VideoCapture | None:
        try:
            source: str | int = self.source
            if isinstance(source, str) and source.isdigit():
                source = int(source)

            cap = cv2.VideoCapture(source)
            if not cap.isOpened():
                logger.error("Failed to open capture source for %s", self.camera_id)
                return None

            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            return cap
        except Exception as exc:
            logger.error("Capture open failed for %s: %s", self.camera_id, exc, exc_info=True)
            return None

    def _process_frame(self, frame: np.ndarray, frame_index: int) -> None:
        obj_result: ObjectDetectionResult | None = None

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures: dict[str, Any] = {}

            if _object_detector is not None and _object_detector.is_ready:
                futures["object"] = executor.submit(
                    _object_detector.detect,
                    frame,
                    self.camera_id,
                    frame_index,
                )

            # Pose future commented out with TODO (Model 2 not implemented yet).

            for key, future in futures.items():
                try:
                    if key == "object":
                        obj_result = future.result(timeout=2.0)
                except Exception as exc:
                    logger.error(
                        "model '%s' timed out or errored: %s",
                        key,
                        exc,
                        exc_info=True,
                    )

        if obj_result is not None:
            self._handle_object_detections(obj_result, frame)

    def _handle_object_detections(self, result: ObjectDetectionResult, frame: np.ndarray) -> None:
        if not result.has_detections:
            return

        from app.services.backend_client import send_alert

        import uuid

        for det in result.detections:
            seat = self._resolve_seat(det.bbox_norm)
            last_ts = app_state.get_last_alert_time(self.camera_id, seat)

            if (time.time() - last_ts) < config.ALERT_COOLDOWN_SECONDS:
                logger.debug("cooldown active, skipping")
                continue

            snapshot_path: str | None = None
            if config.SAVE_SNAPSHOTS:
                snapshot_path = self._save_snapshot(frame, result)

            payload = {
                "alert_id": str(uuid.uuid4()),
                "camera_id": self.camera_id,
                "seat_block": seat,
                "type": "object",
                "label": det.label,
                "confidence": det.confidence,
                "bbox_norm": det.bbox_norm,
                "snapshot_path": snapshot_path,
                "frame_index": result.frame_index,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }

            app_state.set_last_alert_time(self.camera_id, seat, time.time())
            threading.Thread(target=send_alert, args=(payload,), daemon=True).start()
            logger.info(
                "Alert fired: cam=%s seat=%s label=%s conf=%s",
                self.camera_id,
                seat,
                det.label,
                det.confidence,
            )

    def _resolve_seat(self, bbox_norm: dict[str, float]) -> str:
        if not self.seat_map:
            return "unknown"

        cx = (bbox_norm["x1"] + bbox_norm["x2"]) / 2
        cy = (bbox_norm["y1"] + bbox_norm["y2"]) / 2

        for seat_label, region in self.seat_map.items():
            if region["x1"] <= cx <= region["x2"] and region["y1"] <= cy <= region["y2"]:
                return seat_label

        return "unknown"

    def _save_snapshot(self, frame: np.ndarray, result: ObjectDetectionResult) -> str | None:
        try:
            os.makedirs(config.SNAPSHOT_DIR, exist_ok=True)
            ts = time.strftime("%Y%m%d_%H%M%S")
            filename = f"{self.camera_id}_{ts}_{result.frame_index}.jpg"
            path = os.path.join(config.SNAPSHOT_DIR, filename)

            if _object_detector is not None:
                annotated = _object_detector.annotate_frame(frame, result)
            else:
                annotated = frame

            success = cv2.imwrite(path, annotated)
            if not success:
                logger.warning("cv2.imwrite failed silently")
                return None

            return path
        except Exception as exc:
            logger.warning("snapshot failed: %s", exc, exc_info=True)
            return None

    def _update_fps(self) -> None:
        now = time.time()
        self._fps_window.append(now)
        if len(self._fps_window) > 10:
            self._fps_window.pop(0)

        if len(self._fps_window) >= 2:
            elapsed = self._fps_window[-1] - self._fps_window[0]
            if elapsed > 0:
                fps = (len(self._fps_window) - 1) / elapsed
                app_state.update_fps(self.camera_id, round(fps, 1))

