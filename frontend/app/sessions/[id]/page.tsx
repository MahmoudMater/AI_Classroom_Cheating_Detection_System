"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { EventLog } from "@/components/proctoring/EventLog"
import { LiveFeed } from "@/components/proctoring/LiveFeed"
import { StatsPanel } from "@/components/proctoring/StatsPanel"
import { SummaryCharts } from "@/components/proctoring/SummaryCharts"
import { UploadVideoModal } from "@/components/proctoring/UploadVideoModal"
import { Separator } from "@/components/ui/separator"
import { exportEventsUrl } from "@/lib/api"
import { useProctoring } from "@/lib/hooks/useProctoring"
import { useSession } from "@/lib/hooks/useSession"
import type { EventResponse, FrameMessage, SessionStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { LiveDot } from "@/components/brand-ui"

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: SessionStatus }) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.08)] px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-[#10B981]">
        <LiveDot />RUNNING
      </span>
    )
  }
  if (status === "stopped") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(59,158,232,0.25)] bg-[rgba(59,158,232,0.08)] px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-[#3B9EE8]">
        STOPPED
      </span>
    )
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-[#EF4444]">
        ERROR
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(100,116,139,0.2)] bg-[rgba(100,116,139,0.08)] px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-[#64748B]">
      {status}
    </span>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon, children }: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 border-b-2 px-4 py-2.5 font-['Space_Grotesk',sans-serif] text-[12px] font-semibold tracking-wide transition-all",
        active
          ? "border-[#3B9EE8] text-[#3B9EE8]"
          : "border-transparent text-[#64748B] hover:text-[#E2E8F0]"
      )}
    >
      {icon}
      {children}
    </button>
  )
}

