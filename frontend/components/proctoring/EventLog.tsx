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
          <Label>Verdict</Label>
          <Select
            value={draft.verdict}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, verdict: v }))
            }
          >
            <SelectTrigger className="w-full">
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
          <Label htmlFor="person-filter">Person ID</Label>
          <Input
            id="person-filter"
            inputMode="numeric"
            placeholder="e.g. 1"
            value={draft.personId}
            onChange={(e) =>
              setDraft((d) => ({ ...d, personId: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="from-ts">From</Label>
          <Input
            id="from-ts"
            type="datetime-local"
            value={draft.fromTs}
            onChange={(e) =>
              setDraft((d) => ({ ...d, fromTs: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to-ts">To</Label>
          <Input
            id="to-ts"
            type="datetime-local"
            value={draft.toTs}
            onChange={(e) =>
              setDraft((d) => ({ ...d, toTs: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={applyFilters} disabled={loading}>
          Apply filters
        </Button>
        <Button type="button" variant="outline" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="max-h-[min(60vh,520px)] overflow-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Person</TableHead>
              <TableHead>Verdict</TableHead>
              <TableHead>Cheat %</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Object</TableHead>
              <TableHead className="min-w-[180px]">Reasons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {merged.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  No events match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              merged.map((ev) => (
                <TableRow
                  key={ev.id}
                  className={cn(
                    ev.verdict === "CHEATING" &&
                      "bg-red-50 dark:bg-red-950/30"
                  )}
                >
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(ev.occurred_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{ev.person_id}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ev.verdict === "CHEATING"
                          ? "destructive"
                          : "secondary"
                      }
                      className={
                        ev.verdict === "OK"
                          ? "bg-green-600 text-white hover:bg-green-600/90 dark:bg-green-700"
                          : ""
                      }
                    >
                      {ev.verdict}
                    </Badge>
                  </TableCell>
                  <TableCell>{(ev.cheat_prob * 100).toFixed(1)}%</TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {ev.direction}
                  </TableCell>
                  <TableCell className="text-xs">
                    {ev.obj_nearby ? ev.obj_name || "yes" : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs whitespace-normal text-xs">
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
        >
          Load more
        </Button>
      ) : null}
    </div>
  )
}
