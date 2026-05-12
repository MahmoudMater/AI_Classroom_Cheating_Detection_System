"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Book01Icon,
  CheckmarkCircle02Icon,
  LaptopIcon,
  Notebook01Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getEventSummary } from "@/lib/api"
import type { EventSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface SummaryChartsProps {
  sessionId: string
}

const CONFIDENCE_RANGES = ["0-20%", "20-40%", "40-60%", "60-80%", "80-100%"]
const CONFIDENCE_FILLS = ["#14b8a6", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"]

const HEAT_BG = [
  "bg-amber-500/5",
  "bg-amber-500/10",
  "bg-amber-500/20",
  "bg-amber-500/30",
  "bg-amber-500/40",
  "bg-amber-500/50",
  "bg-amber-500/60",
  "bg-amber-500/70",
  "bg-amber-500/80",
  "bg-amber-500/90",
]

function scoreTone(score0to100: number) {
  if (score0to100 < 30)
    return {
      text: "text-green-600 dark:text-green-400",
      stroke: "#16a34a",
    }
  if (score0to100 <= 70)
    return {
      text: "text-amber-600 dark:text-amber-400",
      stroke: "#d97706",
    }
  return {
    text: "text-red-600 dark:text-red-400",
    stroke: "#dc2626",
  }
}

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

function RiskRing({ score, stroke }: { score: number; stroke: string }) {
  const r = 36
  const c = 2 * Math.PI * r
  const p = Math.min(100, Math.max(0, score)) / 100
  const dash = c * (1 - p)
  return (
    <svg viewBox="0 0 100 100" className="size-28 shrink-0" aria-hidden>
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        className="stroke-muted stroke-[8]"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="8"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={dash}
        transform="rotate(-90 50 50)"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ObjectGlyph({ name }: { name: string }) {
  const n = name.toLowerCase()
  let icon = Alert02Icon
  if (n.includes("phone") || n.includes("mobile")) icon = SmartPhone01Icon
  else if (n.includes("book")) icon = Book01Icon
  else if (n.includes("laptop")) icon = LaptopIcon
  else if (n.includes("notebook") || n.includes("paper")) icon = Notebook01Icon
  return (
    <HugeiconsIcon
      icon={icon}
      strokeWidth={1.75}
      className="text-muted-foreground size-8"
    />
  )
}

function SummarySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} size="sm">
            <CardContent className="p-4">
              <div className="bg-muted h-4 w-24 animate-pulse rounded" />
              <div className="bg-muted mt-3 h-10 w-20 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card size="sm">
        <CardContent className="p-4">
          <div className="bg-muted h-40 w-full animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    </div>
  )
}

function buildDirKeys(data: EventSummary | null): string[] {
  if (!data) return []
  const fromHeat = [...new Set(data.direction_over_time.map((d) => d.direction))]
  const fromAgg = Object.keys(data.events_by_direction)
  const merged = [...new Set([...fromHeat, ...fromAgg])]
  const scored = merged
    .map((d) => ({
      d,
      c: data.events_by_direction[d] ?? 0,
    }))
    .sort((a, b) => b.c - a.c)
  return scored.slice(0, 6).map((s) => s.d)
}

function buildMinuteCols(data: EventSummary | null): string[] {
  if (!data) return []
  const mins = [...new Set(data.direction_over_time.map((d) => d.minute))]
  mins.sort((a, b) => {
    const na = Number(a)
    const nb = Number(b)
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
        if (!cancelled) {
          toast.error(
            e instanceof Error ? e.message : "Failed to load summary"
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  const dirKeys = useMemo(() => buildDirKeys(data), [data])
  const minuteCols = useMemo(() => buildMinuteCols(data), [data])
  const byPerson = useMemo(() => buildByPerson(data), [data])

  if (loading && !data) {
    return <SummarySkeleton />
  }

  if (!data) {
    return (
      <p className="text-muted-foreground text-sm">No summary data yet.</p>
    )
  }

  const riskPct = Math.min(100, Math.max(0, data.risk_score))
  const cheatRatePct = Math.min(100, Math.max(0, data.cheating_rate * 100))
  const riskStyle = scoreTone(riskPct)
  const rateStyle = scoreTone(cheatRatePct)

  const timeline = data.timeline
  const maxT = Math.max(1, ...timeline.map((t) => t.cheating + t.ok))
  const chartW = 480
  const chartH = 160
  const pad = 32
  const innerW = chartW - pad * 2
  const innerH = chartH - pad * 2
  const nT = timeline.length
  const pointsCheating = timeline.map((t, i) => {
    const x = pad + (nT <= 1 ? innerW / 2 : (i / (nT - 1)) * innerW)
    const y = pad + innerH - (t.cheating / maxT) * innerH
    return { x, y, cheating: t.cheating, ok: t.ok, minute: t.minute }
  })
  const pointsOk = timeline.map((t, i) => {
    const x = pad + (nT <= 1 ? innerW / 2 : (i / (nT - 1)) * innerW)
    const y = pad + innerH - (t.ok / maxT) * innerH
    return { x, y }
  })

  const confMap = new Map(
    data.confidence_distribution.map((c) => [c.range, c.count])
  )
  const confRows = CONFIDENCE_RANGES.map((range) => ({
    range,
    count: confMap.get(range) ?? 0,
  }))
  const maxConf = Math.max(1, ...confRows.map((r) => r.count))

  const dirTime = data.direction_over_time
  const heatMax = Math.max(1, ...dirTime.map((d) => d.count), 1)

  const heatCell = (dir: string, minute: string) => {
    const cell = dirTime.find(
      (d) => d.direction === dir && d.minute === minute
    )
    const c = cell?.count ?? 0
    const op = c / heatMax
    const idx = Math.min(
      HEAT_BG.length - 1,
      Math.floor(op * HEAT_BG.length)
    )
    return { c, heatClass: HEAT_BG[idx] }
  }

  const directionsBreakdown = Object.entries(data.events_by_direction).sort(
    (a, b) => b[1] - a[1]
  )
  const totalDir = Math.max(
    1,
    directionsBreakdown.reduce((s, [, v]) => s + v, 0)
  )

  const suspiciousId = data.most_suspicious_person?.person_id

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-2 p-4">
            <div className="relative flex items-center justify-center">
              <RiskRing score={riskPct} stroke={riskStyle.stroke} />
              <span
                className={cn(
                  "absolute text-3xl font-bold tabular-nums",
                  riskStyle.text
                )}
              >
                {riskPct.toFixed(0)}
              </span>
            </div>
            <p className="text-muted-foreground text-center text-xs font-medium">
              Risk Score
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col justify-center gap-1 p-4">
            <p className={cn("text-3xl font-bold tabular-nums", rateStyle.text)}>
              {cheatRatePct.toFixed(1)}%
            </p>
            <p className="text-muted-foreground text-xs font-medium">
              Cheating rate
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col justify-center gap-1 p-4">
            <p className="text-foreground text-xl font-semibold tabular-nums">
              {formatPeakMinute(data.peak_cheating_minute)}
            </p>
            <p className="text-muted-foreground text-xs font-medium">
              Peak cheating minute
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col justify-center gap-1 p-4">
            <p className="text-foreground text-xl font-semibold">
              {data.most_suspicious_person
                ? `Person ${data.most_suspicious_person.person_id}`
                : "None"}
            </p>
            <p className="text-muted-foreground text-xs">
              {data.most_suspicious_person
                ? `${data.most_suspicious_person.cheating_events} incidents`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">
            Cheating activity over time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-muted-foreground text-sm">No timeline data yet</p>
          ) : (
            <>
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="bg-muted/30 w-full max-w-full rounded-lg border border-border"
                role="img"
                aria-label="Cheating versus OK over time"
              >
                {pointsCheating.map((p, i) => (
                  <circle
                    key={`c-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    className="fill-red-600"
                  >
                    <title>{`Minute ${p.minute}: cheating ${p.cheating}, ok ${p.ok}`}</title>
                  </circle>
                ))}
                {pointsOk.map((p, i) => (
                  <circle
                    key={`o-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    className="fill-green-600"
                  >
                    <title>{`Minute ${timeline[i]?.minute}: ok ${timeline[i]?.ok}`}</title>
                  </circle>
                ))}
                <polyline
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="2"
                  opacity={0.85}
                  points={pointsCheating.map((p) => `${p.x},${p.y}`).join(" ")}
                />
                <polyline
                  fill="none"
                  stroke="#16A34A"
                  strokeWidth="2"
                  opacity={0.85}
                  points={pointsOk.map((p) => `${p.x},${p.y}`).join(" ")}
                />
              </svg>
              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded-full bg-red-600" />
                  Cheating
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2 rounded-full bg-green-600" />
                  OK
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">
            Cheat probability distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.total_events === 0 && confRows.every((r) => r.count === 0) ? (
            <p className="text-muted-foreground text-sm">
              No events recorded yet
            </p>
          ) : (
            <svg
              viewBox="0 0 420 140"
              className="w-full max-w-full"
              role="img"
              aria-label="Confidence distribution"
            >
              {confRows.map((row, i) => {
                const y = 8 + i * 26
                const bw = (row.count / maxConf) * 300
                return (
                  <g key={row.range}>
                    <text
                      x={4}
                      y={y + 14}
                      className="fill-muted-foreground text-[11px]"
                    >
                      {row.range}
                    </text>
                    <rect
                      x={88}
                      y={y}
                      width={bw}
                      height={18}
                      rx={4}
                      fill={CONFIDENCE_FILLS[i] ?? "#71717a"}
                    />
                    <text
                      x={88 + bw + 8}
                      y={y + 14}
                      className="fill-muted-foreground text-[11px] tabular-nums"
                    >
                      {row.count}
                    </text>
                  </g>
                )
              })}
            </svg>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base">Direction over time</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {dirTime.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No direction-over-time data yet
              </p>
            ) : (
              <div
                className="grid gap-0"
                style={{
                  gridTemplateColumns: `minmax(4rem,auto) repeat(${minuteCols.length}, minmax(1.75rem,1fr))`,
                }}
              >
                <div />
                {minuteCols.map((m) => (
                  <div
                    key={m}
                    className="text-muted-foreground border-b border-border px-0.5 pb-1 text-center text-[10px] leading-tight"
                    title={m}
                  >
                    {m.length > 5 ? `${m.slice(0, 5)}…` : m}
                  </div>
                ))}
                {dirKeys.map((dir) => (
                  <div key={dir} className="contents">
                    <div className="text-muted-foreground flex items-center border-r border-border py-1 pr-2 text-xs">
                      {dir.length > 12 ? `${dir.slice(0, 12)}…` : dir}
                    </div>
                    {minuteCols.map((min) => {
                      const { c, heatClass } = heatCell(dir, min)
                      return (
                        <div
                          key={`${dir}-${min}`}
                          className={cn(
                            "m-0.5 size-8 rounded-sm border border-border/40",
                            heatClass
                          )}
                          title={`${dir} @ ${min}: ${c}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base">Direction breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {directionsBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm">No direction data</p>
            ) : (
              <svg
                viewBox={`0 0 400 ${Math.max(48, directionsBreakdown.length * 22 + 16)}`}
                className="bg-muted/30 w-full max-w-full rounded-lg border border-border"
                role="img"
              >
                {directionsBreakdown.map(([dir, count], i) => {
                  const y = 12 + i * 22
                  const maxC = Math.max(...directionsBreakdown.map(([, v]) => v))
                  const bw = (count / maxC) * 280
                  const pct = ((count / totalDir) * 100).toFixed(1)
                  return (
                    <g key={dir}>
                      <text
                        x={4}
                        y={y + 12}
                        className="fill-muted-foreground text-[10px]"
                      >
                        {dir.length > 16 ? `${dir.slice(0, 16)}…` : dir}
                      </text>
                      <rect
                        x={90}
                        y={y}
                        width={bw}
                        height={14}
                        rx={4}
                        className="fill-primary"
                      />
                      <text
                        x={90 + bw + 6}
                        y={y + 12}
                        className="fill-muted-foreground text-[10px]"
                      >
                        {count} ({pct}%)
                      </text>
                    </g>
                  )
                })}
              </svg>
            )}
          </CardContent>
        </Card>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">Detected objects</CardTitle>
        </CardHeader>
        <CardContent>
          {data.object_detections.length === 0 ? (
            <div className="text-green-600 dark:text-green-400 flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5" />
              No suspicious objects detected
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.object_detections.map((obj) => (
                <Card key={obj.name} size="sm" className="ring-1 ring-border">
                  <CardContent className="flex items-center gap-3 p-4">
                    <ObjectGlyph name={obj.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium capitalize">{obj.name}</p>
                      <Badge variant="destructive" className="mt-1">
                        {obj.count}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">Activity per person</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {byPerson.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No per-person timeline yet
            </p>
          ) : (
            byPerson.map(([pid, rows]) => {
              const w = 320
              const barW = rows.length ? w / rows.length : w
              return (
                <div
                  key={pid}
                  className={cn(
                    "flex flex-col gap-2 sm:flex-row sm:items-center",
                    suspiciousId === pid &&
                      "border-amber-500/60 rounded-lg border-l-4 pl-3"
                  )}
                >
                  <p
                    className={cn(
                      "w-28 shrink-0 text-sm font-medium",
                      suspiciousId === pid &&
                        "text-amber-700 dark:text-amber-400"
                    )}
                  >
                    Person {pid}
                  </p>
                  <svg
                    viewBox={`0 0 ${w} 36`}
                    className="h-9 w-full max-w-md"
                    preserveAspectRatio="none"
                  >
                    {rows.map((r, i) => {
                      const x = i * barW
                      const total = r.cheating + r.ok || 1
                      const ch = (r.cheating / total) * 32
                      const okh = (r.ok / total) * 32
                      return (
                        <g key={`${pid}-${r.minute}`}>
                          <rect
                            x={x + 1}
                            y={32 - ch}
                            width={Math.max(2, barW - 2)}
                            height={ch}
                            className="fill-red-600/90"
                          >
                            <title>{`${r.minute}: cheating ${r.cheating}, ok ${r.ok}`}</title>
                          </rect>
                          <rect
                            x={x + 1}
                            y={32 - ch - okh}
                            width={Math.max(2, barW - 2)}
                            height={okh}
                            className="fill-green-600/90"
                          >
                            <title>{`${r.minute}: cheating ${r.cheating}, ok ${r.ok}`}</title>
                          </rect>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {data.most_suspicious_person ? (
        <Card
          size="sm"
          className="border-amber-500/50 bg-amber-50/80 dark:bg-amber-950/30"
        >
          <CardHeader>
            <CardTitle className="text-base">Highest risk individual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <h3 className="text-lg font-semibold">
              Person {data.most_suspicious_person.person_id}
            </h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                Incidents:{" "}
                <strong className="tabular-nums">
                  {data.most_suspicious_person.cheating_events}
                </strong>
              </span>
              <span>
                Cheating rate:{" "}
                <strong className="tabular-nums">
                  {(data.most_suspicious_person.cheating_rate * 100).toFixed(1)}%
                </strong>
              </span>
              <Badge variant="outline" className="capitalize">
                {data.most_suspicious_person.dominant_direction}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
