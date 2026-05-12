"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModelSelector } from "@/components/proctoring/ModelSelector"
import { createSession, listModels } from "@/lib/api"

export interface CreateSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateSessionModal({
  open,
  onOpenChange,
  onCreated,
}: CreateSessionModalProps) {
  const [title, setTitle] = useState("")
  const [source, setSource] = useState("0")
  const [modelFile, setModelFile] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setTitle("")
    setSource("0")
    setModelFile(null)
  }

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    setBusy(true)
    try {
      let mf = modelFile
      if (!mf) {
        const { models } = await listModels()
        mf = models[0]?.filename ?? null
      }
      await createSession({
        title: title.trim(),
        source: source.trim() || "0",
        metadata: {},
        ...(mf ? { model_file: mf } : {}),
      })
      toast.success("Session created")
      reset()
      onOpenChange(false)
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed")
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
          <DialogTitle>New session</DialogTitle>
          <DialogDescription>
            Create a proctoring session. Use source{" "}
            <code className="text-xs">0</code> for the default webcam, or a
            file path string for recorded video.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="session-title">Title</Label>
            <Input
              id="session-title"
              placeholder="Midterm — Section A"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="session-source">Source</Label>
            <Input
              id="session-source"
              placeholder="0"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <ModelSelector
            value={modelFile}
            onChange={setModelFile}
            disabled={busy}
          />
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
          <Button type="button" onClick={submit} disabled={busy}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
