"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { PremiumButton, SectionLabel } from "@/components/brand-ui"
import { Upload, FileVideo, CheckCircle2, X, Loader2 } from "lucide-react"

export interface UploadVideoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (file: File) => Promise<void>
}

export function UploadVideoModal({
  open,
  onOpenChange,
  onUpload,
}: UploadVideoModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)

  const reset = () => {
    setFile(null)
    setDrag(false)
  }

  const pick = useCallback((f: File | null) => {
    if (!f) { setFile(null); return }
    if (!f.type.startsWith("video/")) {
      toast.error("Please choose a video file")
      return
    }
    setFile(f)
  }, [])

  const submit = async () => {
    if (!file) { toast.error("Select a video file"); return }
    setBusy(true)
    try {
      await onUpload(file)
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setBusy(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}
    >
      <DialogContent
        className={cn(
          "max-w-md border-white/5 bg-[#0D121F]/90 p-0 backdrop-blur-2xl overflow-hidden",
          "shadow-[0_0_100px_rgba(0,0,0,0.8)]"
        )}
      >
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]" />

        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 shadow-lg shadow-[#F59E0B]/5">
              <Upload className="size-6 text-[#F59E0B]" />
            </div>
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                Upload Video
              </DialogTitle>
              <DialogDescription className="text-sm text-[#94A3B8]">
                Select a recorded exam session for offline analysis.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-2">
          <div
            className={cn(
              "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all duration-300",
              drag
                ? "border-[#F59E0B] bg-[#F59E0B]/10"
                : file
                ? "border-[#10B981]/50 bg-[#10B981]/5"
                : "border-white/10 bg-white/[0.02] hover:border-[#3B9EE8]/50 hover:bg-white/[0.04]"
            )}
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0] ?? null) }}
            onClick={() => document.getElementById("upload-video-input")?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.getElementById("upload-video-input")?.click() } }}
            role="button"
            tabIndex={0}
          >
            <input
              id="upload-video-input"
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />

            {file ? (
              <div className="flex flex-col items-center gap-4 p-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-[#10B981]/20 border border-[#10B981]/30">
                  <FileVideo className="size-8 text-[#10B981]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white truncate max-w-[280px]">
                    {file.name}
                  </p>
                  <p className="font-mono text-[10px] text-[#94A3B8]">
                    {formatSize(file.size)} · READY FOR UPLOAD
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
                  <CheckCircle2 className="size-3 text-[#10B981]" />
                  <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">Validated</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/20">
                  <FileVideo className="size-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">
                    {drag ? "Release to drop" : "Drop video file"}
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    or click to browse local files
                  </p>
                </div>
                <div className="font-mono text-[9px] text-white/20 uppercase tracking-widest border border-white/5 px-2 py-1 rounded">
                  MP4 · MOV · AVI · MKV
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/10">
            <SectionLabel className="mb-2 text-[#F59E0B]">Caution</SectionLabel>
            <p className="text-[10px] text-[#94A3B8] leading-relaxed">
              Video processing is resource-intensive. Ensure the file is not corrupted before uploading. 
              Uploads are disabled while a live session is active.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-3 bg-white/[0.02] px-8 py-6 border-t border-white/5">
          <PremiumButton
            variant="ghost"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </PremiumButton>
          <PremiumButton
            disabled={busy || !file}
            onClick={submit}
            className={cn(
              "min-w-[160px] bg-[#F59E0B] hover:bg-[#F59E0B]/90 shadow-[#F59E0B]/20",
              file && !busy ? "animate-in fade-in zoom-in duration-300" : ""
            )}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Start Upload
              </>
            )}
          </PremiumButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}