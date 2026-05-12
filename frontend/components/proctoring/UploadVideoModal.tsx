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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload video</DialogTitle>
          <DialogDescription>
            Upload a replacement video file for this session. Not allowed while
            the session is running.
          </DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            "border-border flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors",
            drag ? "border-primary bg-muted/50" : "hover:bg-muted/40"
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
          <p className="text-muted-foreground text-center text-sm">
            Drag and drop a video here, or click to browse
          </p>
          {file ? (
            <p className="text-foreground text-xs font-medium">{file.name}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={busy || !file}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
