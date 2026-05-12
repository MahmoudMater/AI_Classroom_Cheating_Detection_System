"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CreateSessionModal } from "@/components/Createsessionmodal"
import { SessionCard } from "@/components/Sessioncard"
import { healthCheck } from "@/lib/api"
import { useSessions } from "@/lib/hooks/useSessions"
import { cn } from "@/lib/utils"
import {  PremiumButton, LiveDot, SectionLabel } from "@/components/brand-ui"
import { Activity, Plus, Image as ImageIcon, Shield, ChevronRight, Sparkles, Clock, Database, Server } from "lucide-react"

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

  // Stats calculation
  const totalSessions = sessions.length
  const activeSessions = sessions.filter(s => s.status === "running").length

  const actions = (
    <div className="flex flex-wrap items-center gap-3">
      <Link href="/analyze">
        <PremiumButton variant="secondary" size="sm" className="transition-all">
          <ImageIcon className="size-4" />
          <span className="hidden sm:inline">Analyze</span>
          <span className="sm:hidden">Image</span>
        </PremiumButton>
      </Link>
      
      <PremiumButton onClick={() => setCreateOpen(true)} size="sm" className="bg-gradient-to-r from-[#3B9EE8] to-[#2B7FC8] shadow-lg shadow-blue-500/20 dark:shadow-[#3B9EE8]/20">
        <Plus className="size-4" />
        <span className="hidden sm:inline">New Session</span>
        <span className="sm:hidden">New</span>
      </PremiumButton>
    </div>
  )

  return (
    <main className="relative min-h-screen bg-white dark:bg-gradient-to-br dark:from-[#070B14] dark:via-[#0A0F1A] dark:to-[#070B14] transition-colors duration-300">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/10 dark:bg-[#3B9EE8]/10 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-blue-500/5 dark:bg-[#3B9EE8]/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/[0.02] dark:bg-[#3B9EE8]/[0.02] blur-[120px]" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,158,232,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,158,232,0.03)_1px,transparent_1px)] bg-[size:40px_40px] dark:opacity-100 opacity-50" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-11/12 px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
        
        {/* Header Section */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B9EE8] to-[#2B7FC8] shadow-lg shadow-[#3B9EE8]/30">
                  <Shield className="size-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">
                    Proctoring Dashboard
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-white/40 mt-1 transition-colors">
                    Monitor exam sessions, live video, and integrity events in real-time
                  </p>
                </div>
              </div>
            </div>
            
            {actions}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 backdrop-blur-sm transition-all shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 dark:text-white/40 uppercase tracking-wider transition-colors">Total Sessions</span>
                <div className="size-8 rounded-lg bg-blue-500/10 dark:bg-[#3B9EE8]/10 flex items-center justify-center transition-colors">
                  <Activity className="size-4 text-blue-600 dark:text-[#3B9EE8]" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{totalSessions}</div>
              <div className="text-xs text-slate-400 dark:text-white/30 mt-1 transition-colors">Created sessions</div>
            </div>

            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 backdrop-blur-sm transition-all shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 dark:text-white/40 uppercase tracking-wider transition-colors">Active Now</span>
                <LiveDot />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{activeSessions}</div>
              <div className="text-xs text-slate-400 dark:text-white/30 mt-1 transition-colors">Currently running</div>
            </div>
          </div>

          {/* System Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Server className="size-3.5 text-slate-400 dark:text-white/30 transition-colors" />
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "size-1.5 rounded-full transition-all duration-500",
                    healthOk === null && "bg-slate-300 dark:bg-zinc-400 animate-pulse",
                    healthOk === true && "bg-emerald-500 shadow-lg shadow-emerald-500/50 dark:bg-green-500 dark:shadow-green-500/50",
                    healthOk === false && "bg-rose-500"
                  )} />
                  <span className="text-xs font-mono text-slate-500 dark:text-white/60 transition-colors">API</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "size-1.5 rounded-full transition-all duration-500",
                    dbOk === null && "bg-slate-300 dark:bg-zinc-400 animate-pulse",
                    dbOk === true && "bg-emerald-500 shadow-lg shadow-emerald-500/50 dark:bg-green-500 dark:shadow-green-500/50",
                    dbOk === false && "bg-rose-500"
                  )} />
                  <span className="text-xs font-mono text-slate-500 dark:text-white/60 transition-colors">Database</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 dark:text-white/40 flex items-center gap-1 transition-colors">
                <Clock className="size-3" />
                Auto-refresh every 30s
              </div>
            </div>
            
            {anyRunning && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-green-500/10 border border-emerald-500/20 dark:border-green-500/20 transition-colors">
                <div className="size-1.5 rounded-full bg-emerald-500 dark:bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-green-400 uppercase tracking-wider">
                  Live monitoring active
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sessions Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <SectionLabel className="!mb-0">
              {totalSessions > 0 ? "Active & Recent Sessions" : "Sessions"}
            </SectionLabel>
            {totalSessions > 0 && (
              <button className="text-xs text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60 transition-colors">
                View All <ChevronRight className="size-3 inline ml-0.5" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="relative overflow-hidden rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 animate-pulse">
                  <div className="h-32 bg-slate-200 dark:bg-white/10" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-slate-200 dark:bg-white/10 rounded w-16" />
                      <div className="h-6 bg-slate-200 dark:bg-white/10 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] backdrop-blur-sm transition-colors">
              <div className="size-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6 transition-colors">
                <Activity className="size-10 text-slate-300 dark:text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">No sessions yet</h3>
              <p className="text-slate-500 dark:text-[#94A3B8] text-center max-w-md mb-8 text-sm transition-colors">
                Get started by creating your first proctoring session. Sessions will appear here with live status and integrity event tracking.
              </p>
              <PremiumButton onClick={() => setCreateOpen(true)} size="lg" className="bg-gradient-to-r from-[#3B9EE8] to-[#2B7FC8]">
                <Plus className="size-4" />
                Create your first session
              </PremiumButton>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sessions.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
              
              {sessions.length > 9 && (
                <div className="flex justify-center pt-6">
                  <button className="px-6 py-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-sm">
                    Load More Sessions
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CreateSessionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void refetch()}
      />
    </main>
  )
}