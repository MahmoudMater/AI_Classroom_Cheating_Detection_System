"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import {
  AlertRecord,
  checkBackendHealth,
  endSession,
  getBackendBaseUrl,
  getSessionAlerts,
  getSessionSnapshots,
  SessionRecord,
  simulateAlert,
  SnapshotRecord,
  startSession,
} from "@/lib/backend"

type SocketAlertPayload = {
  session_id: string
  alert: {
    event_type: string
    confidence: number
    severity: "low" | "medium" | "high"
    snapshot_url?: string
    timestamp: string
  }
}

function makeSessionId() {
  return `exam_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString().slice(-4)}`
}

export default function Page() {
  const [backendHealth, setBackendHealth] = useState<
    "checking" | "online" | "offline"
  >("checking")
  const [dbHealth, setDbHealth] = useState<string>("unknown")
  const [session, setSession] = useState<SessionRecord | null>(null)
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const activeSessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const health = await checkBackendHealth()
        setBackendHealth(health.status === "ok" ? "online" : "offline")
        setDbHealth(health.database ?? "unknown")
      } catch {
        setBackendHealth("offline")
      }
    })()
  }, [])

  useEffect(() => {
    const socket = io(getBackendBaseUrl(), {
      transports: ["websocket"],
      autoConnect: true,
    })

    socketRef.current = socket

    socket.on("new_alert", (payload: SocketAlertPayload) => {
      if (payload.session_id !== activeSessionIdRef.current) {
        return
      }

      const nextAlert: AlertRecord = {
        id: `${payload.session_id}_${payload.alert.timestamp}_${payload.alert.event_type}`,
        sessionId: payload.session_id,
        eventType: payload.alert.event_type,
        confidence: payload.alert.confidence,
        severity: payload.alert.severity,
        snapshotUrl: payload.alert.snapshot_url,
        timestamp: payload.alert.timestamp,
      }

      setAlerts((current) => [nextAlert, ...current])

      if (nextAlert.snapshotUrl) {
        const nextSnapshot: SnapshotRecord = {
          id: `snap_${nextAlert.id}`,
          sessionId: payload.session_id,
          imagePath: nextAlert.snapshotUrl,
          eventType: nextAlert.eventType,
          timestamp: nextAlert.timestamp,
        }
        setSnapshots((current) => [nextSnapshot, ...current])
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const backendUrl = useMemo(() => getBackendBaseUrl(), [])

  async function loadSessionData(sessionId: string) {
    const [sessionAlerts, sessionSnapshots] = await Promise.all([
      getSessionAlerts(sessionId),
      getSessionSnapshots(sessionId),
    ])

    setAlerts(sessionAlerts)
    setSnapshots(sessionSnapshots)
  }

  async function handleStartSession() {
    setBusy(true)
    setError(null)

    try {
      const created = await startSession({
        session_id: makeSessionId(),
        student_id: "student_1",
        exam_id: "phase1_exam",
        video_source: "rtsp://dummy",
      })

      setSession(created)
      activeSessionIdRef.current = created.sessionId
      await loadSessionData(created.sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to start session")
    } finally {
      setBusy(false)
    }
  }

  async function handleEndSession() {
    if (!session) {
      return
    }

    setBusy(true)
    setError(null)

    try {
      const ended = await endSession(session.sessionId)
      setSession(ended)
      activeSessionIdRef.current =
        ended.status === "active" ? ended.sessionId : null
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to end session")
    } finally {
      setBusy(false)
    }
  }

  async function handleSimulateAlert() {
    if (!session) {
      setError("start a session first")
      return
    }

    setBusy(true)
    setError(null)

    try {
      await simulateAlert(session.sessionId)
      await loadSessionData(session.sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to simulate alert")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(39,122,95,0.12),_transparent_45%),linear-gradient(180deg,#f8faf9_0%,#eef4f1_100%)] p-6 md:p-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-2xl border border-black/10 bg-white/85 p-6 shadow-sm backdrop-blur">
          <p className="text-xs tracking-[0.2em] text-zinc-500 uppercase">
            AI Classroom Monitoring
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
            Phase 1 Dashboard Wiring
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Frontend talks to backend only. Backend receives AI dummy alerts and
            broadcasts live events.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-zinc-200 px-3 py-1">
              Backend: {backendUrl}
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1">
              API:{" "}
              {backendHealth === "online"
                ? "online"
                : backendHealth === "offline"
                  ? "offline"
                  : "checking"}
            </span>
            <span className="rounded-full border border-zinc-200 px-3 py-1">
              DB: {dbHealth}
            </span>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:col-span-1">
            <h2 className="text-lg font-semibold text-zinc-900">
              Session Control
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Start a monitoring session, then trigger dummy alerts.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                disabled={busy || backendHealth !== "online"}
                onClick={handleStartSession}
              >
                Start Session
              </Button>
              <Button
                disabled={busy || !session || session.status !== "active"}
                onClick={handleSimulateAlert}
              >
                Trigger Dummy Alert
              </Button>
              <Button
                disabled={busy || !session || session.status !== "active"}
                onClick={handleEndSession}
              >
                End Session
              </Button>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 p-3 text-sm text-zinc-700">
              <p>
                <strong>Session ID:</strong> {session?.sessionId ?? "-"}
              </p>
              <p>
                <strong>Status:</strong> {session?.status ?? "-"}
              </p>
              <p>
                <strong>Started:</strong> {session?.startedAt ?? "-"}
              </p>
            </div>

            {error ? (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            ) : null}
          </article>

          <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:col-span-2">
            <h2 className="text-lg font-semibold text-zinc-900">
              Live Alert Feed
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Real-time alerts from backend Socket.IO (`new_alert`).
            </p>

            <div className="mt-4 space-y-2">
              {alerts.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
                  No alerts yet.
                </p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm"
                  >
                    <p className="font-medium text-zinc-900">
                      {alert.eventType}
                    </p>
                    <p className="text-zinc-600">
                      Confidence: {(alert.confidence * 100).toFixed(1)}% |
                      Severity: {alert.severity}
                    </p>
                    <p className="text-zinc-500">{alert.timestamp}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Snapshots Metadata
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Paths saved by backend for each suspicious event.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {snapshots.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
                No snapshots yet.
              </p>
            ) : (
              snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="rounded-xl border border-zinc-200 p-3 text-sm"
                >
                  <p className="font-medium text-zinc-900">
                    {snapshot.eventType}
                  </p>
                  <p className="mt-1 break-all text-zinc-600">
                    {snapshot.imagePath}
                  </p>
                  <p className="mt-1 text-zinc-500">{snapshot.timestamp}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  )
}
