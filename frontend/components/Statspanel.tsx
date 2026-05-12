"use client"

import { cn } from "@/lib/utils"
import { LiveDot, BrandBadge, GlassCard, SectionLabel } from "./brand-ui"
import { Zap, Users, AlertTriangle, Activity } from "lucide-react"

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
    <GlassCard
      accent="none"
      className={cn(
        "grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5 border-white/5",
        className
      )}
    >
      {/* Stream */}
      <div className="flex flex-col gap-3 p-5">
        <SectionLabel className="mb-0">Stream</SectionLabel>
        {live ? (
          <BrandBadge variant="green" className="w-fit">
            <LiveDot />
            LIVE
          </BrandBadge>
        ) : (
          <BrandBadge variant="muted" className="w-fit">
            OFFLINE
          </BrandBadge>
        )}
      </div>

      {/* FPS */}
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-1.5 text-white/30">
          <Zap className="size-3" />
          <SectionLabel className="mb-0">FPS</SectionLabel>
        </div>
        <span className="font-mono text-3xl font-bold leading-none text-white tabular-nums">
          {fps.toFixed(1)}
        </span>
      </div>

      {/* Persons */}
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-1.5 text-white/30">
          <Users className="size-3" />
          <SectionLabel className="mb-0">Persons</SectionLabel>
        </div>
        <span className="font-mono text-3xl font-bold leading-none text-white tabular-nums">
          {personCount}
        </span>
      </div>

      {/* Cheating */}
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-1.5 text-white/30">
          <AlertTriangle className={cn("size-3", cheatingCount > 0 ? "text-[#EF4444]" : "")} />
          <SectionLabel className="mb-0">Incidents</SectionLabel>
        </div>
        <span
          className={cn(
            "font-mono text-3xl font-bold leading-none tabular-nums",
            cheatingCount > 0 ? "text-[#EF4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" : "text-white/80"
          )}
        >
          {cheatingCount}
        </span>
      </div>
    </GlassCard>
  )
}