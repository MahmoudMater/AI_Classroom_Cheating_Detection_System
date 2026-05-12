# ════════════════════════════════════════════════════════════════════
#  YOLO Real-Time Proctoring Pipeline — Local Version (Python 3.11)
# ════════════════════════════════════════════════════════════════════

import os
import csv
import time
from collections import defaultdict, deque
from datetime import datetime

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms
from ultralytics import YOLO

# ── CONFIG — Edit these paths ────────────────────────────────────────
DRIVE_MODELS = r"C:\Users\Mariam\saved_models"  # ← CHANGE THIS
BEST_MODEL_FILE = "cnn_cheating_model.pth"

SOURCE = 0  # 0 = default webcam | use "path/to/video.mp4" for a file

OUTPUT_DIR = "proctoring_output"
LOG_PATH = "proctoring_events.csv"

# ── Constants ────────────────────────────────────────────────────────
CLASS_NAMES = ["cheating", "not_cheating"]
IMG_SIZE = (224, 224)
CLF_MEAN = [0.5, 0.5, 0.5]
CLF_STD = [0.5, 0.5, 0.5]
BEST_MODEL_NAME = "Custom CNN"

SUSPICIOUS = {67: "phone", 73: "book", 63: "laptop", 84: "notebook"}
YOLO_CONF = 0.45
PROXIMITY_FRAC = 0.20
CLF_THRESHOLD = 0.55
CLF_EVERY_N = 3
DIRECTION_PATIENCE = 4

HEAD_L = 0.38
HEAD_R = 0.62
HEAD_DOWN = 0.68
GAZE_L = 0.35
GAZE_R = 0.65

GREEN = (0, 210, 0)
RED = (0, 0, 220)
ORANGE = (0, 140, 255)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
YELLOW = (0, 210, 255)

# ── Model globals (set by load_models) ───────────────────────────────
device = None
clf = None
CLF_TRANSFORM = None
yolo = None
pose_yolo = None


# ── Custom CNN Architecture ──────────────────────────────────────────
class CustomCNN(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
        )
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(64, num_classes),
        )

    def forward(self, x):
        return self.classifier(self.pool(self.features(x)))


def load_models(model_dir: str, best_model_file: str) -> None:
    """Load CNN + YOLO weights into module globals. Safe to call once per process/worker."""
    global device, clf, CLF_TRANSFORM, yolo, pose_yolo

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    model_path = os.path.join(model_dir, best_model_file)
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"❌  Model not found: {model_path}\n   Download cnn_cheating_model.pth from your Google Drive."
        )

    clf = CustomCNN().to(device)
    try:
        state = torch.load(model_path, map_location=device, weights_only=True)
    except TypeError:
        state = torch.load(model_path, map_location=device)
    clf.load_state_dict(state)
    clf.eval()
    print(f"✅  Classifier loaded: {model_path}")

    CLF_TRANSFORM = transforms.Compose(
        [
            transforms.Resize(IMG_SIZE),
            transforms.ToTensor(),
            transforms.Normalize(mean=CLF_MEAN, std=CLF_STD),
        ]
    )

    yolo = YOLO("yolov8n.pt")
    pose_yolo = YOLO("yolov8n-pose.pt")
    print("✅  YOLO models loaded")


@torch.no_grad()
def classify_roi(bgr_crop):
    rgb = cv2.cvtColor(bgr_crop, cv2.COLOR_BGR2RGB)
    tensor = CLF_TRANSFORM(Image.fromarray(rgb)).unsqueeze(0).to(device)
    probs = F.softmax(clf(tensor), dim=1).cpu().numpy()[0]
    return int(probs.argmax()), float(probs[0]), float(probs[1])


# ── Helpers ──────────────────────────────────────────────────────────
def draw_text(frame, text, pos, color=WHITE, scale=0.55, thick=1):
    cv2.putText(frame, text, pos, cv2.FONT_HERSHEY_SIMPLEX, scale, BLACK, thick + 2, cv2.LINE_AA)
    cv2.putText(frame, text, pos, cv2.FONT_HERSHEY_SIMPLEX, scale, color, thick, cv2.LINE_AA)


def object_proximity(p_box, o_box, diag, thresh=PROXIMITY_FRAC):
    pc = ((p_box[0] + p_box[2]) / 2, (p_box[1] + p_box[3]) / 2)
    oc = ((o_box[0] + o_box[2]) / 2, (o_box[1] + o_box[3]) / 2)
    d = ((pc[0] - oc[0]) ** 2 + (pc[1] - oc[1]) ** 2) ** 0.5
    return d < thresh * diag


