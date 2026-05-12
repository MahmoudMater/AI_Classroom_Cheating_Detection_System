import type { PersonFrame } from "@/lib/types"

export type PersonOverlayTransform = {
  offsetX: number
  offsetY: number
  scale: number
}

const CHEAT = "#DC2626"
const OK = "#16A34A"

/**
 * Draws bounding boxes, verdict labels, direction, and cheat probability on a 2D canvas context.
 * Call after the video frame has been drawn; coordinates assume bbox is in source image pixels.
 */
export function drawPersonOverlays(
  ctx: CanvasRenderingContext2D,
  persons: PersonFrame[],
  t: PersonOverlayTransform
): void {
  const pad = 4
  ctx.font = "12px system-ui, sans-serif"
  ctx.lineWidth = 2

  for (const p of persons) {
    const [x1, y1, x2, y2] = p.bbox
    const bx1 = t.offsetX + x1 * t.scale
    const by1 = t.offsetY + y1 * t.scale
    const bx2 = t.offsetX + x2 * t.scale
    const by2 = t.offsetY + y2 * t.scale
    const w = bx2 - bx1
    const h = by2 - by1

    const color = p.verdict === "CHEATING" ? CHEAT : OK
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.strokeRect(bx1, by1, w, h)

    const label = `P${p.id} | ${p.verdict}`
    const metrics = ctx.measureText(label)
    const tw = metrics.width + pad * 2
    const th = 18
    const lx = bx1
    const ly = Math.max(0, by1 - th)

    ctx.fillStyle = "rgba(0,0,0,0.65)"
    ctx.fillRect(lx, ly, tw, th)
    ctx.fillStyle = "#ffffff"
    ctx.fillText(label, lx + pad, ly + 13)

    const sub = `${p.direction} · ${(p.cheat_prob * 100).toFixed(0)}%`
    const sm = ctx.measureText(sub)
    const sw = sm.width + pad * 2
    const sh = 16
    const sx = bx1
    const sy = by2 + 2

    ctx.fillStyle = "rgba(0,0,0,0.55)"
    ctx.fillRect(sx, sy, sw, sh)
    ctx.fillStyle = "#f4f4f5"
    ctx.fillText(sub, sx + pad, sy + 12)
  }
}

/** Present for layout parity; canvas drawing uses `drawPersonOverlays` from this module. */
export function PersonOverlay() {
  return null
}
