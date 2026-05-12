"use client"

import Link from "next/link"
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Scan, 
  Monitor, 
  Cpu, 
  Database, 
  ShieldCheck, 
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
import { FaGithub } from "react-icons/fa";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070B14] text-white selection:bg-[#3B9EE8]/30 selection:text-[#3B9EE8]">
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/4 size-[500px] bg-[#3B9EE8]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 size-[400px] bg-[#60C5F4]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 flex flex-col lg:flex-row items-center gap-20">
          {/* Left Content */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <BrandBadge variant="amber">HNU 2024</BrandBadge>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Neural Networks Project</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Next-Gen AI<br />
              <GradientText>Exam Proctoring</GradientText>
            </h1>

            <p className="text-lg text-white/60 max-w-xl mx-auto lg:mx-0 leading-relaxed">
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
              <a href="#how-it-works">
                <PremiumButton variant="outline" size="lg" className="px-10 h-14 text-base">
                  See Tech Stack
                </PremiumButton>
              </a>
            </div>
          </div>

          {/* Right Mockup */}
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3B9EE8]/20 to-transparent blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
            <GlassCard 
              accent="blue" 
              className="relative p-0 overflow-hidden border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] rotate-[-2deg] group-hover:rotate-0 transition-transform duration-700"
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
      <section id="how-it-works" className="py-32 relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center space-y-4 mb-20">
            <SectionLabel className="mx-auto">Pipeline Architecture</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">How <GradientText>ProctorAI</GradientText> Works</h2>
            <p className="text-white/40 max-w-2xl mx-auto">Five integrated stages of advanced computer vision and neural classification.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
            {/* Arrows for Desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full -translate-y-1/2 pointer-events-none opacity-10">
              <div className="flex justify-around px-20">
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
              <GlassCard key={step.id} className="relative p-8 flex flex-col items-center text-center group hover:bg-[#3B9EE8]/5 transition-colors border-white/5">
                <span className="absolute top-4 right-4 text-4xl font-black text-white/[0.03] select-none group-hover:text-[#3B9EE8]/10 transition-colors">{step.id}</span>
                <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:border-[#3B9EE8]/30 group-hover:bg-[#3B9EE8]/10 transition-all duration-300">
                  <step.icon className="size-8 text-white/60 group-hover:text-[#3B9EE8] transition-colors" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">{step.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODEL COMPARISON ───────────────────────────────── */}
      <section id="models" className="py-32 relative bg-[#0A0F1A]/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-16">
            <div className="space-y-4 max-w-2xl">
              <SectionLabel>Benchmark Analysis</SectionLabel>
              <h2 className="text-4xl font-bold tracking-tight">5 Neural Models.<br /><GradientText>One Optimal Solution.</GradientText></h2>
              <p className="text-white/40">Each team member developed an independent architecture. All were benchmarked on the same 182-image unseen test set.</p>
            </div>
            
            <GlassCard className="p-4 border-amber-500/20 bg-amber-500/5 max-w-xs">
              <div className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                  <Zap className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">Efficiency Record</h4>
                  <p className="text-[10px] text-white/40 mt-1">Our Custom CNN achieves peak accuracy at 430× smaller size than ViT-B/16.</p>
                </div>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-0 overflow-hidden border-white/5" accent="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    {["Model Architecture", "Accuracy", "F1-Score", "ROC-AUC", "Params"].map(h => (
                      <th key={h} className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {/* Winner row */}
                  <tr className="bg-[#F59E0B]/5 border-l-2 border-amber-500 transition-colors hover:bg-[#F59E0B]/10">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">Custom CNN</span>
                        <BrandBadge variant="amber">⭐ WINNER</BrandBadge>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-mono text-sm text-[#10B981] font-bold">97.80%</td>
                    <td className="px-6 py-6 font-mono text-sm text-white/60">97.80%</td>
                    <td className="px-6 py-6 font-mono text-sm text-white/60">99.89%</td>
                    <td className="px-6 py-6 font-mono text-sm text-amber-500 font-bold">~200K</td>
                  </tr>
                  {[
                    { name: "EfficientNet-B0", acc: "97.80%", f1: "97.80%", roc: "99.89%", par: "~5.3M" },
                    { name: "ViT-B/16",        acc: "97.80%", f1: "97.80%", roc: "99.96%", par: "~86M" },
                    { name: "MobileNetV2",     acc: "97.80%", f1: "97.80%", roc: "99.43%", par: "~3.4M" },
                    { name: "ResNet18",        acc: "96.15%", f1: "96.15%", roc: "99.69%", par: "~11M" },
                  ].map((row) => (
                    <tr key={row.name} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 text-sm text-white/60 font-medium">{row.name}</td>
                      <td className="px-6 py-4 font-mono text-sm text-white/40">{row.acc}</td>
                      <td className="px-6 py-4 font-mono text-sm text-white/40">{row.f1}</td>
                      <td className="px-6 py-4 font-mono text-sm text-white/40">{row.roc}</td>
                      <td className="px-6 py-4 font-mono text-sm text-white/40">{row.par}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section id="features" className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center space-y-4 mb-20">
            <SectionLabel className="mx-auto">Core Capabilities</SectionLabel>
            <h2 className="text-4xl font-bold tracking-tight">Enterprise Proctoring Features</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <GlassCard key={card.title} className="p-8 group hover:border-[#3B9EE8]/30 transition-all duration-300 border-white/5">
                <div className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <card.icon className="size-6" style={{ color: card.color }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 tracking-tight">{card.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{card.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ─────────────────────────────────────── */}
      <section className="py-32 bg-[#0A0F1A]">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <SectionLabel className="mx-auto">Technology</SectionLabel>
          <h2 className="text-4xl font-bold tracking-tight mb-16">Built With Modern Standards</h2>
          
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "PyTorch", "YOLOv8", "FastAPI", "Next.js", "PostgreSQL", 
              "WebSockets", "Docker", "Tailwind CSS", "Lucide Icons", 
              "Google Colab", "Custom CNN", "EfficientNet", "MobileNet"
            ].map(tech => (
              <GlassCard key={tech} className="px-6 py-2 rounded-full border-white/5 hover:border-[#3B9EE8]/30 transition-colors">
                <span className="text-sm font-mono font-bold tracking-widest text-white/60">{tech}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ───────────────────────────────────────────── */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center space-y-4 mb-20">
            <SectionLabel className="mx-auto">Research Team</SectionLabel>
            <h2 className="text-4xl font-bold tracking-tight">The Minds Behind <GradientText>ProctorAI</GradientText></h2>
            <p className="text-white/40">Helwan National University — Neural Networks & Deep Learning Class of 2024</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { initials: "AS", name: "Ahmed Salah", role: "MobileNet V2", color: "#3B9EE8" },
              { initials: "RM", name: "Rahma Mohamed", role: "Vision Transformer", color: "#10B981" },
              { initials: "MM", name: "Mahmoud Mater", role: "Custom CNN", color: "#F59E0B" },
              { initials: "MM", name: "Mariam Mohamed", role: "ResNet18", color: "#EF4444" },
              { initials: "RA", name: "Randa Ashraf", role: "EfficientNet-B0", color: "#A855F7" },
            ].map(member => (
              <GlassCard key={member.name} className="p-8 flex flex-col items-center text-center border-white/5 group">
                <div 
                  className="size-20 rounded-full flex items-center justify-center text-2xl font-black text-white mb-6 group-hover:scale-110 transition-transform duration-500 shadow-2xl"
                  style={{ background: `linear-gradient(135deg, ${member.color}88, ${member.color})` }}
                >
                  {member.initials}
                </div>
                <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">{member.name}</h3>
                <span className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-[0.2em]">{member.role}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="py-20 border-t border-white/5 bg-[#070B14]">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B9EE8] to-[#60C5F4]">
                <Scan className="size-5 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tighter text-white">ProctorAI</span>
            </div>
            <p className="text-sm text-white/30 text-center md:text-left max-w-xs">
              Advanced neural surveillance for academic integrity. Built at Helwan National University.
            </p>
          </div>

          <div className="flex items-center gap-8">
            <a href="#" className="text-white/30 hover:text-white transition-colors"><FaGithub className="size-6" /></a>
            <Link href="/dashboard">
              <PremiumButton>
                Access System
                <ChevronRight className="size-4" />
              </PremiumButton>
            </Link>
          </div>
        </div>
        <div className="mt-20 text-center">
          <span className="text-[10px] font-mono text-white/10 uppercase tracking-[0.5em]">© 2024 HNU Neural Networks Team</span>
        </div>
      </footer>
    </div>
  )
}
