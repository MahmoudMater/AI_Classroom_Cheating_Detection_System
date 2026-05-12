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
    <div className="relative min-h-screen bg-gradient-to-br from-[#070B14] via-[#0A0F1A] to-[#070B14]">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#3B9EE8]/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#3B9EE8]/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,158,232,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,158,232,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10 mx-auto w-full px-4 sm:px-8 py-10">
        {/* Navigation & Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="space-y-4">
            <Link href={`/sessions/${id}`} className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-[#3B9EE8] transition-colors group">
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Back to Session Monitor
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B9EE8] to-[#2B7FC8] shadow-lg shadow-[#3B9EE8]/20">
                <BarChart3 className="size-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white tracking-tight">{session.title}</h1>
                  <BrandBadge variant="muted" className="bg-white/5 border-white/10 uppercase tracking-widest text-[10px]">
                    Detailed Analytics
                  </BrandBadge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-white/40">
                  <span className="flex items-center gap-1.5 uppercase tracking-widest text-[10px] font-bold">
                    <Clock className="size-3 text-[#3B9EE8]" />
                    Session ID: {id.slice(0, 8)}...
                  </span>
                  <span className="flex items-center gap-1.5 uppercase tracking-widest text-[10px] font-bold">
                    <Shield className="size-3 text-[#3B9EE8]" />
                    Node: {session.source}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <PremiumButton 
              variant="secondary" 
              onClick={() => window.open(exportEventsUrl(id), "_blank")}
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              <Download className="size-4" />
              Export Dataset (CSV)
            </PremiumButton>
          </div>
        </div>

        {/* Main Analysis Section */}
        <div className="space-y-8">
          <SummaryCharts sessionId={id} />

          {/* Bottom Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <GlassCard className="p-6 border-white/5 bg-white/[0.02]">
                <SectionLabel className="text-xs">Data Origin</SectionLabel>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/5">
                   <div className="size-10 rounded-lg bg-[#3B9EE8]/10 flex items-center justify-center">
                      <Shield className="size-5 text-[#3B9EE8]" />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Storage Path</p>
                      <code className="text-[10px] text-white/30 font-mono break-all">{session.log_csv || "N/A"}</code>
                   </div>
                </div>
             </GlassCard>
             <GlassCard className="p-6 border-white/5 bg-white/[0.02]">
                <SectionLabel className="text-xs">Inference Engine</SectionLabel>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/5">
                   <div className="size-10 rounded-lg bg-[#3B9EE8]/10 flex items-center justify-center">
                      <BarChart3 className="size-5 text-[#3B9EE8]" />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Detection Logic</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest">Multi-stage Neural Architecture with Temporal Smoothing</p>
                   </div>
                </div>
             </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
