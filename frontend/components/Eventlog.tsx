"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { exportEventsUrl, listEvents } from "@/lib/api"
import type { EventResponse, VerdictType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { GlassCard, SectionLabel, BrandBadge, PremiumButton } from "./brand-ui"
import { Filter, Download, User, AlertTriangle, CheckCircle2, Clock, MoreHorizontal, Loader2 } from "lucide-react"

export interface EventLogProps {
  sessionId: string
  liveEvents?: EventResponse[]
}

type FilterState = {
  verdict: string
  personId: string
  fromTs: string
  toTs: string
}

function buildQuery(f: FilterState) {
  const verdictParam = f.verdict === "all" ? undefined : (f.verdict as VerdictType)
  let person_id: number | undefined
  if (f.personId.trim() !== "") {
    const n = Number.parseInt(f.personId, 10)
    if (!Number.isNaN(n)) person_id = n
  }
  const from_ts = f.fromTs.trim() === "" ? undefined : new Date(f.fromTs).toISOString()
  const to_ts = f.toTs.trim() === "" ? undefined : new Date(f.toTs).toISOString()
  return { verdict: verdictParam, person_id, from_ts, to_ts, limit: 50 as const }
}

const defaultFilters: FilterState = { verdict: "all", personId: "", fromTs: "", toTs: "" }

// ─── Shared field wrapper ─────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <SectionLabel className="mb-0">{label}</SectionLabel>
      {children}
    </div>
  )
}

const inputCls = cn(
  "h-10 rounded-xl border border-white/5 bg-white/5",
  "px-3 font-mono text-[11px] text-white placeholder:text-white/20",
  "outline-none transition-all duration-300",
  "focus:bg-white/[0.08] focus:border-[#3B9EE8]/50 focus:ring-1 focus:ring-[#3B9EE8]/20",
  "w-full"
)

