import { cn } from "@/lib/utils"

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = "blue" | "green" | "red" | "amber" | "muted"

export function BrandBadge({
  variant = "blue",
  className,
  children,
}: {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}) {
  const styles: Record<BadgeVariant, string> = {
    blue:  "bg-blue-500/10 dark:bg-[rgba(59,158,232,0.12)] text-blue-600 dark:text-[#3B9EE8] border border-blue-500/20 dark:border-[rgba(59,158,232,0.25)]",
    green: "bg-emerald-500/10 dark:bg-[rgba(16,185,129,0.08)] text-emerald-600 dark:text-[#10B981] border border-emerald-500/20 dark:border-[rgba(16,185,129,0.25)]",
    red:   "bg-rose-500/10 dark:bg-[rgba(239,68,68,0.08)]  text-rose-600 dark:text-[#EF4444] border border-rose-500/20 dark:border-[rgba(239,68,68,0.25)]",
    amber: "bg-amber-500/10 dark:bg-[rgba(245,158,11,0.10)] text-amber-600 dark:text-[#F59E0B] border border-amber-500/20 dark:border-[rgba(245,158,11,0.25)]",
    muted: "bg-slate-500/10 dark:bg-[rgba(100,116,139,0.1)] text-slate-600 dark:text-[#64748B] border border-slate-500/20 dark:border-[rgba(100,116,139,0.2)]",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide transition-colors",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// ─── Live dot ─────────────────────────────────────────────────────────────────

export function LiveDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 rounded-full bg-emerald-500 dark:bg-[#10B981] animate-pulse transition-colors",
        className
      )}
    />
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

export function SectionLabel({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <p className={cn("flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-blue-600 dark:text-[#3B9EE8] mb-1 transition-colors", className)}>
      <span className="inline-block h-px w-4 bg-blue-500 dark:bg-[#3B9EE8] transition-colors" />
      {children}
    </p>
  )
}

// ─── Glass Card ───────────────────────────────────────────────────────────────

export function GlassCard({
  children,
  className,
  accent = "blue",
}: {
  children: React.ReactNode
  className?: string
  accent?: "blue" | "green" | "red" | "amber" | "none"
}) {
  const accents = {
    blue: "before:bg-[#3B9EE8]",
    green: "before:bg-[#10B981]",
    red: "before:bg-[#EF4444]",
    amber: "before:bg-[#F59E0B]",
    none: "",
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 bg-white/90 dark:bg-[#0D121F]/80 backdrop-blur-xl transition-all duration-300 shadow-sm dark:shadow-none",
        accent !== "none" && "before:absolute before:inset-x-0 before:top-0 before:h-px before:content-['']",
        accents[accent],
        className
      )}
    >
      {/* Background glow */}
      <div className="absolute -right-20 -top-20 size-40 bg-blue-500/5 dark:bg-[#3B9EE8]/5 blur-[80px] pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// ─── Premium Button ───────────────────────────────────────────────────────────

export function PremiumButton({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}) {
  const variants = {
    primary: "bg-[#3B9EE8] text-white hover:bg-[#3B9EE8]/90 shadow-[0_0_20px_rgba(59,158,232,0.3)]",
    secondary: "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-colors",
    outline: "border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors",
    ghost: "text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors",
  }

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-5 text-sm",
    lg: "h-12 px-8 text-base",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── Gradient Text ────────────────────────────────────────────────────────────

export function GradientText({
  children,
  className,
  from = "#3B9EE8",
  to = "#60C5F4",
}: {
  children: React.ReactNode
  className?: string
  from?: string
  to?: string
}) {
  return (
    <span
      className={cn("bg-clip-text text-transparent", className)}
      style={{
        backgroundImage: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
    >
      {children}
    </span>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string | React.ReactNode
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 transition-all">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl transition-colors">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] transition-colors">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}