// ─── Control button ───────────────────────────────────────────────────────────
function CtrlBtn({ onClick, disabled, variant = "primary", children }: {
  onClick: () => void
  disabled?: boolean
  variant?: "primary" | "secondary" | "ghost"
  children: React.ReactNode
}) {
  const variantCls = {
    primary: "bg-[#3B9EE8] text-white hover:bg-[#60C5F4]",
    secondary: "bg-[rgba(59,158,232,0.1)] text-[#3B9EE8] border border-[rgba(59,158,232,0.3)] hover:bg-[rgba(59,158,232,0.18)]",
    ghost: "border border-[rgba(59,158,232,0.18)] text-[#94A3B8] hover:border-[rgba(59,158,232,0.35)] hover:text-[#E2E8F0]",
  }[variant]

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-lg px-4 font-['Space_Grotesk',sans-serif] text-[13px] font-semibold transition-all",
        variantCls,
        "disabled:cursor-not-allowed disabled:opacity-40"
      )}
    >
      {children}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SessionDetailPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""

  const { session, loading, notFound, start, stop, upload } = useSession(id)
  const proctoring = useProctoring(!id || loading || notFound ? null : id)
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

  // ── Error states ──
  if (!id) {
    return (
      <div className="p-8">
        <p className="font-mono text-[13px] text-[#64748B]">Invalid session id.</p>
      </div>
    )
  }
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="size-4 animate-spin rounded-full border-2 border-[#3B9EE8] border-t-transparent" />
          <p className="font-mono text-[13px] text-[#64748B]">Loading session…</p>
        </div>
      </div>
    )
  }
  if (notFound || !session) {
    return (
      <div className="flex flex-col items-start gap-4 p-8">
        <h1 className="text-xl font-bold text-[#E2E8F0]">Session not found</h1>
        <p className="font-mono text-[13px] text-[#64748B]">This session does not exist or was deleted.</p>
        <Link
          href="/"
          className="flex h-9 items-center gap-2 rounded-lg border border-[rgba(59,158,232,0.25)] bg-transparent px-4 text-[13px] font-semibold text-[#3B9EE8] transition-all hover:bg-[rgba(59,158,232,0.08)]"
        >
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  const running = session.status === "running"
  const showWsError = proctoring.status === "error" && (proctoring.error?.length ?? 0) > 0

  return (
    <div className="p-4 text-[#E2E8F0] md:p-8">
      <div className="flex flex-col gap-5">

        {/* ── WS error banner ── */}
        {showWsError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-[rgba(239,68,68,0.3)] border-l-2 border-l-[#EF4444] bg-[rgba(239,68,68,0.06)] px-4 py-3 font-mono text-[12px] text-[#FCA5A5]" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0 text-[#EF4444]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {proctoring.error}
          </div>
        )}

        {/* ── Main layout ── */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

          {/* ── Left: feed + controls ── */}
          <section className="flex min-w-0 flex-1 flex-col gap-4 lg:basis-[60%]">

            {/* Session header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#E2E8F0] md:text-2xl">
                  {session.title}
                </h1>
                <p className="mt-0.5 font-mono text-[11px] text-[#64748B]">
                  Source:{" "}
                  <code className="rounded bg-[rgba(59,158,232,0.1)] px-1.5 py-0.5 text-[#60C5F4]">
                    {session.source}
                  </code>
                </p>
              </div>
              <StatusBadge status={session.status} />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2">
              <CtrlBtn
                disabled={busy || running}
                onClick={async () => {
                  setBusy(true)
                  try { await start() } finally { setBusy(false) }
                }}
                variant="primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Start
              </CtrlBtn>
              <CtrlBtn
                disabled={busy || !running}
                onClick={async () => {
                  setBusy(true)
                  try { await stop() } finally { setBusy(false) }
                }}
                variant="secondary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
                Stop
              </CtrlBtn>
              <CtrlBtn
                disabled={running}
                onClick={() => setUploadOpen(true)}
                variant="ghost"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                Upload Video
              </CtrlBtn>
            </div>

            {/* Live Feed */}
            <LiveFeed frame={proctoring.lastFrame} />

            {/* Stats */}
            <StatsPanel
              fps={proctoring.fps}
              personCount={proctoring.personCount}
              cheatingCount={proctoring.cheatingCount}
              live={proctoring.connected && running}
            />
          </section>

          {/* ── Right: tabs ── */}
          <section className="flex w-full min-w-0 flex-col gap-0 lg:basis-[40%]">
            <div className="overflow-hidden rounded-xl border border-[rgba(59,158,232,0.18)] bg-[#151C2C]">

              {/* Tab list */}
              <div className="flex border-b border-[rgba(59,158,232,0.12)] px-1">
                <TabBtn
                  active={tab === "events"}
                  onClick={() => setTab("events")}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  }
                >
                  Live Events
                </TabBtn>
                <TabBtn
                  active={tab === "summary"}
                  onClick={() => setTab("summary")}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/>
                    </svg>
                  }
                >
                  Summary
                </TabBtn>
                <TabBtn
                  active={tab === "export"}
                  onClick={() => setTab("export")}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                  }
                >
                  Export
                </TabBtn>
              </div>

              {/* Tab panels */}
              <div className="p-4">
                {tab === "events" && (
                  <EventLog sessionId={id} liveEvents={liveCheating} />
                )}
                {tab === "summary" && (
                  <SummaryCharts sessionId={id} />
                )}
                {tab === "export" && (
                  <div className="flex flex-col gap-4">
                    <p className="text-[13px] text-[#94A3B8]">
                      Download all logged events as a CSV file from the backend.
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open(exportEventsUrl(id), "_blank", "noopener,noreferrer")}
                      className="flex h-9 w-fit items-center gap-2 rounded-lg bg-[rgba(59,158,232,0.1)] border border-[rgba(59,158,232,0.3)] px-4 font-['Space_Grotesk',sans-serif] text-[13px] font-semibold text-[#3B9EE8] transition-all hover:bg-[rgba(59,158,232,0.18)]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                      </svg>
                      Download CSV
                    </button>
                    <div className="h-px bg-[rgba(59,158,232,0.1)]" />
                    <div>
                      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B]">
                        Server Log Path
                      </p>
                      <code className="block break-all rounded-lg border border-[rgba(59,158,232,0.12)] bg-[#0A0F1A] p-3 font-mono text-[11px] text-[#60C5F4]">
                        {session.log_csv ?? "— (run session to generate)"}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <UploadVideoModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={(file) => upload(file)}
      />
    </div>
  )
}