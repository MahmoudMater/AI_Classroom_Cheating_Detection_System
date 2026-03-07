# Backend (Express + TypeScript + Prisma)

Real-time API hub for sessions and alerts with PostgreSQL persistence.

## Endpoints

- `GET /health`
- `POST /sessions/start`
- `POST /sessions/end`
- `GET /sessions/:id/alerts`
- `GET /sessions/:id/snapshots`
- `POST /ai/alert`

## Socket.IO Events

- Emits: `new_alert`
- Emits on connect: `connected`

## Database Models (Prisma)

- `users`
- `exams`
- `exam_sessions`
- `alerts`
- `snapshots`
- `detection_logs`

## Run with Docker (recommended)

From repo root:

```bash
docker compose up --build
```

This starts:

- backend on `http://localhost:4000`
- postgres on `localhost:5432`

## Run locally (without Docker)

```bash
cd backend
cp .env.example .env
# change DATABASE_URL host from postgres to localhost if your DB runs locally
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```
