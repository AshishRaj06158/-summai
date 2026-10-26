"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Link2,
  Search,
  Zap,
  Copy,
  Check,
  Menu,
  X,
  Clock,
  Compass,
  Flame,
  Play,
  ListTodo,
  HelpCircle,
  MessageSquare,
  Headphones,
  Code2,
  Film,
  ArrowRight,
  TrendingUp,
  Globe,
} from "lucide-react";
import { useUtmPreservation, appendPreservedUtmParams } from "@/lib/utm";
import { ReadingProgress } from "@/components/ReadingProgress";
import { CommandMenu } from "@/components/CommandMenu";
import { BackToTop } from "@/components/BackToTop";
import { FeedbackModal } from "@/components/FeedbackModal";
import { CookieConsent } from "@/components/CookieConsent";
import { FaqSection } from "@/components/FaqSection";
import { ThemeToggle } from "@/components/ThemeToggle";

type OutputLanguage = "auto" | "hinglish" | "hi" | "en" | "es" | "ja";

interface LanguageOption {
  id: OutputLanguage;
  label: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: "auto", label: "🌐 Auto (Same as Video)" },
  { id: "hinglish", label: "🇮🇳 Hinglish" },
  { id: "hi", label: "🇮🇳 Hindi" },
  { id: "en", label: "🇺🇸 English" },
  { id: "es", label: "🇪🇸 Spanish" },
  { id: "ja", label: "🇯🇵 Japanese" },
];

type VibeMode = "quick" | "actions" | "flashcards" | "chat" | "notes" | "copilot";

