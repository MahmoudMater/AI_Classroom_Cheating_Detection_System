"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface StatsPanelProps {
  fps: number
  personCount: number
  cheatingCount: number
  live: boolean
  className?: string
}

export function StatsPanel({
  fps,
  personCount,
  cheatingCount,
  live,
  className,
}: StatsPanelProps) {
  return (
    <Card className={cn("py-4", className)} size="sm">
      <CardContent className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs uppercase">
            Stream
          </span>
          <Badge
            variant={live ? "default" : "secondary"}
            className={cn(
              "w-fit",
              live &&
                "bg-green-600 text-white hover:bg-green-600/90 dark:bg-green-600"
            )}
          >
            {live ? "Live" : "Offline"}
          </Badge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs uppercase">FPS</span>
          <span className="font-mono text-lg font-semibold tabular-nums">
            {fps.toFixed(1)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs uppercase">
            Persons
          </span>
          <span className="font-mono text-lg font-semibold tabular-nums">
            {personCount}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs uppercase">
            Cheating
          </span>
          <span className="font-mono text-lg font-semibold text-red-600 tabular-nums dark:text-red-400">
            {cheatingCount}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
