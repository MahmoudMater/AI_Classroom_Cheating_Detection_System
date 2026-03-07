# Frontend Dashboard (Next.js)

Frontend is connected to backend APIs and Socket.IO for phase-one monitoring flow.

## Features wired

- Backend health and DB status check
- Start session (`POST /sessions/start`)
- End session (`POST /sessions/end`)
- Live alert stream via Socket.IO `new_alert`
- Alert history (`GET /sessions/:id/alerts`)
- Snapshot metadata (`GET /sessions/:id/snapshots`)
- Dummy alert trigger through backend (`POST /ai/alert`)

## Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
