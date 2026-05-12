import { getBackendBaseUrl } from "@/lib/backend"
import type {
  EventResponse,
  EventSummary,
  EventsPage,
  EventsParams,
  HealthResponse,
  ImageAnalysisResult,
  ModelInfo,
  PersonImageResult,
  SessionCreate,
  SessionResponse,
  SessionStatus,
} from "@/lib/types"

export class ApiError extends Error {
  readonly status: number

  constructor({ status, message }: { status: number; message: string }) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

const API_PREFIX = "/api/v1"

function getBase(): string {
  return getBackendBaseUrl().replace(/\/$/, "")
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text()
  try {
    const body = JSON.parse(text) as { detail?: unknown }
    if (typeof body.detail === "string") return body.detail
    if (Array.isArray(body.detail)) {
      return body.detail
        .map((d: { msg?: string }) => d?.msg)
        .filter(Boolean)
        .join(", ")
    }
  } catch {
    /* ignore */
  }
  return text || response.statusText || "Request failed"
}

async function requestJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${getBase()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new ApiError({
        status: response.status,
        message: await readErrorMessage(response),
      })
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError({
      status: 0,
      message: e instanceof Error ? e.message : "Network error",
    })
  }
}

function normalizeSession(raw: Record<string, unknown>): SessionResponse {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    source: String(raw.source ?? ""),
    status: raw.status as SessionResponse["status"],
    started_at: raw.started_at != null ? String(raw.started_at) : null,
    stopped_at: raw.stopped_at != null ? String(raw.stopped_at) : null,
    created_at: String(raw.created_at ?? ""),
    output_video:
      raw.output_video != null ? String(raw.output_video) : null,
    log_csv: raw.log_csv != null ? String(raw.log_csv) : null,
    metadata:
      raw.metadata != null && typeof raw.metadata === "object"
        ? (raw.metadata as Record<string, unknown>)
        : {},
  }
}

function normalizeEvent(raw: Record<string, unknown>): EventResponse {
  const reasons = raw.reasons
  return {
    id: String(raw.id),
    session_id: String(raw.session_id),
    person_id: Number(raw.person_id),
    verdict: raw.verdict as EventResponse["verdict"],
    cheat_prob: Number(raw.cheat_prob),
    direction: raw.direction != null ? String(raw.direction) : "",
    obj_nearby: Boolean(raw.obj_nearby),
    obj_name: raw.obj_name != null ? String(raw.obj_name) : "",
    reasons: Array.isArray(reasons)
      ? reasons.map((r) => String(r))
      : reasons != null
        ? [String(reasons)]
        : [],
    frame_index: raw.frame_index != null ? Number(raw.frame_index) : 0,
    occurred_at: String(raw.occurred_at ?? ""),
  }
}

export async function healthCheck(): Promise<HealthResponse> {
  const raw = await requestJson<HealthResponse>("/health")
  return raw
}

export async function createSession(
  data: SessionCreate
): Promise<SessionResponse> {
  const body: Record<string, unknown> = {
    title: data.title,
    source: data.source,
    metadata: data.metadata ?? {},
  }
  if (data.model_file != null && data.model_file !== "") {
    body.model_file = data.model_file
  }
  const raw = await requestJson<Record<string, unknown>>(
    `${API_PREFIX}/sessions`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  )
  return normalizeSession(raw)
}

export async function listModels(): Promise<{ models: ModelInfo[] }> {
  const raw = await requestJson<{ models?: unknown[] }>(
    `${API_PREFIX}/models`
  )
  const models = (raw.models ?? []).map((row) => {
    const r = row as Record<string, unknown>
    return {
      filename: String(r.filename ?? ""),
      path: String(r.path ?? ""),
      size_mb: Number(r.size_mb ?? 0),
    } satisfies ModelInfo
  })
  return { models }
}

function normalizePersonImage(row: Record<string, unknown>): PersonImageResult {
  const reasons = row.reasons
  return {
    person_index: Number(row.person_index ?? 0),
    verdict: row.verdict as PersonImageResult["verdict"],
    cheat_prob: Number(row.cheat_prob ?? 0),
    direction: row.direction != null ? String(row.direction) : "",
    obj_nearby: Boolean(row.obj_nearby),
    obj_name: row.obj_name != null ? String(row.obj_name) : "",
    reasons: Array.isArray(reasons)
      ? reasons.map((x) => String(x))
      : [],
    bbox: Array.isArray(row.bbox)
      ? (row.bbox as number[]).slice(0, 4) as [number, number, number, number]
      : [0, 0, 0, 0],
  }
}

