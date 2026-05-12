"""Single-image inference for /analyze-image (loads classifier lazily per model_file)."""

from __future__ import annotations

import base64
import logging
import sys
from pathlib import Path

import cv2
import numpy as np

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

import proctoring as _p  # noqa: E402

logger = logging.getLogger(__name__)

_loaded_models: dict[str, bool] = {}


def _ensure_classifier(model_dir: str, model_file: str) -> None:
    if _loaded_models.get(model_file):
        return
    _p.load_models(model_dir, model_file)
    _loaded_models.clear()
    _loaded_models[model_file] = True


def analyze_image_bytes(
    image_bytes: bytes,
    *,
    model_dir: str,
    model_file: str,
) -> dict:
    _ensure_classifier(model_dir, model_file)

    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("could not decode image")

    H, W = frame.shape[:2]
    DIAG = (W**2 + H**2) ** 0.5

    yolo = _p.yolo
    pose_yolo = _p.pose_yolo

    det = yolo.predict(frame, conf=_p.YOLO_CONF, verbose=False)
    person_boxes: list[tuple[int, int, int, int]] = []
    object_boxes: list[tuple[str, int, int, int, int]] = []
    suspicious_labels: list[str] = []

    for r in det:
        if r.boxes is None:
            continue
        for box in r.boxes:
            cls_id = int(box.cls[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            x1, y1, x2, y2 = max(0, x1), max(0, y1), min(W, x2), min(H, y2)
            if cls_id == 0:
                person_boxes.append((x1, y1, x2, y2))
            elif cls_id in _p.SUSPICIOUS:
                lbl = _p.SUSPICIOUS[cls_id]
                object_boxes.append((lbl, x1, y1, x2, y2))
                suspicious_labels.append(lbl)
                cv2.rectangle(frame, (x1, y1), (x2, y2), _p.ORANGE, 2)
                _p.draw_text(frame, lbl, (x1, y1 - 6), _p.ORANGE)

    pose_res = pose_yolo.predict(frame, verbose=False)
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

    persons_out: list[dict] = []
    cheating_n = 0
    ok_n = 0

    for idx, (px1, py1, px2, py2) in enumerate(person_boxes):
        reasons: list[str] = []
        roi = frame[py1:py2, px1:px2]
        if roi.size == 0:
            continue

        obj_near = False
        obj_name = ""
        for olbl, ox1, oy1, ox2, oy2 in object_boxes:
            if _p.object_proximity((px1, py1, px2, py2), (ox1, oy1, ox2, oy2), DIAG):
                obj_near = True
                obj_name = olbl
                reasons.append(f"{olbl} nearby")
                break

        kp = get_nearest_keypoints(px1, py1, px2, py2)
        direction = _p.get_direction_from_keypoints(kp) if kp is not None else "FRONT"
        if direction != "FRONT":
            reasons.append(f"looking {direction}")

        pred, cheat_prob_cheat, _ = _p.classify_roi(roi)
        cheat_prob = float(cheat_prob_cheat)
        clf_flag = cheat_prob >= _p.CLF_THRESHOLD
        if clf_flag:
            reasons.append(f"clf {cheat_prob:.0%}")

        behav_flag = obj_near or (direction != "FRONT")
        cheating = clf_flag or (cheat_prob >= 0.80) or (clf_flag and behav_flag)
        verdict = "CHEATING" if cheating else "OK"
        if cheating:
            cheating_n += 1
        else:
            ok_n += 1

        col = _p.RED if cheating else _p.GREEN
        label = "! CHEATING" if cheating else "OK"
        cv2.rectangle(frame, (px1, py1), (px2, py2), col, 2)
        cv2.rectangle(frame, (px1, py1 - 22), (px2, py1), col, -1)
        cv2.putText(
            frame,
            f"P{idx} | {label}",
            (px1 + 4, py1 - 6),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            _p.WHITE,
            1,
            cv2.LINE_AA,
        )

        persons_out.append(
            {
                "person_index": idx,
                "verdict": verdict,
                "cheat_prob": cheat_prob,
                "direction": direction,
                "obj_nearby": obj_near,
                "obj_name": obj_name,
                "reasons": reasons,
                "bbox": [px1, py1, px2, py2],
            }
        )

    ok_enc, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    b64 = base64.b64encode(buf.tobytes()).decode("ascii") if ok_enc else ""

    return {
        "model_used": model_file,
        "image_width": W,
        "image_height": H,
        "annotated_image_b64": b64,
        "persons": persons_out,
        "summary": {
            "total_persons": len(persons_out),
            "cheating_count": cheating_n,
            "ok_count": ok_n,
            "suspicious_objects": sorted(set(suspicious_labels)),
        },
    }
