"use client"

import { useEffect, useRef, useState, startTransition } from "react"
import { listModels } from "@/lib/api"
import type { ModelInfo } from "@/lib/types"
import { cn } from "@/lib/utils"
import { SectionLabel, BrandBadge } from "./brand-ui"
import { Cpu, Check, AlertCircle, Loader2 } from "lucide-react"

export interface ModelSelectorProps {
  value: string | null
  onChange: (filename: string) => void
  disabled?: boolean
}

export function ModelSelector({
  value,
  onChange,
  disabled,
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let cancelled = false
    startTransition(() => {
      setLoading(true)
      setError(null)
    })
    void listModels()
      .then((res) => {
        if (cancelled) return
        setModels(res.models)
        if (res.models.length === 1) {
          onChangeRef.current(res.models[0].filename)
        }
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Failed to load models")
        setModels([])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        <SectionLabel>Select Model</SectionLabel>
        <div className="h-20 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 transition-colors" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <SectionLabel>Select Model</SectionLabel>
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-rose-50 dark:bg-red-500/5 p-4 text-sm text-rose-600 dark:text-red-400 transition-colors">
          <AlertCircle className="size-5 shrink-0" />
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel className="mb-0">Select Model</SectionLabel>
        <span className="text-[10px] font-mono text-slate-400 dark:text-white/30 uppercase tracking-widest transition-colors">
          {models.length} AVAILABLE
        </span>
      </div>
      
      <div className="grid gap-2">
        {models.map((m, idx) => {
          const isSelected = value === m.filename || (models.length === 1)
          const isWinner = idx === 0

          return (
            <button
              key={m.filename}
              type="button"
              disabled={disabled}
              onClick={() => onChangeRef.current(m.filename)}
              className={cn(
                "group relative flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300",
                isSelected
                  ? "border-blue-500/50 dark:border-[#3B9EE8]/50 bg-blue-50 dark:bg-[#3B9EE8]/10 shadow-lg shadow-blue-500/5 dark:shadow-[#3B9EE8]/5"
                  : "border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:border-blue-500/30 dark:hover:border-white/10 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
                isSelected
                  ? "border-blue-500/30 dark:border-[#3B9EE8]/30 bg-blue-500/20 dark:bg-[#3B9EE8]/20 text-blue-600 dark:text-[#3B9EE8]"
                  : "border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20 group-hover:text-slate-600 dark:group-hover:text-white/40"
              )}>
                <Cpu className="size-6" strokeWidth={1.5} />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className={cn(
                  "truncate text-sm font-bold tracking-tight transition-colors",
                  isSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-white/60 group-hover:text-slate-900 dark:group-hover:text-white/80"
                )}>
                  {m.filename}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-wider transition-colors">
                    {m.size_mb.toFixed(1)} MB
                  </span>
                  {isWinner && (
                    <BrandBadge variant="amber" className="scale-90 origin-left">RELIABLE</BrandBadge>
                  )}
                </div>
              </div>

              {/* Selection Indicator */}
              <div className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                isSelected
                  ? "border-blue-600 dark:border-[#3B9EE8] bg-blue-600 dark:bg-[#3B9EE8] text-white"
                  : "border-slate-300 dark:border-white/10 bg-transparent text-transparent"
              )}>
                <Check className="size-3.5" strokeWidth={3} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}