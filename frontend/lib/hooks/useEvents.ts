"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { ApiError, exportEventsUrl, getEventSummary, listEvents } from "@/lib/api"
import type { EventSummary, EventsPage, EventsParams } from "@/lib/types"

export function useEvents(sessionId: string) {
  const [page, setPage] = useState<EventsPage | null>(null)
  const [summary, setSummary] = useState<EventSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(
    async (params?: EventsParams) => {
      setLoading(true)
      setError(null)
      try {
        const data = await listEvents(sessionId, params)
        setPage(data)
      } catch (e) {
        const msg =
          e instanceof ApiError ? e.message : "Failed to load events"
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    },
    [sessionId]
  )

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true)
    setError(null)
    try {
      const data = await getEventSummary(sessionId)
      setSummary(data)
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Failed to load summary"
      setError(msg)
      toast.error(msg)
    } finally {
      setSummaryLoading(false)
    }
  }, [sessionId])

  return {
    page,
    summary,
    loading,
    summaryLoading,
    error,
    fetchEvents,
    fetchSummary,
    exportUrl: exportEventsUrl(sessionId),
  }
}
