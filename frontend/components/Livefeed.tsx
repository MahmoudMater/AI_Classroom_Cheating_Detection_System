"use client"

import { useEffect, useRef } from "react"
import { drawPersonOverlays } from "@/components/proctoring/PersonOverlay"
import type { FrameMessage } from "@/lib/types"
import { cn } from "@/lib/utils"
import { GlassCard, SectionLabel, BrandBadge, LiveDot } from "./brand-ui"
import { Camera, Video, Monitor, AlertCircle } from "lucide-react"

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

  // Track container size via ResizeObserver
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

  // Draw each frame
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!frame) {
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const { w, h } = sizeRef.current
      canvas.width = Math.floor(w)
      canvas.height = Math.floor(h)
      ctx.fillStyle = "#070B14"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return
    }

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)

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

          ctx.fillStyle = "#070B14"
          ctx.fillRect(0, 0, cw, ch)
          ctx.drawImage(img, ox, oy, dw, dh)

          drawPersonOverlays(ctx, frame.persons, { offsetX: ox, offsetY: oy, scale })
        })
      }
      img.onerror = () => {
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const { w, h } = sizeRef.current
        canvas.width = Math.floor(w)
        canvas.height = Math.floor(h)
        ctx.fillStyle = "#111827"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      img.src = `data:image/jpeg;base64,${frame.frame_b64}`
      imgRef.current = img
    })

    return () => {
      if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    }
  }, [frame])

  return (
    <GlassCard
      accent="none"
      className={cn(
        "relative w-full overflow-hidden border-white/5",
        className
      )}
    >
      <div ref={containerRef} className="relative aspect-video w-full bg-black">
        {/* Surveillance UI Overlay */}
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-black/50 border border-white/10 backdrop-blur-md">
                <Camera className="size-4 text-[#3B9EE8]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Cam-01</span>
                <span className="text-[8px] font-mono text-white/50 uppercase">Session-Alpha</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {frame ? (
                <BrandBadge variant="green" className="bg-black/50 backdrop-blur-md border-white/10">
                  <LiveDot />
                  LIVE
                </BrandBadge>
              ) : (
                <BrandBadge variant="muted" className="bg-black/50 backdrop-blur-md border-white/10">
                  STANDBY
                </BrandBadge>
              )}
            </div>
          </div>

          {/* Corner Marks */}
          <div className="absolute left-4 top-4 size-8 border-l border-t border-[#3B9EE8]/30" />
          <div className="absolute right-4 top-4 size-8 border-r border-t border-[#3B9EE8]/30" />
          <div className="absolute left-4 bottom-4 size-8 border-l border-b border-[#3B9EE8]/30" />
          <div className="absolute right-4 bottom-4 size-8 border-r border-b border-[#3B9EE8]/30" />

          {/* Bottom Bar */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] text-[#3B9EE8] opacity-80 uppercase tracking-widest">
                {new Date().toLocaleTimeString()}
              </span>
              <div className="flex items-center gap-2">
                <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#3B9EE8] animate-[livefeed-buffer_4s_ease-in-out_infinite]" />
                </div>
                <span className="text-[8px] font-mono text-white/30 tracking-widest uppercase">Buffer</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/50 border border-white/5 backdrop-blur-md">
                <Monitor className="size-3 text-white/40" />
                <span className="text-[8px] font-mono text-white/60 uppercase">1080p</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scanline animation */}
        {frame && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 opacity-20"
            style={{
              background: "linear-gradient(to right, transparent, #3B9EE8, transparent)",
              boxShadow: "0 0 15px #3B9EE8",
              animation: "livefeed-scan 3s linear infinite",
            }}
          />
        )}

        {/* Empty state */}
        {!frame && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#070B14]">
            <div className="relative">
              <div className="absolute inset-0 bg-[#3B9EE8]/20 blur-2xl rounded-full" />
              <div className="relative flex size-20 items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] text-white/10">
                <Video className="size-10" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Waiting for Signal</p>
              <p className="text-[10px] font-mono text-[#3B9EE8]/30 uppercase tracking-[0.2em]">Connect session to begin stream</p>
            </div>
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          aria-label="Live proctoring video"
          className={cn(
            "block h-full w-full object-contain",
            !frame && "hidden"
          )}
        />
      </div>

      <style jsx global>{`
        @keyframes livefeed-scan {
          from { top: 0% }
          to   { top: 100% }
        }
        @keyframes livefeed-buffer {
          0% { width: 0%; opacity: 0.5; }
          50% { width: 80%; opacity: 1; }
          100% { width: 100%; opacity: 0.5; }
        }
      `}</style>
    </GlassCard>
  )
}