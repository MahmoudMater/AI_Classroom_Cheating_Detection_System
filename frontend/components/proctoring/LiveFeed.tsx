"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon } from "@hugeicons/core-free-icons"
import { useEffect, useRef } from "react"

import { drawPersonOverlays } from "@/components/proctoring/PersonOverlay"
import type { FrameMessage } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface LiveFeedProps {
  frame: FrameMessage | null
  width?: number
  height?: number
  className?: string
}

export function LiveFeed({
  frame,
  width: propWidth,
  height: propHeight,
  className,
}: LiveFeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef({ w: 640, h: 360 })
  const rafRef = useRef<number | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (!cr) return
      sizeRef.current = {
        w: propWidth ?? Math.max(320, cr.width),
        h: propHeight ?? Math.max(180, (cr.width * 9) / 16),
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [propWidth, propHeight])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!frame) {
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const { w, h } = sizeRef.current
      canvas.width = Math.floor(w)
      canvas.height = Math.floor(h)
      ctx.fillStyle = "#27272a"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return
    }

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = requestAnimationFrame(() => {
      const img = new Image()
      img.decoding = "async"
      img.onload = () => {
        requestAnimationFrame(() => {
          const ctx = canvas.getContext("2d")
          if (!ctx) return

          const { w, h } = sizeRef.current
          const cw = Math.floor(w)
          const ch = Math.floor(h)
          canvas.width = cw
          canvas.height = ch

          const iw = img.naturalWidth || cw
          const ih = img.naturalHeight || ch
          const scale = Math.min(cw / iw, ch / ih)
          const dw = iw * scale
          const dh = ih * scale
          const ox = (cw - dw) / 2
          const oy = (ch - dh) / 2

          ctx.fillStyle = "#18181b"
          ctx.fillRect(0, 0, cw, ch)
          ctx.drawImage(img, ox, oy, dw, dh)

          drawPersonOverlays(ctx, frame.persons, {
            offsetX: ox,
            offsetY: oy,
            scale,
          })
        })
      }
      img.onerror = () => {
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const { w, h } = sizeRef.current
        canvas.width = Math.floor(w)
        canvas.height = Math.floor(h)
        ctx.fillStyle = "#3f3f46"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      img.src = `data:image/jpeg;base64,${frame.frame_b64}`
      imgRef.current = img
    })

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [frame])

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-muted relative w-full overflow-hidden rounded-xl ring-1 ring-border",
        className
      )}
    >
      {!frame ? (
        <div className="text-muted-foreground flex aspect-video w-full flex-col items-center justify-center gap-2 py-16">
          <HugeiconsIcon
            icon={Camera01Icon}
            strokeWidth={1.5}
            className="size-12 opacity-60"
          />
          <p className="text-sm">Waiting for video frames…</p>
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className={cn("block w-full", frame ? "aspect-video max-h-[min(70vh,720px)]" : "hidden")}
        aria-label="Live proctoring video"
      />
    </div>
  )
}
