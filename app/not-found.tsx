import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body flex flex-col selection:bg-primary-action selection:text-white">
      {/* Top Header */}
      <header className="h-16 border-b border-white/[0.08] bg-surface-dim/80 backdrop-blur-xl px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/25 group-hover:scale-105 transition-all">
            <div className="w-9 h-9 rounded-[14px] bg-[#090b10] flex items-center justify-center relative">
              <Zap className="w-5 h-5 text-white fill-amber-300 -rotate-12 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            </div>
          </div>
          <span className="font-headline font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-violet-300 bg-clip-text text-transparent">
            Summ<span className="text-fuchsia-400">AI</span>
          </span>
        </Link>
      </header>

      {/* Main 404 Content */}
      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto"
      >
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-white/[0.1] flex items-center justify-center mb-6 shadow-2xl">
          <Compass className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: "12s" }} />
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-secondary font-bold mb-2">
          Error 404 • Lost in Latent Space
        </span>

        <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight mb-3">
          Timeline Coordinate Not Found
        </h1>

        <p className="text-sm text-on-surface-variant leading-relaxed mb-8 max-w-md">
          The video intelligence brief or route you are looking for has been moved,
          archived, or does not exist in the active index.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-action text-white hover:bg-opacity-90 font-headline text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>

          <Link
            href="/video/workspace"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-low border border-white/[0.08] hover:bg-surface-container text-on-surface font-headline text-xs font-semibold transition-all"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300 -rotate-12" />
            <span>Open Demo Workspace</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 border-t border-white/[0.06] flex items-center justify-center text-xs font-mono text-outline">
        SummAI Core v2.4 • Gemini 3.8 Flash Engine
      </footer>
    </div>
  );
}
