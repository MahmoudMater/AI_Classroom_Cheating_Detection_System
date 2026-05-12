"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import ReactECharts from "echarts-for-react"
import * as echarts from "echarts"
import { 
  BarChart3, 
  Activity, 
  Target, 
  Users, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  Shield, 
  Smartphone, 
  Laptop, 
  Book, 
  FileText,
  Map as MapIcon
} from "lucide-react"

import { getEventSummary } from "@/lib/api"
import type { EventSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import { GlassCard, SectionLabel, BrandBadge } from "@/components/brand-ui"

export interface SummaryChartsProps {
  sessionId: string
}

const THEME_COLORS = {
  blue: "#3B9EE8",
  red: "#EF4444",
  green: "#10B981",
  amber: "#F59E0B",
  text: "#94A3B8",
  border: "rgba(255, 255, 255, 0.05)",
  bg: "rgba(10, 15, 26, 0.4)"
}

export function SummaryCharts({ sessionId }: SummaryChartsProps) {
  const [data, setData] = useState<EventSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setLoading(true)
    void (async () => {
      try {
        const s = await getEventSummary(sessionId)
        if (!cancelled) setData(s)
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load summary")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [sessionId])

  // ── Timeline Option ────────────────────────────────────────────────────────
  const timelineOption = useMemo(() => {
    if (!data) return {}
    const timeline = data.timeline
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(13, 20, 34, 0.9)",
        borderColor: "rgba(59, 158, 232, 0.2)",
        textStyle: { color: "#fff", fontSize: 12 },
        borderWidth: 1,
        formatter: (params: any) => {
          let res = `<div className="font-mono text-[10px] mb-1">MINUTE ${params[0].name}</div>`
          params.forEach((item: any) => {
            res += `<div className="flex items-center gap-2">
              <div className="size-2 rounded-full" style="background: ${item.color}"></div>
              <span className="text-white/40 uppercase text-[9px] font-bold">${item.seriesName}:</span>
              <span className="text-white font-bold">${item.value}</span>
            </div>`
          })
          return res
        }
      },
      legend: {
        data: ["Cheating", "Normal"],
        textStyle: { color: THEME_COLORS.text, fontSize: 10, fontWeight: "bold" },
        right: 0,
        icon: "circle"
      },
      grid: { left: "2%", right: "2%", bottom: "3%", top: "15%", containLabel: true },
      xAxis: {
        type: "category",
        data: timeline.map(t => t.minute),
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.05)" } },
        axisLabel: { color: THEME_COLORS.text, fontSize: 10, fontFamily: "monospace" }
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.03)", type: "dashed" } },
        axisLabel: { color: THEME_COLORS.text, fontSize: 10, fontFamily: "monospace" }
      },
      series: [
        {
          name: "Cheating",
          type: "line",
          smooth: true,
          symbolSize: 8,
          lineStyle: { width: 3, color: THEME_COLORS.red },
          itemStyle: { color: THEME_COLORS.red },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(239, 68, 68, 0.2)" },
              { offset: 1, color: "rgba(239, 68, 68, 0)" }
            ])
          },
          data: timeline.map(t => t.cheating)
        },
        {
          name: "Normal",
          type: "line",
          smooth: true,
          symbolSize: 8,
          lineStyle: { width: 3, color: THEME_COLORS.green },
          itemStyle: { color: THEME_COLORS.green },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(16, 185, 129, 0.1)" },
              { offset: 1, color: "rgba(16, 185, 129, 0)" }
            ])
          },
          data: timeline.map(t => t.ok)
        }
      ]
    }
  }, [data])

  // ── Confidence Option ──────────────────────────────────────────────────────
  const confidenceOption = useMemo(() => {
    if (!data) return {}
    const conf = data.confidence_distribution
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(13, 20, 34, 0.9)",
        borderColor: "rgba(59, 158, 232, 0.2)",
        textStyle: { color: "#fff" }
      },
      grid: { left: "10%", right: "10%", bottom: "10%", top: "10%", containLabel: true },
      xAxis: {
        type: "value",
        axisLabel: { show: false },
        splitLine: { show: false }
      },
      yAxis: {
        type: "category",
        data: conf.map(c => c.range).reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: THEME_COLORS.text, fontSize: 10, fontWeight: "bold" }
      },
      series: [
        {
          type: "bar",
          data: conf.map(c => c.count).reverse(),
          itemStyle: {
            color: (params: any) => {
              const colors = ["#EF4444", "#f97316", "#F59E0B", "#3B9EE8", "#10B981"].reverse()
              return colors[params.dataIndex]
            },
            borderRadius: [0, 4, 4, 0]
          },
          barWidth: "60%",
          label: {
            show: true,
            position: "right",
            color: "#fff",
            fontSize: 10,
            fontFamily: "monospace"
          }
        }
      ]
    }
  }, [data])

  // ── Direction Option ───────────────────────────────────────────────────────
  const directionOption = useMemo(() => {
    if (!data) return {}
    const dirs = Object.entries(data.events_by_direction).sort((a, b) => b[1] - a[1])
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(13, 20, 34, 0.9)",
        borderColor: "rgba(59, 158, 232, 0.2)",
        textStyle: { color: "#fff" }
      },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: "#0A0F1A",
            borderWidth: 2
          },
          label: {
            show: false,
            position: "center"
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: "bold",
              color: "#fff"
            }
          },
          labelLine: { show: false },
          data: dirs.map(([name, value]) => ({ 
            name: name.toUpperCase(), 
            value,
            itemStyle: { 
              color: name.toLowerCase().includes("gaze") ? THEME_COLORS.amber : THEME_COLORS.blue 
            }
          }))
        }
      ]
    }
  }, [data])

  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10" />
        ))}
        <div className="col-span-full h-80 bg-white/5 rounded-2xl border border-white/10" />
      </div>
    )
  }

  if (!data) return null

  const riskPct = Math.min(100, Math.max(0, data.risk_score))
  const cheatRatePct = Math.min(100, Math.max(0, data.cheating_rate * 100))

  return (
    <div className="flex flex-col gap-8">
      {/* ── KPI Grid ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent group hover:border-[#3B9EE8]/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="size-10 rounded-xl bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
              <Target className="size-5" />
            </div>
            <BrandBadge variant="red" className="text-[9px] uppercase tracking-widest font-bold">Critical</BrandBadge>
          </div>
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Aggregate Risk</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white tabular-nums tracking-tighter">{riskPct.toFixed(0)}</span>
              <span className="text-sm font-bold text-white/20">/100</span>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#EF4444] to-[#f97316] rounded-full" style={{ width: `${riskPct}%` }} />
          </div>
        </GlassCard>

        <GlassCard className="p-6 border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent group hover:border-[#3B9EE8]/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="size-10 rounded-xl bg-[#3B9EE8]/10 flex items-center justify-center text-[#3B9EE8]">
              <Activity className="size-5" />
            </div>
            <BrandBadge variant="blue" className="text-[9px] uppercase tracking-widest font-bold">Efficiency</BrandBadge>
          </div>
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Cheating Rate</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white tabular-nums tracking-tighter">{cheatRatePct.toFixed(1)}</span>
              <span className="text-sm font-bold text-white/20">%</span>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#3B9EE8] to-[#10B981] rounded-full" style={{ width: `${cheatRatePct}%` }} />
          </div>
        </GlassCard>

        <GlassCard className="p-6 border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent group hover:border-[#3B9EE8]/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="size-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
              <Clock className="size-5" />
            </div>
            <BrandBadge variant="amber" className="text-[9px] uppercase tracking-widest font-bold">Temporal</BrandBadge>
          </div>
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Peak Activity</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tabular-nums tracking-tighter">{data.peak_cheating_minute || "00:00"}</span>
              <span className="text-xs font-bold text-white/20 uppercase tracking-widest">MIN</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
             <div className="size-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
             <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Highest Frequency Detected</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6 border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent group hover:border-[#3B9EE8]/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60">
              <Users className="size-5" />
            </div>
            <BrandBadge variant="muted" className="text-[9px] uppercase tracking-widest font-bold">Subjects</BrandBadge>
          </div>
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Most Suspicious</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tighter">
                {data.most_suspicious_person ? `Person ${data.most_suspicious_person.person_id}` : "None"}
              </span>
            </div>
          </div>
          <div className="mt-4 text-[10px] font-mono text-white/40 uppercase tracking-widest flex justify-between">
             <span>Incidents: <span className="text-[#EF4444] font-bold">{data.most_suspicious_person?.cheating_events || 0}</span></span>
          </div>
        </GlassCard>
      </div>

      {/* ── Main Timeline ────────────────────────────────────────────────────── */}
      <GlassCard className="p-8 border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <SectionLabel className="mb-1 text-[#3B9EE8]">Temporal Integrity Analysis</SectionLabel>
            <p className="text-xs text-white/40">Correlation between normal behavior and detected anomalies over time.</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-white/20 uppercase tracking-widest border border-white/5 px-4 py-2 rounded-lg bg-black/20">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[#EF4444]" />
              <span>Anomalies</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-[#10B981]" />
              <span>Standard</span>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ReactECharts option={timelineOption} style={{ height: "100%", width: "100%" }} theme="dark" />
        </div>
      </GlassCard>

      {/* ── Distribution & Direction ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-8 border-white/10">
          <SectionLabel className="mb-6 text-[#3B9EE8]">Probability Distribution</SectionLabel>
          <div className="h-[300px] w-full">
            <ReactECharts option={confidenceOption} style={{ height: "100%", width: "100%" }} />
          </div>
          <div className="mt-6 p-4 rounded-xl bg-black/20 border border-white/5">
             <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">
                Distribution of AI confidence levels across all detected events. High-risk clusters (80-100%) indicate confirmed cheating behaviors.
             </p>
          </div>
        </GlassCard>

        <GlassCard className="p-8 border-white/10">
          <SectionLabel className="mb-6 text-[#3B9EE8]">Gaze & Orientation Breakdown</SectionLabel>
          <div className="flex items-center justify-center h-[300px] w-full">
            <ReactECharts option={directionOption} style={{ height: "100%", width: "100%" }} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {Object.entries(data.events_by_direction).slice(0, 4).map(([dir, count]) => (
              <div key={dir} className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">{dir}</div>
                <div className="text-lg font-bold text-white tabular-nums">{count}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ── Objects & Per-Person ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Suspicious Objects */}
        <GlassCard className="xl:col-span-1 p-8 border-white/10 flex flex-col">
          <SectionLabel className="mb-6 text-[#3B9EE8]">Prohibited Objects</SectionLabel>
          <div className="flex-1 space-y-4">
            {data.object_detections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 text-green-500">
                  <Shield className="size-8" />
                </div>
                <p className="text-sm font-bold text-white/60">No Violations Detected</p>
                <p className="text-xs text-white/20 mt-1">Workspace remains compliant.</p>
              </div>
            ) : (
              data.object_detections.map(obj => (
                <div key={obj.name} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#EF4444]/30 transition-all">
                  <div className="size-12 rounded-lg bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
                    {obj.name.toLowerCase().includes("phone") ? <Smartphone className="size-6" /> : 
                     obj.name.toLowerCase().includes("laptop") ? <Laptop className="size-6" /> :
                     obj.name.toLowerCase().includes("book") ? <Book className="size-6" /> : <FileText className="size-6" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white uppercase tracking-tight">{obj.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <BrandBadge variant="red" className="text-[9px] py-0">{obj.count} DETECTIONS</BrandBadge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Heatmap/Activity */}
        <GlassCard className="xl:col-span-2 p-8 border-white/10">
          <div className="flex items-center justify-between mb-8">
            <SectionLabel className="mb-0 text-[#3B9EE8]">Subject Risk Map</SectionLabel>
            <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Person ID vs Temporal Axis</div>
          </div>
          
          <div className="space-y-3">
             {data.persons_timeline.length === 0 ? (
                <p className="text-white/20 text-sm italic">Insufficient temporal data for risk mapping.</p>
             ) : (
               [...new Set(data.persons_timeline.map(p => p.person_id))].sort((a, b) => a - b).slice(0, 8).map(pid => {
                 const personData = data.persons_timeline.filter(p => p.person_id === pid)
                 const totalEvents = personData.reduce((acc, curr) => acc + curr.cheating + curr.ok, 0)
                 const riskScore = totalEvents > 0 ? (personData.reduce((acc, curr) => acc + curr.cheating, 0) / totalEvents) * 100 : 0
                 
                 return (
                   <div key={pid} className="flex items-center gap-4 group">
                     <div className="w-20 shrink-0 flex items-center gap-2">
                        <div className={cn(
                          "size-7 rounded-lg flex items-center justify-center text-[10px] font-bold border",
                          riskScore > 50 ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-[#3B9EE8]/10 border-[#3B9EE8]/30 text-[#3B9EE8]"
                        )}>
                          {pid}
                        </div>
                        <span className="text-[10px] font-bold text-white/40 uppercase">ID-{pid}</span>
                     </div>
                     <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden flex gap-0.5 p-[1px]">
                        {personData.map((d, i) => (
                           <div 
                            key={i} 
                            className={cn(
                              "h-full rounded-sm transition-all duration-500",
                              d.cheating > 0 ? "bg-[#EF4444]" : d.ok > 0 ? "bg-[#10B981]/40" : "bg-transparent"
                            )}
                            style={{ flex: 1, opacity: d.cheating > 0 ? 0.8 + (d.cheating * 0.1) : 0.4 }}
                           />
                        ))}
                     </div>
                     <div className="w-12 text-right">
                        <span className={cn(
                          "text-[10px] font-bold font-mono",
                          riskScore > 50 ? "text-red-500" : "text-white/20"
                        )}>{riskScore.toFixed(0)}%</span>
                     </div>
                   </div>
                 )
               })
             )}
          </div>
          
          <div className="mt-8 flex items-center gap-6 text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
             <div className="flex items-center gap-2">
                <div className="size-2 rounded-sm bg-[#EF4444]" />
                <span>Cheating Detected</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="size-2 rounded-sm bg-[#10B981]/40" />
                <span>Normal Activity</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="size-2 rounded-sm bg-white/5" />
                <span>No Presence</span>
             </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}