export async function analyzeImage(
  file: File,
  modelFile?: string
): Promise<ImageAnalysisResult> {
  const fd = new FormData()
  fd.append("file", file)
  if (modelFile != null && modelFile !== "") {
    fd.append("model_file", modelFile)
  }
  try {
    const response = await fetch(`${getBase()}${API_PREFIX}/analyze-image`, {
      method: "POST",
      body: fd,
      cache: "no-store",
    })
    if (!response.ok) {
      throw new ApiError({
        status: response.status,
        message: await readErrorMessage(response),
      })
    }
    const raw = (await response.json()) as Record<string, unknown>
    const summaryRaw = (raw.summary ?? {}) as Record<string, unknown>
    const suspicious = summaryRaw.suspicious_objects
    return {
      model_used: String(raw.model_used ?? ""),
      image_width: Number(raw.image_width ?? 0),
      image_height: Number(raw.image_height ?? 0),
      annotated_image_b64: String(raw.annotated_image_b64 ?? ""),
      persons: Array.isArray(raw.persons)
        ? (raw.persons as Record<string, unknown>[]).map(normalizePersonImage)
        : [],
      summary: {
        total_persons: Number(summaryRaw.total_persons ?? 0),
        cheating_count: Number(summaryRaw.cheating_count ?? 0),
        ok_count: Number(summaryRaw.ok_count ?? 0),
        suspicious_objects: Array.isArray(suspicious)
          ? suspicious.map((x) => String(x))
          : [],
      },
    }
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError({
      status: 0,
      message: e instanceof Error ? e.message : "Network error",
    })
  }
}

export async function listSessions(params?: {
  status?: SessionStatus
  limit?: number
  offset?: number
}): Promise<SessionResponse[]> {
  const sp = new URLSearchParams()
  if (params?.status) sp.set("status_filter", params.status)
  if (params?.limit != null) sp.set("limit", String(params.limit))
  if (params?.offset != null) sp.set("offset", String(params.offset))
  const q = sp.toString()
  const path = `${API_PREFIX}/sessions${q ? `?${q}` : ""}`
  const raw = await requestJson<Record<string, unknown>[]>(path)
  return raw.map((row) => normalizeSession(row))
}

export async function getSession(id: string): Promise<SessionResponse> {
  const raw = await requestJson<Record<string, unknown>>(
    `${API_PREFIX}/sessions/${encodeURIComponent(id)}`
  )
  return normalizeSession(raw)
}

export async function startSession(id: string): Promise<SessionResponse> {
  const raw = await requestJson<Record<string, unknown>>(
    `${API_PREFIX}/sessions/${encodeURIComponent(id)}/start`,
    { method: "POST" }
  )
  return normalizeSession(raw)
}

export async function stopSession(id: string): Promise<SessionResponse> {
  const raw = await requestJson<Record<string, unknown>>(
    `${API_PREFIX}/sessions/${encodeURIComponent(id)}/stop`,
    { method: "POST" }
  )
  return normalizeSession(raw)
}