def get_direction_from_keypoints(keypoints):
    direction = "FRONT"
    nose, left_ear, right_ear = keypoints[0], keypoints[3], keypoints[4]
    left_sh, right_sh = keypoints[5], keypoints[6]
    if nose[2] > 0.3 and left_sh[2] > 0.3 and right_sh[2] > 0.3:
        sh_span = abs(left_sh[0] - right_sh[0]) + 1e-6
        norm_x = (nose[0] - right_sh[0]) / sh_span
        mid_y = (left_sh[1] + right_sh[1]) / 2
        if norm_x < HEAD_L:
            direction = "LEFT"
        elif norm_x > HEAD_R:
            direction = "RIGHT"
        elif nose[1] > mid_y * HEAD_DOWN:
            direction = "DOWN"
    if left_ear[2] > 0.3 and right_ear[2] > 0.3:
        ear_ratio = (nose[0] - right_ear[0]) / (left_ear[0] - right_ear[0] + 1e-6)
        if ear_ratio < GAZE_L:
            direction = "GAZE LEFT"
        elif ear_ratio > GAZE_R:
            direction = "GAZE RIGHT"
    elif left_ear[2] > 0.3 and right_ear[2] < 0.2:
        direction = "GAZE RIGHT"
    elif right_ear[2] > 0.3 and left_ear[2] < 0.2:
        direction = "GAZE LEFT"
    return direction


def log_event(pid, verdict, cheat_p, direction, obj_near, obj_name, reasons):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_PATH, "a", newline="") as f:
        csv.writer(f).writerow(
            [
                ts,
                pid,
                "CHEATING" if verdict else "OK",
                f"{cheat_p:.4f}",
                direction,
                obj_near,
                obj_name,
                " | ".join(reasons),
            ]
        )


# ── Person State ─────────────────────────────────────────────────────
class PersonState:
    __slots__ = [
        "dir_timer",
        "direction",
        "clf_pred",
        "cheat_prob",
        "cheating",
        "obj_near",
        "obj_name",
        "reasons",
        "frame_count",
    ]

    def __init__(self):
        self.dir_timer = 0
        self.direction = "FRONT"
        self.clf_pred = 1
        self.cheat_prob = 0.0
        self.cheating = False
        self.obj_near = False
        self.obj_name = ""
        self.reasons = []
        self.frame_count = 0