interface VibeOption {
  id: VibeMode;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const VIBE_OPTIONS: VibeOption[] = [
  {
    id: "quick",
    label: "⚡ Mukhya Baatein",
    desc: "Poore video ka main nichod aur core points sirf 2 minute mein",
    icon: Zap,
    accentColor: "from-amber-400 to-orange-500",
  },
  {
    id: "actions",
    label: "📝 Action Steps",
    desc: "Direct step-by-step checklist aur important commands",
    icon: ListTodo,
    accentColor: "from-emerald-400 to-teal-500",
  },
  {
    id: "flashcards",
    label: "🧠 Flashcards",
    desc: "Quick revision ke liye interactive Q&A cards",
    icon: HelpCircle,
    accentColor: "from-fuchsia-400 to-pink-500",
  },
  {
    id: "chat",
    label: "💬 Video Chat",
    desc: "Video se direct koi bhi sawaal-jawab poocho",
    icon: MessageSquare,
    accentColor: "from-cyan-400 to-blue-500",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  useUtmPreservation();

  const [url, setUrl] = useState("");
  const [selectedVibe, setSelectedVibe] = useState<VibeMode>("quick");
  const [selectedLang, setSelectedLang] = useState<OutputLanguage>("auto");
  const [loading, setLoading] = useState(false);
  const [pasted, setPasted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mobile menu escape listener and background scroll lock
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const isValidVideoUrl = (inputUrl: string): boolean => {
    if (!inputUrl) return false;
    const trimmed = inputUrl.trim();
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i;
    const videoExtRegex = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
    try {
      const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      return (
        ytRegex.test(parsed.href) ||
        videoExtRegex.test(parsed.pathname) ||
        parsed.hostname.includes("youtube.com") ||
        parsed.hostname === "youtu.be"
      );
    } catch {
      return false;
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setError(null);
        setPasted(true);
        setTimeout(() => setPasted(false), 2000);
      }
    } catch {
      // Clipboard permissions fallback
    }
  };

  const handleGenerate = (
    targetUrl?: string,
    targetVibe?: VibeMode,
    targetLang?: OutputLanguage
  ) => {
    const finalUrl = (targetUrl || url).trim();
    const finalVibe = targetVibe || selectedVibe;
    const finalLang = targetLang || selectedLang;

    if (!finalUrl) {
      setError("Paste a YouTube link or tap one of the juicy scenario cards below!");
      return;
    }
    if (!isValidVideoUrl(finalUrl)) {
      setError("Please paste a valid YouTube video link (e.g. https://www.youtube.com/watch?v=...)");
      return;
    }

    setError(null);
    setLoading(true);

    const targetPath = `/video/workspace?source=${encodeURIComponent(finalUrl)}&mode=${finalVibe}&lang=${finalLang}`;
    router.push(appendPreservedUtmParams(targetPath));
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-fuchsia-500 selection:text-white flex flex-col relative overflow-hidden">
      {/* Playful Ambient Neon Blur Orbs */}
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed top-1/4 -right-32 w-[32rem] h-[32rem] bg-violet-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/3 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />

      <ReadingProgress />
      <CommandMenu />
      <BackToTop />
      <FeedbackModal />
      <CookieConsent />

      {/* Top Header */}
      <header className="sticky top-0 z-40 h-16 bg-surface-dim/80 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation drawer"
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 rounded-xl bg-surface-container border border-white/[0.08] text-on-surface"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => router.push("/")}>
            <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/25 group-hover:scale-105 group-hover:shadow-fuchsia-500/40 transition-all">
              <div className="w-9 h-9 rounded-[14px] bg-[#090b10] flex items-center justify-center relative">
                <Zap className="w-5 h-5 text-white fill-amber-300 -rotate-12 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              </div>
            </div>
            <span className="font-headline font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-violet-300 bg-clip-text text-transparent">
              Summ<span className="text-fuchsia-400">AI</span>
            </span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Free for Humans
          </span>
        </div>

        {/* Global Search & Command Menu Trigger */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
            );
          }}
          className="hidden md:flex items-center justify-between bg-surface-container-low/70 border border-white/[0.08] hover:border-fuchsia-500/40 px-3.5 py-1.5 rounded-full w-80 text-left transition-all backdrop-blur-md group"
        >
          <div className="flex items-center gap-2 text-outline text-xs">
            <Search className="w-3.5 h-3.5 text-fuchsia-400 group-hover:rotate-12 transition-transform" />
            <span className="group-hover:text-on-surface transition-colors">Search notes, presets, chapters...</span>
          </div>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-white/[0.06]">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => handleGenerate("https://www.youtube.com/watch?v=zjkBMFhNj_g", "quick")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container border border-white/[0.08] hover:border-violet-500/40 text-xs font-headline font-medium text-on-surface hover:text-white transition-all"
          >
            <Play className="w-3 h-3 text-fuchsia-400 fill-fuchsia-400" />
            <span>Try Live Demo</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
          className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-md pt-16 animate-in slide-in-from-top-4 duration-200"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-surface-container-low border-b border-white/[0.1] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="font-headline font-semibold text-sm">Quick Jump</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close mobile menu"
                className="p-1 rounded text-outline hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm font-medium">
              <button
                onClick={() => {
                  router.push("/");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-surface-container text-on-surface"
              >
                🏠 Home Dashboard
              </button>
              <button
                onClick={() => {
                  router.push(appendPreservedUtmParams("/video/workspace"));
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-surface-container text-fuchsia-300 font-semibold"
              >
                ⚡ Live Workspace
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
                  );
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-surface-container text-primary flex items-center justify-between"
              >
                <span>Command Search</span>
                <span className="font-mono text-xs bg-surface-container-highest px-2 py-0.5 rounded">⌘K</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Hero Container */}
      <main
        id="main-content"
        className="flex-1 px-4 sm:px-6 pt-10 sm:pt-16 pb-20 max-w-5xl mx-auto flex flex-col items-center text-center w-full z-10"
      >
        {/* Playful Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high/80 border border-fuchsia-500/20 backdrop-blur-md text-xs font-mono mb-6 shadow-lg shadow-fuchsia-500/5 group">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500" />
          </span>
          <span className="text-on-surface font-medium">Skip the fluff</span>
          <span className="text-outline">/</span>
          <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-transparent font-semibold">
            3-hour deep dives in 3 minutes
          </span>
        </div>

        {/* Punchy Headline & Copy */}
        <h1 className="font-headline text-3xl sm:text-6xl font-extrabold tracking-tight text-on-surface max-w-3xl leading-[1.12]">
          Stop watching 2-hour videos at{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
            2x speed
          </span>
          .
        </h1>
        <p className="text-on-surface-variant text-sm sm:text-lg max-w-2xl mt-4 leading-relaxed font-body">
          Whether it&apos;s a marathon tech podcast, a multi-hour coding stream, or a complex video essay—get the core insights, clickable timestamps, and cheatsheet notes while your chai is still hot.
        </p>

        {/* ================= HERO INGESTION CARD ================= */}
        <div className="w-full mt-10 bg-surface-container-low/70 backdrop-blur-2xl border border-white/[0.08] hover:border-white/[0.16] rounded-3xl p-5 sm:p-8 shadow-2xl shadow-violet-500/5 text-left transition-all relative group">
          {/* Subtle Ambient Card Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500/20 via-violet-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-40 group-hover:opacity-75 transition duration-500 pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5">
            {/* Vibe Selectors Header */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <span className="text-xs font-headline font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-fuchsia-400" /> Choose Your Vibe
                </span>

                {/* Compact, Stylish Language Dropdown Pill */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] font-mono text-outline flex items-center gap-1">
                    <Globe className="w-3 h-3 text-cyan-400 shrink-0" /> Language:
                  </span>
                  <div className="relative inline-flex items-center">
                    <select
                      value={selectedLang}
                      onChange={(e) => setSelectedLang(e.target.value as OutputLanguage)}
                      aria-label="Output Language"
                      className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-cyan-500/40 rounded-xl px-2.5 py-1 text-xs font-headline font-medium text-on-surface focus:outline-none cursor-pointer transition-colors [&>option]:bg-[#0d1117] [&>option]:text-white shadow-sm"
                    >
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Segmented Tab Bar */}
              <div
                role="tablist"
                aria-label="Video intelligence modes"
                className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md overflow-x-auto scrollbar-none"
              >
                {VIBE_OPTIONS.map((vibe) => {
                  const isSelected = selectedVibe === vibe.id;
                  const Icon = vibe.icon;
                  return (
                    <button
                      key={vibe.id}
                      role="tab"
                      aria-selected={isSelected}
                      type="button"
                      onClick={() => setSelectedVibe(vibe.id)}
                      className={`flex-1 min-w-[130px] sm:min-w-0 px-3 py-2.5 rounded-xl border text-center sm:text-left transition-all flex items-center justify-center sm:justify-between gap-1.5 whitespace-nowrap ${
                        isSelected
                          ? "bg-white/[0.08] border-fuchsia-500/50 shadow-md ring-1 ring-fuchsia-500/30 text-white font-semibold"
                          : "border-transparent hover:bg-white/[0.04] text-on-surface-variant hover:text-white font-medium"
                      }`}
                    >
                      <span className="text-xs font-headline whitespace-nowrap">{vibe.label}</span>
                      <Icon
                        className={`w-3.5 h-3.5 hidden sm:inline-block shrink-0 ${
                          isSelected ? "text-fuchsia-400" : "text-outline"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Selected Tab Description */}
              <p className="text-xs text-gray-400 font-mono mt-2.5 px-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse shrink-0" />
                <span className="leading-relaxed">
                  {VIBE_OPTIONS.find((v) => v.id === selectedVibe)?.desc}
                </span>
              </p>
            </div>

            {/* Input Bar with Gradient Glow */}
            <div className="p-[1px] rounded-2xl sm:rounded-full bg-gradient-to-r from-fuchsia-500/30 via-violet-500/30 to-cyan-400/30 focus-within:from-fuchsia-500 focus-within:via-violet-500 focus-within:to-cyan-400 transition-all shadow-lg">
              <div className="bg-surface-container-low/95 backdrop-blur-xl rounded-2xl sm:rounded-full p-2 pl-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-2.5 w-full flex-1 py-1">
                  <Link2 className="w-4 h-4 text-fuchsia-400 shrink-0" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    placeholder="Paste YouTube video link here..."
                    className="w-full bg-transparent text-xs sm:text-sm text-on-surface outline-none placeholder:text-outline font-body"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  <button
                    type="button"
                    onClick={handlePaste}
                    title="Paste from clipboard"
                    className="h-10 flex items-center gap-1.5 px-3.5 text-xs font-mono bg-surface-container-high hover:bg-surface-container-highest rounded-xl sm:rounded-full text-on-surface-variant hover:text-white transition-all border border-white/[0.06] shrink-0"
                  >
                    {pasted ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Pasted!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Paste</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    disabled={loading}
                    className="h-10 w-full sm:w-auto bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 hover:from-violet-500 hover:via-fuchsia-500 hover:to-pink-400 text-white font-headline font-bold px-6 rounded-xl sm:rounded-full text-xs sm:text-sm shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300 -rotate-12" />
                    <span>{loading ? "Distilling Video..." : "Get Notes ->"}</span>
                    <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
                  </button>
                </div>
              </div>
            </div>

            {/* Error Announcement */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="text-rose-400 text-xs font-mono flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20"
              >
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Quick Demos Pill Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-outline font-mono text-[11px] flex items-center gap-1 font-medium">
                ⚡ Quick Demos:
              </span>
              {[
                {
                  label: "🎙️ Karpathy on LLMs",
                  url: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
                  vibe: "quick" as const,
                },
                {
                  label: "💻 Stripe Keynote",
                  url: "https://www.youtube.com/watch?v=E7321F8gZtQ",
                  vibe: "actions" as const,
                },
                {
                  label: "🧠 State of AI 2024",
                  url: "https://www.youtube.com/watch?v=aG0Kz8u9_qU",
                  vibe: "flashcards" as const,
                },
              ].map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setUrl(sample.url);
                    setSelectedVibe(sample.vibe);
                    if (error) setError(null);
                  }}
                  className="px-3 py-1 rounded-full bg-surface-container border border-white/[0.06] hover:border-fuchsia-500/40 text-on-surface-variant hover:text-white text-[11px] font-mono transition-all hover:scale-105 active:scale-95"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= DAILY LIFE PRESETS (3 Relatable Scenario Cards) ================= */}
        <section className="w-full mt-16 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-fuchsia-400 font-semibold uppercase tracking-wider mb-1">
                <TrendingUp className="w-3.5 h-3.5" /> Built for real daily routines
              </div>
              <h2 className="font-headline text-2xl font-bold text-on-surface">
                What are you trying to learn today?
              </h2>
            </div>
            <span className="text-xs font-mono text-outline">Click any card to launch preset</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Scenario 1: The 3-Hour Podcast Marathon */}
            <div
              onClick={() =>
                handleGenerate(
                  "https://www.youtube.com/watch?v=zjkBMFhNj_g",
                  "quick"
                )
              }
              className="bg-surface-container-low/70 backdrop-blur-xl border border-white/[0.08] hover:border-amber-400/40 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                  <Headphones className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase tracking-wider">
                  Podcasts & Talk Shows
                </span>
                <h3 className="font-headline text-lg font-bold text-on-surface mt-3 group-hover:text-amber-300 transition-colors">
                  The 3-Hour Podcast Haul
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  Skip the 40-minute preamble and sponsor spots. Extract the actual protocols, recommended books, and key arguments in 1 page.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-outline">
                <span className="text-amber-400/90 font-medium">Huberman, Lex, Rogan</span>
                <span className="group-hover:translate-x-1 transition-transform text-white">→</span>
              </div>
            </div>

            {/* Scenario 2: The 4-Hour Coding Masterclass */}
            <div
              onClick={() =>
                handleGenerate(
                  "https://www.youtube.com/watch?v=E7321F8gZtQ",
                  "actions"
                )
              }
              className="bg-surface-container-low/70 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-400/40 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5 group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                  <Code2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase tracking-wider">
                  Dev & Tech Streams
                </span>
                <h3 className="font-headline text-lg font-bold text-on-surface mt-3 group-hover:text-cyan-300 transition-colors">
                  The 4-Hour Code Along
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  Pull all terminal commands, library dependencies, and architecture checkpoints without constantly pausing every 12 seconds.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-outline">
                <span className="text-cyan-400/90 font-medium">Full Stack Architecture</span>
                <span className="group-hover:translate-x-1 transition-transform text-white">→</span>
              </div>
            </div>

            {/* Scenario 3: The Midnight Video Essay */}
            <div
              onClick={() =>
                handleGenerate(
                  "https://www.youtube.com/watch?v=aG0Kz8u9_qU",
                  "flashcards"
                )
              }
              className="bg-surface-container-low/70 backdrop-blur-xl border border-white/[0.08] hover:border-fuchsia-400/40 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-fuchsia-500/5 group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 mb-4 group-hover:scale-110 transition-transform">
                  <Film className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 uppercase tracking-wider">
                  Documentaries & Exams
                </span>
                <h3 className="font-headline text-lg font-bold text-on-surface mt-3 group-hover:text-fuchsia-300 transition-colors">
                  The Midnight Rabbit Hole
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  Turn Veritasium, Vox, or university lectures into chronological story points plus interactive flashcards for effortless memory retention.
                </p>
              </div>

              <div className="pt-5 mt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-outline">
                <span className="text-fuchsia-400/90 font-medium">Interactive Flashcards</span>
                <span className="group-hover:translate-x-1 transition-transform text-white">→</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= RECENT COMMUNITY SUMMARIES ================= */}
        <section className="w-full mt-16 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> Recent Notes
            </h2>
            <span className="text-xs font-mono text-outline">Instant Workspace Previews</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "State of AI 2024: Agentic Workflows",
                tag: "Agentic Loop",
                duration: "42:18",
                words: "1,420 words",
                updated: "12m ago",
                color: "text-fuchsia-400",
              },
              {
                title: "Building Microservices with Docker & Go",
                tag: "Clean Architecture",
                duration: "18:45",
                words: "950 words",
                updated: "1h ago",
                color: "text-cyan-400",
              },
              {
                title: "Next.js 15 & React 19 Compiler Deep Dive",
                tag: "Full Stack",
                duration: "1:12:04",
                words: "1,890 words",
                updated: "3h ago",
                color: "text-emerald-400",
              },
              {
                title: "Why Modern Urban Infrastructure Is Broken",
                tag: "Docuseries",
                duration: "27:30",
                words: "1,100 words",
                updated: "1d ago",
                color: "text-amber-400",
              },
            ].map((card, idx) => (
              <div
                key={idx}
                onClick={() => router.push(appendPreservedUtmParams("/video/workspace"))}
                className="bg-surface-container-low/60 backdrop-blur-xl border border-white/[0.08] hover:border-fuchsia-500/40 rounded-2xl p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between h-44 shadow-lg hover:shadow-fuchsia-500/5 group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-2">
                    <span className={`${card.color} font-semibold`}>{card.tag}</span>
                    <span className="text-outline">{card.duration}</span>
                  </div>
                  <h3 className="font-headline text-xs sm:text-sm font-semibold text-on-surface line-clamp-2 group-hover:text-fuchsia-300 transition-colors">
                    {card.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-outline border-t border-white/[0.06] pt-2">
                  <span>{card.words}</span>
                  <span className="flex items-center gap-1 text-[10px]">
                    <Clock className="w-3 h-3 text-outline" /> {card.updated}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Expandable FAQ Section */}
        <FaqSection />
      </main>

      {/* Production Footer */}
      <footer className="h-16 border-t border-white/[0.06] bg-surface-dim/90 px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-outline font-mono gap-2 z-10">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-fuchsia-400" />
          <span>SummAI • Built for students, developers & curious humans</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/robots.txt" className="hover:text-on-surface">robots.txt</a>
          <a href="/sitemap.xml" className="hover:text-on-surface">sitemap.xml</a>
          <a href="/llms.txt" className="hover:text-on-surface">llms.txt</a>
        </div>
      </footer>
    </div>
  );
}
