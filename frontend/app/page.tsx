"use client"

import Link from "next/link"

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes bbox-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes live-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes bbox-shift-red {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(2px, -1px); }
        }
        @keyframes bbox-shift-green {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(-2px, 1px); }
        }
        .bbox-red {
          animation: bbox-pulse 2s ease-in-out infinite, bbox-shift-red 3s ease-in-out infinite;
        }
        .bbox-green {
          animation: bbox-pulse 2s ease-in-out infinite 0.5s, bbox-shift-green 3s ease-in-out infinite 0.5s;
        }
        .live-dot {
          animation: live-pulse 1s ease-in-out infinite;
        }
        .pill-hover:hover {
          border-color: rgba(255,255,255,0.6) !important;
          background: rgba(255,255,255,0.1) !important;
        }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
        style={{
          background: "rgba(10,15,26,0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 36, height: 36, background: "#3B9EE8" }}
          >
            <i className="ti ti-eye" style={{ fontSize: 20, color: "#fff" }} />
          </div>
          <div>
            <span className="font-bold text-white text-lg leading-none">ProctorAI</span>
            <p className="text-xs leading-none mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              by Helwan National University
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "#3B9EE8" }}
        >
          View Dashboard
        </Link>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        className="flex min-h-screen items-center pt-16"
        style={{ background: "#0A0F1A" }}
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-20 flex flex-col lg:flex-row items-center gap-16">

          {/* Left 55% */}
          <div className="flex-1 lg:w-[55%] flex flex-col gap-6">
            <span
              className="self-start rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "#92400e22", color: "#fbbf24", border: "1px solid #92400e66" }}
            >
              Neural Networks &amp; Deep Learning — HNU 2024
            </span>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-white">
              AI-Powered Exam<br />
              <span style={{ color: "#3B9EE8" }}>Cheating Detection</span>
            </h1>

            <p className="text-lg max-w-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
              Real-time proctoring using computer vision, pose estimation, and deep learning.
              Monitors multiple students simultaneously across webcam and video feeds.
            </p>

            <div className="flex flex-wrap gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-mono font-semibold"
                style={{ background: "#14532d55", color: "#4ade80", border: "1px solid #14532d" }}
              >
                97.80% Accuracy
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-mono font-semibold"
                style={{ background: "#1e3a5f55", color: "#60a5fa", border: "1px solid #1e3a5f" }}
              >
                99.89% ROC-AUC
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-mono font-semibold"
                style={{ background: "#92400e55", color: "#fbbf24", border: "1px solid #92400e" }}
              >
                &lt; 200K Params
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              <Link
                href="/dashboard"
                className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #0a0f1a 0%, #3B9EE8 100%)", border: "1px solid #3B9EE8" }}
              >
                Open Dashboard
              </Link>
              <a
                href="#how-it-works"
                className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)" }}
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Right 45% — animated mockup */}
          <div className="flex-1 lg:w-[45%] flex justify-center">
            <div
              className="w-full max-w-sm rounded-xl overflow-hidden"
              style={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.12)",
                transform: "rotate(-2deg)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              }}
            >
              {/* Title bar */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ background: "#1f2937", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
                  <span className="ml-2 text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Live Session
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="live-dot w-2 h-2 rounded-full"
                    style={{ background: "#22c55e" }}
                  />
                  <span className="text-xs font-mono font-bold" style={{ color: "#22c55e" }}>LIVE</span>
                </div>
              </div>

              {/* Fake video area */}
              <div
                className="relative mx-3 my-3 rounded-lg overflow-hidden"
                style={{ background: "#0d1117", aspectRatio: "16/9" }}
              >
                {/* Scan lines overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
                  }}
                />

                {/* Red bounding box — P1 CHEATING */}
                <div
                  className="bbox-red absolute"
                  style={{
                    top: "12%", left: "8%", width: "35%", height: "68%",
                    border: "2px solid #ef4444",
                    borderRadius: 4,
                  }}
                >
                  <span
                    className="absolute top-0 left-0 text-xs font-mono font-bold px-1 py-0.5 leading-none"
                    style={{ background: "#ef4444", color: "#fff", fontSize: 9 }}
                  >
                    P1 | CHEATING
                  </span>
                </div>

                {/* Green bounding box — P2 OK */}
                <div
                  className="bbox-green absolute"
                  style={{
                    top: "15%", left: "55%", width: "35%", height: "60%",
                    border: "2px solid #22c55e",
                    borderRadius: 4,
                  }}
                >
                  <span
                    className="absolute top-0 left-0 text-xs font-mono font-bold px-1 py-0.5 leading-none"
                    style={{ background: "#22c55e", color: "#fff", fontSize: 9 }}
                  >
                    P2 | OK
                  </span>
                </div>

                {/* Corner brackets decoration */}
                <div className="absolute top-2 left-2 w-4 h-4" style={{ borderTop: "2px solid rgba(59,158,232,0.5)", borderLeft: "2px solid rgba(59,158,232,0.5)" }} />
                <div className="absolute top-2 right-2 w-4 h-4" style={{ borderTop: "2px solid rgba(59,158,232,0.5)", borderRight: "2px solid rgba(59,158,232,0.5)" }} />
                <div className="absolute bottom-2 left-2 w-4 h-4" style={{ borderBottom: "2px solid rgba(59,158,232,0.5)", borderLeft: "2px solid rgba(59,158,232,0.5)" }} />
                <div className="absolute bottom-2 right-2 w-4 h-4" style={{ borderBottom: "2px solid rgba(59,158,232,0.5)", borderRight: "2px solid rgba(59,158,232,0.5)" }} />
              </div>

              {/* Bottom stats bar */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ background: "#1f2937", borderTop: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                  FPS: <span className="text-white">28.4</span>
                </span>
                <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Persons: <span className="text-white">2</span>
                </span>
                <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Alerts: <span style={{ color: "#f87171" }}>1</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6" style={{ background: "#f9fafb" }}>
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-3 text-lg text-gray-500">Five-stage pipeline from camera to verdict</p>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-0">
            {[
              {
                n: "01", icon: "ti-video", title: "Video Input",
                desc: "Connects to webcam or uploaded video file. Supports multiple simultaneous exam sessions.",
              },
              {
                n: "02", icon: "ti-box-model", title: "YOLO Detection",
                desc: "YOLOv8n tracks every person and detects suspicious objects: phones, laptops, books, and notebooks.",
              },
              {
                n: "03", icon: "ti-body-scan", title: "Pose Analysis",
                desc: "YOLOv8n-pose maps 17 body keypoints per person. Head turn, gaze direction, and posture are computed from nose, ear, and shoulder positions.",
              },
              {
                n: "04", icon: "ti-brain", title: "CNN Classification",
                desc: "Custom CNN (97.80% accuracy, ~200K parameters) classifies each person ROI as cheating or not every 3 frames for real-time performance.",
              },
              {
                n: "05", icon: "ti-alert-triangle", title: "Verdict & Alert",
                desc: "Decision engine combines classifier score, head direction, and object proximity. Events logged to PostgreSQL in real time.",
              },
            ].map((step, i, arr) => (
              <div key={step.n} className="flex lg:flex-col items-start lg:items-center flex-1 gap-4 lg:gap-0">
                <div
                  className="relative flex flex-col items-center bg-white rounded-xl p-6 border border-gray-200 w-full lg:mx-2 shadow-sm hover:shadow-md transition-shadow"
                  style={{ minHeight: 180 }}
                >
                  <span
                    className="absolute top-3 right-4 font-mono text-4xl font-bold"
                    style={{ color: "rgba(0,0,0,0.05)", userSelect: "none" }}
                  >
                    {step.n}
                  </span>
                  <div
                    className="flex items-center justify-center rounded-lg mb-4"
                    style={{ width: 48, height: 48, background: "#eff6ff" }}
                  >
                    <i className={`ti ${step.icon}`} style={{ fontSize: 24, color: "#3B9EE8" }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-center">{step.title}</h3>
                  <p className="text-sm text-gray-500 text-center leading-relaxed">{step.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center" style={{ width: 0, marginTop: 72, zIndex: 10, position: "relative" }}>
                    <span style={{ position: "absolute", color: "#9ca3af", fontSize: 20, fontWeight: "bold", left: -8 }}>→</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODEL COMPARISON ───────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#111827" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-4">
            <h2 className="text-4xl font-bold text-white">5 Models. One Winner.</h2>
            <p className="mt-3 text-lg" style={{ color: "rgba(255,255,255,0.5)" }}>
              Each team member trained a model independently. All evaluated on the same 182-image held-out test set.
            </p>
          </div>

          <div className="overflow-x-auto mt-10 rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  {["Model", "Accuracy", "Precision", "Recall", "F1-Score", "ROC-AUC", "Params"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Winner row */}
                <tr style={{ background: "rgba(251,191,36,0.07)", borderLeft: "3px solid #f59e0b", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <td className="px-4 py-3 font-semibold text-white">
                    Custom CNN{" "}
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-xs font-mono"
                      style={{ background: "#92400e", color: "#fbbf24" }}
                    >
                      ⭐ Winner
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: "#4ade80" }}>97.80%</td>
                  <td className="px-4 py-3 font-mono text-white">97.87%</td>
                  <td className="px-4 py-3 font-mono text-white">97.83%</td>
                  <td className="px-4 py-3 font-mono text-white">97.80%</td>
                  <td className="px-4 py-3 font-mono text-white">99.89%</td>
                  <td className="px-4 py-3 font-mono" style={{ color: "#fbbf24" }}>~200K</td>
                </tr>
                {[
                  { name: "EfficientNet-B0", acc: "97.80%", pre: "97.87%", rec: "97.83%", f1: "97.80%", roc: "99.89%", par: "~5.3M" },
                  { name: "ViT-B/16",        acc: "97.80%", pre: "97.87%", rec: "97.83%", f1: "97.80%", roc: "99.96%", par: "~86M" },
                  { name: "MobileNetV2",     acc: "97.80%", pre: "97.81%", rec: "97.81%", f1: "97.80%", roc: "99.43%", par: "~3.4M" },
                  { name: "ResNet18",        acc: "96.15%", pre: "96.15%", rec: "96.16%", f1: "96.15%", roc: "99.69%", par: "~11M" },
                ].map((row, i) => (
                  <tr
                    key={row.name}
                    style={{
                      background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{row.acc}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{row.pre}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{row.rec}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{row.f1}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{row.roc}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>{row.par}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Winner callout */}
          <div
            className="mt-10 mx-auto max-w-2xl rounded-xl p-6"
            style={{ border: "1px solid #f59e0b", background: "rgba(251,191,36,0.05)" }}
          >
            <h3 className="text-lg font-bold text-white mb-4">Why Custom CNN?</h3>
            <ul className="space-y-2">
              {[
                "Same 97.80% accuracy as models up to 430× larger in parameter count",
                "Lightest model (~200K params) means real-time inference with minimal GPU load",
                "ROC-AUC of 99.89% — exceptional separation between cheating and non-cheating",
              ].map(b => (
                <li key={b} className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                  <span style={{ color: "#fbbf24", marginTop: 2 }}>✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">What It Detects</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "ti-device-mobile", color: "#ef4444", bg: "#fef2f2",
                title: "Suspicious Objects",
                desc: "Detects phones, laptops, books, and notebooks in proximity to exam candidates using YOLOv8n object classification.",
              },
              {
                icon: "ti-eye", color: "#3B9EE8", bg: "#eff6ff",
                title: "Gaze & Head Direction",
                desc: "Tracks nose and ear keypoints to determine if a student is looking left, right, or down — sustained for more than 4 consecutive frames.",
              },
              {
                icon: "ti-brain", color: "#a855f7", bg: "#faf5ff",
                title: "Behavioral Classification",
                desc: "Custom CNN analyzes the full person bounding box crop every 3 frames. Outputs a cheating probability score from 0 to 100%.",
              },
              {
                icon: "ti-users", color: "#14b8a6", bg: "#f0fdfa",
                title: "Multi-Person Tracking",
                desc: "YOLO tracking assigns persistent IDs across frames. Each person's state is tracked independently with their own direction timer and classifier score.",
              },
              {
                icon: "ti-activity", color: "#f59e0b", bg: "#fffbeb",
                title: "Real-Time Streaming",
                desc: "Annotated frames stream over WebSocket to the dashboard at up to 30fps. Cheating events are persisted to PostgreSQL instantly.",
              },
              {
                icon: "ti-chart-bar", color: "#22c55e", bg: "#f0fdf4",
                title: "Session Analytics",
                desc: "Full post-session analysis: confidence distribution, per-person timelines, peak cheating minutes, direction heatmaps, and risk scores.",
              },
            ].map(card => (
              <div
                key={card.title}
                className="rounded-xl p-6 border border-gray-100 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{ borderRadius: 12 }}
              >
                <div
                  className="flex items-center justify-center rounded-lg mb-4"
                  style={{ width: 48, height: 48, background: card.bg }}
                >
                  <i className={`ti ${card.icon}`} style={{ fontSize: 24, color: card.color }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ─────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#0A0F1A" }}>
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white">Built With</h2>
          </div>

          <div className="flex flex-col gap-4 items-center">
            {[
              ["PyTorch", "YOLOv8", "Custom CNN", "EfficientNet", "ViT", "MobileNet", "ResNet"],
              ["FastAPI", "PostgreSQL", "WebSocket", "Next.js", "Tailwind CSS", "Docker", "Google Colab"],
            ].map((row, i) => (
              <div key={i} className="flex flex-wrap justify-center gap-3">
                {row.map(pill => (
                  <span
                    key={pill}
                    className="pill-hover rounded-full px-4 py-1.5 text-sm font-mono text-white cursor-default transition-all duration-150"
                    style={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    {pill}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ───────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#f9fafb" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-4">
            <h2 className="text-4xl font-bold text-gray-900">The Team</h2>
            <p className="mt-3 text-gray-500">Helwan National University — Neural Networks &amp; Deep Learning, 2024</p>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {/* ──────────────────────────────────────────────────────────────
                TEAM MEMBERS — fill in real names here.
                File: app/page.tsx
                Replace "Member 1" through "Member 5" with actual names.
                ────────────────────────────────────────────────────────────── */}
            {[
              { initials: "M1", name: "Member 1", model: "Custom CNN",      accuracy: "97.80%", gradient: "linear-gradient(135deg,#3b82f6,#a855f7)" },
              { initials: "M2", name: "Member 2", model: "EfficientNet-B0", accuracy: "97.80%", gradient: "linear-gradient(135deg,#14b8a6,#3b82f6)" },
              { initials: "M3", name: "Member 3", model: "ViT-B/16",        accuracy: "97.80%", gradient: "linear-gradient(135deg,#f59e0b,#f97316)" },
              { initials: "M4", name: "Member 4", model: "MobileNetV2",     accuracy: "97.80%", gradient: "linear-gradient(135deg,#22c55e,#14b8a6)" },
              { initials: "M5", name: "Member 5", model: "ResNet18",        accuracy: "96.15%", gradient: "linear-gradient(135deg,#a855f7,#ec4899)" },
            ].map(member => (
              <div
                key={member.name}
                className="flex flex-col items-center bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                style={{ width: 180 }}
              >
                <div
                  className="flex items-center justify-center rounded-full mb-4 text-white font-bold text-xl"
                  style={{ width: 72, height: 72, background: member.gradient }}
                >
                  {member.initials}
                </div>
                <p className="font-semibold text-gray-900 text-center">{member.name}</p>
                <span
                  className="mt-2 rounded-full px-2 py-0.5 text-xs font-mono"
                  style={{ background: "#eff6ff", color: "#3b82f6" }}
                >
                  {member.model}
                </span>
                <p className="mt-2 text-xs text-gray-400 font-mono">Accuracy: {member.accuracy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="px-6 py-16" style={{ background: "#0A0F1A" }}>
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between gap-8">
          <div>
            <p className="text-xl font-bold text-white">ProctorAI</p>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              AI Classroom Cheating Detection System
            </p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Helwan National University, 2024</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Neural Networks &amp; Deep Learning Course Project</p>
          </div>
          <div className="flex items-start md:items-center">
            <Link
              href="/dashboard"
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "#3B9EE8" }}
            >
              Open Dashboard
            </Link>
          </div>
        </div>
        <div
          className="mt-12 mx-auto max-w-6xl pt-6 text-center text-xs"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}
        >
          Built with PyTorch, FastAPI, and Next.js
        </div>
      </footer>
    </>
  )
}
