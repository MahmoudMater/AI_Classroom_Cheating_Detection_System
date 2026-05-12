# AI Classroom Cheating Detection System — Full Architecture

**Helwan National University | Neural Networks & Deep Learning**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Data Pipeline (Notebooks 01–02)](#3-data-pipeline-notebooks-0102)
4. [Model Training Architecture (Notebooks 03.1–03.4)](#4-model-training-architecture)
5. [Custom CNN Architecture (Winner)](#5-custom-cnn-architecture-winner)
6. [Model Comparison Results (Notebook 04)](#6-model-comparison-results)
7. [Backend Architecture (FastAPI)](#7-backend-architecture-fastapi)
8. [Real-Time Proctoring Pipeline](#8-real-time-proctoring-pipeline)
9. [Frontend Architecture (Next.js)](#9-frontend-architecture-nextjs)
10. [Frontend User Flows](#10-frontend-user-flows)
11. [Database Schema](#11-database-schema)
12. [WebSocket Protocol](#12-websocket-protocol)
13. [Full Request Flow: Image Upload](#13-full-request-flow-image-upload)
14. [Full Request Flow: Live Session](#14-full-request-flow-live-session)
15. [Decision Engine Logic](#15-decision-engine-logic)
16. [Technology Stack Summary](#16-technology-stack-summary)

---

## 1. Project Overview

The system detects exam cheating in real time using a three-track computer vision pipeline:

- **Track 1 — Object Detection:** YOLOv8n identifies persons and suspicious objects (phone, laptop, book, notebook)
- **Track 2 — Pose Analysis:** YOLOv8n-pose computes head turn direction and gaze using 17 body keypoints
- **Track 3 — CNN Classification:** Custom CNN classifies each person's bounding-box crop as *cheating* or *not_cheating*

All three verdicts feed into a per-person decision engine that emits a final `CHEATING` or `OK` verdict per frame, streamed live to the dashboard over WebSocket.

---

## 2. High-Level System Architecture

```mermaid
graph TB
    subgraph INPUT["📥 Input Sources"]
        A1[🎥 Webcam<br/>source=0]
        A2[📁 Uploaded Video<br/>.mp4 / .avi]
        A3[🖼️ Single Image<br/>JPEG / PNG]
    end

    subgraph FRONTEND["🖥️ Frontend — Next.js + Tailwind"]
        F1[Landing Page<br/>app/page.tsx]
        F2[Dashboard<br/>app/dashboard/page.tsx]
        F3["Session View<br/>app/sessions/[id]/page.tsx"]
        F4[Image Analyze<br/>app/analyze/page.tsx]
        F5[LiveFeed Canvas<br/>WebSocket frames]
        F6[EventLog + Charts<br/>REST polling]
    end

    subgraph BACKEND["⚙️ Backend — FastAPI + PostgreSQL"]
        B1[REST API<br/>/api/v1/*]
        B2["WebSocket<br/>/ws/:sessionId"]
        B3[Session Manager<br/>in-memory dict]
        B4[Frame Broadcaster<br/>asyncio bridge]
        B5[Event Store<br/>SQLAlchemy async]
        B6[PostgreSQL 16<br/>exam_sessions + events]
    end

    subgraph PIPELINE["🤖 CV Pipeline — proctoring.py"]
        P1[YOLOv8n<br/>Person + Object Detection]
        P2[YOLOv8n-pose<br/>17 Keypoint Estimation]
        P3[Custom CNN<br/>ROI Classifier ★]
        P4[Decision Engine<br/>PersonState per ID]
        P5[Frame Annotator<br/>OpenCV draw]
    end

    subgraph MODELS["🧠 Trained Models — saved_models/"]
        M1[cnn_cheating_model.pth<br/>~200K params ★ WINNER]
        M2[resnet18_cheating_model.pth<br/>~11M params]
        M3[efficientnet_cheating.pth<br/>~5.3M params]
        M4[Vision_Transformer.pth<br/>~86M params]
        M5[mobilenetv2_model.pth<br/>~3.4M params]
    end

    A1 --> B3
    A2 --> B1
    A3 --> B1
    F3 --> F5
    F3 --> F6
    F2 --> F3
    F4 --> B1
    F5 <-->|WebSocket JSON + base64 JPEG| B2
    F6 <-->|HTTP REST| B1
    B1 --> B3
    B2 --> B4
    B3 --> PIPELINE
    P1 --> P4
    P2 --> P4
    P3 --> P4
    P4 --> P5
    P5 --> B4
    P4 --> B5
    B4 --> B2
    B5 --> B6
    M1 --> P3
```

---

## 3. Data Pipeline (Notebooks 01–02)

```mermaid
flowchart LR
    subgraph NB01["📓 Notebook 01 — Frame Extraction"]
        V1[exam_videos/<br/>cheating/]
        V2[exam_videos/<br/>not_cheating/]
        E1{Every 5th frame}
        E2{Blur filter<br/>Laplacian ≥ 80}
        E3[Save JPEG<br/>quality=95]
    end

    subgraph NB02["📓 Notebook 02 — Preprocessing"]
        D1[Load dataset_frames/]
        D2[Remove corrupted<br/>cv2.imread == None]
        D3[Remove duplicates<br/>MD5 hash]
        D4[Resize all<br/>224×224 px]
        D5{Random split<br/>seed=42}
        D6[Train 80%]
        D7[Val 10%]
        D8[Test 10%]
    end

    subgraph OUT["💾 Output: dataset_final/"]
        O1[train/<br/>cheating/ + not_cheating/]
        O2[val/<br/>cheating/ + not_cheating/]
        O3[test/<br/>cheating/ + not_cheating/]
    end

    V1 --> E1
    V2 --> E1
    E1 --> E2
    E2 -->|Sharp enough| E3
    E2 -->|Blurry| X1[❌ Skip]
    E3 --> D1
    D1 --> D2 --> D3 --> D4 --> D5
    D5 --> D6 --> O1
    D5 --> D7 --> O2
    D5 --> D8 --> O3
```

**Key parameters:**
| Setting | Value |
|---------|-------|
| Frame skip interval | Every 5th frame |
| Blur threshold (Laplacian variance) | ≥ 80 |
| JPEG quality | 95 |
| Image size | 224 × 224 px |
| Train / Val / Test split | 80% / 10% / 10% |
| Random seed | 42 (reproducible) |
| Classes | `cheating`, `not_cheating` |

---

## 4. Model Training Architecture

All five models share the same training loop and evaluation harness. Differences are in architecture, normalization, and fine-tuning strategy.

```mermaid
flowchart TD
    DS[dataset_final/] --> TF

    subgraph TF["Data Transforms"]
        T1[Resize 224×224]
        T2[Random Horizontal Flip]
        T3[Random Rotation ±10°]
        T4[Color Jitter<br/>brightness, contrast, saturation]
        T5[ToTensor + Normalize]
        T1 --> T2 --> T3 --> T4 --> T5
    end

    TF --> DL[DataLoader<br/>batch=32, shuffle=True]
    DL --> MODEL

    subgraph MODEL["Model Selection"]
        M1[Custom CNN<br/>Norm: 0.5/0.5 ★]
        M2[ResNet18<br/>Norm: ImageNet]
        M3[EfficientNet-B0<br/>Norm: ImageNet]
        M4[ViT-B/16<br/>Norm: ImageNet]
        M5[MobileNetV2<br/>Norm: ImageNet]
    end

    MODEL --> TRAIN

    subgraph TRAIN["Training Loop (20 epochs max)"]
        TR1[CrossEntropyLoss]
        TR2[Adam optimizer<br/>lr=5e-4 or 1e-3, wd=1e-4]
        TR3[ReduceLROnPlateau<br/>factor=0.5, patience=2]
        TR4[Early stopping<br/>patience=5 on val acc]
        TR1 --> TR2 --> TR3 --> TR4
    end

    TRAIN --> EVAL

    subgraph EVAL["Evaluation (test set, 182 images)"]
        EV1[Accuracy + F1-Score]
        EV2[Precision + Recall]
        EV3[ROC-AUC + PR-AUC]
        EV4[Confusion Matrix]
        EV5[Confidence distribution]
    end

    EVAL --> SAVE[Save best .pth<br/>to saved_models/]
```

**Fine-tuning strategies:**

| Model | Strategy |
|-------|----------|
| Custom CNN | Trained from scratch — all layers |
| ResNet18 | Freeze backbone → train FC head → optional full unfreeze |
| EfficientNet-B0 | Freeze features → train classifier → optional full fine-tune |
| ViT-B/16 | Freeze encoder → train head → optional unfreeze last 4 blocks |
| MobileNetV2 | Freeze features → train classifier → optional full fine-tune |

---

## 5. Custom CNN Architecture (Winner)

```mermaid
flowchart LR
    IN["Input<br/>3 × 224 × 224"] --> B1

    subgraph B1["Block 1"]
        C1["Conv2d(3→32, 3×3)<br/>+ BN + ReLU"] --> P1["MaxPool2d(2×2)<br/>→ 32 × 112 × 112"]
    end

    subgraph B2["Block 2"]
        C2["Conv2d(32→64, 3×3)<br/>+ BN + ReLU"] --> P2["MaxPool2d(2×2)<br/>→ 64 × 56 × 56"]
    end

    subgraph B3["Block 3"]
        C3["Conv2d(64→128, 3×3)<br/>+ BN + ReLU"] --> P3["MaxPool2d(2×2)<br/>→ 128 × 28 × 28"]
    end

    subgraph HEAD["Classifier Head"]
        AP["AdaptiveAvgPool2d(1×1)<br/>→ 128 × 1 × 1"] --> FL["Flatten → 128"]
        FL --> L1["Linear(128→64)<br/>+ BN1d + ReLU + Dropout(0.3)"]
        L1 --> L2["Linear(64→2)"]
        L2 --> SM["Softmax<br/>[p_cheating, p_ok]"]
    end

    B1 --> B2 --> B3 --> HEAD
```

**Why Custom CNN won:** Same 97.80% accuracy as models 200–430× larger. ~200K parameters enable real-time inference with negligible GPU load. ROC-AUC of 99.95% on the test set.

---

## 6. Model Comparison Results

*(Test set: 182 images — held-out, never seen during training)*

```mermaid
xychart-beta
    title "Model Accuracy vs Parameter Count"
    x-axis ["Custom CNN", "EfficientNet-B0", "MobileNetV2", "ResNet18", "ViT-B/16"]
    y-axis "Accuracy (%)" 95 --> 100
    bar [97.80, 97.80, 97.80, 97.25, 97.80]
```

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Params |
|-------|----------|-----------|--------|----------|---------|--------|
| **Custom CNN ⭐** | **97.80%** | **97.87%** | **97.83%** | **97.80%** | **99.95%** | **~200K** |
| EfficientNet-B0 | 97.80% | 97.87% | 97.83% | 97.80% | 99.89% | ~5.3M |
| ViT-B/16 | 97.80% | 97.87% | 97.83% | 97.80% | 99.99% | ~86M |
| MobileNetV2 | 97.80% | 97.81% | 97.81% | 97.80% | 99.43% | ~3.4M |
| ResNet18 | 97.25% | 97.25% | 97.25% | 97.25% | 99.86% | ~11M |

> Custom CNN is **430× smaller than ViT** while achieving equivalent accuracy — the clear choice for real-time edge deployment.

---

## 7. Backend Architecture (FastAPI)

> **Note:** Mermaid treats `{` inside node labels as rhombus syntax. Path placeholders use `:id` / `:sessionId` (same meaning as `{id}` in OpenAPI).

```mermaid
flowchart TB
    subgraph ENTRY["🌐 Clients"]
        E1[REST — Next.js<br/>api.ts fetch]
        E2[WebSocket — LiveFeed<br/>useProctoring]
    end

    subgraph MAIN["main.py — FastAPI app"]
        APP[CORS · lifespan · global errors]
    end

    subgraph ROUTERS["Routers — /api/v1/"]
        direction LR
        R1["sessions.py<br/>POST /sessions · GET /sessions<br/>POST /:id/start · stop · DELETE /:id"]
        R2["events.py<br/>GET /:id/events · summary · export"]
        R3["stream.py<br/>WS /ws/:sessionId"]
        R4[health.py · GET /health]
        R5[models_router · GET /models]
        R6[analyze.py · POST /analyze-image]
    end

    subgraph SERVICES["Domain services"]
        direction TB
        S1["session_manager<br/>sessionId → ProctoringService"]
        S2["proctoring_service<br/>CV thread + proctoring.py"]
        S3["frame_broadcaster<br/>thread → asyncio → WS subscribers"]
        S4["event_store<br/>async reads · sync CV writes"]
    end

    subgraph DB["Persistence"]
        direction TB
        DB1[("PostgreSQL 16<br/>exam_sessions + proctoring_events")]
        DB2[SQLAlchemy async + asyncpg]
        DB3[SQLAlchemy sync + psycopg2]
    end

    E1 --> APP
    E2 --> R3
    APP --> R1
    APP --> R2
    APP --> R4
    APP --> R5
    APP --> R6
    R1 --> S1
    R3 --> S3
    R2 --> DB2
    R4 --> DB2
    DB2 --> DB1
    S1 --> S2
    S2 --> S3
    S2 --> S4
    S4 --> DB3
    DB3 --> DB1

    classDef clients fill:#e8f4fc,stroke:#1565a0
    classDef routers fill:#fff8e6,stroke:#b8860b
    classDef services fill:#eef8ee,stroke:#2e7d32
    classDef data fill:#f3e8ff,stroke:#6a1b9a
    class E1,E2 clients
    class R1,R2,R3,R4,R5,R6 routers
    class S1,S2,S3,S4 services
    class DB1,DB2,DB3 data
```

**Layer cheat sheet (for demos):** clients → FastAPI shell → thin routers → long‑running services → two DB access paths (async API vs sync CV thread).

---

## 8. Real-Time Proctoring Pipeline

```mermaid
sequenceDiagram
    participant CV as CV Thread<br/>(proctoring.py)
    participant SM as SessionManager
    participant EB as FrameBroadcaster
    participant ES as EventStore
    participant WS as WebSocket<br/>(/ws/:sessionId)
    participant FE as Frontend<br/>(LiveFeed canvas)

    SM->>CV: start() → threading.Thread
    loop Every Frame
        CV->>CV: cap.read() → frame
        CV->>CV: yolo.track() → person boxes + object boxes
        CV->>CV: pose_yolo.predict() → 17 keypoints
        CV->>CV: get_direction_from_keypoints() → direction
        CV->>CV: Every 3rd frame: classify_roi(crop) → cheat_prob
        CV->>CV: object_proximity() → obj_near, obj_name
        CV->>CV: PersonState.update() → verdict

        alt verdict == CHEATING
            CV->>ES: save_event_sync() [sync psycopg2]
            ES-->>CV: ok
        end

        CV->>CV: annotate frame → draw boxes, labels
        CV->>CV: cv2.imencode → JPEG base64
        CV->>EB: broadcast_sync(session_id, payload) [thread-safe]
        EB->>WS: loop.call_soon_threadsafe(broadcast)
        WS->>FE: JSON frame message type frame + base64 + persons + summary
        FE->>FE: drawImage on canvas + overlay bounding boxes
    end

    SM->>CV: stop() → _stop_event.set()
    CV-->>SM: thread joins (5s timeout)
```

---

## 9. Frontend Architecture (Next.js)

```mermaid
graph TD
    subgraph PAGES["Pages / Routes"]
        PG1["/ — Landing Page<br/>app/page.tsx"]
        PG2["/dashboard — Session List<br/>app/dashboard/page.tsx"]
        PG3["/sessions/[id] — Live View<br/>app/sessions/[id]/page.tsx"]
        PG4["/analyze — Image Analysis<br/>app/analyze/page.tsx"]
    end

    subgraph HOOKS["lib/hooks/"]
        H1[useSessions.ts<br/>CRUD + 10s polling]
        H2[useSession.ts<br/>Single session + start/stop]
        H3[useProctoring.ts<br/>WebSocket + frame state<br/>reconnect backoff]
        H4[useEvents.ts<br/>Events + summary + export]
    end

    subgraph COMPONENTS["components/proctoring/"]
        C1[LiveFeed.tsx<br/>canvas renderer<br/>requestAnimationFrame]
        C2[PersonOverlay.tsx<br/>bbox + verdict badge]
        C3[EventLog.tsx<br/>real-time scrolling table]
        C4[StatsPanel.tsx<br/>FPS / persons / alerts]
        C5[SummaryCharts.tsx<br/>timeline + heatmap + confidence]
        C6[SessionCard.tsx<br/>status + start/stop]
        C7[CreateSessionModal.tsx<br/>form + ModelSelector]
        C8[ModelSelector.tsx<br/>GET /api/v1/models]
        C9[UploadVideoModal.tsx<br/>drag-and-drop upload]
    end

    subgraph LIB["lib/"]
        L1[api.ts<br/>all fetch wrappers]
        L2[types.ts<br/>all TypeScript types]
        L3[backend.ts<br/>base URL config]
    end

    PG2 --> H1 --> C6
    PG2 --> C7
    PG3 --> H2
    PG3 --> H3 --> C1
    PG3 --> H4 --> C3
    PG3 --> C4
    PG3 --> C5
    PG4 --> L1
    PG4 --> C8
    C7 --> C8
    L1 --> L3
    L1 --> L2
    H3 --> C4
```

---

## 10. Frontend User Flows

### Flow A — Start a Live Session

```mermaid
flowchart TD
    A[User opens /dashboard] --> B[Click New Session]
    B --> C[CreateSessionModal opens]
    C --> D[Select model from ModelSelector<br/>GET /api/v1/models]
    D --> E{Source type?}
    E -->|Webcam| F[source = '0']
    E -->|Video file| G[Upload video<br/>POST /upload-video]
    F --> H[POST /api/v1/sessions<br/>title + source + model_file]
    G --> H
    H --> I[Session created, status=idle]
    I --> J[Navigate to /sessions/id]
    J --> K[Click Start]
    K --> L[POST /sessions/id/start]
    L --> M[Status → running]
    M --> N[WebSocket connects<br/>ws://localhost:8000/ws/id]
    N --> O[LiveFeed canvas receives frames]
    O --> P[Per-frame: drawImage + bbox overlay]
    O --> Q[EventLog: prepend CHEATING events]
    O --> R[StatsPanel: FPS / persons / count live]
    P --> S[Click Stop]
    S --> T[POST /sessions/id/stop]
    T --> U[Status → stopped, WebSocket closes]
    U --> V[Summary tab: fetch /events/summary]
```

### Flow B — Analyze a Single Image

```mermaid
flowchart TD
    A[User opens /analyze] --> B[Drag & drop or select image]
    B --> C[Preview renders in left panel]
    C --> D[Select model from dropdown]
    D --> E[Click Analyze]
    E --> F[POST /api/v1/analyze-image<br/>multipart: file + model_file]
    F --> G[Backend: cv2.imdecode → numpy]
    G --> H[yolo.predict no tracking]
    H --> I[classify_roi per person]
    I --> J[get_direction_from_keypoints]
    J --> K[Annotate frame, imencode JPEG]
    K --> L[Return ImageAnalysisResult JSON]
    L --> M[Right panel: show annotated_image_b64]
    M --> N[Summary cards: persons / cheating / objects]
    N --> O[Per-person table: verdict + confidence + direction]
```

---

## 11. Database Schema

```mermaid
erDiagram
    exam_sessions {
        UUID id PK
        VARCHAR title
        VARCHAR source
        VARCHAR status
        TIMESTAMPTZ started_at
        TIMESTAMPTZ stopped_at
        TIMESTAMPTZ created_at
        VARCHAR output_video
        VARCHAR log_csv
        VARCHAR model_file
        JSONB metadata
    }

    proctoring_events {
        UUID id PK
        UUID session_id FK
        INTEGER person_id
        VARCHAR verdict
        FLOAT cheat_prob
        VARCHAR direction
        BOOLEAN obj_nearby
        VARCHAR obj_name
        TEXT_ARRAY reasons
        INTEGER frame_index
        TIMESTAMPTZ occurred_at
    }

    exam_sessions ||--o{ proctoring_events : "has"
```

**Indexes:**
- `proctoring_events(session_id, occurred_at DESC)` — timeline queries
- `proctoring_events(session_id, verdict) WHERE verdict = 'CHEATING'` — partial index for fast cheating counts

---

## 12. WebSocket Protocol

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant WS as WebSocket Server

    FE->>WS: Connect ws://localhost:8000/ws/:sessionId
    WS-->>FE: status message started

    loop While session running (up to 30fps)
        WS-->>FE: frame message type frame + session_id + frame_index + fps + timestamp + frame_b64 + persons array + summary counts
    end

    FE->>WS: ping message
    WS-->>FE: pong message

    WS-->>FE: status message stopped
    FE->>WS: Disconnect
```

**Frame JSON shape (reference):** `type`, `session_id`, `frame_index`, `fps`, `timestamp`, `frame_b64`, `persons[]` (each with `id`, `verdict`, `cheat_prob`, `direction`, `obj_nearby`, `obj_name`, `reasons`, `bbox`), `summary` (`person_count`, `cheating_count`).

**Reconnect strategy (frontend `useProctoring.ts`):**

| Attempt | Delay |
|---------|-------|
| 1 | 1 s |
| 2 | 2 s |
| 3 | 4 s |
| 4 | 8 s |
| 5 | 16 s |
| > 5 | Give up, show error |

---

## 13. Full Request Flow: Image Upload

```mermaid
flowchart LR
    A[User selects image<br/>in browser] -->|multipart/form-data| B[POST /api/v1/analyze-image]
    B --> C[FastAPI reads file bytes]
    C --> D[cv2.imdecode → numpy array]
    D --> E[load_models if not cached]
    E --> F[yolo.predict<br/>no tracking, conf=0.5]
    F --> G[For each person bbox<br/>extract ROI crop]
    G --> H[classify_roi<br/>→ cheat_prob, verdict]
    H --> I[pose_yolo.predict<br/>→ 17 keypoints]
    I --> J[get_direction_from_keypoints<br/>→ direction string]
    J --> K[object_proximity check<br/>→ obj_near, obj_name]
    K --> L[Draw annotated frame<br/>RED boxes = CHEATING<br/>GREEN boxes = OK]
    L --> M[cv2.imencode JPEG<br/>→ base64 string]
    M --> N[Return ImageAnalysisResult JSON]
    N --> O[Frontend renders<br/>annotated image + table]
```

---

## 14. Full Request Flow: Live Session

```mermaid
flowchart TD
    A[POST /api/v1/sessions] -->|create in DB, status=idle| B[SessionResponse returned]
    B --> C[POST /sessions/id/start]
    C -->|409 if already running| ERR[Error]
    C --> D[DB: status → running, started_at = now]
    D --> E[SessionManager.start<br/>creates ProctoringService instance]
    E --> F[threading.Thread._run starts]

    subgraph LOOP["CV Thread Loop (proctoring.py)"]
        F --> G[cap = cv2.VideoCapture source]
        G --> H[cap.read → frame]
        H --> I[yolo.track persist=True<br/>→ person boxes + IDs + objects]
        I --> J[pose_yolo.predict<br/>→ keypoints per person]
        J --> K[Every 3rd frame:<br/>classify_roi → cheat_prob]
        K --> L[get_direction<br/>check DIRECTION_PATIENCE=4]
        L --> M[object_proximity<br/>20% diagonal threshold]
        M --> N[PersonState.update<br/>verdict = clf OR behavioral]
        N --> O{verdict?}
        O -->|CHEATING| P[event_store.save_event_sync<br/>psycopg2 sync session]
        O -->|OK| Q[continue]
        P --> R[annotate_frame<br/>draw bbox + labels]
        Q --> R
        R --> S[imencode JPEG base64]
        S --> T[frame_broadcaster.broadcast_sync<br/>loop.call_soon_threadsafe]
        T --> U[WebSocket push to all subscribers]
        U --> H
    end

    V[POST /sessions/id/stop] --> W[_stop_event.set]
    W --> X[Thread joins 5s timeout]
    X --> Y[DB: status → stopped, stopped_at = now]
    Y --> Z[output_video + log_csv paths saved]
```

---

## 15. Decision Engine Logic

```mermaid
flowchart TD
    START[New frame for person_id] --> CLF

    subgraph CLF["Track 3 — CNN Classifier"]
        C1{Every 3rd frame?}
        C1 -->|Yes| C2[classify_roi crop]
        C2 --> C3{cheat_prob ≥ 0.5?}
        C3 -->|Yes| C4[clf_flag = True]
        C3 -->|No| C5[clf_flag = False]
        C1 -->|No| C6[use last clf_flag]
    end

    CLF --> POSE

    subgraph POSE["Track 2 — Pose Analysis"]
        P1[get_direction_from_keypoints]
        P1 --> P2{direction ≠ FRONT?}
        P2 -->|Yes| P3[increment direction_counter]
        P2 -->|No| P4[reset direction_counter]
        P3 --> P5{counter ≥ DIRECTION_PATIENCE=4?}
        P5 -->|Yes| P6[direction_flag = True]
        P5 -->|No| P7[direction_flag = False]
    end

    POSE --> OBJ

    subgraph OBJ["Track 1 — Object Detection"]
        O1{Suspicious object<br/>within 20% diagonal?}
        O1 -->|Yes| O2[obj_flag = True<br/>obj_name = phone/laptop/...]
        O1 -->|No| O3[obj_flag = False]
    end

    OBJ --> DECIDE

    subgraph DECIDE["Decision Engine"]
        D1{clf_flag == True?}
        D1 -->|Yes| D2[verdict = CHEATING]
        D1 -->|No| D3{direction_flag OR obj_flag?}
        D3 -->|Yes| D4[verdict = CHEATING]
        D3 -->|No| D5[verdict = OK]
    end

    D2 --> LOG[Log to DB + CSV]
    D4 --> LOG
    D5 --> STREAM[Stream frame only]
    LOG --> STREAM
```

---

## 16. Technology Stack Summary

```mermaid
mindmap
  root((ProctorAI))
    Data
      Google Colab T4 GPU
      OpenCV frame extraction
      MD5 deduplication
      80/10/10 split
    Models
      PyTorch 2.x
      Custom CNN ⭐ 200K params
      ResNet18 11M params
      EfficientNet-B0 5.3M params
      ViT-B16 86M params
      MobileNetV2 3.4M params
    CV Pipeline
      YOLOv8n detection + tracking
      YOLOv8n-pose 17 keypoints
      OpenCV annotations
    Backend
      FastAPI 0.111+
      PostgreSQL 16
      SQLAlchemy 2.x async
      asyncpg + psycopg2
      Alembic migrations
      Docker
    Frontend
      Next.js 14 App Router
      TypeScript
      Tailwind CSS
      shadcn/ui components
      Recharts
      WebSocket canvas stream
    Infra
      Docker Compose
      Uvicorn ASGI
      WebSocket streaming
      REST API /api/v1
```

---

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Custom CNN as production model | Same accuracy as ViT at 430× fewer parameters — critical for real-time inference |
| Threading for CV loop (not async) | OpenCV and PyTorch blocking calls are incompatible with asyncio event loop |
| Dual DB sessions (sync + async) | CV thread needs synchronous psycopg2 writes; REST routes use async asyncpg |
| `loop.call_soon_threadsafe` bridge | Thread-safe way to push frames from blocking CV thread into async WebSocket |
| Per-person `PersonState` | YOLO tracking IDs persist across frames — each person has independent timers and history |
| `DIRECTION_PATIENCE = 4` | Prevents false positives from momentary head movements; requires 4 consecutive off-center frames |
| Classify every 3rd frame | Balances accuracy with latency — CNN inference is the most expensive step per person |
| base64 JPEG over WebSocket | Avoids binary framing complexity; quality set to 60 to balance bandwidth vs. visual clarity |
