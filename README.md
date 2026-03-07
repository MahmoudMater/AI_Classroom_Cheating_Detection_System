# AI Classroom Cheating Detection System

This repo is split into services:

- `backend/` - Express + TypeScript API, Socket.IO hub, Prisma persistence
- `ai-service/` - Flask AI microservice (currently mock inference + backend callback)
- `frontend/` - reserved for your frontend implementation

## Backend Persistence

Backend now uses PostgreSQL + Prisma with these tables:

- `users`
- `exams`
- `exam_sessions`
- `alerts`
- `snapshots`
- `detection_logs`

Schema file: `backend/prisma/schema.prisma`

## Implemented API Contract

### Backend (`http://localhost:4000`)

- `GET /health`
- `POST /sessions/start`
- `POST /sessions/end`
- `GET /sessions/:id/alerts`
- `GET /sessions/:id/snapshots`
- `POST /ai/alert`

Socket.IO event stream:

- Event: `new_alert`

### AI Service (`http://localhost:5001`)

- `GET /health`
- `POST /monitor/start`
- `POST /monitor/stop`
- `GET /monitor/status/<session_id>`
- `POST /infer/frame`

`/infer/frame` emits a mock detection payload and optionally sends it to backend `/ai/alert`.

## Docker Setup (includes PostgreSQL)

```bash
cp ai-service/.env.example ai-service/.env
cp backend/.env.example backend/.env
docker compose up --build
```

Services:

- backend: `localhost:4000`
- ai-service: `localhost:5001`
- postgres: `localhost:5432`

## Local Setup (without Docker)

### 1) PostgreSQL

Run PostgreSQL locally and create `proctoring_db`.

### 2) Backend

```bash
cd backend
cp .env.example .env
# for local postgres, set DATABASE_URL host to localhost
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

### 3) AI Service

```bash
cd ai-service
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m app.main
```

## Quick API Flow Test

1. Start a backend session:

```bash
curl -X POST http://localhost:4000/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"session_id":"exam_123","student_id":"student_1","video_source":"rtsp://mock"}'
```

2. Trigger AI inference + callback:

```bash
curl -X POST http://localhost:5001/infer/frame \
  -H "Content-Type: application/json" \
  -d '{"session_id":"exam_123","send_to_backend":true}'
```

3. Fetch alerts:

```bash
curl http://localhost:4000/sessions/exam_123/alerts
```
