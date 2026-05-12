"use client"

import { startTransition, useEffect, useState } from "react"

import { getSession } from "@/lib/api"
import { getBackendBaseUrl } from "@/lib/backend"
import type { FrameMessage, StatusMessage } from "@/lib/types"

function httpToWsBase(http: string): string {
  if (http.startsWith("https://")) return `wss://${http.slice(8)}`
  if (http.startsWith("http://")) return `ws://${http.slice(7)}`
  return http
}

export interface ProctoringState {
  connected: boolean
  lastFrame: FrameMessage | null
  fps: number
  personCount: number
  cheatingCount: number
  status: "idle" | "connecting" | "live" | "stopped" | "error"
  error: string | null
}

const initialState: ProctoringState = {
  connected: false,
  lastFrame: null,
  fps: 0,
  personCount: 0,
  cheatingCount: 0,
  status: "idle",
  error: null,
}

const BACKOFF_MS = [1000, 2000, 4000, 8000, 16_000]

export function useProctoring(sessionId: string | null): ProctoringState {
  const [state, setState] = useState<ProctoringState>(initialState)

  useEffect(() => {
    if (!sessionId) {
      startTransition(() => {
        setState(initialState)
      })
      return
    }

    let cancelled = false
    const wsRef = { current: null as WebSocket | null }
    let pingTimer: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let manuallyClosing = false
    let reconnectAttempts = 0
    let sessionRunning = false

    const latestFrameRef = { current: null as FrameMessage | null }
    let rafScheduled = false
    let lastAppliedFrameIndex: number | null = null

    const clearPing = () => {
      if (pingTimer) {
        clearInterval(pingTimer)
        pingTimer = null
      }
    }

    const clearReconnect = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    const closeWs = () => {
      manuallyClosing = true
      clearPing()
      clearReconnect()
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      manuallyClosing = false
    }

    const flushFrame = () => {
      rafScheduled = false
      const frame = latestFrameRef.current
      if (!frame || cancelled) return
      if (frame.frame_index === lastAppliedFrameIndex) return
      lastAppliedFrameIndex = frame.frame_index
      setState((prev) => ({
        ...prev,
        lastFrame: frame,
        fps: frame.fps,
        personCount: frame.summary.person_count,
        cheatingCount: frame.summary.cheating_count,
        status: prev.status === "connecting" ? "live" : prev.status,
      }))
    }

    const scheduleFrameFlush = () => {
      if (rafScheduled) return
      rafScheduled = true
      requestAnimationFrame(flushFrame)
    }

    const applyStatusMessage = (msg: StatusMessage) => {
      const st = msg.status
      if (st === "error") {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: msg.message,
          connected: false,
        }))
        return
      }
      if (st === "stopped" || st === "idle") {
        setState((prev) => ({
          ...prev,
          status: "stopped",
          error: null,
          connected: false,
        }))
        return
      }
      if (st === "started" || st === "running") {
        setState((prev) => ({
          ...prev,
          status: prev.lastFrame ? "live" : "connecting",
          error: null,
        }))
      }
    }

    const openWs = () => {
      clearReconnect()
      const httpBase = getBackendBaseUrl().replace(/\/$/, "")
      const wsUrl = `${httpToWsBase(httpBase)}/ws/${encodeURIComponent(sessionId)}`

      setState((prev) => ({
        ...prev,
        status: "connecting",
        error: null,
        connected: false,
      }))

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (cancelled) return
        reconnectAttempts = 0
        setState((prev) => ({ ...prev, connected: true }))
        clearPing()
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }))
          }
        }, 30_000)
      }

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(String(ev.data)) as { type?: string }
          if (data.type === "frame") {
            latestFrameRef.current = data as FrameMessage
            scheduleFrameFlush()
          } else if (data.type === "status") {
            applyStatusMessage(data as StatusMessage)
          }
        } catch {
          /* ignore */
        }
      }

      ws.onerror = () => {
        if (cancelled) return
        setState((prev) => ({
          ...prev,
          error: prev.error ?? "WebSocket error",
          status: prev.status === "live" ? prev.status : "error",
        }))
      }

      ws.onclose = () => {
        clearPing()
        if (cancelled) return
        wsRef.current = null
        setState((prev) => ({ ...prev, connected: false }))

        if (manuallyClosing) return
        if (!sessionRunning) return
        if (reconnectAttempts >= BACKOFF_MS.length) {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: "Lost connection after multiple retries",
          }))
          return
        }
        const delay = BACKOFF_MS[reconnectAttempts] ?? 16_000
        reconnectAttempts += 1
        reconnectTimer = setTimeout(() => {
          if (cancelled || !sessionRunning) return
          openWs()
        }, delay)
      }
    }

    const maybeConnect = () => {
      if (!sessionRunning) return
      const w = wsRef.current
      if (
        w &&
        (w.readyState === WebSocket.CONNECTING ||
          w.readyState === WebSocket.OPEN)
      ) {
        return
      }
      if (reconnectTimer) return
      reconnectAttempts = 0
      openWs()
    }

    const tick = async () => {
      if (cancelled) return
      try {
        const s = await getSession(sessionId)
        if (cancelled) return

        sessionRunning = s.status === "running"

        if (!sessionRunning) {
          closeWs()
          reconnectAttempts = 0
          lastAppliedFrameIndex = null
          latestFrameRef.current = null
          const nextStatus: ProctoringState["status"] =
            s.status === "error"
              ? "error"
              : s.status === "stopped"
                ? "stopped"
                : "idle"
          setState({
            connected: false,
            lastFrame: null,
            fps: 0,
            personCount: 0,
            cheatingCount: 0,
            status: nextStatus,
            error: s.status === "error" ? "Session reported error" : null,
          })
          return
        }

        setState((prev) => ({
          ...prev,
          status:
            prev.connected || wsRef.current
              ? prev.status === "idle"
                ? "connecting"
                : prev.status
              : "connecting",
          error: null,
        }))

        maybeConnect()
      } catch {
        if (cancelled) return
        sessionRunning = false
        closeWs()
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "Could not load session status",
        }))
      }
    }

    void tick()
    pollTimer = setInterval(() => {
      void tick()
    }, 2000)

    return () => {
      cancelled = true
      if (pollTimer) clearInterval(pollTimer)
      closeWs()
      sessionRunning = false
      lastAppliedFrameIndex = null
      latestFrameRef.current = null
      reconnectAttempts = 0
    }
  }, [sessionId])

  return state
}