// ─── Main component ───────────────────────────────────────────────────────────
export function EventLog({ sessionId, liveEvents = [] }: EventLogProps) {
  const [draft, setDraft] = useState<FilterState>(defaultFilters)
  const [active, setActive] = useState<FilterState>(defaultFilters)
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState<EventResponse[]>([])
  const [loading, setLoading] = useState(false)

  const fetchList = useCallback(
    async (offset: number, append: boolean, filters: FilterState) => {
      setLoading(true)
      try {
        const page = await listEvents(sessionId, { ...buildQuery(filters), offset })
        setTotal(page.total)
        setItems((prev) => append ? [...prev, ...page.items] : [...page.items])
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load events")
      } finally {
        setLoading(false)
      }
    },
    [sessionId]
  )

  useEffect(() => {
    setDraft(defaultFilters)
    setActive(defaultFilters)
    setItems([])
    void fetchList(0, false, defaultFilters)
  }, [sessionId, fetchList])

  const applyFilters = () => { setActive({ ...draft }); void fetchList(0, false, draft) }
  const loadMore = () => void fetchList(items.length, true, active)
  const exportCsv = () => window.open(exportEventsUrl(sessionId), "_blank", "noopener,noreferrer")

  const merged = useMemo(() => {
    const liveIds = new Set(liveEvents.map((e) => e.id))
    return [...liveEvents, ...items.filter((i) => !liveIds.has(i.id))]
  }, [liveEvents, items])

  const cheatingInView = merged.filter((e) => e.verdict === "CHEATING").length

  return (
    <div className="flex flex-col gap-6">
      {/* Filter bar */}
      <GlassCard className="p-6" accent="none">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Field label="Verdict">
            <div className="relative">
              <select
                value={draft.verdict}
                onChange={(e) => setDraft((d) => ({ ...d, verdict: e.target.value }))}
                className={cn(inputCls, "appearance-none cursor-pointer pr-10")}
              >
                <option value="all">All Events</option>
                <option value="CHEATING">Cheating Only</option>
                <option value="OK">OK Only</option>
              </select>
              <Filter className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
            </div>
          </Field>
          <Field label="Person ID">
            <div className="relative">
              <input
                inputMode="numeric"
                placeholder="All Persons"
                value={draft.personId}
                onChange={(e) => setDraft((d) => ({ ...d, personId: e.target.value }))}
                className={cn(inputCls, "pl-10")}
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
            </div>
          </Field>
          <Field label="From">
            <input
              type="datetime-local"
              value={draft.fromTs}
              onChange={(e) => setDraft((d) => ({ ...d, fromTs: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="To">
            <input
              type="datetime-local"
              value={draft.toTs}
              onChange={(e) => setDraft((d) => ({ ...d, toTs: e.target.value }))}
              className={inputCls}
            />
          </Field>
        </div>
        
        <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <PremiumButton
              onClick={applyFilters}
              disabled={loading}
              size="sm"
            >
              <Filter className="size-3.5" />
              Apply Filters
            </PremiumButton>
            <PremiumButton
              variant="outline"
              onClick={exportCsv}
              size="sm"
            >
              <Download className="size-3.5" />
              Export CSV
            </PremiumButton>
          </div>

          {cheatingInView > 0 && (
            <BrandBadge variant="red" className="animate-pulse">
              <AlertTriangle className="size-3" />
              {cheatingInView} CRITICAL INCIDENT{cheatingInView !== 1 ? "S" : ""}
            </BrandBadge>
          )}
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-0 overflow-hidden" accent="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Time</th>
                <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Subject</th>
                <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Confidence</th>
                <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Direction</th>
                <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Object</th>
                <th className="p-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {merged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <Clock className="size-10" strokeWidth={1} />
                      <p className="font-mono text-xs uppercase tracking-widest">
                        {loading ? "Decrypting logs..." : "No events recorded"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                merged.map((ev) => (
                  <tr
                    key={ev.id}
                    className={cn(
                      "group transition-colors duration-200",
                      ev.verdict === "CHEATING" 
                        ? "bg-red-500/5 hover:bg-red-500/10" 
                        : "hover:bg-white/[0.02]"
                    )}
                  >
                    <td className="p-4 font-mono text-[10px] text-white/50">
                      {new Date(ev.occurred_at).toLocaleTimeString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex size-8 items-center justify-center rounded-lg border text-[10px] font-bold shadow-sm transition-all duration-300 group-hover:scale-110",
                          ev.verdict === "CHEATING"
                            ? "border-red-500/30 bg-red-500/10 text-red-500 shadow-red-500/10"
                            : "border-white/5 bg-white/5 text-white/40 shadow-white/5"
                        )}>
                          #{ev.person_id}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <BrandBadge variant={ev.verdict === "CHEATING" ? "red" : "green"}>
                        {ev.verdict === "CHEATING" ? <AlertTriangle className="size-2.5" /> : <CheckCircle2 className="size-2.5" />}
                        {ev.verdict}
                      </BrandBadge>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5 min-w-[100px]">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className={cn("font-bold", ev.cheat_prob > 0.6 ? "text-red-500" : "text-green-500")}>
                            {(ev.cheat_prob * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", ev.cheat_prob > 0.5 ? "bg-red-500" : "bg-green-500")}
                            style={{ width: `${Math.min(100, ev.cheat_prob * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[10px] text-white/40 uppercase tracking-wider">
                      {ev.direction}
                    </td>
                    <td className="p-4">
                      {ev.obj_nearby ? (
                        <BrandBadge variant="amber" className="text-[9px]">
                          {ev.obj_name || "DETECTED"}
                        </BrandBadge>
                      ) : (
                        <span className="text-[10px] text-white/10 uppercase tracking-widest font-mono">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {ev.reasons?.map((r) => (
                          <span key={r} className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-white/30 border border-white/5 font-mono uppercase">
                            {r}
                          </span>
                        )) || <span className="text-[10px] text-white/10 uppercase tracking-widest font-mono">—</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="p-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
          <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
            {merged.length} of {total} records showing
          </span>
          {items.length < total && (
            <PremiumButton
              variant="outline"
              size="sm"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <MoreHorizontal className="size-3.5" />}
              Fetch More Records
            </PremiumButton>
          )}
        </div>
      </GlassCard>
    </div>
  )
}