"use client"

import { Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft, CheckCircle2, AlertTriangle, Users, Scan, ImageIcon, Upload, RefreshCw, Info, Zap, Award, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { ModelSelector } from "@/components/Modelselector"
import { BrandBadge, GlassCard, PageHeader, PremiumButton, SectionLabel, GradientText } from "@/components/brand-ui"
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
      toast.success("Analysis completed successfully!")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed")
    } finally {
      setLoading(false)
    }
  }

  const resetAnalysis = () => {
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setModelFile(null)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#070B14] via-[#0A0F1A] to-[#070B14]">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#3B9EE8]/10 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#3B9EE8]/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#3B9EE8]/[0.02] blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,158,232,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,158,232,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors group">
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B9EE8] to-[#2B7FC8] shadow-lg shadow-[#3B9EE8]/30">
                  <Scan className="size-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Quick Image Analysis
                  </h1>
                  <p className="text-sm text-white/40 mt-1">
                    Upload a single frame to test AI detection models and inspect visual results
                  </p>
                </div>
              </div>
            </div>
            
            {result && (
              <PremiumButton variant="secondary" size="sm" onClick={resetAnalysis} className="bg-white/5 border-white/10">
                <RefreshCw className="size-4" />
                New Analysis
              </PremiumButton>
            )}
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Zap className="size-3.5 text-[#3B9EE8]" />
              <span className="text-xs text-white/60">Real-time Detection</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Award className="size-3.5 text-[#3B9EE8]" />
              <span className="text-xs text-white/60">Multiple Models</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <BarChart3 className="size-3.5 text-[#3B9EE8]" />
              <span className="text-xs text-white/60">Detailed Metrics</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Left Column - Input Section */}
          <section className="flex w-full min-w-0 flex-1 flex-col gap-6 lg:w-2/5">
            <GlassCard className="p-6 border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
              <SectionLabel className="mb-4 flex items-center justify-between">
                <span>Input Source</span>
                {file && (
                  <button onClick={() => pickFile(null)} className="text-xs text-white/40 hover:text-white/60 transition-colors">
                    Clear
                  </button>
                )}
              </SectionLabel>
              
              {/* Upload Area */}
              <div
                className={cn(
                  "relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 transition-all duration-300",
                  drag 
                    ? "border-[#3B9EE8] bg-[#3B9EE8]/10 shadow-lg shadow-[#3B9EE8]/20" 
                    : "border-white/10 hover:border-[#3B9EE8]/40 hover:bg-white/[0.03]"
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
                
                {previewUrl ? (
                  <div className="relative w-full h-full p-6 flex flex-col items-center">
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                      <img
                        src={previewUrl}
                        alt="Selected preview"
                        className="max-h-48 w-auto rounded-lg object-contain shadow-2xl transition-all duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                      <ImageIcon className="size-3.5 text-[#3B9EE8]" />
                      <span className="text-xs font-medium text-white/80 truncate max-w-[200px]">
                        {file?.name}
                      </span>
                      <span className="text-xs text-white/40">
                        ({(file?.size! / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B9EE8]/20 to-[#3B9EE8]/5 border border-[#3B9EE8]/30">
                      <Upload className="size-7 text-[#3B9EE8]" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-base font-semibold text-white">Drop image here</p>
                      <p className="text-sm text-white/40">or click to browse your files</p>
                      <p className="text-xs text-white/30">Supports JPG, PNG, GIF, WebP</p>
                    </div>
                  </>
                )}
              </div>

              {/* Model Configuration */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <SectionLabel className="mb-3">Model Configuration</SectionLabel>
                <ModelSelector
                  value={modelFile}
                  onChange={setModelFile}
                  disabled={loading}
                />
                <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                  <Info className="size-3" />
                  Select a model for analysis or leave empty for default
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <PremiumButton
                  className="w-full bg-gradient-to-r from-[#3B9EE8] to-[#2B7FC8] shadow-lg shadow-[#3B9EE8]/20"
                  onClick={runAnalyze}
                  disabled={!file || loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Processing Image...
                    </>
                  ) : (
                    <>
                      <Scan className="size-4" />
                      Run AI Analysis
                    </>
                  )}
                </PremiumButton>
                
                {!file && !loading && (
                  <p className="text-center text-xs text-white/30">
                    Ready to analyze? Upload an image to get started
                  </p>
                )}
              </div>
            </GlassCard>
          </section>

          {/* Right Column - Results Section */}
          <section className="flex w-full min-w-0 flex-1 flex-col gap-6 lg:w-3/5">
            {!loading && !result ? (
              <GlassCard className="flex min-h-[500px] flex-col items-center justify-center p-8 text-center border-white/10 bg-gradient-to-br from-white/[0.01] to-transparent">
                <div className="size-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <Scan className="size-12 text-white/10" />
                </div>
                <h3 className="text-xl font-bold text-white/40 mb-3">No Analysis Result</h3>
                <p className="text-white/40 text-sm max-w-sm">
                  {file
                    ? "Click the button above to process this image with the selected model."
                    : "Upload an image and select a model to see the AI detection results."}
                </p>
              </GlassCard>
            ) : null}

            {loading ? (
              <GlassCard className="p-8 border-white/10">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="size-32 rounded-full border-4 border-white/10 border-t-[#3B9EE8] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Scan className="size-10 text-[#3B9EE8] animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-lg font-bold text-white">Running Inference</p>
                    <p className="text-xs text-white/40 font-mono">Analyzing scene · Detecting objects · Processing results</p>
                  </div>
                </div>
              </GlassCard>
            ) : null}

            {result && !loading ? (
              <div className="flex flex-col gap-6">
                {/* Annotated Image */}
                <GlassCard className="p-0 overflow-hidden rounded-xl border-white/10">
                  <div className="relative bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element -- base64 JPEG per product spec */}
                    <img
                      src={`data:image/jpeg;base64,${result.annotated_image_b64}`}
                      alt="Annotated analysis"
                      className="w-full h-auto object-contain"
                    />
                    <div className="absolute top-4 left-4">
                      <BrandBadge variant="muted" className="bg-black/60 backdrop-blur-sm">
                        {result.model_used}
                      </BrandBadge>
                    </div>
                  </div>
                  <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <div className="size-1.5 rounded-full bg-[#3B9EE8]" />
                        <span className="text-[10px] font-mono text-white/40">{result.image_width} × {result.image_height}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-white/30 tracking-widest">
                      ANNOTATED RESULT
                    </span>
                  </div>
                </GlassCard>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <GlassCard className="p-5 text-center hover:scale-105 transition-transform duration-200 border-white/10">
                    <div className="flex flex-col items-center">
                      <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                        <Users className="size-5 text-[#3B9EE8]" />
                      </div>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Total Persons</p>
                      <p className="text-3xl font-bold text-white tabular-nums">{result.summary.total_persons}</p>
                    </div>
                  </GlassCard>

                  <GlassCard className={cn("p-5 text-center hover:scale-105 transition-transform duration-200 border-white/10", result.summary.cheating_count > 0 && "bg-red-500/5")}>
                    <div className="flex flex-col items-center">
                      <div className={cn("size-10 rounded-xl flex items-center justify-center mb-3", result.summary.cheating_count > 0 ? "bg-red-500/10" : "bg-yellow-500/10")}>
                        <AlertTriangle className={cn("size-5", result.summary.cheating_count > 0 ? "text-red-500" : "text-yellow-500")} />
                      </div>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Cheating Detected</p>
                      <p className="text-3xl font-bold text-white tabular-nums">{result.summary.cheating_count}</p>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-5 text-center hover:scale-105 transition-transform duration-200 border-white/10">
                    <div className="flex flex-col items-center">
                      <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
                        <CheckCircle2 className="size-5 text-green-500" />
                      </div>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-1">Compliant</p>
                      <p className="text-3xl font-bold text-white tabular-nums">{result.summary.ok_count}</p>
                    </div>
                  </GlassCard>
                </div>

                {/* Suspicious Objects */}
                {result.summary.suspicious_objects.length > 0 && (
                  <GlassCard className="p-5 border-yellow-500/20 bg-yellow-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="size-4 text-yellow-500" />
                      <h4 className="text-sm font-bold text-white">Suspicious Objects Detected</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.summary.suspicious_objects.map((name) => (
                        <BrandBadge key={name} variant="amber" className="text-xs">
                          {name}
                        </BrandBadge>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Detailed Table */}
                <GlassCard className="p-0 overflow-hidden rounded-xl border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                          <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">ID</th>
                          <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Verdict</th>
                          <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Confidence</th>
                          <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-wider">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.persons.map((p) => (
                          <tr key={p.person_index} className={cn(
                            "border-b border-white/5 hover:bg-white/[0.03] transition-colors",
                            p.verdict === "CHEATING" && "bg-red-500/5"
                          )}>
                            <td className="p-4 font-mono text-sm text-white/60">#{p.person_index + 1}</td>
                            <td className="p-4">
                              <BrandBadge variant={p.verdict === "CHEATING" ? "red" : "green"} className="text-xs">
                                {p.verdict}
                              </BrandBadge>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1.5 min-w-[120px]">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-white/40 font-mono">Probability</span>
                                  <span className={cn(
                                    "text-xs font-bold",
                                    p.cheat_prob > 0.5 ? "text-red-500" : "text-green-500"
                                  )}>
                                    {(p.cheat_prob * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className={cn("h-full rounded-full transition-all duration-1000", p.verdict === "CHEATING" ? "bg-red-500" : "bg-green-500")}
                                    style={{ width: `${Math.min(100, p.cheat_prob * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <span className="text-xs text-white/40 uppercase tracking-wider block">{p.direction}</span>
                                <div className="flex flex-wrap gap-1">
                                  {p.reasons.slice(0, 2).map((r) => (
                                    <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">
                                      {r}
                                    </span>
                                  ))}
                                  {p.reasons.length > 2 && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                                      +{p.reasons.length - 2}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
      `}</style>
    </div>
  )
}