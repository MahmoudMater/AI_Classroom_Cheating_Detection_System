Yes — make the **AI part a standalone microservice** and let the **backend be the system of record + API for the dashboard**. That is the cleanest setup for your project.

Here’s a solid way to structure it.

## 1) Recommended high-level architecture

You have 3 projects:

- **frontend** → live dashboard for proctors/admin
    
- **backend** → users, sessions, exams, logs, snapshots metadata, dashboard APIs
    
- **ai-service** → video analysis, detection, tracking, suspicious behavior events
    

### Flow

1. Camera/video stream is sent to the **AI service**
    
2. AI service runs:
    
    - head orientation detection
        
    - mobile phone detection with YOLOv8
        
    - student movement tracking
        
    - suspicious behavior logic
        
3. AI service sends results/events to the **backend**
    
4. Backend stores:
    
    - alerts
        
    - timestamps
        
    - snapshot paths
        
    - session logs
        
5. Frontend connects to **backend** via WebSocket for real-time dashboard updates
    

That means:

- **AI service does inference**
    
- **Backend manages business logic + DB**
    
- **Frontend shows monitoring UI**
    

This separation is very good because later you can improve the model without breaking the dashboard.

---

## 2) Best communication design

Do **not** make the frontend talk directly to the AI service.

Use this:

- **Frontend ↔ Backend**
    
- **Backend ↔ AI Service**
    

### Why

Because the backend should control:

- authentication
    
- exam session state
    
- alert history
    
- snapshot storage metadata
    
- access permissions
    
- dashboard broadcasting
    

The AI service should stay focused on:

- receiving frames/streams
    
- processing them
    
- returning structured detection results
    

---

## 3) What each service should do

## AI Microservice responsibilities

The **AI microservice** should handle:

### Input

- webcam frames
    
- RTSP stream
    
- uploaded video chunks
    
- exam/session ID from backend
    

### Processing

- detect mobile phones with YOLOv8
    
- detect head direction / face orientation
    
- track student position and movement across frames
    
- combine detections into suspicious behavior rules
    

### Output

Return structured JSON like:

```json
{
  "session_id": "exam_123",
  "timestamp": "2026-03-07T14:20:10Z",
  "detections": {
    "phone_detected": true,
    "head_direction": "left",
    "movement_level": "high"
  },
  "suspicious_events": [
    {
      "type": "phone_detected",
      "confidence": 0.91
    },
    {
      "type": "looking_away",
      "confidence": 0.84
    }
  ],
  "snapshot_url": "/snapshots/exam_123/frame_245.jpg"
}
```

### AI service should also

- save temporary snapshots locally
    
- expose health endpoint
    
- expose inference endpoints
    
- optionally push events to backend callback
    

---

## Backend responsibilities

The **backend** should handle:

- authentication / authorization
    
- student/exam/session management
    
- receiving AI alerts
    
- saving logs to PostgreSQL
    
- storing snapshot metadata
    
- broadcasting live updates to dashboard with WebSockets
    
- exposing APIs for:
    
    - current sessions
        
    - live alerts
        
    - past logs
        
    - suspicious activity history
        

### Backend database tables idea

- `users`
    
- `exams`
    
- `exam_sessions`
    
- `alerts`
    
- `snapshots`
    
- `detection_logs`
    

Example:

### alerts

- id
    
- session_id
    
- type
    
- confidence
    
- created_at
    
- status
    

### snapshots

- id
    
- session_id
    
- image_path
    
- event_type
    
- timestamp
    

### detection_logs

- id
    
- session_id
    
- head_direction
    
- phone_detected
    
- movement_score
    
- timestamp
    

---

## Frontend responsibilities

The **frontend dashboard** should show:

- active exam sessions
    
- live video status
    
- suspicious alerts in real time
    
- event timeline
    
- snapshots for each alert
    
- alert severity / confidence
    
- session history
    

Good sections:

