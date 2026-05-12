"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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
    if (!f) {
      setFile(null)
      return
    }
    if (!f.type.startsWith("video/")) {
      toast.error("Please choose a video file")
      return
    }
    setFile(f)
  }, [])

  const submit = async () => {
    if (!file) {
      toast.error("Select a video file")
      return
    }
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

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#0A0F1A] border-slate-200 dark:border-white/10 transition-colors p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Upload Session Video</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-white/40 transition-colors">
            Replace the current session feed with a pre-recorded video file for offline analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div
            className={cn(
              "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all duration-300",
              drag 
                ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20" 
                : "border-slate-200 dark:border-white/10 hover:border-blue-500/40 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.03]"
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              pick(e.dataTransfer.files[0] ?? null)
            }}
            onClick={() => document.getElementById("upload-file-input")?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                document.getElementById("upload-file-input")?.click()
              }
            }}
            role="button"
            tabIndex={0}
          >
            <input
              id="upload-file-input"
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
            
            <div className="flex size-14 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-6 text-blue-600 dark:text-[#3B9EE8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-slate-900 dark:text-white transition-colors">
                {file ? file.name : "Select Video File"}
              </p>
              <p className="text-xs text-slate-400 dark:text-white/30 mt-1 transition-colors">
                {file ? `(${(file.size / (1024 * 1024)).toFixed(1)} MB)` : "Drag and drop or click to browse"}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 transition-colors gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={submit} 
            disabled={busy || !file}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-[#3B9EE8] dark:hover:bg-[#2B7FC8] text-white shadow-lg shadow-blue-600/20 dark:shadow-[#3B9EE8]/20 transition-all px-8"
          >
            {busy ? "Uploading..." : "Start Analysis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
