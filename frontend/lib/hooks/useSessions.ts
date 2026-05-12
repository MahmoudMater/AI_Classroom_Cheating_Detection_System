"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { ApiError, listSessions } from "@/lib/api"
import type { SessionResponse } from "@/lib/types"

export function useSessions() {
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const anyRunning = useMemo(
    () => sessions.some((s) => s.status === "running"),
    [sessions]
  )

  const refetch = useCallback(async () => {
    try {
      const data = await listSessions()
      setSessions(data)
      setError(null)
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Failed to load sessions"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  useEffect(() => {
    if (!anyRunning) return
    const t = window.setInterval(() => {
      void refetch()
    }, 10_000)
    return () => window.clearInterval(t)
  }, [anyRunning, refetch])

  return { sessions, loading, error, refetch, anyRunning }
}
