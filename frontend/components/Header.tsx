"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Scan, LayoutDashboard, Search, Activity, ArrowRight, Shield, Menu, X, ScrollText, Sun, Moon } from "lucide-react"
import { GlassCard, PremiumButton, BrandBadge, LiveDot } from "@/components/brand-ui"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

export function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Analysis", href: "/analyze", icon: Search },
    { name: "Docs", href: "/docs", icon: ScrollText },
    { name: "Docs2", href: "/docs2", icon: ScrollText }
  ]

  if (pathname.includes("docs")) {
    return null
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] px-4 md:px-6 transition-[padding] duration-300 bg-transparent pointer-events-none [&>*]:pointer-events-auto",
          scrolled ? "py-2" : "py-3"
        )}
      >
        <nav className="mx-auto max-w-7xl">
          <div className={cn(
            "flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-[#0A0F1A]/95 to-[#0D1422]/95 dark:from-[#0A0F1A]/95 dark:to-[#0D1422]/95 backdrop-blur-2xl shadow-xl transition-all duration-300",
            scrolled ? "bg-[#0A0F1A]/98 shadow-2xl" : "bg-[#0A0F1A]/80",
            "bg-white/90 dark:bg-[#0A0F1A]/80 border-slate-200 dark:border-white/10"
          )}>
            
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-3 px-4 py-2 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5 group">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B9EE8] to-[#2B7FC8] shadow-lg shadow-[#3B9EE8]/20 group-hover:shadow-[#3B9EE8]/40 transition-all">
                <Shield className="size-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">ProctorAI</div>
                <div className="text-[10px] text-slate-500 dark:text-white/40 font-mono -mt-0.5">Security Node</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center h-14">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={cn(
                      "relative px-5 py-2 mx-0.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 group",
                      isActive 
                        ? "text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10" 
                        : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                    )}
                  >
                    <link.icon className={cn("size-4 transition-transform duration-200 group-hover:scale-110", isActive ? "text-[#3B9EE8]" : "text-slate-400 dark:text-white/40")} />
                    <span>{link.name}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-[#3B9EE8] to-transparent rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3 pr-2">
              {/* Status Indicators - Desktop */}
              <div className="hidden md:flex items-center gap-4 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="size-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                    <div className="absolute inset-0 size-2 rounded-full bg-green-500 animate-ping opacity-75" />
                  </div>
                  <span className="text-xs font-mono text-green-600 dark:text-green-400">Secure</span>
                </div>
                <div className="w-px h-4 bg-slate-200 dark:bg-white/10" />
                <div className="flex items-center gap-2">
                  <Activity className="size-3 text-[#3B9EE8] animate-pulse" />
                  <span className="text-xs font-mono text-[#3B9EE8]">Active</span>
                </div>
              </div>

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </button>
              )}

              {/* CTA Button */}
              <Link href="/dashboard">
                <PremiumButton size="sm" className="h-9 px-4 md:px-5 bg-gradient-to-r from-[#3B9EE8] to-[#2B7FC8] text-white hover:shadow-lg hover:shadow-[#3B9EE8]/30 transition-all text-xs font-semibold border-0">
                  <Activity className="size-3.5 mr-2" />
                  Live Monitor
                </PremiumButton>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* In-flow spacer so page content starts below the fixed header */}
      <div
        className="w-full shrink-0 transition-[height] duration-300"
        style={{ height: "var(--site-header-height)" }}
        aria-hidden
      />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-4 right-4 top-[calc(var(--site-header-height)+0.25rem)] bg-[#0D1422] border border-white/10 rounded-2xl shadow-2xl z-[100] lg:hidden animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      isActive 
                        ? "bg-white/10 text-white" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <link.icon className={cn("size-4", isActive && "text-[#3B9EE8]")} />
                    <span className="font-medium">{link.name}</span>
                    {isActive && <ArrowRight className="size-3 ml-auto opacity-60" />}
                  </Link>
                )
              })}
              
              <div className="pt-4 mt-2 border-t border-white/10">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs text-white/40">Connection Status</span>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-400">Secure Tunnel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}