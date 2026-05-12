"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getEventSummary } from "@/lib/api"
import type { SessionResponse, SessionStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { LiveDot, BrandBadge, GlassCard } from "./brand-ui"
import { Calendar, AlertCircle, ArrowRight } from "lucide-react"

function statusConfig(status: SessionStatus) {
  switch (status) {
    case "running":
      return {
        badge: (
          <BrandBadge variant="green">
            <LiveDot />
            RUNNING
          </BrandBadge>
        ),
        accent: "green" as const,
      }
    case "stopped":
      return {
        badge: <BrandBadge variant="blue">STOPPED</BrandBadge>,
        accent: "blue" as const,
      }
    case "error":
      return {
        badge: <BrandBadge variant="red">ERROR</BrandBadge>,
        accent: "red" as const,
      }
    default:
      return {
        badge: <BrandBadge variant="muted">{status.toUpperCase()}</BrandBadge>,
        accent: "none" as const,
      }
  }
}

export interface SessionCardProps {
  session: SessionResponse
}

export function SessionCard({ session }: SessionCardProps) {
  const [cheatingCount, setCheatingCount] = useState<number | null>(null)
  const { badge, accent } = statusConfig(session.status)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const s = await getEventSummary(session.id)
        if (!cancelled) setCheatingCount(s.cheating_count)
      } catch {
        if (!cancelled) setCheatingCount(null)
      }
    })()
    return () => { cancelled = true }
  }, [session.id])

  return (
    <Link href={`/sessions/${session.id}`} className="group block h-full">
      <GlassCard
        accent={accent}
        className="h-full border-slate-200 dark:border-white/5 transition-all duration-300 group-hover:border-blue-500/50 dark:group-hover:border-[#3B9EE8]/30 group-hover:bg-slate-50 dark:group-hover:bg-[#151C2C]/90 group-hover:shadow-xl dark:group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <div className="p-6 flex flex-col h-full">
          {/* Title row */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-lg font-bold leading-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#3B9EE8] transition-colors">
              {session.title}
            </h3>
            <div className="shrink-0 pt-1">{badge}</div>
          </div>

          {/* Metadata */}
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#94A3B8] transition-colors">
              <Calendar className="size-3.5" />
              <span className="font-mono text-[10px] uppercase tracking-wider">
                {session.started_at
                  ? new Date(session.started_at).toLocaleString()
                  : "NOT STARTED"}
              </span>
            </div>
            {session.source !== "0" && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-[#94A3B8] transition-colors">
                <div className="size-3.5 flex items-center justify-center">
                  <div className="size-1 rounded-full bg-slate-400 dark:bg-white/20" />
                </div>
                <span className="font-mono text-[10px] truncate max-w-[200px]">
                  {session.source}
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto">
            {/* Divider */}
            <div className="mb-4 h-px bg-slate-100 dark:bg-white/5 transition-colors" />

            {/* Stats row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="mb-1 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-white/30 transition-colors">
                  <AlertCircle className="size-2.5" />
                  Incidents
                </span>
                <p
                  className={cn(
                    "font-mono text-3xl font-bold tabular-nums leading-none transition-all",
                    cheatingCount !== null && cheatingCount > 0
                      ? "text-rose-600 dark:text-[#EF4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.2)] dark:drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                      : "text-slate-900 dark:text-white/80"
                  )}
                >
                  {cheatingCount ?? 0}
                </p>
              </div>

              {/* View Details hint */}
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-blue-600 dark:text-[#3B9EE8] transition-all duration-300 group-hover:bg-blue-600 dark:group-hover:bg-[#3B9EE8] group-hover:text-white group-hover:border-blue-600 dark:group-hover:border-[#3B9EE8]">
                <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}