export async function deleteSession(id: string): Promise<void> {
  await requestJson<void>(
    `${API_PREFIX}/sessions/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  )
}

export async function uploadVideo(
  id: string,
  file: File
): Promise<SessionResponse> {
  const fd = new FormData()
  fd.append("file", file)
  try {
    const response = await fetch(
      `${getBase()}${API_PREFIX}/sessions/${encodeURIComponent(id)}/upload-video`,
      {
        method: "POST",
        body: fd,
        cache: "no-store",
      }
    )
    if (!response.ok) {
      throw new ApiError({
        status: response.status,
        message: await readErrorMessage(response),
      })
    }
    const raw = (await response.json()) as Record<string, unknown>
    return normalizeSession(raw)
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError({
      status: 0,
      message: e instanceof Error ? e.message : "Network error",
    })
  }
}

export async function listEvents(
  id: string,
  params?: EventsParams
): Promise<EventsPage> {
  const sp = new URLSearchParams()
  if (params?.verdict) sp.set("verdict", params.verdict)
  if (params?.person_id != null) sp.set("person_id", String(params.person_id))
  if (params?.from_ts) sp.set("from_ts", params.from_ts)
  if (params?.to_ts) sp.set("to_ts", params.to_ts)
  if (params?.limit != null) sp.set("limit", String(params.limit))
  if (params?.offset != null) sp.set("offset", String(params.offset))
  const q = sp.toString()
  const raw = await requestJson<{ total: number; items: Record<string, unknown>[] }>(
    `${API_PREFIX}/sessions/${encodeURIComponent(id)}/events${q ? `?${q}` : ""}`
  )
  return {
    total: raw.total,
    items: raw.items.map((row) => normalizeEvent(row)),
  }
}

export async function getEventSummary(id: string): Promise<EventSummary> {
  const raw = await requestJson<Record<string, unknown>>(
    `${API_PREFIX}/sessions/${encodeURIComponent(id)}/events/summary`
  )

  const timelineRaw = (raw.timeline ?? []) as {
    minute?: number | string
    cheating?: number
    ok?: number
  }[]

  const msp = raw.most_suspicious_person as Record<string, unknown> | null | undefined
  const most_suspicious_person =
    msp != null &&
    typeof msp === "object" &&
    msp.person_id != null &&
    !Number.isNaN(Number(msp.person_id))
      ? {
          person_id: Number(msp.person_id),
          cheating_events: Number(msp.cheating_events ?? 0),
          cheating_rate: Number(msp.cheating_rate ?? 0),
          dominant_direction: String(msp.dominant_direction ?? ""),
        }
      : null

  const object_detections = Array.isArray(raw.object_detections)
    ? (raw.object_detections as Record<string, unknown>[]).map((o) => ({
        name: String(o.name ?? ""),
        count: Number(o.count ?? 0),
      }))
    : []

  const direction_over_time = Array.isArray(raw.direction_over_time)
    ? (raw.direction_over_time as Record<string, unknown>[]).map((d) => ({
        minute: String(d.minute ?? ""),
        direction: String(d.direction ?? ""),
        count: Number(d.count ?? 0),
      }))
    : []

  const confidence_distribution = Array.isArray(raw.confidence_distribution)
    ? (raw.confidence_distribution as Record<string, unknown>[]).map((c) => ({
        range: String(c.range ?? ""),
        count: Number(c.count ?? 0),
      }))
    : []

  const persons_timeline = Array.isArray(raw.persons_timeline)
    ? (raw.persons_timeline as Record<string, unknown>[]).map((p) => ({
        person_id: Number(p.person_id ?? 0),
        minute: String(p.minute ?? ""),
        cheating: Number(p.cheating ?? 0),
        ok: Number(p.ok ?? 0),
      }))
    : []

  return {
    session_id: String(raw.session_id ?? ""),
    total_events: Number(raw.total_events ?? 0),
    cheating_count: Number(raw.cheating_count ?? 0),
    ok_count: Number(raw.ok_count ?? 0),
    unique_persons: Number(raw.unique_persons ?? 0),
    cheating_rate: Number(raw.cheating_rate ?? 0),
    events_by_direction:
      (raw.events_by_direction as Record<string, number>) ?? {},
    events_by_person:
      (raw.events_by_person as Record<
        string,
        { cheating: number; ok: number }
      >) ?? {},
    timeline: timelineRaw.map((t) => ({
      minute: String(t.minute ?? ""),
      cheating: Number(t.cheating ?? 0),
      ok: Number(t.ok ?? 0),
    })),
    risk_score: Number(raw.risk_score ?? 0),
    peak_cheating_minute:
      raw.peak_cheating_minute != null && raw.peak_cheating_minute !== ""
        ? String(raw.peak_cheating_minute)
        : null,
    most_suspicious_person,
    object_detections,
    direction_over_time,
    confidence_distribution,
    persons_timeline,
  }
}

export function exportEventsUrl(id: string): string {
  return `${getBase()}${API_PREFIX}/sessions/${encodeURIComponent(id)}/events/export`
}
