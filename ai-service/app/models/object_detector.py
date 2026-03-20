"""YOLO-based object detector for cheating-relevant devices."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── dataclasses ─────────────────────────────────────────────────────────────


@dataclass(slots=True)
class Detection:
    label: str
    confidence: float
    bbox: dict[str, int]
    bbox_norm: dict[str, float]


@dataclass(slots=True)
class ObjectDetectionResult:
    camera_id: str
    frame_index: int
    timestamp: float
    detections: list[Detection] = field(default_factory=list)
    inference_ms: float = 0.0
    had_error: bool = False
    error_msg: str = ""

    @property
    def has_detections(self) -> bool:
        return len(self.detections) > 0

    @property
    def labels_found(self) -> list[str]:
        return [d.label for d in self.detections]


# ── detector ────────────────────────────────────────────────────────────────


class ObjectDetector:
    def __init__(
        self,
        model_path: str,
        confidence_threshold: float = 0.75,
        iou_threshold: float = 0.45,
        input_size: int = 640,
        class_names: list[str] | None = None,
    ) -> None:
        self.model_path = model_path
        self.confidence_threshold = float(confidence_threshold)
        self.iou_threshold = float(iou_threshold)
        self.input_size = int(input_size)
        self.class_names = class_names or ["phone", "smartwatch", "unauthorized_notebook"]

        self._model: Any | None = None
        self._ready: bool = False

    @property
    def is_ready(self) -> bool:
        return self._ready

    def load(self) -> None:
        """Load YOLO model and run a warm-up inference."""
        try:
            import os

            from ultralytics import YOLO

            if os.path.exists(self.model_path):
                self._model = YOLO(self.model_path)
            else:
                logger.warning(
                    "custom weights not found at '%s', falling back to yolov8n.pt",
                    self.model_path,
                )
                self._model = YOLO("yolov8n.pt")

            dummy = np.zeros((self.input_size, self.input_size, 3), dtype=np.uint8)
            _ = self._model(dummy, verbose=False)

            self._ready = True
            logger.info("ObjectDetector ready")
        except Exception as exc:
            logger.exception("ObjectDetector failed to load: %s", exc)
            raise

    def detect(
        self,
        frame: np.ndarray,
        camera_id: str = "unknown",
        frame_index: int = 0,
    ) -> ObjectDetectionResult:
        result = ObjectDetectionResult(
            camera_id=camera_id,
            frame_index=frame_index,
            timestamp=time.time(),
        )

        if not self._ready or self._model is None:
            result.had_error = True
            result.error_msg = "object_detector_not_ready"
            return result

        t0 = time.perf_counter()
        try:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            yolo_results = self._model(
                rgb,
                conf=self.confidence_threshold,
                iou=self.iou_threshold,
                imgsz=self.input_size,
                verbose=False,
            )
            result.detections = self._parse_results(
                yolo_results,
                frame_w=int(frame.shape[1]),
                frame_h=int(frame.shape[0]),
            )
            result.inference_ms = round((time.perf_counter() - t0) * 1000, 2)
            return result
        except Exception as exc:
            result.had_error = True
            result.error_msg = str(exc)
            logger.error("ObjectDetector.detect failed: %s", exc, exc_info=True)
            return result

    def _parse_results(self, yolo_results: Any, frame_w: int, frame_h: int) -> list[Detection]:
        detections: list[Detection] = []
        for result in yolo_results:
            if result.boxes is None or len(result.boxes) == 0:
                continue

            for box in result.boxes:
                cls_idx = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                if cls_idx >= len(self.class_names):
                    logger.warning("Unknown class index %s", cls_idx)
                    continue

                label = self.class_names[cls_idx]
                x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                bbox_norm = {
                    "x1": round(x1 / frame_w, 4),
                    "y1": round(y1 / frame_h, 4),
                    "x2": round(x2 / frame_w, 4),
                    "y2": round(y2 / frame_h, 4),
                }

                detections.append(
                    Detection(
                        label=label,
                        confidence=round(conf, 4),
                        bbox={"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                        bbox_norm=bbox_norm,
                    )
                )

        return detections

    def annotate_frame(
        self,
        frame: np.ndarray,
        result: ObjectDetectionResult,
    ) -> np.ndarray:
        try:
            annotated = frame.copy()
            color_map = {
                "phone": (0, 0, 255),
                "smartwatch": (0, 165, 255),
                "unauthorized_notebook": (0, 255, 0),
            }

            for det in result.detections:
                color = color_map.get(det.label, (255, 255, 255))
                x1 = int(det.bbox["x1"])
                y1 = int(det.bbox["y1"])
                x2 = int(det.bbox["x2"])
                y2 = int(det.bbox["y2"])

                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, thickness=2)

                label_text = f"{det.label} {det.confidence:.2f}"
                (text_w, text_h), baseline = cv2.getTextSize(
                    label_text,
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    2,
                )
                text_x = x1
                text_y = max(0, y1 - 5)
                box_tl = (text_x, text_y - text_h - baseline)
                box_br = (text_x + text_w, text_y + baseline)
                cv2.rectangle(annotated, box_tl, box_br, color, thickness=-1)
                cv2.putText(
                    annotated,
                    label_text,
                    (text_x, text_y),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 0, 0),
                    2,
                    cv2.LINE_AA,
                )

            return annotated
        except Exception as exc:
            logger.warning("annotate_frame failed: %s", exc, exc_info=True)
            return frame

