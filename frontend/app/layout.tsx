import { Geist, Geist_Mono, Merriweather } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { Header } from "@/components/Header"

export const metadata: Metadata = {
  title: "ProctorAI — AI Classroom Cheating Detection",
  description: "Real-time exam proctoring powered by YOLOv8 and deep learning",
}

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["300", "400", "700", "900"],
})

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        fontMono.variable,
        merriweather.variable
      )}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
      </head>
      <body className="bg-background text-foreground dark:bg-[#070B14] dark:text-white min-h-screen selection:bg-[#3B9EE8]/30 selection:text-[#3B9EE8] transition-colors duration-300">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex min-h-0 flex-1 flex-col w-full">{children}</div>
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