- **Live Monitoring**
    
- **Alert Feed**
    
- **Student Session Details**
    
- **Logs & Snapshots**
    
- **Analytics Summary**
    

---

## 4) Recommended communication pattern

You have 2 strong options.

## Option A — Backend sends stream/video info to AI, AI posts results back

This is best for your case.

### Example

- backend starts session
    
- backend tells AI service:
    
    - session ID
        
    - camera source / stream URL
        
- AI processes frames
    
- AI sends alert events to backend through REST or WebSocket
    

### Pros

- centralized control
    
- easier dashboard integration
    
- backend owns all session lifecycle
    

---

## Option B — AI service processes directly and backend polls results

Less ideal for real-time systems.

Use **Option A**.

---

## 5) API design suggestion

## AI service endpoints

### Health

```http
GET /health
```

### Start monitoring

```http
POST /monitor/start
```

Body:

```json
{
  "session_id": "exam_123",
  "video_source": "rtsp://...",
  "student_id": "student_45"
}
```

### Stop monitoring

```http
POST /monitor/stop
```

### Single frame inference

```http
POST /infer/frame
```

### Stream status

```http
GET /monitor/status/:session_id
```

---

## Backend endpoints

### Start exam session

```http
POST /sessions/start
```

### End exam session

```http
POST /sessions/end
```

### Receive alert from AI

```http
POST /ai/alert
```

### Get session alerts

```http
GET /sessions/:id/alerts
```

### Get session snapshots

```http
GET /sessions/:id/snapshots
```

### WebSocket channel

```txt
/ws/alerts
```

---

## 6) Suspicious behavior rules

Do not depend only on raw detections. Add a **rule engine** in the AI service or backend.

Examples:

### Rule 1: Mobile phone

- if phone detected for more than N frames
    
- raise alert: `phone_usage`
    

### Rule 2: Looking away

- if head direction != forward for more than 3–5 seconds
    
- raise alert: `looking_away`
    

### Rule 3: Excessive movement

- if tracked body movement score exceeds threshold over time window
    
- raise alert: `excessive_movement`
    

### Rule 4: Repeated suspicious behavior

- if 3 alerts happen within 1 minute
    
- raise alert severity = high
    

This helps reduce false positives.

---

## 7) Suggested repo structure

Since you already have 3 projects, keep them clearly separated:

