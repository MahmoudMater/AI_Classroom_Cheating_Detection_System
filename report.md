---
## AUDIT REPORT

### ✅ Files that are correct
- `ai-service/app/core/config.py`
- `ai-service/app/services/backend_client.py` (single POST + JSON handling works; retry is missing but not a crash)
- `ai-service/app/api/routes_health.py`
- `ai-service/app/api/routes_infer.py`
- `ai-service/app/api/routes_monitor.py`

### 🐛 Bugs found (will crash at runtime)
1.  
  FILE: `ai-service/app/services/pipeline.py`  
  LINE: ~32  
  ISSUE: Unconditional import `from app.models.pose_estimator import PoseEstimator, PoseResult` will crash app startup if `mediapipe`/`opencv-python(-headless)`/`numpy` are not installed (and they are not present in `requirements.txt`).  
  FIX: Make pose-estimator an optional import (similar to `ObjectDetector`), or move the import inside `load_models()` with `try/except` so Model 1 can run even if Model 2 deps are missing.

2.  
  FILE: `ai-service/app/main.py`  
  LINE: ~29  
  ISSUE: `app.run(... debug=True)` leaves Flask reloader enabled by default. Your instructions explicitly say `use_reloader=False` is required because reloader breaks background threads/worker lifecycle.  
  FIX: Change `app.run(..., use_reloader=False, debug=...)` and ensure any worker startup is not duplicated.

### ⚠️ Warnings (won't crash but are wrong or risky)
1.  
  FILE: `ai-service/app/core/state.py`  
  LINE: ~1-3  
  ISSUE: `ACTIVE_MONITORS` is just a plain dict with no locking/thread-safety, and there is no `app_state` singleton, no `deque maxlen`, and no worker/FPS shared-state structure as required by the audit checklist.  
  FIX: Replace/extend state to include a proper thread-safe singleton (locks), and the expected counters/FPS/deques.

2.  
  FILE: `ai-service/app/services/backend_client.py`  
  LINE: ~5-16  
  ISSUE: No retry loop / no queue/backoff logic; `timeout=5` contradicts checklist guidance (`timeout=2` mentioned).  
  FIX: Implement a small retry/backoff mechanism (without busy-spin) and tune timeout.

3.  
  FILE: `ai-service/app/services/inference.py`  
  LINE: ~1-20  
  ISSUE: `run_mock_inference()` is a placeholder and not real YOLO inference, so Model 1 behavior is not actually implemented.  
  FIX: Wire inference to Model 1 object detector and (optionally) Model 2.

4.  
  FILE: `ai-service/app/services/pipeline.py`  
  LINE: ~67-233  
  ISSUE: Pipeline is incomplete relative to the checklist: missing stream loop (`_run()`), stop/join logic, FPS stats updates, cooldown/global worker registration, seat resolution, and correct concurrent worker structure. Also `_process_frame()` spins up a new `ThreadPoolExecutor` per frame (inefficient).  
  FIX: Implement the missing worker orchestration pieces to match the checklist (load/register/start/stop/update FPS; handle cap.read loop; avoid per-frame executor recreation).

5.  
  FILE: `ai-service/app/services/pipeline.py`  
  LINE: ~90-104  
  ISSUE: Attempts `from app.core.config import config as _cfg` but `core/config.py` only defines `class Config` (no `config` singleton). This is caught, so it won’t crash, but it’s incorrect.  
  FIX: Remove the unused first branch and only use `Config`.

6.  
  FILE: `ai-service/app/services/pipeline.py`  
  LINE: ~213-221  
  ISSUE: Payload hardcodes `"seat_block": "unknown"` and ignores `StreamContext.seat_block`; also `_object_detector` result is ignored (`pass`), so no alerting based on Model 1 detections is implemented.  
  FIX: Use `StreamContext.seat_block` and implement handling for object detector outputs.

7.  
  FILE: `ai-service/app/api/routes_* .py`  
  LINE: various  
  ISSUE: Missing explicit return type hints and no module-level docstrings (per your later style requirements).  
  FIX: Add module docstrings and type hints; switch any debug prints to `logging.getLogger(__name__)` (routes currently don’t print, so this is mostly doc/type hygiene).

8.  
  FILE: `ai-service/app/services/pipeline.py`  
  LINE: ~55-61  
  ISSUE: `_save_snapshot()` assumes `SNAPSHOTS_DIR` exists/should be created (it does via `_ensure_dir`), but it never checks `cv2.imwrite` success.  
  FIX: Log/handle write failures gracefully.

### 📦 Requirements issues
- `ai-service/requirements.txt` contains only:
  - `Flask==3.1.0`
  - `python-dotenv==1.0.1`
  - `requests==2.32.3`
- Missing packages required by the code:
  - `numpy`
  - `opencv-python-headless` (or `opencv-python`)
  - `mediapipe`
  - YOLO dependencies (`ultralytics`, and typically `torch`/`torchvision`)
- Because of the missing packages, importing `pose_estimator.py` (mediapipe/cv2/numpy) will fail, which in turn breaks `pipeline.py` startup as noted in the “will crash” section.

Recommended next step (after the report): rewrite `ai-service/requirements.txt` with compatible versions (especially `torch`/`torchvision` and `mediapipe` vs Python/numpy).

### 🗂️ Missing files
- `ai-service/app/models/object_detector.py` is missing, but:
  - `pipeline.py` expects `app.models.object_detector.ObjectDetector` (wrapped in try/except, so it doesn’t crash)
  - your checklist requires auditing and making Model 1 production-ready.

### 📋 What models are implemented so far
  - Model 1 (YOLO object detection): `MISSING`
    Reason: `object_detector.py` does not exist and `run_mock_inference()` is not real YOLO.
  - Model 2 (Head pose / gaze): `PARTIAL`
    Reason: `pose_estimator.py` exists and is functionally implemented, but the pipeline/state/orchestration around it is incomplete, and dependencies are not declared in `requirements.txt`.

### 🔢 Overall health score
4 / 12 files are production-ready as-is.
---

