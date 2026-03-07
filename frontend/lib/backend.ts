export type Severity = "low" | "medium" | "high"

export interface SessionRecord {
  sessionId: string
  examId?: string
  studentId?: string
  videoSource?: string
  startedAt: string
  endedAt?: string
  status: "active" | "ended"
}

export interface AlertRecord {
  id: string
  sessionId: string
  eventType: string
  confidence: number
  severity: Severity
  snapshotUrl?: string
  timestamp: string
  meta?: Record<string, unknown>
}

export interface SnapshotRecord {
  id: string
  sessionId: string
  imagePath: string
  eventType: string
  timestamp: string
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Request failed (${response.status}): ${message}`)
  }

  return (await response.json()) as T
}

export function getBackendBaseUrl(): string {
  return BASE_URL
}

export async function checkBackendHealth(): Promise<{
  status: string
  database: string
  timestamp: string
}> {
  return request("/health")
}

export async function startSession(payload: {
  session_id: string
  student_id?: string
  exam_id?: string
  video_source?: string
}): Promise<SessionRecord> {
  const data = await request<{ session: SessionRecord }>("/sessions/start", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return data.session
}

export async function endSession(sessionId: string): Promise<SessionRecord> {
  const data = await request<{ session: SessionRecord }>("/sessions/end", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  })

  return data.session
}

export async function getSessionAlerts(
  sessionId: string
): Promise<AlertRecord[]> {
  const data = await request<{ alerts: AlertRecord[] }>(
    `/sessions/${sessionId}/alerts`
  )
  return data.alerts
}

export async function getSessionSnapshots(
  sessionId: string
): Promise<SnapshotRecord[]> {
  const data = await request<{ snapshots: SnapshotRecord[] }>(
    `/sessions/${sessionId}/snapshots`
  )
  return data.snapshots
}

export async function simulateAlert(sessionId: string): Promise<AlertRecord[]> {
  const now = new Date().toISOString()

  const data = await request<{ alerts: AlertRecord[] }>("/ai/alert", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      timestamp: now,
      detections: {
        phone_detected: true,
        head_direction: "left",
        movement_level: "medium",
      },
      suspicious_events: [
        { type: "phone_detected", confidence: 0.91 },
        { type: "looking_away", confidence: 0.84 },
      ],
      snapshot_url: `/snapshots/${sessionId}/frame_${Date.now()}.jpg`,
    }),
  })

  return data.alerts
}
