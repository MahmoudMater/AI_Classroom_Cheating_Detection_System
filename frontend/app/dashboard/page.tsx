"use client"

import { useEffect, useState } from "react"

import Link from "next/link"

import { CreateSessionModal } from "@/components/proctoring/CreateSessionModal"
import { SessionCard } from "@/components/proctoring/SessionCard"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { healthCheck } from "@/lib/api"
import { useSessions } from "@/lib/hooks/useSessions"
import { cn } from "@/lib/utils"

export default function Page() {
  const { sessions, loading, refetch, anyRunning } = useSessions()
  const [healthOk, setHealthOk] = useState<boolean | null>(null)
  const [dbOk, setDbOk] = useState<boolean | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const h = await healthCheck()
        if (cancelled) return
        setHealthOk(h.status === "ok")
        setDbOk(h.db === "connected")
      } catch {
        if (!cancelled) {
          setHealthOk(false)
          setDbOk(false)
        }
      }
    }
    void tick()
    const id = window.setInterval(tick, 30_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return (
    <main className="bg-background text-foreground min-h-svh p-6 md:p-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Proctoring Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Monitor exam sessions, live video, and integrity events.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "size-2.5 rounded-full",
                  healthOk === null && "bg-zinc-400",
                  healthOk === true && "bg-green-600",
                  healthOk === false && "bg-red-600"
                )}
                aria-hidden
              />
              <span>API</span>
              <span
                className={cn(
                  "size-2.5 rounded-full",
                  dbOk === null && "bg-zinc-400",
                  dbOk === true && "bg-green-600",
                  dbOk === false && "bg-red-600"
                )}
                aria-hidden
              />
              <span>DB</span>
            </div>
            <Button type="button" variant="outline" asChild>
              <Link href="/analyze">Analyze Image</Link>
            </Button>
            <Button type="button" onClick={() => setCreateOpen(true)}>
              New Session
            </Button>
          </div>
        </header>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No sessions yet</CardTitle>
              <CardDescription>
                Create a session to start proctoring. Sessions appear here with
                live status and cheating event counts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => setCreateOpen(true)}>
                Create your first session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}

        {anyRunning ? (
          <p className="text-muted-foreground text-xs">
            Session list refreshes every 10s while a session is running.
          </p>
        ) : null}
      </div>

      <CreateSessionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void refetch()}
      />
    </main>
  )
}
