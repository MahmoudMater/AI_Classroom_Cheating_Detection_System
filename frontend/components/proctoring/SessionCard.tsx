"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getEventSummary } from "@/lib/api"
import type { SessionResponse, SessionStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

function statusBadgeClass(status: SessionStatus) {
  switch (status) {
    case "running":
      return "border-green-600/40 bg-green-600/15 text-green-700 dark:text-green-400"
    case "stopped":
      return "border-blue-600/40 bg-blue-600/15 text-blue-700 dark:text-blue-400"
    case "error":
      return "border-red-600/40 bg-red-600/15 text-red-700 dark:text-red-400"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

export interface SessionCardProps {
  session: SessionResponse
}

export function SessionCard({ session }: SessionCardProps) {
  const [cheatingCount, setCheatingCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const s = await getEventSummary(session.id)
        if (!cancelled) setCheatingCount(s.cheating_count)
      } catch {
        if (!cancelled) setCheatingCount(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session.id])

  return (
    <Link href={`/sessions/${session.id}`} className="block h-full">
      <Card
        className="hover:border-primary/40 h-full transition-colors hover:shadow-md"
        size="sm"
      >
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base leading-snug">
              {session.title}
            </CardTitle>
            <Badge
              variant="outline"
              className={cn("shrink-0 capitalize", statusBadgeClass(session.status))}
            >
              {session.status === "running" ? (
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-green-600 dark:bg-green-400" />
                  {session.status}
                </span>
              ) : (
                session.status
              )}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Started:{" "}
            {session.started_at
              ? new Date(session.started_at).toLocaleString()
              : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-xs">
          <p>
            Cheating events:{" "}
            <span className="text-foreground font-medium tabular-nums">
              {cheatingCount ?? "—"}
            </span>
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
