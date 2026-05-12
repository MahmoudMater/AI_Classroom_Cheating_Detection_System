"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { ModelSelector } from "@/components/proctoring/ModelSelector"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { analyzeImage, listModels } from "@/lib/api"
import type { ImageAnalysisResult } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [modelFile, setModelFile] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImageAnalysisResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pickFile = useCallback((f: File | null) => {
    if (!f) {
      setFile(null)
      return
    }
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file")
      return
    }
    setFile(f)
    setResult(null)
  }, [])

  const runAnalyze = async () => {
    if (!file) {
      toast.error("Select an image first")
      return
    }
    setLoading(true)
    setResult(null)
    try {
      let mf = modelFile
      if (!mf) {
        const { models } = await listModels()
        mf = models[0]?.filename ?? null
      }
      const res = await analyzeImage(file, mf ?? undefined)
      setResult(res)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-background text-foreground min-h-svh p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
            <Link href="/">← Dashboard</Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Quick Image Analysis
          </h1>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <section className="flex w-full min-w-0 flex-1 flex-col gap-4 lg:w-1/2">
            <div
              className={cn(
                "border-border flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors",
                drag ? "border-primary bg-muted/50" : "hover:bg-muted/30"
              )}
              onDragOver={(e) => {
                e.preventDefault()
                setDrag(true)
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDrag(false)
                pickFile(e.dataTransfer.files[0] ?? null)
              }}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  inputRef.current?.click()
                }
              }}
              role="button"
              tabIndex={0}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              <HugeiconsIcon
                icon={Image01Icon}
                className="text-muted-foreground size-12"
                strokeWidth={1.25}
              />
              <p className="text-muted-foreground text-center text-sm">
                Drop image here or click to browse
              </p>
              {previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                  <img
                    src={previewUrl}
                    alt="Selected preview"
                    className="mt-2 max-h-40 w-full max-w-xs rounded-lg object-contain ring-1 ring-border"
                  />
                </>
              ) : null}
            </div>

            <ModelSelector
              value={modelFile}
              onChange={setModelFile}
              disabled={loading}
            />

            <Button
              type="button"
              onClick={runAnalyze}
              disabled={!file || loading}
            >
              Analyze
            </Button>

            {file ? (
              <p className="text-muted-foreground text-xs">
                {file.name} — {(file.size / 1024).toFixed(1)} KB
              </p>
            ) : null}
          </section>

          <section className="flex w-full min-w-0 flex-1 flex-col gap-4 lg:w-1/2">
            {!loading && !result ? (
              <div className="text-muted-foreground flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-8">
                <HugeiconsIcon
                  icon={Image01Icon}
                  className="size-14 opacity-40"
                  strokeWidth={1}
                />
                <p className="text-center text-sm">
                  {file
                    ? "Run analysis to see results"
                    : "Upload an image to analyze"}
                </p>
              </div>
            ) : null}

            {loading ? (
              <Card>
                <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 p-8">
                  <div className="bg-muted h-48 w-full max-w-md animate-pulse rounded-lg" />
                  <p className="text-muted-foreground text-sm">
                    Running inference…
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {result && !loading ? (
              <div className="flex flex-col gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 JPEG per product spec */}
                <img
                  src={`data:image/jpeg;base64,${result.annotated_image_b64}`}
                  alt="Annotated analysis"
                  className="bg-muted/20 w-full max-w-full rounded-lg object-contain ring-1 ring-border"
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Card size="sm">
                    <CardContent className="p-4 text-center">
                      <p className="text-muted-foreground text-xs uppercase">
                        Total persons
                      </p>
                      <p className="text-2xl font-semibold tabular-nums">
                        {result.summary.total_persons}
                      </p>
                    </CardContent>
                  </Card>
                  <Card size="sm">
                    <CardContent className="p-4 text-center">
                      <p className="text-muted-foreground text-xs uppercase">
                        Cheating
                      </p>
                      <p
                        className={cn(
                          "text-2xl font-semibold tabular-nums",
                          result.summary.cheating_count > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {result.summary.cheating_count}
                      </p>
                    </CardContent>
                  </Card>
                  <Card size="sm">
                    <CardContent className="p-4 text-center">
                      <p className="text-muted-foreground text-xs uppercase">
                        OK
                      </p>
                      <p className="text-2xl font-semibold text-green-600 tabular-nums dark:text-green-400">
                        {result.summary.ok_count}
                      </p>
                    </CardContent>
                  </Card>
                  <Card size="sm">
                    <CardContent className="p-4">
                      <p className="text-muted-foreground mb-2 text-center text-xs uppercase">
                        Suspicious objects
                      </p>
                      <div className="flex flex-wrap justify-center gap-1">
                        {result.summary.suspicious_objects.length === 0 ? (
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            None
                          </span>
                        ) : (
                          result.summary.suspicious_objects.map((name) => (
                            <Badge
                              key={name}
                              variant="secondary"
                              className="border-orange-500/40 bg-orange-500/15 text-orange-800 dark:text-orange-300"
                            >
                              {name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <p className="text-muted-foreground text-xs">
                  Model: {result.model_used}
                </p>
                <p className="text-muted-foreground text-xs">
                  {result.image_width} × {result.image_height}px
                </p>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="p-3 font-medium">Person</th>
                        <th className="p-3 font-medium">Verdict</th>
                        <th className="p-3 font-medium">Confidence</th>
                        <th className="p-3 font-medium">Direction</th>
                        <th className="p-3 font-medium">Object</th>
                        <th className="p-3 font-medium">Reasons</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.persons.map((p) => (
                        <tr
                          key={p.person_index}
                          className={cn(
                            "border-b border-border/60",
                            p.verdict === "CHEATING"
                              ? "bg-red-50 dark:bg-red-950/35"
                              : ""
                          )}
                        >
                          <td className="p-3 tabular-nums">{p.person_index}</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                p.verdict === "CHEATING"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className={
                                p.verdict === "OK"
                                  ? "bg-green-600 text-white hover:bg-green-600/90 dark:bg-green-700"
                                  : ""
                              }
                            >
                              {p.verdict}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex max-w-[140px] flex-col gap-1">
                              <span className="tabular-nums text-xs">
                                {(p.cheat_prob * 100).toFixed(1)}%
                              </span>
                              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    p.verdict === "CHEATING"
                                      ? "bg-red-500"
                                      : "bg-green-500"
                                  )}
                                  style={{
                                    width: `${Math.min(100, p.cheat_prob * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-xs">{p.direction}</td>
                          <td className="p-3 text-xs">
                            {p.obj_nearby ? p.obj_name || "yes" : "—"}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {p.reasons.length === 0 ? (
                                <span className="text-muted-foreground text-xs">
                                  —
                                </span>
                              ) : (
                                p.reasons.map((r) => (
                                  <Badge
                                    key={r}
                                    variant="outline"
                                    className="text-xs font-normal"
                                  >
                                    {r}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  )
}