```txt
proctoring-system/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── websocket/
│   │   ├── db/
│   │   └── app.ts
│   ├── package.json
│   └── README.md
│
├── ai-service/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── detectors/
│   │   ├── trackers/
│   │   ├── rules/
│   │   ├── utils/
│   │   └── main.py
│   ├── models/
│   ├── snapshots/
│   ├── tests/
│   ├── requirements.txt
│   └── README.md
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 8) Internal structure of the AI service

Inside `ai-service/`:

```txt
app/
├── api/
│   ├── routes_monitor.py
│   ├── routes_infer.py
│   └── routes_health.py
│
├── core/
│   ├── config.py
│   ├── logger.py
│   └── events.py
│
├── detectors/
│   ├── phone_detector.py
│   ├── head_pose_detector.py
│   └── suspicious_detector.py
│
├── trackers/
│   └── movement_tracker.py
│
├── rules/
│   └── alert_rules.py
│
├── utils/
│   ├── image_utils.py
│   └── video_utils.py
│
└── main.py
```

### Explanation

- `detectors/` → raw model inference
    
- `trackers/` → frame-to-frame movement tracking
    
- `rules/` → suspicious behavior decisions
    
- `api/` → REST endpoints
    
- `core/` → config/logging/events
    

---

## 9) Best backend role in real-time alerts

The backend should act like the **real-time hub**.

When AI detects something:

1. AI sends alert to backend
    
2. Backend writes it to DB
    
3. Backend emits WebSocket event to frontend
    
4. Frontend updates alert feed instantly
    

### Example WebSocket event

```json
{
  "type": "new_alert",
  "session_id": "exam_123",
  "alert": {
    "event_type": "phone_detected",
    "confidence": 0.91,
    "snapshot_url": "/snapshots/exam_123/frame245.jpg",
    "timestamp": "2026-03-07T14:20:10Z"
  }
}
```

---

## 10) Tech stack recommendation

Your stack is good. I would refine it like this:

### AI service

- Python
    
- FastAPI or Flask
    
- YOLOv8
    
- OpenCV
    
- TensorFlow/Keras if needed for head orientation model
    
- NumPy
    
- Torch
    
- Celery optional later
    

### Backend

- TypeScript
    
- Express or NestJS
    
- PostgreSQL
    
- Socket.IO or WebSocket
    
- Prisma or TypeORM
    

### Frontend

- React + TypeScript
    
- Tailwind
    
- Socket.IO client
    
- Chart library for analytics
    

### Infrastructure

- Docker
    
- docker-compose for development
    

If starting fresh, I would prefer:

- **FastAPI for AI service**
    
- **NestJS or Express for backend**
    
- **React for frontend**
    

FastAPI is usually better than Flask for clean API structure and async-friendly services.

---

## 11) Development phases

## Phase 1 — Basic working system

- setup frontend/backend/ai-service
    
- connect backend to AI service
    
- create health check endpoints
    
- create start/stop monitoring flow
    
- make dashboard receive fake alerts first
    

## Phase 2 — Detection integration

- integrate YOLOv8 phone detection
    
- integrate head orientation detection
    
- integrate movement tracking
    
- test each module separately
    

## Phase 3 — Alerting logic

- define suspicious behavior rules
    
- reduce false positives
    
- add confidence thresholds
    
- save snapshots on alert
    

## Phase 4 — Dashboard & logs

- live alerts feed
    
- session page
    
- snapshots viewer
    
- history and filters
    

## Phase 5 — Hardening

- performance optimization
    
- GPU/CPU switching
    
- error handling
    
- retry logic
    
- monitoring
    

---

## 12) Important engineering advice

### Keep the AI service stateless where possible

Do not store too much permanent business data there. Let backend/database own persistence.

### Save only important snapshots

Do not save every frame. Save:

- on alert
    
- maybe every N seconds for audit  
    Otherwise storage will explode.
    

### Add thresholds

Do not trigger alerts from a single bad frame.

### Use session-based processing

Every monitoring process should be linked to:

- exam_id
    
- student_id
    
- session_id
    

### Version your model

Keep model files versioned:

- `phone_detector_v1.pt`
    
- `head_pose_v1.h5`
    

### Add logs everywhere

Especially:

- AI inference errors
    
- stream disconnects
    
- backend callback failures
    

---

## 13) What I recommend you build first

Build in this exact order:

1. **Backend + frontend real-time dashboard with fake alerts**
    
2. **AI microservice skeleton**
    
3. **Connect AI service to backend**
    
4. **Add phone detection**
    
5. **Add head orientation**
    
6. **Add movement tracking**
    
7. **Add suspicious behavior rules**
    
8. **Add snapshot storage**
    
9. **Optimize**
    

This is better than trying to finish all AI first.

---

## 15) Final recommendation

Your architecture should be:

```txt
Camera/Video
   ↓
AI Microservice (Python, YOLOv8, OpenCV)
   ↓
Backend API (TypeScript, PostgreSQL, WebSocket)
   ↓
Frontend Dashboard (React)
```

And the AI service should be a **separate standalone microservice** that:

- receives monitoring jobs
    
- processes video
    
- sends structured alerts to backend
    
- saves snapshots
    
- never directly serves the dashboard
    

That is the right design.

I can next give you one of these:

1. a full **system architecture diagram**
    
2. a **folder structure for all 3 projects**
    
3. a **backend ↔ AI API contract**
    
4. a **step-by-step implementation roadmap for the whole team**