if __name__ == "__main__":
    load_models(DRIVE_MODELS, BEST_MODEL_FILE)

    with open(LOG_PATH, "w", newline="") as f:
        csv.writer(f).writerow(
            ["timestamp", "person_id", "verdict", "cheat_prob", "direction", "obj_nearby", "obj_name", "reasons"]
        )

    states = defaultdict(PersonState)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    cap = cv2.VideoCapture(SOURCE)
    if not cap.isOpened():
        raise RuntimeError(f"❌  Cannot open source: {SOURCE}")

    fps_cap = cap.get(cv2.CAP_PROP_FPS) or 30.0
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    DIAG = (W**2 + H**2) ** 0.5

    out_vid = cv2.VideoWriter(
        os.path.join(OUTPUT_DIR, "annotated.avi"),
        cv2.VideoWriter_fourcc(*"XVID"),
        fps_cap,
        (W, H),
    )

    fps_q = deque(maxlen=30)
    prev_t = time.time()
    frame_idx = 0

    print(f"▶  Pipeline started | {W}×{H} | Press Q to quit, S to snapshot")
    cv2.namedWindow("AI Proctoring", cv2.WINDOW_NORMAL)

    while True:
        ret, frame = cap.read()
        if not ret:
            print("⏹  Stream ended.")
            break

        frame_idx += 1
        now = time.time()
        fps_q.append(1 / (now - prev_t + 1e-9))
        prev_t = now

        yolo_res = yolo.track(frame, persist=True, conf=YOLO_CONF, verbose=False)
        person_boxes = []
        object_boxes = []

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
                elif cls_id in SUSPICIOUS:
                    object_boxes.append((SUSPICIOUS[cls_id], x1, y1, x2, y2))
                    cv2.rectangle(frame, (x1, y1), (x2, y2), ORANGE, 2)
                    draw_text(frame, SUSPICIOUS[cls_id], (x1, y1 - 6), ORANGE)

        pose_res = pose_yolo(frame, verbose=False)
        pose_keypoints = []
        if pose_res and pose_res[0].keypoints is not None:
            kp_data = pose_res[0].keypoints.data
            for i in range(kp_data.shape[0]):
                pose_keypoints.append(kp_data[i].cpu().numpy())

        def get_nearest_keypoints(px1, py1, px2, py2):
            for kp in pose_keypoints:
                nx, ny = kp[0][0], kp[0][1]
                if px1 <= nx <= px2 and py1 <= ny <= py2:
                    return kp
            return None

        n_cheat = 0
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
                if object_proximity((px1, py1, px2, py2), (ox1, oy1, ox2, oy2), DIAG):
                    st.obj_near = True
                    st.obj_name = olbl
                    st.reasons.append(f"{olbl} nearby")
                    break

            kp = get_nearest_keypoints(px1, py1, px2, py2)
            st.direction = get_direction_from_keypoints(kp) if kp is not None else "FRONT"

            if st.direction != "FRONT":
                st.dir_timer += 1
                if st.dir_timer >= DIRECTION_PATIENCE:
                    st.reasons.append(f"looking {st.direction}")
            else:
                st.dir_timer = max(0, st.dir_timer - 1)

            if kp is not None:
                for idx in [0, 3, 4, 5, 6]:
                    x, y, conf = kp[idx]
                    if conf > 0.3:
                        cv2.circle(frame, (int(x), int(y)), 4, (200, 200, 200), -1)

            if frame_idx % CLF_EVERY_N == 0:
                pred, cp, _ = classify_roi(roi)
                st.clf_pred = pred
                st.cheat_prob = cp

            clf_flag = st.cheat_prob >= CLF_THRESHOLD
            if clf_flag:
                st.reasons.append(f"clf {st.cheat_prob:.0%}")

            behav_flag = st.dir_timer >= DIRECTION_PATIENCE or st.obj_near
            st.cheating = clf_flag or (st.cheat_prob >= 0.80) or (clf_flag and behav_flag)

            if st.cheating:
                n_cheat += 1
                log_event(pid, True, st.cheat_prob, st.direction, st.obj_near, st.obj_name, st.reasons)

            col = RED if st.cheating else GREEN
            label = "! CHEATING" if st.cheating else "OK"
            cv2.rectangle(frame, (px1, py1), (px2, py2), col, 2)
            cv2.rectangle(frame, (px1, py1 - 22), (px2, py1), col, -1)
            cv2.putText(
                frame,
                f"P{pid} | {label}",
                (px1 + 4, py1 - 6),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                WHITE,
                1,
                cv2.LINE_AA,
            )
            iy = py2 + 16
            draw_text(frame, f"Dir: {st.direction}", (px1, iy), YELLOW)
            draw_text(frame, f"Clf: {st.cheat_prob:.0%} cheat", (px1, iy + 18), RED if clf_flag else GREEN)
            if st.obj_near:
                draw_text(frame, f"Obj: {st.obj_name} nearby!", (px1, iy + 36), ORANGE)

        ov = frame.copy()
        cv2.rectangle(ov, (0, 0), (320, 95), BLACK, -1)
        cv2.addWeighted(ov, 0.45, frame, 0.55, 0, frame)
        draw_text(frame, f"AI Proctoring | {BEST_MODEL_NAME}", (8, 18), WHITE, 0.52)
        draw_text(frame, f"FPS: {np.mean(fps_q):.1f}", (8, 38), YELLOW, 0.52)
        draw_text(frame, f"Persons: {len(person_boxes)}  Cheating: {n_cheat}", (8, 58), WHITE, 0.52)
        draw_text(frame, datetime.now().strftime("%H:%M:%S"), (8, 78), WHITE, 0.52)

        out_vid.write(frame)
        cv2.imshow("AI Proctoring", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            print("⏹  Quit by user.")
            break
        elif key == ord("s"):
            snap = os.path.join(OUTPUT_DIR, f"snap_{frame_idx}.jpg")
            cv2.imwrite(snap, frame)
            print(f"📸  Snapshot saved: {snap}")

    cap.release()
    out_vid.release()
    cv2.destroyAllWindows()
    print(f"\n✅  Done.\n   Video: {OUTPUT_DIR}/annotated.avi\n   Log:   {LOG_PATH}")
