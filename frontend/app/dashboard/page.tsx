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
        <PremiumButton variant="secondary" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-white">
          <ImageIcon className="size-4" />
          <span className="hidden sm:inline">Analyze</span>
          <span className="sm:hidden">Image</span>
        </PremiumButton>
      </Link>
      
      <PremiumButton onClick={() => setCreateOpen(true)} size="sm" className="bg-gradient-to-r from-[#3B9EE8] to-[#2B7FC8] shadow-lg shadow-[#3B9EE8]/20">
        <Plus className="size-4" />
        <span className="hidden sm:inline">New Session</span>
        <span className="sm:hidden">New</span>
      </PremiumButton>
    </div>
  )

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-[#070B14] via-[#0A0F1A] to-[#070B14]">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#3B9EE8]/10 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#3B9EE8]/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#3B9EE8]/[0.02] blur-[120px]" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,158,232,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,158,232,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
        
        {/* Header Section */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B9EE8] to-[#2B7FC8] shadow-lg shadow-[#3B9EE8]/30">
                  <Shield className="size-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Proctoring Dashboard
                  </h1>
                  <p className="text-sm text-white/40 mt-1">
                    Monitor exam sessions, live video, and integrity events in real-time
                  </p>
                </div>
              </div>
            </div>
            
            {actions}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Total Sessions</span>
                <div className="size-8 rounded-lg bg-[#3B9EE8]/10 flex items-center justify-center">
                  <Activity className="size-4 text-[#3B9EE8]" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{totalSessions}</div>
              <div className="text-xs text-white/30 mt-1">Created sessions</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Active Now</span>
                <LiveDot />
              </div>
              <div className="text-2xl font-bold text-white">{activeSessions}</div>
              <div className="text-xs text-white/30 mt-1">Currently running</div>
            </div>

           
          </div>

          {/* System Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Server className="size-3.5 text-white/30" />
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "size-1.5 rounded-full transition-all duration-500",
                    healthOk === null && "bg-zinc-400 animate-pulse",
                    healthOk === true && "bg-green-500 shadow-lg shadow-green-500/50",
                    healthOk === false && "bg-red-500"
                  )} />
                  <span className="text-xs font-mono text-white/60">API</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "size-1.5 rounded-full transition-all duration-500",
                    dbOk === null && "bg-zinc-400 animate-pulse",
                    dbOk === true && "bg-green-500 shadow-lg shadow-green-500/50",
                    dbOk === false && "bg-red-500"
                  )} />
                  <span className="text-xs font-mono text-white/60">Database</span>
                </div>
              </div>
              <div className="text-xs text-white/40 flex items-center gap-1">
                <Clock className="size-3" />
                Auto-refresh every 30s
              </div>
            </div>
            
            {anyRunning && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
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
              <button className="text-xs text-white/40 hover:text-white/60 transition-colors">
                View All <ChevronRight className="size-3 inline ml-0.5" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 animate-pulse">
                  <div className="h-32 bg-white/10" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-white/10 rounded w-16" />
                      <div className="h-6 bg-white/10 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] backdrop-blur-sm">
              <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Activity className="size-10 text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No sessions yet</h3>
              <p className="text-[#94A3B8] text-center max-w-md mb-8 text-sm">
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
                  <button className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm">
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