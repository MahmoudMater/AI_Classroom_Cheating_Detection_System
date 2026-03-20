"""Head pose estimator using MediaPipe FaceMesh + OpenCV PnP.

This module estimates a subject's head orientation (yaw/pitch) from a video frame
and classifies it into simple movement directions used by the AI service alerting
pipeline (e.g., look_left/look_right/look_up).
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np

logger = logging.getLogger(__name__)

# ── constants ────────────────────────────────────────────────────────────────

NOSE_TIP_LANDMARK = 1
CHIN_LANDMARK = 152
LEFT_EYE_LANDMARK = 33
RIGHT_EYE_LANDMARK = 263
LEFT_MOUTH_LANDMARK = 61
RIGHT_MOUTH_LANDMARK = 291

MODEL_POINTS_3D = np.array(
    [
        (0.0, 0.0, 0.0),  # nose tip
        (0.0, -63.6, -12.5),  # chin
        (-43.3, 32.7, -26.0),  # left eye
        (43.3, 32.7, -26.0),  # right eye
        (-28.9, -28.9, -24.1),  # left mouth
        (28.9, -28.9, -24.1),  # right mouth
    ],
    dtype=np.float64,
)

DIRECTION_NORMAL = "normal"
DIRECTION_LOOK_LEFT = "look_left"
DIRECTION_LOOK_RIGHT = "look_right"
DIRECTION_LOOK_UP = "look_up"


# ── dataclasses ──────────────────────────────────────────────────────────────


@dataclass(slots=True)
class PoseResult:
    camera_id: str
    frame_index: int
    timestamp: float
    direction: str
    yaw: float
    pitch: float
    confidence: float
    face_detected: bool
    inference_ms: float
    had_error: bool
    error_msg: str

    @property
    def is_suspicious(self) -> bool:
        """Return True if this pose indicates suspicious movement."""

        return self.direction != DIRECTION_NORMAL


# ── pose estimator ───────────────────────────────────────────────────────────


class PoseEstimator:
    """Estimate head pose (yaw/pitch) using FaceMesh + solvePnP."""

    def __init__(
        self,
        yaw_threshold: float,
        pitch_threshold: float,
        min_detection_confidence: float,
        min_tracking_confidence: float,
    ) -> None:
        """Create estimator with thresholds and MediaPipe confidences.

        Note: MediaPipe FaceMesh is not initialized here; call `load()` first.
        """

        self.yaw_threshold = float(yaw_threshold)
        self.pitch_threshold = float(pitch_threshold)
        self.min_detection_confidence = float(min_detection_confidence)
        self.min_tracking_confidence = float(min_tracking_confidence)

        self._face_mesh: Optional[mp.solutions.face_mesh.FaceMesh] = None
        self._ready: bool = False

    def load(self) -> None:
        """Load and warm up MediaPipe FaceMesh."""

        try:
            face_mesh = mp.solutions.face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=self.min_detection_confidence,
                min_tracking_confidence=self.min_tracking_confidence,
            )

            # Warm-up pass (black frame). Some backends do one-time initialization.
            dummy = np.zeros((480, 640, 3), dtype=np.uint8)
            _ = face_mesh.process(cv2.cvtColor(dummy, cv2.COLOR_BGR2RGB))

            self._face_mesh = face_mesh
            self._ready = True
            logger.info("[PoseEstimator] Loaded MediaPipe FaceMesh successfully.")
        except Exception as exc:  # noqa: BLE001 - must not raise from load()
            self._face_mesh = None
            self._ready = False
            logger.exception("[PoseEstimator] Failed to load FaceMesh: %s", exc)

    @property
    def is_ready(self) -> bool:
        """Return True if the estimator is loaded and ready."""

        return self._ready and self._face_mesh is not None

    def estimate(self, frame: np.ndarray, camera_id: str, frame_index: int) -> PoseResult:
        """Estimate head pose and classify direction for a single frame."""

        started = time.perf_counter()
        ts = time.time()

        if not self.is_ready:
            return PoseResult(
                camera_id=camera_id,
                frame_index=frame_index,
                timestamp=ts,
                direction=DIRECTION_NORMAL,
                yaw=0.0,
                pitch=0.0,
                confidence=0.0,
                face_detected=False,
                inference_ms=0.0,
                had_error=True,
                error_msg="pose_estimator_not_ready",
            )

        try:
            frame_h, frame_w = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self._face_mesh.process(rgb)  # type: ignore[union-attr]

            if not results.multi_face_landmarks:
                return PoseResult(
                    camera_id=camera_id,
                    frame_index=frame_index,
                    timestamp=ts,
                    direction=DIRECTION_NORMAL,
                    yaw=0.0,
                    pitch=0.0,
                    confidence=0.0,
                    face_detected=False,
                    inference_ms=(time.perf_counter() - started) * 1000.0,
                    had_error=False,
                    error_msg="",
                )

            face = results.multi_face_landmarks[0]
            lm = face.landmark

            indices = (
                NOSE_TIP_LANDMARK,
                CHIN_LANDMARK,
                LEFT_EYE_LANDMARK,
                RIGHT_EYE_LANDMARK,
                LEFT_MOUTH_LANDMARK,
                RIGHT_MOUTH_LANDMARK,
            )

            image_points = np.array(
                [
                    (lm[i].x * frame_w, lm[i].y * frame_h)
                    for i in indices
                ],
                dtype=np.float64,
            )

            focal_length = float(frame_w)
            center = (frame_w / 2.0, frame_h / 2.0)
            camera_matrix = np.array(
                [
                    [focal_length, 0.0, center[0]],
                    [0.0, focal_length, center[1]],
                    [0.0, 0.0, 1.0],
                ],
                dtype=np.float64,
            )

            dist_coeffs = np.zeros((4, 1), dtype=np.float64)

            ok, rotation_vector, translation_vector = cv2.solvePnP(
                MODEL_POINTS_3D,
                image_points,
                camera_matrix,
                dist_coeffs,
                flags=cv2.SOLVEPNP_ITERATIVE,
            )

            if not ok:
                return PoseResult(
                    camera_id=camera_id,
                    frame_index=frame_index,
                    timestamp=ts,
                    direction=DIRECTION_NORMAL,
                    yaw=0.0,
                    pitch=0.0,
                    confidence=1.0,
                    face_detected=True,
                    inference_ms=(time.perf_counter() - started) * 1000.0,
                    had_error=True,
                    error_msg="solvepnp_failed",
                )

            rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
            projection_matrix = np.hstack(
                [rotation_matrix, np.zeros((3, 1), dtype=np.float64)]
            )
            _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(projection_matrix)

            pitch = float(euler_angles[0][0])
            yaw = float(euler_angles[1][0])

            if yaw < -self.yaw_threshold:
                direction = DIRECTION_LOOK_LEFT
            elif yaw > self.yaw_threshold:
                direction = DIRECTION_LOOK_RIGHT
            elif pitch < -self.pitch_threshold:
                direction = DIRECTION_LOOK_UP
            else:
                direction = DIRECTION_NORMAL

            # FaceMesh doesn't expose a stable per-face detection score.
            confidence = 1.0

            return PoseResult(
                camera_id=camera_id,
                frame_index=frame_index,
                timestamp=ts,
                direction=direction,
                yaw=yaw,
                pitch=pitch,
                confidence=confidence,
                face_detected=True,
                inference_ms=(time.perf_counter() - started) * 1000.0,
                had_error=False,
                error_msg="",
            )
        except Exception as exc:  # noqa: BLE001 - never raise from estimate()
            logger.exception("[PoseEstimator] estimate() failed: %s", exc)
            return PoseResult(
                camera_id=camera_id,
                frame_index=frame_index,
                timestamp=ts,
                direction=DIRECTION_NORMAL,
                yaw=0.0,
                pitch=0.0,
                confidence=0.0,
                face_detected=False,
                inference_ms=(time.perf_counter() - started) * 1000.0,
                had_error=True,
                error_msg=str(exc),
            )

    def annotate_frame(self, frame: np.ndarray, result: PoseResult) -> np.ndarray:
        """Return an annotated copy of `frame` with pose text overlay."""

        try:
            out = frame.copy()
            color = (0, 255, 0) if not result.is_suspicious else (0, 0, 255)
            lines = [
                f"pose: {result.direction}",
                f"yaw: {result.yaw:.1f} deg",
                f"pitch: {result.pitch:.1f} deg",
            ]
            x, y = 10, 25
            for i, text in enumerate(lines):
                cv2.putText(
                    out,
                    text,
                    (x, y + i * 22),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    color,
                    2,
                    cv2.LINE_AA,
                )
            return out
        except Exception as exc:  # noqa: BLE001 - never raise from annotate_frame()
            logger.exception("[PoseEstimator] annotate_frame() failed: %s", exc)
            return frame

