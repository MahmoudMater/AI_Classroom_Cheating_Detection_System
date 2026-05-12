"use client"

import {
  Alert02Icon,
  Book01Icon,
  CheckmarkCircle02Icon,
  LaptopIcon,
  Notebook01Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { getEventSummary } from "@/lib/api"
import type { EventSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface SummaryChartsProps {
  sessionId: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CONFIDENCE_RANGES = ["0-20%", "20-40%", "40-60%", "60-80%", "80-100%"]
const CONFIDENCE_COLORS = ["#10B981", "#3B9EE8", "#F59E0B", "#f97316", "#EF4444"]

function formatPeakMinute(raw: string | null): string {
  if (raw == null || raw === "") return "None"
  if (/^\d{1,2}:\d{2}$/.test(raw)) return raw
  const n = Number(raw)
  if (!Number.isNaN(n) && Number.isFinite(n)) {
    const h = Math.floor(n / 60) % 24
    const m = Math.floor(n) % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }
  const t = Date.parse(raw)
  if (!Number.isNaN(t)) {
    const d = new Date(t)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }
  return raw
}

function scoreTone(score0to100: number) {
  if (score0to100 < 30) return { text: "text-[#10B981]", stroke: "#10B981" }
  if (score0to100 <= 70) return { text: "text-[#F59E0B]", stroke: "#F59E0B" }
  return { text: "text-[#EF4444]", stroke: "#EF4444" }
}

function buildDirKeys(data: EventSummary | null): string[] {
  if (!data) return []
  const fromHeat = [...new Set(data.direction_over_time.map((d) => d.direction))]
  const fromAgg = Object.keys(data.events_by_direction)
  const merged = [...new Set([...fromHeat, ...fromAgg])]
  return merged
    .map((d) => ({ d, c: data.events_by_direction[d] ?? 0 }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 6)
    .map((s) => s.d)
}

function buildMinuteCols(data: EventSummary | null): string[] {
  if (!data) return []
  const mins = [...new Set(data.direction_over_time.map((d) => d.minute))]
  mins.sort((a, b) => {
    const na = Number(a); const nb = Number(b)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
    return String(a).localeCompare(String(b))
  })
  return mins.slice(-20)
}

function buildByPerson(data: EventSummary | null) {
  if (!data) return [] as [number, EventSummary["persons_timeline"]][]
  const m = new Map<number, EventSummary["persons_timeline"]>()
  for (const row of data.persons_timeline) {
    const arr = m.get(row.person_id) ?? []
    arr.push(row)
    m.set(row.person_id, arr)
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => String(a.minute).localeCompare(String(b.minute)))
  }
  return [...m.entries()].sort((a, b) => a[0] - b[0])
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ObjectGlyph({ name }: { name: string }) {
  const n = name.toLowerCase()
  let icon = Alert02Icon
  if (n.includes("phone") || n.includes("mobile")) icon = SmartPhone01Icon
  else if (n.includes("book")) icon = Book01Icon
  else if (n.includes("laptop")) icon = LaptopIcon
  else if (n.includes("notebook") || n.includes("paper")) icon = Notebook01Icon
  return <HugeiconsIcon icon={icon} strokeWidth={1.75} className="size-7 text-[#94A3B8]" />
}

function RiskRing({ score, stroke }: { score: number; stroke: string }) {
  const r = 34
  const c = 2 * Math.PI * r
  const p = Math.min(100, Math.max(0, score)) / 100
  return (
    <svg viewBox="0 0 88 88" className="size-24 shrink-0" aria-hidden>
      <circle cx="44" cy="44" r={r} fill="none" className="stroke-[rgba(59,158,232,0.1)]" strokeWidth="7" />
      <circle
        cx="44" cy="44" r={r} fill="none"
        stroke={stroke} strokeWidth="7"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={c * (1 - p)}
        transform="rotate(-90 44 44)"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-[rgba(59,158,232,0.06)] border border-[rgba(59,158,232,0.1)]" />
        ))}
      </div>
      <div className="h-44 animate-pulse rounded-xl bg-[rgba(59,158,232,0.06)] border border-[rgba(59,158,232,0.1)]" />
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-[rgba(59,158,232,0.15)] bg-[#151C2C]", className)}>
      {children}
    </div>
  )
}

function CardHead({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-[rgba(59,158,232,0.1)] px-4 py-3">
      <span className="text-[#3B9EE8]">{icon}</span>
      <h3 className="font-['Space_Grotesk',sans-serif] text-[12px] font-semibold uppercase tracking-[0.06em] text-[#94A3B8]">
        {title}
      </h3>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

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

  const dirKeys = useMemo(() => buildDirKeys(data), [data])
  const minuteCols = useMemo(() => buildMinuteCols(data), [data])
  const byPerson = useMemo(() => buildByPerson(data), [data])

  if (loading && !data) return <Skeleton />
  if (!data) return <p className="text-[13px] text-[#64748B]">No summary data yet.</p>

  const riskPct = Math.min(100, Math.max(0, data.risk_score))
  const cheatRatePct = Math.min(100, Math.max(0, data.cheating_rate * 100))
  const riskStyle = scoreTone(riskPct)
  const rateStyle = scoreTone(cheatRatePct)

  // Timeline chart
  const timeline = data.timeline
  const maxT = Math.max(1, ...timeline.map((t) => t.cheating + t.ok))
  const nT = timeline.length
  const chartW = 460; const chartH = 120; const pad = 24; const iW = chartW - pad * 2; const iH = chartH - pad * 2
  const toX = (i: number) => pad + (nT <= 1 ? iW / 2 : (i / (nT - 1)) * iW)
  const toY = (v: number) => pad + iH - (v / maxT) * iH
  const cheatingPts = timeline.map((t, i) => ({ x: toX(i), y: toY(t.cheating), ...t }))
  const okPts = timeline.map((t, i) => ({ x: toX(i), y: toY(t.ok) }))

  // Confidence
  const confMap = new Map(data.confidence_distribution.map((c) => [c.range, c.count]))
  const confRows = CONFIDENCE_RANGES.map((range) => ({ range, count: confMap.get(range) ?? 0 }))
  const maxConf = Math.max(1, ...confRows.map((r) => r.count))

  // Direction over time heatmap
  const dirTime = data.direction_over_time
  const heatMax = Math.max(1, ...dirTime.map((d) => d.count))
  const heatCell = (dir: string, minute: string) => {
    const c = dirTime.find((d) => d.direction === dir && d.minute === minute)?.count ?? 0
    const op = c / heatMax
    return { c, opacity: op }
  }

  const directionsBreakdown = Object.entries(data.events_by_direction).sort((a, b) => b[1] - a[1])
  const totalDir = Math.max(1, directionsBreakdown.reduce((s, [, v]) => s + v, 0))
  const suspiciousId = data.most_suspicious_person?.person_id

  return (
    <div className="flex flex-col gap-4">

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Risk ring */}
        <Card className="flex flex-col items-center gap-1 p-4">
          <div className="relative flex items-center justify-center">
            <RiskRing score={riskPct} stroke={riskStyle.stroke === "text-[#10B981]" ? "#10B981" : riskStyle.stroke === "text-[#F59E0B]" ? "#F59E0B" : "#EF4444"} />
            <span className={cn("absolute font-mono text-2xl font-bold tabular-nums", riskStyle.text)}>
              {riskPct.toFixed(0)}
            </span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B]">Risk Score</p>
        </Card>

        {/* Cheating rate */}
        <Card className="flex flex-col justify-center gap-1 p-4">
          <p className={cn("font-mono text-3xl font-bold tabular-nums", rateStyle.text)}>
            {cheatRatePct.toFixed(1)}%
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B]">Cheating rate</p>
        </Card>

        {/* Peak minute */}
        <Card className="flex flex-col justify-center gap-1 p-4">
          <p className="font-mono text-2xl font-bold tabular-nums text-[#E2E8F0]">
            {formatPeakMinute(data.peak_cheating_minute)}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B]">Peak minute</p>
        </Card>

        {/* Most suspicious */}
        <Card className="flex flex-col justify-center gap-2 p-4">
          <p className="text-[15px] font-bold text-[#F59E0B]">
            {data.most_suspicious_person ? `Person ${data.most_suspicious_person.person_id}` : "None"}
          </p>
          {data.most_suspicious_person && (
            <span className="inline-flex w-fit items-center rounded-full border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-2 py-0.5 font-mono text-[9px] font-bold text-[#EF4444]">
              {data.most_suspicious_person.cheating_events} incidents
            </span>
          )}
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B]">Most suspicious</p>
        </Card>
      </div>

      {/* ── Timeline chart ── */}
      <Card>
        <CardHead title="Cheating activity over time" icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        } />
        <div className="p-4">
          {timeline.length === 0 ? (
            <p className="text-[13px] text-[#64748B]">No timeline data yet</p>
          ) : (
            <>
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" role="img" aria-label="Activity over time">
                {/* Grid lines */}
                {[0.25, 0.5, 0.75].map((f) => (
                  <line key={f} x1={pad} y1={pad + iH * (1 - f)} x2={chartW - pad} y2={pad + iH * (1 - f)}
                    stroke="rgba(59,158,232,0.06)" strokeWidth="1" />
                ))}
                {/* Cheating fill */}
                <path
                  fill="rgba(239,68,68,0.1)"
                  d={[
                    `M ${cheatingPts[0]?.x} ${chartH - pad}`,
                    ...cheatingPts.map((p) => `L ${p.x} ${p.y}`),
                    `L ${cheatingPts[cheatingPts.length - 1]?.x} ${chartH - pad}`,
                    "Z",
                  ].join(" ")}
                />
                {/* OK fill */}
                <path
                  fill="rgba(16,185,129,0.07)"
                  d={[
                    `M ${okPts[0]?.x} ${chartH - pad}`,
                    ...okPts.map((p) => `L ${p.x} ${p.y}`),
                    `L ${okPts[okPts.length - 1]?.x} ${chartH - pad}`,
                    "Z",
                  ].join(" ")}
                />
                {/* Lines */}
                <polyline fill="none" stroke="#EF4444" strokeWidth="1.5" opacity={0.9}
                  points={cheatingPts.map((p) => `${p.x},${p.y}`).join(" ")} />
                <polyline fill="none" stroke="#10B981" strokeWidth="1.5" opacity={0.9}
                  points={okPts.map((p) => `${p.x},${p.y}`).join(" ")} />
                {/* Dots */}
                {cheatingPts.map((p, i) => (
                  <circle key={`c${i}`} cx={p.x} cy={p.y} r={2.5} fill="#EF4444">
                    <title>{`Min ${p.minute}: cheating ${p.cheating}, ok ${p.ok}`}</title>
                  </circle>
                ))}
                {okPts.map((p, i) => (
                  <circle key={`o${i}`} cx={p.x} cy={p.y} r={2.5} fill="#10B981">
                    <title>{`Min ${timeline[i]?.minute}: ok ${timeline[i]?.ok}`}</title>
                  </circle>
                ))}
              </svg>
              <div className="mt-2 flex gap-4">
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#94A3B8]">
                  <span className="inline-block size-2 rounded-full bg-[#EF4444]" />CHEATING
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#94A3B8]">
                  <span className="inline-block size-2 rounded-full bg-[#10B981]" />OK
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* ── Confidence distribution ── */}
      <Card>
        <CardHead title="Cheat probability distribution" icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/>
          </svg>
        } />
        <div className="flex flex-col gap-2 p-4">
          {data.total_events === 0 && confRows.every((r) => r.count === 0) ? (
            <p className="text-[13px] text-[#64748B]">No events recorded yet</p>
          ) : confRows.map((row, i) => (
            <div key={row.range} className="flex items-center gap-3">
              <span className="w-10 shrink-0 text-right font-mono text-[10px] text-[#64748B]">{row.range}</span>
              <div className="relative h-4 flex-1 overflow-hidden rounded bg-[rgba(255,255,255,0.04)]">
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{ width: `${(row.count / maxConf) * 100}%`, background: CONFIDENCE_COLORS[i] ?? "#64748B", opacity: 0.85 }}
                />
              </div>
              <span className="w-6 shrink-0 font-mono text-[10px] text-[#64748B] tabular-nums">{row.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Direction heatmap + breakdown ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Direction over time" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
            </svg>
          } />
          <div className="overflow-x-auto p-4">
            {dirTime.length === 0 ? (
              <p className="text-[13px] text-[#64748B]">No direction-over-time data yet</p>
            ) : (
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: `minmax(4rem, auto) repeat(${minuteCols.length}, minmax(22px, 1fr))` }}
              >
                <div />
                {minuteCols.map((m) => (
                  <div key={m} className="pb-1 text-center font-mono text-[9px] leading-tight text-[#64748B] truncate" title={m}>
                    {m.length > 5 ? `${m.slice(0, 4)}…` : m}
                  </div>
                ))}
                {dirKeys.map((dir) => (
                  <div key={dir} className="contents">
                    <div className="flex items-center border-r border-[rgba(59,158,232,0.1)] pr-2 py-0.5 font-mono text-[9px] text-[#94A3B8] truncate">
                      {dir.length > 12 ? `${dir.slice(0, 12)}…` : dir}
                    </div>
                    {minuteCols.map((min) => {
                      const { c, opacity } = heatCell(dir, min)
                      return (
                        <div
                          key={`${dir}-${min}`}
                          className="m-0.5 size-5 rounded-sm border border-[rgba(59,158,232,0.08)]"
                          style={{ background: `rgba(245,158,11,${opacity * 0.8})` }}
                          title={`${dir} @ ${min}: ${c}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHead title="Direction breakdown" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          } />
          <div className="flex flex-col gap-2 p-4">
            {directionsBreakdown.length === 0 ? (
              <p className="text-[13px] text-[#64748B]">No direction data</p>
            ) : directionsBreakdown.map(([dir, count]) => {
              const maxC = Math.max(...directionsBreakdown.map(([, v]) => v))
              return (
                <div key={dir} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate font-mono text-[10px] text-[#94A3B8]" title={dir}>
                    {dir}
                  </span>
                  <div className="relative h-4 flex-1 overflow-hidden rounded bg-[rgba(255,255,255,0.04)]">
                    <div
                      className="h-full rounded bg-[#3B9EE8]"
                      style={{ width: `${(count / maxC) * 100}%`, opacity: 0.7 }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono text-[10px] text-[#64748B]">
                    {count} ({((count / totalDir) * 100).toFixed(1)}%)
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── Detected objects ── */}
      <Card>
        <CardHead title="Detected objects" icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        } />
        <div className="p-4">
          {data.object_detections.length === 0 ? (
            <div className="flex items-center gap-2 text-[13px] text-[#10B981]">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
              No suspicious objects detected
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.object_detections.map((obj) => (
                <div
                  key={obj.name}
                  className="flex items-center gap-3 rounded-lg border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] p-3"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)]">
                    <ObjectGlyph name={obj.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold capitalize text-[#E2E8F0]">{obj.name}</p>
                    <span className="inline-flex items-center rounded-full border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-2 py-0.5 font-mono text-[9px] font-bold text-[#EF4444] mt-0.5">
                      {obj.count} detection{obj.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ── Activity per person ── */}
      <Card>
        <CardHead title="Activity per person" icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        } />
        <div className="flex flex-col gap-3 p-4">
          {byPerson.length === 0 ? (
            <p className="text-[13px] text-[#64748B]">No per-person timeline yet</p>
          ) : byPerson.map(([pid, rows]) => {
            const w = 320
            const barW = rows.length ? w / rows.length : w
            const isSuspicious = suspiciousId === pid
            return (
              <div
                key={pid}
                className={cn(
                  "flex flex-col gap-2 rounded-lg p-2 sm:flex-row sm:items-center",
                  isSuspicious && "border-l-2 border-[#F59E0B] bg-[rgba(245,158,11,0.04)] pl-3"
                )}
              >
                <div className="flex items-center gap-2 sm:w-28 sm:shrink-0">
                  <div className={cn(
                    "flex size-6 items-center justify-center rounded-full border text-[10px] font-bold",
                    isSuspicious
                      ? "border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.12)] text-[#F59E0B]"
                      : "border-[rgba(59,158,232,0.3)] bg-[rgba(59,158,232,0.08)] text-[#3B9EE8]"
                  )}>
                    {pid}
                  </div>
                  <p className={cn("text-[12px] font-semibold", isSuspicious ? "text-[#F59E0B]" : "text-[#94A3B8]")}>
                    Person {pid}
                  </p>
                </div>
                <svg viewBox={`0 0 ${w} 36`} className="h-9 w-full max-w-md" preserveAspectRatio="none" aria-hidden>
                  {rows.map((r, i) => {
                    const x = i * barW
                    const total = r.cheating + r.ok || 1
                    const ch = (r.cheating / total) * 32
                    const okh = (r.ok / total) * 32
                    return (
                      <g key={`${pid}-${r.minute}`}>
                        <rect x={x + 1} y={32 - ch} width={Math.max(2, barW - 2)} height={ch} fill="#EF4444" opacity={0.8}>
                          <title>{`${r.minute}: cheating ${r.cheating}`}</title>
                        </rect>
                        <rect x={x + 1} y={32 - ch - okh} width={Math.max(2, barW - 2)} height={okh} fill="#10B981" opacity={0.7}>
                          <title>{`${r.minute}: ok ${r.ok}`}</title>
                        </rect>
                      </g>
                    )
                  })}
                </svg>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Highest risk individual ── */}
      {data.most_suspicious_person && (
        <div className="rounded-xl border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.05)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.1)] text-[#F59E0B]">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <h3 className="font-['Space_Grotesk',sans-serif] text-[13px] font-bold uppercase tracking-[0.06em] text-[#F59E0B]">
              Highest Risk Individual
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-[18px] font-bold text-[#E2E8F0]">
              Person {data.most_suspicious_person.person_id}
            </p>
            <div className="flex flex-wrap gap-3 text-[12px]">
              <span className="text-[#94A3B8]">
                Incidents:{" "}
                <strong className="font-mono text-[#EF4444] tabular-nums">
                  {data.most_suspicious_person.cheating_events}
                </strong>
              </span>
              <span className="text-[#94A3B8]">
                Rate:{" "}
                <strong className="font-mono text-[#EF4444] tabular-nums">
                  {(data.most_suspicious_person.cheating_rate * 100).toFixed(1)}%
                </strong>
              </span>
              <span className="inline-flex items-center rounded-full border border-[rgba(59,158,232,0.25)] bg-[rgba(59,158,232,0.08)] px-2 py-0.5 font-mono text-[10px] capitalize text-[#3B9EE8]">
                {data.most_suspicious_person.dominant_direction}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}