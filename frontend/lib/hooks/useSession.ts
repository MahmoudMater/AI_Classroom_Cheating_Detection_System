"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  ApiError,
  deleteSession,
  getSession,
  startSession,
  stopSession,
  uploadVideo,
} from "@/lib/api"
import type { SessionResponse } from "@/lib/types"

export function useSession(id: string) {
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!id) {
      setSession(null)
      setNotFound(true)
      setLoading(false)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const s = await getSession(id)
      setSession(s)
      setNotFound(false)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setNotFound(true)
        setSession(null)
      } else {
        const msg = e instanceof Error ? e.message : "Failed to load session"
        setError(msg)
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void refetch()
  }, [id, refetch])

  const start = useCallback(async () => {
    if (!id) return
    try {
      const s = await startSession(id)
      setSession(s)
      toast.success("Session started")
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Could not start session"
      toast.error(msg)
      throw e
    }
  }, [id])

  const stop = useCallback(async () => {
    if (!id) return
    try {
      const s = await stopSession(id)
      setSession(s)
      toast.success("Session stopped")
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Could not stop session"
      toast.error(msg)
      throw e
    }
  }, [id])

  const remove = useCallback(async () => {
    if (!id) return
    try {
      await deleteSession(id)
      toast.success("Session deleted")
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Could not delete session"
      toast.error(msg)
      throw e
    }
  }, [id])

  const upload = useCallback(
    async (file: File) => {
      if (!id) return
      try {
        const s = await uploadVideo(id, file)
        setSession(s)
        toast.success("Video uploaded")
      } catch (e) {
        const msg =
          e instanceof ApiError ? e.message : "Could not upload video"
        toast.error(msg)
        throw e
      }
    },
    [id]
  )

  return {
    session,
    loading,
    notFound,
    error,
    refetch,
    start,
    stop,
    remove,
    upload,
  }
}
