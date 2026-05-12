"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { exportEventsUrl, listEvents } from "@/lib/api"
import type { EventResponse, VerdictType } from "@/lib/types"
import { cn } from "@/lib/utils"

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
  const verdictParam =
    f.verdict === "all" ? undefined : (f.verdict as VerdictType)
  let person_id: number | undefined
  if (f.personId.trim() !== "") {
    const n = Number.parseInt(f.personId, 10)
    if (!Number.isNaN(n)) person_id = n
  }
  const from_ts =
    f.fromTs.trim() === "" ? undefined : new Date(f.fromTs).toISOString()
  const to_ts =
    f.toTs.trim() === "" ? undefined : new Date(f.toTs).toISOString()
  return { verdict: verdictParam, person_id, from_ts, to_ts, limit: 50 as const }
}

const defaultFilters: FilterState = {
  verdict: "all",
  personId: "",
  fromTs: "",
  toTs: "",
}

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
        const page = await listEvents(sessionId, {
          ...buildQuery(filters),
          offset,
        })
        setTotal(page.total)
        setItems((prev) =>
          append ? [...prev, ...page.items] : [...page.items]
        )
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

  const applyFilters = () => {
    setActive({ ...draft })
    void fetchList(0, false, draft)
  }

  const loadMore = () => {
    void fetchList(items.length, true, active)
  }

  const exportCsv = () => {
    window.open(exportEventsUrl(sessionId), "_blank", "noopener,noreferrer")
  }

  const merged = useMemo(() => {
    const liveIds = new Set(liveEvents.map((e) => e.id))
    const rest = items.filter((i) => !liveIds.has(i.id))
    return [...liveEvents, ...rest]
  }, [liveEvents, items])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">Verdict</Label>
          <Select
            value={draft.verdict}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, verdict: v }))
            }
          >
            <SelectTrigger className="w-full bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 transition-colors">
              <SelectValue placeholder="Verdict" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="CHEATING">Cheating</SelectItem>
              <SelectItem value="OK">OK</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="person-filter" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">Person ID</Label>
          <Input
            id="person-filter"
            inputMode="numeric"
            placeholder="e.g. 1"
            value={draft.personId}
            onChange={(e) =>
              setDraft((d) => ({ ...d, personId: e.target.value }))
            }
            className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 transition-colors"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="from-ts" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">From</Label>
          <Input
            id="from-ts"
            type="datetime-local"
            value={draft.fromTs}
            onChange={(e) =>
              setDraft((d) => ({ ...d, fromTs: e.target.value }))
            }
            className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 transition-colors"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to-ts" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">To</Label>
          <Input
            id="to-ts"
            type="datetime-local"
            value={draft.toTs}
            onChange={(e) =>
              setDraft((d) => ({ ...d, toTs: e.target.value }))
            }
            className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 transition-colors"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button 
          type="button" 
          onClick={applyFilters} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-[#3B9EE8] dark:hover:bg-[#2B7FC8] text-white transition-colors"
        >
          Apply filters
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={exportCsv}
          className="border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          Export CSV
        </Button>
      </div>

      <div className="max-h-[min(60vh,520px)] overflow-auto rounded-lg border border-slate-200 dark:border-white/10 transition-colors">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">Time</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">Person</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">Verdict</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">Cheat %</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">Direction</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">Object</TableHead>
              <TableHead className="min-w-[180px] text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">Reasons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {merged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-slate-400 dark:text-white/30 py-8 text-center transition-colors"
                >
                  No events match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              merged.map((ev) => (
                <TableRow
                  key={ev.id}
                  className={cn(
                    "transition-colors",
                    ev.verdict === "CHEATING" 
                      ? "bg-rose-50 dark:bg-red-950/30 border-rose-100 dark:border-red-900/30" 
                      : "border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                  )}
                >
                  <TableCell className="whitespace-nowrap text-xs font-mono text-slate-500 dark:text-white/60">
                    {new Date(ev.occurred_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-white">{ev.person_id}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ev.verdict === "CHEATING"
                          ? "destructive"
                          : "secondary"
                      }
                      className={cn(
                        "text-[10px] font-bold tracking-widest",
                        ev.verdict === "OK"
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-green-700"
                          : ""
                      )}
                    >
                      {ev.verdict}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-slate-900 dark:text-white">
                    {(ev.cheat_prob * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs uppercase tracking-tight text-slate-600 dark:text-white/60">
                    {ev.direction}
                  </TableCell>
                  <TableCell className="text-[10px] font-bold uppercase text-slate-500 dark:text-white/40">
                    {ev.obj_nearby ? ev.obj_name || "yes" : "—"}
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-normal text-[10px] text-slate-400 dark:text-white/30 leading-relaxed">
                    {ev.reasons?.length ? ev.reasons.join(" · ") : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {items.length < total ? (
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={loadMore}
          className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-white transition-colors"
        >
          Load more
        </Button>
      ) : null}
    </div>
  )
}
