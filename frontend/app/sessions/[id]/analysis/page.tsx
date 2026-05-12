"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, BarChart3, Shield, Clock, Download } from "lucide-react"
import { SummaryCharts } from "@/components/proctoring/SummaryCharts"
import { useSession } from "@/lib/hooks/useSession"
import { PremiumButton, GlassCard, SectionLabel, BrandBadge } from "@/components/brand-ui"
import { cn } from "@/lib/utils"
import { exportEventsUrl } from "@/lib/api"

export default function SessionAnalysisPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""
  const { session, loading, notFound } = useSession(id)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-4 border-white/10 border-t-[#3B9EE8] animate-spin" />
          <p className="text-white/40 font-mono text-sm animate-pulse tracking-widest uppercase">Initializing Analysis Engine...</p>
        </div>
      </div>
    )
  }

  if (notFound || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Session Data Not Found</h1>
        <p className="text-white/40 mb-8">The requested proctoring session could not be retrieved.</p>
        <Link href="/dashboard">
          <PremiumButton variant="secondary">Back to Dashboard</PremiumButton>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#070B14] transition-colors overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-[#3B9EE8]/10 blur-[120px] transition-all" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/5 dark:bg-[#3B9EE8]/5 blur-[120px] transition-all" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,158,232,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,158,232,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(59,158,232,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,158,232,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10 mx-auto w-full px-4 sm:px-8 py-10">
        {/* Navigation & Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="space-y-4">
            <Link href={`/sessions/${id}`} className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 hover:text-blue-600 dark:hover:text-[#3B9EE8] transition-colors group">
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Monitor Feed
            </Link>
            <div className="flex items-center gap-6">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 dark:from-[#3B9EE8] dark:to-[#2B7FC8] shadow-xl shadow-blue-500/20 dark:shadow-[#3B9EE8]/20 transition-all">
                <BarChart3 className="size-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">{session.title}</h1>
                  <BrandBadge variant="blue" className="uppercase tracking-[0.2em] text-[9px] font-black px-3 py-1">
                    Intelligence Report
                  </BrandBadge>
                </div>
                <div className="flex flex-wrap items-center gap-6 mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40">
                  <span className="flex items-center gap-2 transition-colors">
                    <Clock className="size-3.5 text-blue-500 dark:text-[#3B9EE8]" />
                    HASH: {id.slice(0, 12)}
                  </span>
                  <span className="flex items-center gap-2 transition-colors">
                    <Shield className="size-3.5 text-blue-500 dark:text-[#3B9EE8]" />
                    ORIGIN: {session.source}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <PremiumButton 
              variant="secondary" 
              onClick={() => window.open(exportEventsUrl(id), "_blank")}
              className="bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm dark:shadow-none h-11 px-6 text-xs font-bold uppercase tracking-widest transition-all"
            >
              <Download className="size-4" />
              Export Dataset
            </PremiumButton>
          </div>
        </div>

        {/* Main Analysis Section */}
        <div className="space-y-8">
          <SummaryCharts sessionId={id} />

          {/* Bottom Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <GlassCard className="p-8 border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-lg dark:shadow-none transition-colors">
                <SectionLabel className="text-[10px] mb-4 text-blue-600 dark:text-[#3B9EE8]">Data Infrastructure</SectionLabel>
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 transition-colors">
                   <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Shield className="size-6 text-blue-600 dark:text-[#3B9EE8]" />
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1">Secure Storage Path</p>
                      <code className="text-[11px] text-blue-600 dark:text-white/60 font-mono break-all leading-tight">{session.log_csv || "PENDING_GENERATION"}</code>
                   </div>
                </div>
             </GlassCard>
             <GlassCard className="p-8 border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-lg dark:shadow-none transition-colors">
                <SectionLabel className="text-[10px] mb-4 text-blue-600 dark:text-[#3B9EE8]">Detection Core</SectionLabel>
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 transition-colors">
                   <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <BarChart3 className="size-6 text-blue-600 dark:text-[#3B9EE8]" />
                   </div>
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1">Architecture</p>
                      <p className="text-[11px] font-bold text-slate-900 dark:text-white/80 uppercase tracking-tight transition-colors">
                        Temporal Neural Smoothing <span className="text-blue-500 dark:text-[#3B9EE8] mx-1">v4.2</span>
                      </p>
                   </div>
                </div>
             </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
