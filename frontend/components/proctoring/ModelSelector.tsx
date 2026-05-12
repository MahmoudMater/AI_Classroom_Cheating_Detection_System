"use client"

import { useEffect, useRef, useState, startTransition } from "react"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listModels } from "@/lib/api"
import type { ModelInfo } from "@/lib/types"

export interface ModelSelectorProps {
  value: string | null
  onChange: (filename: string) => void
  disabled?: boolean
}

const PLACEHOLDER = "__model_placeholder__"

export function ModelSelector({
  value,
  onChange,
  disabled,
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let cancelled = false
    startTransition(() => {
      setLoading(true)
      setError(null)
    })
    void listModels()
      .then((res) => {
        if (cancelled) return
        setModels(res.models)
        if (res.models.length === 1) {
          onChangeRef.current(res.models[0].filename)
        }
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Failed to load models")
        setModels([])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="grid gap-2">
        <Label>Model</Label>
        <div
          className="bg-muted h-9 w-full animate-pulse rounded-4xl"
          aria-hidden
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-2">
        <Label>Model</Label>
        <p className="text-destructive text-sm">{error}</p>
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="grid gap-2">
        <Label>Model</Label>
        <p className="text-muted-foreground text-sm">
          No models available on the server.
        </p>
      </div>
    )
  }

  const hasValue = Boolean(value && models.some((m) => m.filename === value))
  let selectValue: string
  if (models.length === 1) {
    selectValue = models[0].filename
  } else if (!hasValue) {
    selectValue = PLACEHOLDER
  } else {
    selectValue = value as string
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="model-select">Model</Label>
      <Select
        value={
          selectValue === PLACEHOLDER || models.some((m) => m.filename === selectValue)
            ? selectValue
            : PLACEHOLDER
        }
        onValueChange={(v) => {
          if (v !== PLACEHOLDER) onChangeRef.current(v)
        }}
        disabled={disabled || models.length === 0}
      >
        <SelectTrigger id="model-select" className="w-full">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {models.length > 1 ? (
            <SelectItem value={PLACEHOLDER} disabled>
              Select a model
            </SelectItem>
          ) : null}
          {models.map((m) => (
            <SelectItem key={m.filename} value={m.filename}>
              {m.filename} ({m.size_mb.toFixed(2)} MB)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
