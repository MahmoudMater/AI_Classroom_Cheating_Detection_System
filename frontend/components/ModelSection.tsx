import { SubTitle, InfoTable, MetricBar, Tag } from "@/components/DocComponents"
import { CodeBlock } from "@/components/CodeBlock"

interface ModelCard {
  name: string;
  emoji: string;
  badge?: string;
  accuracy: number;
  f1: number;
  rocAuc: number;
  params: string;
  norm: string;
  file: string;
  strategy: string;
  architecture: string[];
  pros: string[];
  cons: string[];
  color: string;
  phase2: string;
  archCode?: string;
}

export function ModelSection({ model }: { model: ModelCard }) {
  return (
    <div 
      className="bg-[#0f172a] rounded-2xl p-6 md:p-8 mb-8 border transition-colors hover:bg-[#111a2e]"
      style={{ borderColor: `${model.color}33` }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start gap-6 mb-8 pb-8 border-b border-white/5">
        <span className="text-4xl md:text-5xl drop-shadow-xl">{model.emoji}</span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className="text-xl md:text-2xl font-bold text-slate-100 font-syne">{model.name}</h3>
            {model.badge && (
              <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] md:text-xs font-bold tracking-widest uppercase">
                {model.badge}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-500 font-mono italic">
            {model.strategy}
          </p>
        </div>
      </div>

      {/* Metrics & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white/5 rounded-xl p-6 border border-white/5">
          <MetricBar value={model.accuracy} color={model.color} label="Test Accuracy" />
          <MetricBar value={model.f1} color={model.color} label="F1-Score" />
          <MetricBar value={model.rocAuc} color={model.color} label="ROC-AUC Score" />
        </div>
        <div className="bg-white/5 rounded-xl p-2 border border-white/5">
          <InfoTable rows={[
            ["Parameters", model.params],
            ["Weights Path", model.file],
            ["Normalisation", model.norm],
          ]} />
        </div>
      </div>

      {/* Architecture */}
      <div className="mb-10">
        <SubTitle>Model Architecture Layers</SubTitle>
        <div className="mt-4 bg-black/20 rounded-xl p-5 border border-white/5">
          <ol className="space-y-3">
            {model.architecture.map((line, i) => (
              <li key={i} className="text-xs md:text-sm text-slate-400 font-mono flex items-start gap-3">
                <span className="text-slate-600 font-bold">{(i + 1).toString().padStart(2, '0')}</span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {model.archCode && (
        <div className="mb-10">
          <SubTitle>PyTorch Implementation</SubTitle>
          <CodeBlock code={model.archCode} />
        </div>
      )}

      {/* Phase 2 */}
      {model.phase2 !== "N/A — single-phase training from scratch" && (
        <div className="mb-10">
          <SubTitle>Phase 2 — Advanced Fine-tuning</SubTitle>
          <div className="mt-4 bg-blue-500/5 rounded-xl p-5 border border-blue-500/10">
            <p className="text-xs md:text-sm text-blue-400/80 font-mono italic leading-relaxed">
              {model.phase2}
            </p>
          </div>
        </div>
      )}

      {/* Pros / Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-500/5 rounded-xl p-6 border border-green-500/10">
          <h4 className="text-green-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-green-500" />
            Core Strengths
          </h4>
          <ul className="space-y-3">
            {model.pros.map((p, i) => (
              <li key={i} className="text-xs md:text-sm text-slate-400 flex items-start gap-3">
                <span className="text-green-500/50">•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-red-500/5 rounded-xl p-6 border border-red-500/10">
          <h4 className="text-red-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-red-500" />
            Key Limitations
          </h4>
          <ul className="space-y-3">
            {model.cons.map((c, i) => (
              <li key={i} className="text-xs md:text-sm text-slate-400 flex items-start gap-3">
                <span className="text-red-500/50">•</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}