"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ModelSelector } from "@/components/Modelselector"
import { createSession, listModels } from "@/lib/api"
import { cn } from "@/lib/utils"
import { PremiumButton, SectionLabel } from "@/components/brand-ui"
import { Plus, Video, Layout, Loader2 } from "lucide-react"

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
      <DialogContent
        className={cn(
          "max-w-2xl! border-white/5 bg-[#0D121F]/90 p-0 backdrop-blur-2xl overflow-hidden",
          "shadow-[0_0_100px_rgba(0,0,0,0.8)]"
        )}
      >
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#3B9EE8] to-[#60C5F4]" />

        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#3B9EE8]/10 border border-[#3B9EE8]/20 shadow-lg shadow-[#3B9EE8]/5">
              <Plus className="size-6 text-[#3B9EE8]" />
            </div>
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                New Session
              </DialogTitle>
              <DialogDescription className="text-sm text-[#94A3B8]">
                Initialize a new real-time or offline proctoring instance.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-8 px-8">
          {/* Title */}
          <div className="flex flex-col gap-3">
            <SectionLabel className="mb-0">Session Title</SectionLabel>
            <Input
              placeholder="e.g. Midterm Examination — Spring 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                "h-12 border-white/5 bg-white/5 px-4 text-white placeholder:text-white/20 transition-all",
                "focus:bg-white/[0.08] focus:border-[#3B9EE8]/50 focus:ring-1 focus:ring-[#3B9EE8]/20"
              )}
            />
          </div>

          {/* Source */}
          <div className="flex flex-col gap-3">
            <SectionLabel className="mb-0">Video Source</SectionLabel>
            <div className="relative">
              <Input
                placeholder="0"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className={cn(
                  "h-12 border-white/5 bg-white/5 pl-12 text-white font-mono placeholder:text-white/20 transition-all",
                  "focus:bg-white/[0.08] focus:border-[#3B9EE8]/50 focus:ring-1 focus:ring-[#3B9EE8]/20"
                )}
              />
              <Video className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-white/30" />
            </div>
            <p className="text-[10px] text-[#94A3B8] font-mono flex items-center gap-2">
              <span className="text-[#3B9EE8]">TIP:</span> Use 0 for default webcam or enter a local file path.
            </p>
          </div>

          {/* Model */}
          <div className="flex flex-col gap-3">
            <SectionLabel className="mb-0">AI Model</SectionLabel>
            <ModelSelector
              value={modelFile}
              onChange={setModelFile}
              disabled={busy}
            />
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
            disabled={busy}
            onClick={submit}
            className="min-w-[160px]"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Layout className="size-4" />
                Create Session
              </>
            )}
          </PremiumButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}