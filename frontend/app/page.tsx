"use client"

import Link from "next/link"
import { 
  ArrowRight, 
  AlertTriangle, 
  Users, 
  Scan, 
  Monitor, 
  Cpu, 
  Database, 
  Zap, 
  Activity,
  ChevronRight,
  BrainCircuit,
  Layout,
} from "lucide-react"
import { 
  GlassCard, 
  PremiumButton, 
  GradientText, 
  BrandBadge, 
  LiveDot, 
  SectionLabel 
} from "@/components/brand-ui"
import { FaGithub } from "react-icons/fa"

const ANCHOR_SCROLL =
  "scroll-mt-[calc(var(--site-header-height)+0.75rem)]"

export default function LandingPage() {
  return (
    // bg-slate-100 text-slate-900
    <main className="relative min-h-screen  transition-colors selection:bg-[#3B9EE8]/30 selection:text-[#3B9EE8] dark:bg-[#070B14] dark:text-white dark:selection:text-[#3B9EE8]">
      {/* Ambient grid + glows (match app shell) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-[#3B9EE8]/10 blur-[100px] dark:opacity-100 opacity-60" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-[#3B9EE8]/5 blur-[100px] dark:opacity-100 opacity-50" />
        <div className="absolute inset-0 bg-[size:40px_40px] bg-[linear-gradient(rgba(59,158,232,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,158,232,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(59,158,232,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,158,232,0.03)_1px,transparent_1px)]" />
      </div>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-10 pb-20 md:pt-12">
        {/* Background Glows */}
        <div className="pointer-events-none absolute top-0 left-1/4 size-[500px] rounded-full bg-[#3B9EE8]/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 size-[400px] rounded-full bg-[#60C5F4]/5 blur-[100px]" />

        <div className="mx-auto max-w-7xl px-6 flex flex-col lg:flex-row items-center gap-20">
          {/* Left Content */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1 dark:border-white/10 dark:bg-white/5">
              <BrandBadge variant="amber">HNU 2024</BrandBadge>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">
                Neural Networks Project
              </span>
            </div>

            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-7xl dark:text-white">
              Next-Gen AI<br />
              <GradientText>Exam Proctoring</GradientText>
            </h1>

            <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-600 dark:text-white/60 lg:mx-0">
              Eliminate academic dishonesty with real-time computer vision. 
              Our system tracks gaze, posture, and suspicious objects across 
              webcams and video feeds with military-grade precision.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <BrandBadge variant="green">97.80% ACCURACY</BrandBadge>
              <BrandBadge variant="blue">99.89% ROC-AUC</BrandBadge>
              <BrandBadge variant="amber">&lt; 200K PARAMS</BrandBadge>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              <Link href="/dashboard">
                <PremiumButton size="lg" className="px-10 h-14 text-base">
                  Open Dashboard
                  <ArrowRight className="size-5" />
                </PremiumButton>
              </Link>
              <a href="#tech-stack">
                <PremiumButton variant="outline" size="lg" className="h-14 px-10 text-base">
                  See Tech Stack
                </PremiumButton>
              </a>
              <Link href="/docs">
                <PremiumButton variant="ghost" size="lg" className="h-14 px-6 text-base">
                  ML Documentation
                  <ChevronRight className="size-5" />
                </PremiumButton>
              </Link>
            </div>
          </div>

          {/* Right Mockup */}
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3B9EE8]/20 to-transparent blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
            <GlassCard 
              accent="blue" 
              className="dark relative overflow-hidden border-slate-600/50 p-0 shadow-[0_40px_100px_rgba(0,0,0,0.4)] transition-transform duration-700 rotate-[-2deg] group-hover:rotate-0 dark:border-white/10 dark:shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
            >
              {/* Surveillance Monitor Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-black/40 border border-white/10">
                    <Monitor className="size-4 text-[#3B9EE8]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Live Stream</span>
                    <span className="text-[8px] font-mono text-white/30 uppercase">Node: HNU-ADMIN-X1</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BrandBadge variant="green" className="bg-black/50 backdrop-blur-md">
                    <LiveDot />
                    LIVE
                  </BrandBadge>
                </div>
              </div>

              {/* Mock Video Area */}
              <div className="relative aspect-video bg-[#070B14] p-4 overflow-hidden">
                {/* Scanlines overlay */}
                <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]" 
                  style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)" }} />
                
                {/* Bounding Boxes */}
                <div className="absolute top-[20%] left-[10%] w-[35%] h-[60%] border-2 border-red-500 rounded-lg animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  <span className="absolute -top-6 left-0 text-[10px] font-mono font-bold text-red-500 uppercase tracking-tighter">P-01 | CHEATING (98%)</span>
                </div>
                <div className="absolute top-[25%] left-[55%] w-[35%] h-[55%] border-2 border-green-500 rounded-lg opacity-60 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <span className="absolute -top-6 left-0 text-[10px] font-mono font-bold text-green-500 uppercase tracking-tighter opacity-80">P-02 | OK (99%)</span>
                </div>

                {/* Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="size-40 border border-[#3B9EE8]/30 rounded-full flex items-center justify-center">
                    <div className="size-20 border border-[#3B9EE8]/50 rounded-full" />
                  </div>
                </div>

                {/* Surveillance Overlays */}
                <div className="absolute left-6 top-6 size-10 border-l-2 border-t-2 border-[#3B9EE8]/40" />
                <div className="absolute right-6 top-6 size-10 border-r-2 border-t-2 border-[#3B9EE8]/40" />
                <div className="absolute left-6 bottom-6 size-10 border-l-2 border-b-2 border-[#3B9EE8]/40" />
                <div className="absolute right-6 bottom-6 size-10 border-r-2 border-b-2 border-[#3B9EE8]/40" />
              </div>

              {/* Stats Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.02]">
                <div className="flex gap-6 font-mono text-[10px] text-white/30 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Activity className="size-3" /> FPS: <span className="text-white">29.8</span></span>
                  <span className="flex items-center gap-1.5"><Users className="size-3" /> PERSONS: <span className="text-white">2</span></span>
                </div>
                <span className="text-[10px] font-mono text-[#EF4444] font-bold animate-pulse">INCIDENT DETECTED</span>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className={`relative py-32 ${ANCHOR_SCROLL}`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 space-y-4 text-center">
            <SectionLabel className="mx-auto">Pipeline Architecture</SectionLabel>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl dark:text-white">
              How <GradientText>ProctorAI</GradientText> Works
            </h2>
            <p className="mx-auto max-w-2xl text-slate-500 dark:text-white/40">
              Five integrated stages of advanced computer vision and neural classification.
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {/* Arrows for Desktop */}
            <div className="pointer-events-none absolute top-1/2 left-0 hidden w-full -translate-y-1/2 opacity-10 lg:block">
              <div className="flex justify-around px-20 text-slate-400 dark:text-white/10">
                <ArrowRight className="size-10" /><ArrowRight className="size-10" /><ArrowRight className="size-10" /><ArrowRight className="size-10" />
              </div>
            </div>

            {[
              {
                id: "01", icon: Monitor, title: "Video Input",
                desc: "Universal source ingestion from webcams or local files.",
              },
              {
                id: "02", icon: Scan, title: "Object Detection",
                desc: "YOLOv8n identifies phones, books, and laptops in real-time.",
              },
              {
                id: "03", icon: Users, title: "Pose Analysis",
                desc: "17-point skeletal mapping tracks gaze and head direction.",
              },
              {
                id: "04", icon: Cpu, title: "CNN Scoring",
                desc: "Custom 200K param CNN classifies behavior every 3 frames.",
              },
              {
                id: "05", icon: AlertTriangle, title: "Verdict Engine",
                desc: "Heuristic decision engine logs alerts to the database.",
              },
            ].map((step) => (
              <GlassCard
                key={step.id}
                className="group relative flex flex-col items-center border-slate-200/80 p-8 text-center transition-colors hover:bg-[#3B9EE8]/5 dark:border-white/5"
              >
                <span className="pointer-events-none absolute top-4 right-4 select-none text-4xl font-black text-slate-200 transition-colors group-hover:text-[#3B9EE8]/20 dark:text-white/[0.03] dark:group-hover:text-[#3B9EE8]/10">
                  {step.id}
                </span>
                <div className="mb-6 flex size-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 transition-all duration-300 group-hover:border-[#3B9EE8]/30 group-hover:bg-[#3B9EE8]/10 dark:border-white/10 dark:bg-white/5">
                  <step.icon className="size-8 text-slate-500 transition-colors group-hover:text-[#3B9EE8] dark:text-white/60" />
                </div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-white">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-white/40">{step.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODEL COMPARISON ───────────────────────────────── */}
      <section id="models" className={`relative bg-slate-200/40 py-32 dark:bg-[#0A0F1A]/50 ${ANCHOR_SCROLL}`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 flex flex-col items-end justify-between gap-8 lg:flex-row">
            <div className="max-w-2xl space-y-4">
              <SectionLabel>Benchmark Analysis</SectionLabel>
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                5 Neural Models.<br /><GradientText>One Optimal Solution.</GradientText>
              </h2>
              <p className="text-slate-500 dark:text-white/40">
                Each team member developed an independent architecture. All were benchmarked on the same 182-image unseen test set.
              </p>
            </div>
            
            <GlassCard className="max-w-xs border-amber-500/25 bg-amber-500/10 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
              <div className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-500">
                  <Zap className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">Efficiency Record</h4>
                  <p className="mt-1 text-[10px] text-slate-600 dark:text-white/40">
                    Our Custom CNN achieves peak accuracy at 430× smaller size than ViT-B/16.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="overflow-hidden border-slate-200/80 p-0 dark:border-white/5" accent="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 dark:border-white/5 dark:bg-white/5">
                    {["Model Architecture", "Accuracy", "F1-Score", "ROC-AUC", "Params"].map(h => (
                      <th key={h} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.02]">
                  {/* Winner row */}
                  <tr className="border-l-2 border-amber-500 bg-amber-500/5 transition-colors hover:bg-amber-500/10 dark:bg-[#F59E0B]/5 dark:hover:bg-[#F59E0B]/10">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Custom CNN</span>
                        <BrandBadge variant="amber">⭐ WINNER</BrandBadge>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-mono text-sm font-bold text-[#059669] dark:text-[#10B981]">97.80%</td>
                    <td className="px-6 py-6 font-mono text-sm text-slate-600 dark:text-white/60">97.80%</td>
                    <td className="px-6 py-6 font-mono text-sm text-slate-600 dark:text-white/60">99.89%</td>
                    <td className="px-6 py-6 font-mono text-sm font-bold text-amber-600 dark:text-amber-500">~200K</td>
                  </tr>
                  {[
                    { name: "EfficientNet-B0", acc: "97.80%", f1: "97.80%", roc: "99.89%", par: "~5.3M" },
                    { name: "ViT-B/16",        acc: "97.80%", f1: "97.80%", roc: "99.96%", par: "~86M" },
                    { name: "MobileNetV2",     acc: "97.80%", f1: "97.80%", roc: "99.43%", par: "~3.4M" },
                    { name: "ResNet18",        acc: "96.15%", f1: "96.15%", roc: "99.69%", par: "~11M" },
                  ].map((row) => (
                    <tr key={row.name} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                      <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-white/60">{row.name}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-500 dark:text-white/40">{row.acc}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-500 dark:text-white/40">{row.f1}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-500 dark:text-white/40">{row.roc}</td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-500 dark:text-white/40">{row.par}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section id="features" className={`py-32 ${ANCHOR_SCROLL}`}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 space-y-4 text-center">
            <SectionLabel className="mx-auto">Core Capabilities</SectionLabel>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Enterprise Proctoring Features</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Monitor, color: "#3B9EE8",
                title: "Live Monitoring",
                desc: "Annotation frames stream via WebSocket to the dashboard at up to 30fps.",
              },
              {
                icon: AlertTriangle, color: "#EF4444",
                title: "Object Guard",
                desc: "Instant detection of phones, laptops, and books in candidate proximity.",
              },
              {
                icon: Users, color: "#10B981",
                title: "ID Persistence",
                desc: "YOLO tracking maintains unique IDs across frames for individual score histories.",
              },
              {
                icon: BrainCircuit, color: "#A855F7",
                title: "Neural Scoring",
                desc: "Custom CNN analyzes person ROIs every 3 frames for probabilistic cheat scoring.",
              },
              {
                icon: Layout, color: "#F59E0B",
                title: "Audit Dashboard",
                desc: "Full session replay with incident markers and per-candidate timelines.",
              },
              {
                icon: Database, color: "#60C5F4",
                title: "Secure Persistence",
                desc: "All session metrics and logs are persisted to a secure PostgreSQL cluster.",
              },
            ].map(card => (
              <GlassCard key={card.title} className="group border-slate-200/80 p-8 transition-all duration-300 hover:border-[#3B9EE8]/30 dark:border-white/5">
                <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 transition-transform duration-300 group-hover:scale-110 dark:border-white/10 dark:bg-white/5">
                  <card.icon className="size-6" style={{ color: card.color }} />
                </div>
                <h3 className="mb-3 text-lg font-bold tracking-tight text-slate-900 dark:text-white">{card.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-white/40">{card.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ─────────────────────────────────────── */}
      <section id="tech-stack" className={`bg-slate-200/50 py-32 dark:bg-[#0A0F1A] ${ANCHOR_SCROLL}`}>
        <div className="mx-auto max-w-5xl px-6 text-center">
          <SectionLabel className="mx-auto">Technology</SectionLabel>
          <h2 className="mb-16 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Built With Modern Standards</h2>
          
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "PyTorch", "YOLOv8", "FastAPI", "Next.js", "PostgreSQL", 
              "WebSockets", "Docker", "Tailwind CSS", "Lucide Icons", 
              "Google Colab", "Custom CNN", "EfficientNet", "MobileNet"
            ].map(tech => (
              <GlassCard key={tech} className="rounded-full border-slate-200/80 px-6 py-2 transition-colors hover:border-[#3B9EE8]/30 dark:border-white/5">
                <span className="text-sm font-mono font-bold tracking-widest text-slate-600 dark:text-white/60">{tech}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ───────────────────────────────────────────── */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 space-y-4 text-center">
            <SectionLabel className="mx-auto">Research Team</SectionLabel>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              The Minds Behind <GradientText>ProctorAI</GradientText>
            </h2>
            <p className="text-slate-500 dark:text-white/40">
              Helwan National University — Neural Networks & Deep Learning (2024–2026)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {[
              { initials: "AS", name: "Ahmed Salah", role: "MobileNet V2", color: "#3B9EE8" },
              { initials: "RM", name: "Rahma Mohamed", role: "Vision Transformer", color: "#10B981" },
              { initials: "MM", name: "Mahmoud Mater", role: "Custom CNN", color: "#F59E0B" },
              { initials: "MM", name: "Mariam Mohamed", role: "ResNet18", color: "#EF4444" },
              { initials: "RA", name: "Randa Ashraf", role: "EfficientNet-B0", color: "#A855F7" },
            ].map(member => (
              <GlassCard key={member.name} className="group flex flex-col items-center border-slate-200/80 p-8 text-center dark:border-white/5">
                <div 
                  className="mb-6 flex size-20 items-center justify-center rounded-full text-2xl font-black text-white shadow-2xl transition-transform duration-500 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${member.color}88, ${member.color})` }}
                >
                  {member.initials}
                </div>
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{member.name}</h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-white/30">{member.role}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-slate-100 py-20 dark:border-white/5 dark:bg-[#070B14]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-6 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B9EE8] to-[#60C5F4]">
                <Scan className="size-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white">ProctorAI</span>
            </div>
            <p className="max-w-xs text-center text-sm text-slate-500 md:text-left dark:text-white/30">
              Advanced neural surveillance for academic integrity. Built at Helwan National University.
            </p>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium md:justify-start">
              <Link href="/dashboard" className="text-slate-600 transition-colors hover:text-[#3B9EE8] dark:text-white/50 dark:hover:text-white">
                Dashboard
              </Link>
              <Link href="/analyze" className="text-slate-600 transition-colors hover:text-[#3B9EE8] dark:text-white/50 dark:hover:text-white">
                Analyze
              </Link>
              <Link href="/docs" className="text-slate-600 transition-colors hover:text-[#3B9EE8] dark:text-white/50 dark:hover:text-white">
                ML Docs
              </Link>
              <a href="#how-it-works" className="text-slate-600 transition-colors hover:text-[#3B9EE8] dark:text-white/50 dark:hover:text-white">
                Pipeline
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-8">
            <a
              href="https://github.com/MahmoudMater/AI_Classroom_Cheating_Detection_System"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 transition-colors hover:text-slate-900 dark:text-white/30 dark:hover:text-white"
              aria-label="GitHub"
            >
              <FaGithub className="size-6" />
            </a>
            <Link href="/dashboard">
              <PremiumButton>
                Access System
                <ChevronRight className="size-4" />
              </PremiumButton>
            </Link>
          </div>
        </div>
        <div className="mt-20 text-center">
          <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-slate-400 dark:text-white/10">
            © 2026 HNU Neural Networks Team
          </span>
        </div>
      </footer>
    </main>
  )
}
