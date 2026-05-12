import { cn } from "@/lib/utils"

interface InfoTableProps {
  rows: [string, string][];
}

export function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 font-syne border-b border-slate-200 dark:border-white/10 pb-3 mb-6 mt-12 flex items-center gap-3 scroll-mt-24 transition-colors"
    >
      {children}
    </h2>
  );
}

export function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm md:text-base font-semibold text-slate-600 dark:text-slate-300 mb-3 mt-8 font-syne uppercase tracking-wider transition-colors">
      {children}
    </h3>
  );
}

export function InfoTable({ rows }: InfoTableProps) {
  return (
    <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-sm dark:shadow-none transition-colors">
      <table className="w-full text-left font-mono text-xs md:text-sm min-w-[500px] md:min-w-0">
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {rows.map(([k, v], i) => (
            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
              <td className="py-4 px-4 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest w-1/3 md:w-48 align-top">
                {k}
              </td>
              <td className="py-4 px-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                {v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Tag({ children, color = "#334155" }: { children: React.ReactNode; color?: string }) {
  return (
    <span 
      className="inline-block px-2.5 py-1 rounded-full text-[10px] md:text-xs font-mono font-semibold tracking-wider transition-all"
      style={{
        background: color + "15",
        border: `1px solid ${color}44`,
        color: color,
      }}
    >
      {children}
    </span>
  );
}

export function MetricBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1.5 px-1">
        <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-mono font-bold uppercase tracking-widest">{label}</span>
        <span className="text-[10px] md:text-xs font-mono font-bold" style={{ color }}>
          {value.toFixed(4)}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-100 dark:border-white/5 transition-colors">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${value * 100}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            boxShadow: `0 0 12px ${color}33`
          }}
        />
      </div>
    </div>
  );
}