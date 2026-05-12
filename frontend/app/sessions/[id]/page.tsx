"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { EventLog } from "@/components/proctoring/EventLog"
import { LiveFeed } from "@/components/proctoring/LiveFeed"
import { StatsPanel } from "@/components/proctoring/StatsPanel"
import { SummaryCharts } from "@/components/proctoring/SummaryCharts"
import { UploadVideoModal } from "@/components/proctoring/UploadVideoModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { exportEventsUrl } from "@/lib/api"
import { useProctoring } from "@/lib/hooks/useProctoring"
import { useSession } from "@/lib/hooks/useSession"
import type { EventResponse, FrameMessage, SessionStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

function sessionStatusBadge(status: SessionStatus) {
  switch (status) {
    case "running":
      return "border-green-600/40 bg-green-600/15 text-green-700 dark:text-green-400"
    case "stopped":
      return "border-blue-600/40 bg-blue-600/15 text-blue-700 dark:text-blue-400"
    case "error":
      return "border-red-600/40 bg-red-600/15 text-red-700 dark:text-red-400"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

export default function SessionDetailPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""

  const { session, loading, notFound, start, stop, upload } = useSession(id)
  const proctoring = useProctoring(
    !id || loading || notFound ? null : id
  )
  const [uploadOpen, setUploadOpen] = useState(false)
  const [tab, setTab] = useState("events")
  const [liveCheating, setLiveCheating] = useState<EventResponse[]>([])
  const [busy, setBusy] = useState(false)

  const appendLiveFromFrame = useCallback((frame: FrameMessage) => {
      if (!session) return
      setLiveCheating((prev) => {
        const additions: EventResponse[] = []
        for (const p of frame.persons) {
          if (p.verdict !== "CHEATING") continue
          const eid = `live-${frame.frame_index}-${p.id}-${frame.timestamp}`
          if (prev.some((x) => x.id === eid)) continue
          additions.push({
            id: eid,
            session_id: session.id,
            person_id: p.id,
            verdict: "CHEATING",
            cheat_prob: p.cheat_prob,
            direction: p.direction,
            obj_nearby: p.obj_nearby,
            obj_name: p.obj_name,
            reasons: p.reasons ?? [],
            frame_index: frame.frame_index,
            occurred_at: frame.timestamp,
          })
        }
        if (additions.length === 0) return prev
        return [...additions, ...prev].slice(0, 400)
      })
  }, [session])

  useEffect(() => {
    const f = proctoring.lastFrame
    if (!f) return
    appendLiveFromFrame(f)
  }, [proctoring.lastFrame, appendLiveFromFrame])

  if (!id) {
    return (
      <main className="bg-background min-h-svh p-8">
        <p className="text-muted-foreground text-sm">Invalid session id.</p>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="bg-background min-h-svh p-8">
        <p className="text-muted-foreground text-sm">Loading session…</p>
      </main>
    )
  }

  if (notFound || !session) {
    return (
      <main className="bg-background flex min-h-svh flex-col items-start gap-4 p-8">
        <h1 className="text-xl font-semibold">Session not found</h1>
        <p className="text-muted-foreground text-sm">
          This session does not exist or was deleted.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Back to dashboard</Link>
        </Button>
      </main>
    )
  }

  const running = session.status === "running"
  const showWsError =
    proctoring.status === "error" && (proctoring.error?.length ?? 0) > 0

  return (
    <main className="bg-background text-foreground min-h-svh p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">← Dashboard</Link>
          </Button>
        </div>

        {showWsError ? (
          <div
            className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm"
            role="alert"
          >
            {proctoring.error}
          </div>
        ) : null}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <section className="flex min-w-0 flex-1 flex-col gap-4 lg:basis-[60%]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                  {session.title}
                </h1>
                <p className="text-muted-foreground mt-1 text-xs">
                  Source:{" "}
                  <code className="bg-muted rounded px-1 py-0.5">
                    {session.source}
                  </code>
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "w-fit shrink-0 capitalize",
                  sessionStatusBadge(session.status)
                )}
              >
                {session.status === "running" ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 animate-pulse rounded-full bg-green-600 dark:bg-green-400" />
                    {session.status}
                  </span>
                ) : (
                  session.status
                )}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={busy || running}
                onClick={async () => {
                  setBusy(true)
                  try {
                    await start()
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                Start
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy || !running}
                onClick={async () => {
                  setBusy(true)
                  try {
                    await stop()
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                Stop
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={running}
                onClick={() => setUploadOpen(true)}
              >
                Upload video
              </Button>
            </div>

            <LiveFeed frame={proctoring.lastFrame} />

            <StatsPanel
              fps={proctoring.fps}
              personCount={proctoring.personCount}
              cheatingCount={proctoring.cheatingCount}
              live={proctoring.connected && running}
            />
          </section>

          <section className="flex w-full min-w-0 flex-col gap-4 lg:basis-[40%]">
            <Tabs value={tab} onValueChange={setTab} className="gap-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="events">Live Events</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>
              <TabsContent value="events" className="mt-0">
                <Card size="sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Event log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EventLog sessionId={id} liveEvents={liveCheating} />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="summary" className="mt-0">
                <Card size="sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tab === "summary" ? (
                      <SummaryCharts sessionId={id} />
                    ) : null}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="export" className="mt-0">
                <Card size="sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Export</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <p className="text-muted-foreground text-sm">
                      Download all logged events as CSV from the backend.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        window.open(
                          exportEventsUrl(id),
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      Download CSV
                    </Button>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">
                        Server log path
                      </p>
                      <code className="bg-muted mt-1 block break-all rounded-lg p-2 text-xs">
                        {session.log_csv ?? "— (run session to generate)"}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>

      <UploadVideoModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={(file) => upload(file)}
      />
    </main>
  )
}
