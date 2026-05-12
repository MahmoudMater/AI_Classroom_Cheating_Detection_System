"use client"

import { useState, useEffect } from "react"
import { Menu, X, ChevronRight, Book, Activity, Cpu, Layers, Terminal, Search, Binary, Database } from "lucide-react"
import { cn } from "@/lib/utils"

interface Section {
  id: string;
  label: string;
  icon: any;
}

const SECTIONS: Section[] = [
  { id: "overview", label: "Project Overview", icon: Book },
  { id: "pipeline", label: "Pipeline", icon: Layers },
  { id: "nb01", label: "NB 01 · Frame Extraction", icon: Database },
  { id: "nb02", label: "NB 02 · Preprocessing", icon: Binary },
  { id: "nb03_cnn", label: "NB 03.1 · Custom CNN", icon: Cpu },
  { id: "nb03_resnet", label: "NB 03.2 · ResNet18", icon: Cpu },
  { id: "nb03_eff", label: "NB 03.3 · EfficientNet", icon: Cpu },
  { id: "nb03_vit", label: "NB 03.4 · ViT-B/16", icon: Activity },
  { id: "nb04", label: "NB 04 · Comparison", icon: Search },
  { id: "metrics", label: "Results & Metrics", icon: Activity },
  { id: "training", label: "Training Strategy", icon: Terminal },
  { id: "constants", label: "Project Constants", icon: Terminal },
];

function Tag({ children, color = "#334155" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      display: "inline-block",
      background: color + "22",
      border: `1px solid ${color}55`,
      color: color,
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 9px",
      borderRadius: 20,
      letterSpacing: "0.04em",
      fontFamily: "monospace",
    }}>
      {children}
    </span>
  );
}

export function DocumentationLayout({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-100px 0px -100px 0px" }
    );

    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d1a] text-slate-900 dark:text-[#e2e8f0] flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white/80 dark:bg-[#070d1a]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Book className="size-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">Integrity Docs</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors"
        >
          {isSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 shrink-0 bg-white dark:bg-[#070d1a] border-r border-slate-200 dark:border-white/10 transition-transform duration-300",
        "md:sticky md:inset-auto md:top-0 md:left-0 md:self-start md:h-screen md:max-h-screen md:translate-x-0 md:flex md:flex-col md:z-30",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-full min-h-0 flex flex-col pt-8 pb-4">
          {/* Logo Section */}
          <div className="px-6 mb-8 border-b border-slate-100 dark:border-white/5 pb-8">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2 font-mono">Technical Documentation</div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight font-syne">Integrity Engine <br/><span className="text-blue-600 dark:text-blue-500 text-sm">v1.0.0</span></h1>
            <div className="flex gap-2 mt-4">
              <Tag color="#16a34a">Stable</Tag>
              <Tag color="#2563eb">PyTorch</Tag>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all group",
                    activeSection === s.id 
                      ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500" 
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("size-4 transition-colors", activeSection === s.id ? "text-blue-600 dark:text-blue-500" : "text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400")} />
                  {s.label}
                </button>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-6 pt-4 border-t border-slate-100 dark:border-white/5 mt-auto text-[11px] text-slate-400 dark:text-slate-600 font-mono leading-relaxed">
            System: AI_DETECT_01<br/>
            Env: CUDA_12.1
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 px-6 py-12 md:px-12 md:py-16 overflow-x-hidden">
        <div >
          {children}
        </div>
      </main>
    </div>
  );
}