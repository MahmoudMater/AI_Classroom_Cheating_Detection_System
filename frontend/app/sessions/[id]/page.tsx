"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { EventLog } from "@/components/proctoring/EventLog"
import { LiveFeed } from "@/components/proctoring/LiveFeed"
import { StatsPanel } from "@/components/proctoring/StatsPanel"
import { UploadVideoModal } from "@/components/proctoring/UploadVideoModal"
import { Separator } from "@/components/ui/separator"
import { BarChart3, ChevronRight, Upload, Play, Square, ExternalLink, Activity, Download } from "lucide-react"
import { exportEventsUrl } from "@/lib/api"
import { useProctoring } from "@/lib/hooks/useProctoring"
import { useSession } from "@/lib/hooks/useSession"
import type { EventResponse, FrameMessage, SessionStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { LiveDot, PremiumButton } from "@/components/brand-ui"

// ─── Status badge ─────────────────────────────────────────────────────────────
// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: SessionStatus }) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-emerald-600 dark:text-emerald-400 transition-colors">
        <LiveDot />RUNNING
      </span>
    )
  }
  if (status === "stopped") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-slate-500 dark:text-white/40 transition-colors">
        STOPPED
      </span>
    )
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-rose-600 dark:text-rose-400 transition-colors">
        ERROR
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-slate-500 dark:text-white/40 transition-colors">
      {status.toUpperCase()}
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
        "flex items-center gap-2 px-6 py-3 font-bold text-[11px] uppercase tracking-[0.1em] transition-all relative",
        active
          ? "text-blue-600 dark:text-[#3B9EE8]"
          : "text-slate-400 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60"
      )}
    >
      {icon}
      {children}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-[#3B9EE8] shadow-lg shadow-blue-500/50" />
      )}
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
    primary: "bg-blue-600 dark:bg-[#3B9EE8] text-white hover:bg-blue-700 dark:hover:bg-[#2B7FC8] shadow-md hover:shadow-lg dark:shadow-none",
    secondary: "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10",
    ghost: "border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white",
  }[variant]

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-bold uppercase tracking-wider transition-all",
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
    <div className="p-4 text-slate-900 dark:text-[#E2E8F0] md:p-8 transition-colors">
      <div className="flex flex-col gap-6">

        {/* ── WS error banner ── */}
        {showWsError && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 dark:border-rose-900/30 border-l-4 border-l-rose-500 bg-rose-50 dark:bg-rose-900/10 px-5 py-4 text-sm text-rose-700 dark:text-rose-300 shadow-sm transition-all" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="flex flex-col">
              <span className="font-bold uppercase tracking-widest text-[10px] opacity-60">Connection Error</span>
              <span className="font-medium">{proctoring.error}</span>
            </div>
          </div>
        )}

        {/* ── Main layout ── */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

          {/* ── Left: feed + controls ── */}
          <section className="flex min-w-0 flex-1 flex-col gap-6 lg:basis-[60%]">

            {/* Session header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50 dark:bg-white/[0.02] p-6 rounded-3xl border border-slate-200 dark:border-white/10 transition-colors">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl transition-colors">
                  {session.title}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Source Node</span>
                  <code className="rounded-lg bg-blue-50 dark:bg-[#3B9EE8]/10 px-2.5 py-1 text-[10px] font-bold font-mono text-blue-600 dark:text-[#60C5F4] border border-blue-100 dark:border-blue-500/20 transition-colors">
                    {session.source}
                  </code>
                </div>
              </div>
              <StatusBadge status={session.status} />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <CtrlBtn
                disabled={busy || running}
                onClick={async () => {
                  setBusy(true)
                  try { await start() } finally { setBusy(false) }
                }}
                variant="primary"
              >
                <Play className="size-4 fill-current" />
                Initialize
              </CtrlBtn>
              <CtrlBtn
                disabled={busy || !running}
                onClick={async () => {
                  setBusy(true)
                  try { await stop() } finally { setBusy(false) }
                }}
                variant="secondary"
              >
                <Square className="size-4 fill-current" />
                Terminate
              </CtrlBtn>
              <CtrlBtn
                disabled={running}
                onClick={() => setUploadOpen(true)}
                variant="ghost"
              >
                <Upload className="size-4" />
                Upload Data
              </CtrlBtn>

              <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-2 hidden sm:block transition-colors" />

              <Link href={`/sessions/${id}/analysis`}>
                <PremiumButton variant="secondary" size="sm" className="h-10 px-5 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-[#3B9EE8]/30 hover:text-blue-600 dark:hover:text-[#3B9EE8] transition-all shadow-sm dark:shadow-none">
                  <BarChart3 className="size-4" />
                  Analytics Hub
                  <ChevronRight className="size-3 ml-2 opacity-40" />
                </PremiumButton>
              </Link>
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
          <section className="flex w-full min-w-0 flex-col lg:basis-[40%]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0A0F1A] shadow-xl dark:shadow-none transition-colors">

              {/* Tab list */}
              <div className="flex border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] transition-colors">
                <TabBtn
                  active={tab === "events"}
                  onClick={() => setTab("events")}
                  icon={<Activity className="size-4" />}
                >
                  Live Events
                </TabBtn>
                <TabBtn
                  active={tab === "export"}
                  onClick={() => setTab("export")}
                  icon={<Download className="size-4" />}
                >
                  Data Export
                </TabBtn>
              </div>

              {/* Tab panels */}
              <div className="p-6">
                {tab === "events" && (
                  <EventLog sessionId={id} liveEvents={liveCheating} />
                )}
                {tab === "export" && (
                  <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white transition-colors">Full Dataset Export</h3>
                      <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed transition-colors">
                        Generate and download a comprehensive CSV report of all detected incidents, timestamps, and confidence levels.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => window.open(exportEventsUrl(id), "_blank", "noopener,noreferrer")}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-50 dark:bg-[#3B9EE8]/10 border border-blue-200 dark:border-[#3B9EE8]/30 px-6 font-bold text-[13px] text-blue-600 dark:text-[#3B9EE8] transition-all hover:bg-blue-100 dark:hover:bg-[#3B9EE8]/20 shadow-sm"
                    >
                      <Download className="size-4" />
                      Download Manifest
                    </button>

                    <div className="h-px bg-slate-100 dark:bg-white/5 transition-colors" />

                    <div className="space-y-3">
                      <p className="font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
                        Local Server Endpoint
                      </p>
                      <div className="group relative">
                        <code className="block break-all rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 p-4 font-mono text-[11px] text-blue-600 dark:text-[#60C5F4] transition-colors">
                          {session.log_csv ?? "— (awaiting session initialization)"}
                        </code>
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                      </div>
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