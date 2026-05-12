export type SessionStatus = "idle" | "running" | "stopped" | "error"

export type VerdictType = "CHEATING" | "OK"

export interface SessionResponse {
  id: string
  title: string
  source: string
  status: SessionStatus
  started_at: string | null
  stopped_at: string | null
  created_at: string
  output_video: string | null
  log_csv: string | null
  metadata: Record<string, unknown>
}

export interface EventResponse {
  id: string
  session_id: string
  person_id: number
  verdict: VerdictType
  cheat_prob: number
  direction: string
  obj_nearby: boolean
  obj_name: string
  reasons: string[]
  frame_index: number
  occurred_at: string
}

export interface EventsPage {
  total: number
  items: EventResponse[]
}

export interface EventSummary {
  session_id: string
  total_events: number
  cheating_count: number
  ok_count: number
  unique_persons: number
  cheating_rate: number
  events_by_direction: Record<string, number>
  events_by_person: Record<string, { cheating: number; ok: number }>
  timeline: { minute: string; cheating: number; ok: number }[]
  risk_score: number
  peak_cheating_minute: string | null
  most_suspicious_person: {
    person_id: number
    cheating_events: number
    cheating_rate: number
    dominant_direction: string
  } | null
  object_detections: { name: string; count: number }[]
  direction_over_time: { minute: string; direction: string; count: number }[]
  confidence_distribution: { range: string; count: number }[]
  persons_timeline: {
    person_id: number
    minute: string
    cheating: number
    ok: number
  }[]
}

export interface PersonFrame {
  id: number
  verdict: VerdictType
  cheat_prob: number
  direction: string
  obj_nearby: boolean
  obj_name: string
  reasons: string[]
  bbox: [number, number, number, number]
}

export interface FrameMessage {
  type: "frame"
  session_id: string
  frame_index: number
  fps: number
  timestamp: string
  frame_b64: string
  persons: PersonFrame[]
  summary: { person_count: number; cheating_count: number }
}

export interface StatusMessage {
  type: "status"
  status: "started" | "stopped" | "error" | SessionStatus
  message: string
}

export type WsMessage = FrameMessage | StatusMessage

export interface HealthResponse {
  status: string
  db: "connected" | "error" | string
  version: string
}

export interface SessionCreate {
  title: string
  source: string
  model_file?: string
  metadata?: Record<string, unknown>
}

export interface ModelInfo {
  filename: string
  path: string
  size_mb: number
}

export interface PersonImageResult {
  person_index: number
  verdict: "CHEATING" | "OK"
  cheat_prob: number
  direction: string
  obj_nearby: boolean
  obj_name: string
  reasons: string[]
  bbox: [number, number, number, number]
}

export interface ImageSummary {
  total_persons: number
  cheating_count: number
  ok_count: number
  suspicious_objects: string[]
}

export interface ImageAnalysisResult {
  model_used: string
  image_width: number
  image_height: number
  annotated_image_b64: string
  persons: PersonImageResult[]
  summary: ImageSummary
}

export interface EventsParams {
  verdict?: VerdictType
  person_id?: number
  from_ts?: string
  to_ts?: string
  limit?: number
  offset?: number
}
