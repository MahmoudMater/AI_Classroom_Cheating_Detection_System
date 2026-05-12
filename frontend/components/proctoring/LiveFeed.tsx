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
        "relative w-full overflow-hidden rounded-xl border transition-all duration-300 shadow-lg dark:shadow-none",
        "bg-slate-900 border-slate-200 dark:border-white/10",
        className
      )}
    >
      {!frame ? (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 py-20 bg-slate-100 dark:bg-black/20 transition-colors">
          <div className="size-16 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm transition-colors">
            <HugeiconsIcon
              icon={Camera01Icon}
              strokeWidth={1.5}
              className="size-8 text-slate-400 dark:text-white/20 animate-pulse"
            />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-slate-600 dark:text-white/40 uppercase tracking-widest transition-colors">Awaiting Signal</p>
            <p className="text-xs text-slate-400 dark:text-white/20 transition-colors">Initializing secure video link...</p>
          </div>
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className={cn(
          "block w-full transition-opacity duration-500", 
          frame ? "aspect-video max-h-[min(70vh,720px)] opacity-100" : "hidden opacity-0"
        )}
        aria-label="Live proctoring video"
      />
      
      {/* HUD Overlay for status */}
      {frame && (
        <div className="absolute top-4 right-4 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">ENCRYPTED FEED</span>
          </div>
        </div>
      )}
    </div>
  )
}
