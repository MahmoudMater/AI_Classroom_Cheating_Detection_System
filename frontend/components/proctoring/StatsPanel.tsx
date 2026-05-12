"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface StatsPanelProps {
  fps: number
  personCount: number
  cheatingCount: number
  live: boolean
  className?: string
}

export function StatsPanel({
  fps,
  personCount,
  cheatingCount,
  live,
  className,
}: StatsPanelProps) {
  return (
    <div className={cn(
      "grid grid-cols-2 gap-4 sm:grid-cols-4 p-5 rounded-2xl border transition-all duration-300",
      "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]",
      className
    )}>
      <div className="flex flex-col gap-1.5">
        <span className="text-slate-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-widest transition-colors">
          Stream Status
        </span>
        <div className="flex items-center gap-2">
          <div className={cn(
            "size-2 rounded-full animate-pulse",
            live ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-slate-300 dark:bg-white/20"
          )} />
          <span className={cn(
            "text-sm font-bold tracking-tight",
            live ? "text-emerald-600 dark:text-emerald-500" : "text-slate-400 dark:text-white/40"
          )}>
            {live ? "LIVE FEED" : "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-slate-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-widest transition-colors">
          Inference FPS
        </span>
        <span className="font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white transition-colors">
          {fps.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-slate-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-widest transition-colors">
          Total Persons
        </span>
        <span className="font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white transition-colors">
          {personCount}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-slate-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-widest transition-colors">
          Detected Violations
        </span>
        <span className={cn(
          "font-mono text-xl font-bold tabular-nums transition-colors",
          cheatingCount > 0 ? "text-rose-600 dark:text-red-500" : "text-slate-900 dark:text-white"
        )}>
          {cheatingCount}
        </span>
      </div>
    </div>
  )
}
