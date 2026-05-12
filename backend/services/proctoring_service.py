from __future__ import annotations

import base64
import logging
import sys
import threading
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

from services.event_store import save_event_sync, update_exam_session_sync
from services.frame_broadcaster import FrameBroadcaster

logger = logging.getLogger(__name__)

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

import proctoring as _p  # noqa: E402


class ProctoringService:
    def __init__(
        self,
        session_id: uuid.UUID,
        source: str,
        model_dir: str,
        model_file: str,
        log_csv_path: str,
        output_video_path: str,
        frame_broadcaster: FrameBroadcaster,
        jpeg_quality: int,
    ) -> None:
        self.session_id = session_id
        self._source = source
        self._model_file = model_file
        self._log_csv_path = log_csv_path
        self._output_video_path = output_video_path
        self._frame_broadcaster = frame_broadcaster
        self._jpeg_quality = jpeg_quality

        _p.load_models(model_dir, model_file)

        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()

    def set_source(self, source: str) -> None:
        """Update capture source before the next ``start()`` (e.g. after upload)."""
        self._source = source

    @property
    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def start(self) -> None:
        if self.is_running:
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, name=f"proctor-{self.session_id}", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=5.0)
            self._thread = None

    def _parse_source(self) -> int | str:
        s = self._source.strip()
        if s == "0":
            return 0
        try:
            return int(s)
        except ValueError:
            return s

    def _run(self) -> None:
        sid_str = str(self.session_id)
        states: defaultdict[int, _p.PersonState] = defaultdict(_p.PersonState)
        source = self._parse_source()

        Path(self._output_video_path).parent.mkdir(parents=True, exist_ok=True)

        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            logger.error("Cannot open source: %s", source)
            update_exam_session_sync(self.session_id, status="error")
            self._frame_broadcaster.broadcast_sync(
                sid_str,
                {"type": "status", "status": "error", "message": f"Cannot open source: {source}"},
            )
            return

        fps_cap = cap.get(cv2.CAP_PROP_FPS) or 30.0
        W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        DIAG = (W**2 + H**2) ** 0.5

        out_vid = cv2.VideoWriter(
            self._output_video_path,
            cv2.VideoWriter_fourcc(*"XVID"),
            fps_cap,
            (W, H),
        )

        fps_q: deque[float] = deque(maxlen=30)
        prev_t = time.time()
        frame_idx = 0
        yolo = _p.yolo
        pose_yolo = _p.pose_yolo

        try:
            while not self._stop_event.is_set():
                ret, frame = cap.read()
                if not ret:
                    break

                frame_idx += 1
                now = time.time()
                fps_q.append(1 / (now - prev_t + 1e-9))
                prev_t = now
                fps_val = float(np.mean(fps_q)) if fps_q else 0.0

                yolo_res = yolo.track(frame, persist=True, conf=_p.YOLO_CONF, verbose=False)
                person_boxes: list[tuple[int, int, int, int, int]] = []
                object_boxes: list[tuple[str, int, int, int, int]] = []

                for r in yolo_res:
                    if r.boxes is None:
                        continue
                    for box in r.boxes:
                        cls_id = int(box.cls[0])
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        x1, y1, x2, y2 = max(0, x1), max(0, y1), min(W, x2), min(H, y2)
                        tid = int(box.id[0]) if box.id is not None else -(frame_idx * 1000 + len(person_boxes))
                        if cls_id == 0:
                            person_boxes.append((tid, x1, y1, x2, y2))
                        elif cls_id in _p.SUSPICIOUS:
                            object_boxes.append((_p.SUSPICIOUS[cls_id], x1, y1, x2, y2))
                            cv2.rectangle(frame, (x1, y1), (x2, y2), _p.ORANGE, 2)
                            _p.draw_text(frame, _p.SUSPICIOUS[cls_id], (x1, y1 - 6), _p.ORANGE)

                pose_res = pose_yolo(frame, verbose=False)
                pose_keypoints: list = []
                if pose_res and pose_res[0].keypoints is not None:
                    kp_data = pose_res[0].keypoints.data
                    for i in range(kp_data.shape[0]):
                        pose_keypoints.append(kp_data[i].cpu().numpy())

                def get_nearest_keypoints(px1: int, py1: int, px2: int, py2: int):
                    for kp in pose_keypoints:
                        nx, ny = kp[0][0], kp[0][1]
                        if px1 <= nx <= px2 and py1 <= ny <= py2:
                            return kp
                    return None

                n_cheat = 0
                persons_payload: list[dict] = []

                for (pid, px1, py1, px2, py2) in person_boxes:
                    st = states[pid]
                    st.frame_count += 1
                    st.reasons = []
                    roi = frame[py1:py2, px1:px2]
                    if roi.size == 0:
                        continue

                    st.obj_near = False
                    st.obj_name = ""
                    for (olbl, ox1, oy1, ox2, oy2) in object_boxes:
                        if _p.object_proximity((px1, py1, px2, py2), (ox1, oy1, ox2, oy2), DIAG):
                            st.obj_near = True
                            st.obj_name = olbl
                            st.reasons.append(f"{olbl} nearby")
                            break

                    kp = get_nearest_keypoints(px1, py1, px2, py2)
                    st.direction = _p.get_direction_from_keypoints(kp) if kp is not None else "FRONT"

                    if st.direction != "FRONT":
                        st.dir_timer += 1
                        if st.dir_timer >= _p.DIRECTION_PATIENCE:
                            st.reasons.append(f"looking {st.direction}")
                    else:
                        st.dir_timer = max(0, st.dir_timer - 1)

                    if kp is not None:
                        for idx in [0, 3, 4, 5, 6]:
                            x, y, conf = kp[idx]
                            if conf > 0.3:
                                cv2.circle(frame, (int(x), int(y)), 4, (200, 200, 200), -1)

                    if frame_idx % _p.CLF_EVERY_N == 0:
                        pred, cp, _ = _p.classify_roi(roi)
                        st.clf_pred = pred
                        st.cheat_prob = cp

                    clf_flag = st.cheat_prob >= _p.CLF_THRESHOLD
                    if clf_flag:
                        st.reasons.append(f"clf {st.cheat_prob:.0%}")

                    behav_flag = st.dir_timer >= _p.DIRECTION_PATIENCE or st.obj_near
                    st.cheating = clf_flag or (st.cheat_prob >= 0.80) or (clf_flag and behav_flag)

                    if st.cheating:
                        n_cheat += 1
                        try:
                            save_event_sync(
                                self.session_id,
                                self._log_csv_path,
                                person_id=pid,
                                verdict="CHEATING",
                                cheat_prob=st.cheat_prob,
                                direction=st.direction,
                                obj_nearby=st.obj_near,
                                obj_name=st.obj_name or None,
                                reasons=list(st.reasons),
                                frame_index=frame_idx,
                            )
                        except Exception as e:
                            logger.exception("save_event_sync failed: %s", e)

                    col = _p.RED if st.cheating else _p.GREEN
                    label = "! CHEATING" if st.cheating else "OK"
                    cv2.rectangle(frame, (px1, py1), (px2, py2), col, 2)
                    cv2.rectangle(frame, (px1, py1 - 22), (px2, py1), col, -1)
                    cv2.putText(
                        frame,
                        f"P{pid} | {label}",
                        (px1 + 4, py1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        _p.WHITE,
                        1,
                        cv2.LINE_AA,
                    )
                    iy = py2 + 16
                    _p.draw_text(frame, f"Dir: {st.direction}", (px1, iy), _p.YELLOW)
                    _p.draw_text(
                        frame,
                        f"Clf: {st.cheat_prob:.0%} cheat",
                        (px1, iy + 18),
                        _p.RED if clf_flag else _p.GREEN,
                    )
                    if st.obj_near:
                        _p.draw_text(frame, f"Obj: {st.obj_name} nearby!", (px1, iy + 36), _p.ORANGE)

                    persons_payload.append(
                        {
                            "id": pid,
                            "verdict": "CHEATING" if st.cheating else "OK",
                            "cheat_prob": float(st.cheat_prob),
                            "direction": st.direction,
                            "obj_nearby": bool(st.obj_near),
                            "obj_name": st.obj_name or "",
                            "reasons": list(st.reasons),
                            "bbox": [px1, py1, px2, py2],
                        }
                    )

                ov = frame.copy()
                cv2.rectangle(ov, (0, 0), (320, 95), _p.BLACK, -1)
                cv2.addWeighted(ov, 0.45, frame, 0.55, 0, frame)
                _p.draw_text(frame, f"AI Proctoring | {_p.BEST_MODEL_NAME}", (8, 18), _p.WHITE, 0.52)
                _p.draw_text(frame, f"FPS: {fps_val:.1f}", (8, 38), _p.YELLOW, 0.52)
                _p.draw_text(
                    frame,
                    f"Persons: {len(person_boxes)}  Cheating: {n_cheat}",
                    (8, 58),
                    _p.WHITE,
                    0.52,
                )
                _p.draw_text(frame, datetime.now().strftime("%H:%M:%S"), (8, 78), _p.WHITE, 0.52)

                out_vid.write(frame)

                ok, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), self._jpeg_quality])
                frame_b64 = base64.b64encode(buf.tobytes()).decode("ascii") if ok else ""

                ts_iso = datetime.now(timezone.utc).isoformat()
                payload = {
                    "type": "frame",
                    "session_id": sid_str,
                    "frame_index": frame_idx,
                    "fps": fps_val,
                    "timestamp": ts_iso,
                    "frame_b64": frame_b64,
                    "persons": persons_payload,
                    "summary": {
                        "person_count": len(person_boxes),
                        "cheating_count": n_cheat,
                    },
                }
                self._frame_broadcaster.broadcast_sync(sid_str, payload)

            if not self._stop_event.is_set():
                try:
                    update_exam_session_sync(
                        self.session_id,
                        status="stopped",
                        stopped_at=datetime.now(timezone.utc),
                    )
                    self._frame_broadcaster.broadcast_sync(
                        sid_str,
                        {"type": "status", "status": "stopped", "message": "stream ended"},
                    )
                except Exception:
                    logger.exception("Failed to persist stopped status after stream end")

        except Exception as e:
            logger.exception("Proctoring pipeline error: %s", e)
            try:
                update_exam_session_sync(self.session_id, status="error")
            except Exception:
                logger.exception("Failed to persist error status")
            self._frame_broadcaster.broadcast_sync(
                sid_str,
                {"type": "status", "status": "error", "message": str(e)},
            )
        finally:
            cap.release()
            out_vid.release()
