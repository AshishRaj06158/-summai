"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Search,
  MessageSquare,
  ListTodo,
  FileText,
  HelpCircle,
  Clock,
  ExternalLink,
  Volume2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Send,
  Loader2,
  Bot,
  User,
  Zap,
  Globe,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUtmPreservation } from "@/lib/utm";

// ==================== Interfaces ====================

type TabType = "notes" | "actions" | "transcript" | "flashcards" | "chat";

function resolveTabFromMode(mode: string | null): TabType {
  if (!mode) return "notes";
  const normalized = mode.toLowerCase();
  if (normalized === "quick" || normalized === "notes") return "notes";
  if (normalized === "actions") return "actions";
  if (normalized === "transcript") return "transcript";
  if (normalized === "flashcards") return "flashcards";
  if (normalized === "chat" || normalized === "copilot") return "chat";
  return "notes";
}

interface RawChapter {
  id?: string;
  startSeconds?: number | string;
  timestampStr?: string;
  title?: string;
  duration?: string;
  summary?: string;
}

interface RawActionItem {
  id?: string;
  task?: string;
  timestampStr?: string;
  timestampSeconds?: number;
  priority?: "high" | "medium" | "low";
}

interface RawTranscriptLine {
  id?: string;
  timestampStr?: string;
  startSeconds?: number | string;
  speaker?: string;
  text?: string;
}

interface RawFlashcard {
  id?: string;
  concept?: string;
  question?: string;
  answer?: string;
  timestampStr?: string;
  seconds?: number | string;
}

interface Chapter {
  id: string;
  startSeconds: number;
  timestampStr: string;
  title: string;
  duration: string;
  summary: string;
}

interface ActionItem {
  id: string;
  task: string;
  timestampStr: string;
  timestampSeconds?: number;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

interface TranscriptLine {
  id: string;
  timestampStr: string;
  seconds: number;
  speaker: string;
  text: string;
}

interface Flashcard {
  id: string;
  concept: string;
  question: string;
  answer: string;
  timestampStr: string;
  seconds: number;
}

// Helper to extract YouTube video ID
function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

// Format seconds into MM:SS
function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// Component to render text with interactive [MM:SS] timestamp pills
function GroundedCitations({
  text,
  onSeek,
}: {
  text: string;
  onSeek: (sec: number) => void;
}) {
  const parts = text.split(/(\[\d{1,2}:\d{2}\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d{1,2}):(\d{2})\]$/);
        if (match) {
          const m = parseInt(match[1], 10);
          const s = parseInt(match[2], 10);
          const seconds = m * 60 + s;
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSeek(seconds);
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-1 font-mono text-[11px] font-bold text-fuchsia-300 bg-fuchsia-500/15 border border-fuchsia-500/30 rounded-md hover:bg-fuchsia-500/25 hover:border-fuchsia-400 transition-colors align-baseline"
              title={`Jump video to ${part}`}
            >
              <Clock className="w-2.5 h-2.5 inline" />
              <span>{part}</span>
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ==================== Main Workspace Content ====================

function WorkspaceContent() {
  useUtmPreservation();
  const searchParams = useSearchParams();
  const sourceUrl =
    searchParams.get("source") || "https://www.youtube.com/watch?v=zjkBMFhNj_g";
  const modeParam = searchParams.get("mode");
  const langParam = searchParams.get("lang") || "auto";

  const [currentLang, setCurrentLang] = useState<string>(langParam);
  const [prevLangParam, setPrevLangParam] = useState(langParam);

  if (langParam !== prevLangParam) {
    setPrevLangParam(langParam);
    setCurrentLang(langParam);
  }

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [videoTitle, setVideoTitle] = useState("State of AI 2024: Agentic Workflows & Reasoning");

  const ytId = useMemo(() => extractYouTubeId(sourceUrl), [sourceUrl]);

  // Client hydration mount guard
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Active tab state with URL mode synchronization
  const [prevModeParam, setPrevModeParam] = useState(modeParam);
  const [userSelectedTab, setUserSelectedTab] = useState<TabType | null>(null);

  if (modeParam !== prevModeParam) {
    setPrevModeParam(modeParam);
    setUserSelectedTab(null);
  }

  const activeTab: TabType = userSelectedTab ?? resolveTabFromMode(modeParam);
  const setActiveTab = (tab: TabType) => {
    setUserSelectedTab(tab);
  };
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chatLogs, setChatLogs] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([
    {
      role: "assistant",
      text: "Hey! I am your video copilot. Ask me any question grounded in the video, or click [08:42] to jump to the agentic loop thesis.",
    },
  ]);

  // Flashcard state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Record<string, boolean>>({});

  // Dynamic Synthesis & Keynote Thesis State
  const [keynoteThesis, setKeynoteThesis] = useState(
    "The paradigm of modern AI has fundamentally inverted: we are shifting from monolithic pre-training scale to dynamic test-time computation and autonomous feedback loops."
  );
  const [thesisTimestamp, setThesisTimestamp] = useState("08:42");
  const [thesisSeconds, setThesisSeconds] = useState(522);
  const [executiveSummaryMarkdown, setExecutiveSummaryMarkdown] = useState<string>("");
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>([]);
  const [durationStr, setDurationStr] = useState<string>("42:18");

  // Dynamic state loaded or initialized with Wayin AI Mock Baseline
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    {
      id: "1",
      task: "Adopt ReAct loop schema over plain zero-shot inference",
      timestampStr: "08:42",
      completed: false,
      priority: "high",
    },
    {
      id: "2",
      task: "Isolate tool execution in sandboxed WebAssembly environments",
      timestampStr: "16:30",
      completed: false,
      priority: "high",
    },
    {
      id: "3",
      task: "Benchmark test-time reasoning tokens against static system prompts",
      timestampStr: "28:15",
      completed: true,
      priority: "medium",
    },
    {
      id: "4",
      task: "Configure fallback telemetry and automated incident recovery",
      timestampStr: "35:10",
      completed: false,
      priority: "low",
    },
  ]);

  const [chapters, setChapters] = useState<Chapter[]>([
    {
      id: "ch1",
      startSeconds: 0,
      timestampStr: "00:00",
      title: "Introduction & Foundation Models Shift",
      duration: "04:15",
      summary:
        "The macro transition from scale-only pretraining to autonomous agentic workflows and dynamic test-time computation.",
    },
    {
      id: "ch2",
      startSeconds: 255,
      timestampStr: "04:15",
      title: "Core Bottlenecks in Prompt-Only Workflows",
      duration: "04:27",
      summary:
        "Context rot, compounding hallucinations across hops, and brittle failure modes under zero-shot prompting.",
    },
    {
      id: "ch3",
      startSeconds: 522,
      timestampStr: "08:42",
      title: "Agentic Loops: Planning, Action & Reflection",
      duration: "07:48",
      summary:
        "Architecting self-correcting cognitive loops, verification barriers, and dynamic checkpoint recovery.",
    },
    {
      id: "ch4",
      startSeconds: 990,
      timestampStr: "16:30",
      title: "Tool Calling & Sandboxed Execution",
      duration: "11:45",
      summary:
        "Safe environment runtimes, WASM isolation, and deterministic code generation protocols.",
    },
  ]);

  const [transcript, setTranscript] = useState<TranscriptLine[]>([
    {
      id: "t1",
      timestampStr: "00:15",
      seconds: 15,
      speaker: "Host",
      text: "Welcome everyone. Today we are unpacking why pure zero-shot prompts fail in production software systems.",
    },
    {
      id: "t2",
      timestampStr: "04:18",
      seconds: 258,
      speaker: "Speaker",
      text: "When tasks require multiple reasoning hops, context degradation happens almost immediately without an external loop.",
    },
    {
      id: "t3",
      timestampStr: "08:45",
      seconds: 525,
      speaker: "Speaker",
      text: "The paradigm is moving toward agentic loops: planning, tool use, reflection, and automated error recovery.",
    },
    {
      id: "t4",
      timestampStr: "16:32",
      seconds: 992,
      speaker: "Speaker",
      text: "Executing raw Python or shell commands without isolated sandboxes creates unacceptable security vectors.",
    },
    {
      id: "t5",
      timestampStr: "28:18",
      seconds: 1698,
      speaker: "Speaker",
      text: "Allocating compute during test-time allows models to explore multiple solution trajectories before committing.",
    },
  ]);

  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    {
      id: "fc1",
      concept: "Agentic Architecture",
      question:
        "What fundamentally distinguishes agentic loops from traditional zero-shot prompts?",
      answer:
        "Agentic loops introduce test-time computation with planning, tool invocation, reflection, and automated error recovery rather than relying solely on monolithic pretraining weights.",
      timestampStr: "08:42",
      seconds: 522,
    },
    {
      id: "fc2",
      concept: "Cognitive Bottlenecks",
      question:
        "Why do prompt-only workflows degrade when handling multi-step reasoning?",
      answer:
        "Context rot, compounding hallucinations across hops, and the lack of an execution feedback mechanism cause brittle outputs.",
      timestampStr: "04:15",
      seconds: 255,
    },
    {
      id: "fc3",
      concept: "Runtime Security",
      question:
        "Why are sandboxed WebAssembly environments necessary for LLM tool use?",
      answer:
        "Running generated code or shell commands without isolated sandboxes creates high-risk remote code execution vectors and state leakage.",
      timestampStr: "16:30",
      seconds: 990,
    },
    {
      id: "fc4",
      concept: "Evaluation Benchmarks",
      question:
        "What metric showed a 64.8% performance in the keynote?",
      answer:
        "SWE-bench Verified problem resolution rate achieved by pairing multi-step planning with iterative unit test verification.",
      timestampStr: "28:15",
      seconds: 1695,
    },
  ]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus chat input when switching to chat tab
  useEffect(() => {
    if (activeTab === "chat") {
      chatInputRef.current?.focus();
    }
  }, [activeTab]);

  // Fetch real summary if a YouTube URL is passed and online
  useEffect(() => {
    let isCancelled = false;

    if (!ytId) return;

    const fetchSummary = async () => {
      try {
        setIsSummarizing(true);
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: sourceUrl,
            mode: modeParam || "quick",
            lang: currentLang,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (isCancelled || !data) return;

        if (data.title || data.videoTitle) {
          setVideoTitle(data.title || data.videoTitle);
        }

        if (data.keynoteThesis) {
          setKeynoteThesis(data.keynoteThesis);
        }

        if (data.thesisTimestamp) {
          setThesisTimestamp(data.thesisTimestamp);
          const parts = String(data.thesisTimestamp).split(":").map(Number);
          const sec =
            parts.length === 2
              ? parts[0] * 60 + parts[1]
              : parts.length === 3
              ? parts[0] * 3600 + parts[1] * 60 + parts[2]
              : 0;
          setThesisSeconds(sec || 0);
        }

        if (data.executiveSummaryMarkdown || data.executiveSummary) {
          setExecutiveSummaryMarkdown(data.executiveSummaryMarkdown || data.executiveSummary);
        }

        if (Array.isArray(data.keyTakeaways) && data.keyTakeaways.length > 0) {
          setKeyTakeaways(data.keyTakeaways);
        }

        if (data.durationStr) {
          setDurationStr(data.durationStr);
        }

        if (Array.isArray(data.chapters) && data.chapters.length > 0) {
          setChapters(
            (data.chapters as RawChapter[]).map((ch, idx) => ({
              id: ch.id || `ch-${idx + 1}`,
              startSeconds: Number(ch.startSeconds) || idx * 180,
              timestampStr: ch.timestampStr || formatTime(Number(ch.startSeconds) || idx * 180),
              title: ch.title || `Chapter ${idx + 1}`,
              duration: ch.duration || "04:30",
              summary: ch.summary || "",
            }))
          );
        }

        if (Array.isArray(data.actionItems) && data.actionItems.length > 0) {
          setActionItems(
            (data.actionItems as RawActionItem[]).map((item, idx) => {
              let sec = item.timestampSeconds;
              if (typeof sec !== "number" && item.timestampStr) {
                const parts = item.timestampStr.split(":").map(Number);
                if (parts.length === 2) sec = parts[0] * 60 + parts[1];
                else if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
              }
              return {
                id: item.id || `ai-${idx + 1}`,
                task: item.task || "",
                timestampStr: item.timestampStr || "00:00",
                timestampSeconds: sec ?? 0,
                completed: false,
                priority:
                  item.priority === "high" || item.priority === "low" ? item.priority : "medium",
              };
            })
          );
        }

        if (Array.isArray(data.flashcards) && data.flashcards.length > 0) {
          setFlashcards(
            (data.flashcards as RawFlashcard[]).map((fc, idx) => ({
              id: fc.id || `fc-${idx + 1}`,
              concept: fc.concept || "Key Concept",
              question: fc.question || "",
              answer: fc.answer || "",
              timestampStr: fc.timestampStr || "00:00",
              seconds: Number(fc.seconds) || 0,
            }))
          );
        }

        if (Array.isArray(data.transcript) && data.transcript.length > 0) {
          setTranscript(
            (data.transcript as RawTranscriptLine[]).map((t, idx) => ({
              id: t.id || `tr-${idx + 1}`,
              timestampStr: t.timestampStr || "00:00",
              seconds: Number(t.startSeconds) || 0,
              speaker: t.speaker || "Speaker",
              text: t.text || "",
            }))
          );
        }
      } catch {
        // Fallback to initial mock keynote data safely
      } finally {
        if (!isCancelled) setIsSummarizing(false);
      }
    };

    fetchSummary();
    return () => {
      isCancelled = true;
    };
  }, [sourceUrl, ytId, modeParam, currentLang]);

  // Master Seek
  const handleSeek = (sec: number) => {
    setCurrentSeconds(sec);
    setIsPlaying(true);

    if (ytId && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "seekTo", args: [sec, true] }),
        "*"
      );
    }

    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleCopyMarkdown = () => {
    const title = videoTitle || "SummAI Video Summary";
    const thesis = keynoteThesis ? `## Key Thesis\n"${keynoteThesis}"\n\n` : "";
    const execSummary = executiveSummaryMarkdown
      ? `## Executive Summary\n${executiveSummaryMarkdown}\n\n`
      : "";
    const markdown = `# ${title}\nSource: ${sourceUrl}\n\n${thesis}${execSummary}## Action Items\n${actionItems
      .map(
        (a) =>
          `- [${a.completed ? "x" : " "}] ${a.task} (${a.timestampStr}) [${a.priority.toUpperCase()}]`
      )
      .join("\n")}\n\n## Video Chapters\n${chapters
      .map((c) => `### ${c.timestampStr} - ${c.title}\n${c.summary}`)
      .join("\n\n")}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(markdown).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion.trim() || isAsking) return;

    const q = chatQuestion.trim();
    // Append user question and assistant placeholder for real-time streaming
    setChatLogs((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "assistant", text: "" },
    ]);
    setChatQuestion("");
    setIsAsking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          transcriptText: transcript
            .map((t) => `[${t.timestampStr}] ${t.speaker}: ${t.text}`)
            .join("\n"),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      if (!res.body) {
        throw new Error("No response body received");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setChatLogs((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx].role === "assistant") {
            next[lastIdx] = { ...next[lastIdx], text: accumulatedText };
          }
          return next;
        });

        // Keep latest tokens in view
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }

      if (!accumulatedText.trim()) {
        setChatLogs((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx].role === "assistant") {
            next[lastIdx] = {
              ...next[lastIdx],
              text: "No context found in video transcript at [00:00].",
            };
          }
          return next;
        });
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to connect to video copilot.";
      setChatLogs((prev) => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (lastIdx >= 0 && next[lastIdx].role === "assistant") {
          next[lastIdx] = {
            ...next[lastIdx],
            text: `⚠️ ${errMsg}`,
          };
        }
        return next;
      });
    } finally {
      setIsAsking(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="min-h-screen bg-background text-on-surface font-body flex flex-col selection:bg-fuchsia-500 selection:text-white relative overflow-hidden">
      {/* Ambient Playful Neon Blur Orbs */}
      <div className="fixed -top-32 -left-32 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-1/3 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-[150px] pointer-events-none" />

      {/* 1. Global Navigation & Action Utility Bar */}
      <header className="h-14 border-b border-white/[0.08] bg-surface-container-low px-4 sm:px-6 flex items-center justify-between text-xs sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-outline hover:text-on-surface transition-colors group"
          >
            <div className="relative p-[1px] rounded-lg bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 shadow-sm shadow-fuchsia-500/20 group-hover:scale-105 transition-all">
              <div className="w-6 h-6 rounded-[7px] bg-[#090b10] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white fill-amber-300 -rotate-12" />
              </div>
            </div>
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline font-medium">Dashboard</span>
          </Link>
          <span className="text-outline">/</span>
          <h1 className="font-headline font-semibold text-on-surface truncate max-w-[160px] sm:max-w-xs md:max-w-md text-xs sm:text-sm">
            {videoTitle}
          </h1>
          <span className="hidden md:inline-flex px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary text-[10px] font-mono border border-secondary/20">
            Whisper Synced
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Output Language Pill Switcher */}
          <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-surface-container-high border border-white/[0.08] hover:border-cyan-500/40 text-on-surface text-xs transition-colors shadow-sm">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value)}
              aria-label="Switch output language"
              className="bg-transparent text-xs font-headline font-medium text-on-surface focus:outline-none cursor-pointer pr-1 [&>option]:bg-[#121620] [&>option]:text-white"
            >
              <option value="auto">🌐 Auto</option>
              <option value="hinglish">🇮🇳 Hinglish</option>
              <option value="hi">🇮🇳 हिन्दी</option>
              <option value="en">🇺🇸 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="ja">🇯🇵 日本語</option>
            </select>
            {isSummarizing && (
              <Loader2 className="w-3 h-3 text-cyan-400 animate-spin shrink-0" />
            )}
          </div>

          <ThemeToggle />
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
            title="Copy structured summary to clipboard"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-secondary" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy Markdown"}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high border border-white/[0.08] hover:bg-surface-container-highest transition-colors"
            title="Export as PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </header>

      {/* 2. Workspace Two-Column Split (Wayin AI / context.dev architecture) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ================= LEFT COLUMN: Video Player & Timeline Navigator (42% width) ================= */}
        <section className="lg:col-span-5 border-r border-white/[0.08] p-4 sm:p-5 flex flex-col gap-5 overflow-y-auto bg-surface-container-lowest">
          {/* Responsive 16:9 Player with Seek Bar */}
          <div className="aspect-video w-full rounded-2xl bg-black border border-white/[0.08] relative overflow-hidden group flex flex-col justify-end p-4 shadow-xl">
            {!isMounted ? (
              <div className="absolute inset-0 w-full h-full bg-surface-container-lowest flex flex-col items-center justify-center gap-2.5">
                <div className="w-8 h-8 rounded-full border-2 border-fuchsia-500/20 border-t-fuchsia-500 animate-spin" />
                <span className="text-[11px] font-mono text-outline">Initializing Player...</span>
              </div>
            ) : ytId ? (
              <iframe
                ref={iframeRef}
                src={`https://www.youtube-nocookie.com/embed/${ytId}?enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}&rel=0`}
                title="Synchronized Video Player"
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  src="/sample.mp4"
                  className="absolute inset-0 w-full h-full object-cover"
                  onTimeUpdate={(e) => setCurrentSeconds(Math.floor(e.currentTarget.currentTime))}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) {
                          videoRef.current.pause();
                        } else {
                          videoRef.current.play().catch(() => {});
                        }
                      }
                      setIsPlaying(!isPlaying);
                    }}
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform"
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>
                </div>
              </>
            )}

            {/* In-player telemetry bar */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-white/80 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/[0.06] pointer-events-auto">
              <span>
                {formatTime(currentSeconds)} / {chapters[chapters.length - 1]?.timestampStr || "42:18"}
              </span>
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-outline" />
                <span className="text-secondary font-medium">1080p 60fps</span>
              </div>
            </div>
          </div>

          {/* Video Metadata & Telemetry Card */}
          <div
            data-testid="telemetry-card"
            className="p-3.5 rounded-xl bg-surface-container-low border border-white/[0.06] flex items-center justify-between"
          >
            <div>
              <div className="text-[11px] font-mono text-outline uppercase tracking-wider">
                Processing Telemetry
              </div>
              <div className="text-xs font-medium text-secondary flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span>Latency: 0.82s</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">
                  Duration Reduction: {durationStr ? `${durationStr} → 2m (96% time saved)` : "96% time saved"}
                </span>
                <span>•</span>
                <span>88% Token Reduction</span>
                <span>•</span>
                <span>Gemini 3.8 Flash</span>
              </div>
            </div>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-outline hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors"
              title="Open Source Video"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Interactive Chapter Timeline */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-xs font-semibold text-outline uppercase tracking-wider">
                Video Chapters
              </h3>
              <span className="text-[11px] font-mono text-outline">
                {chapters.length} Synchronized Moments
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {chapters.map((ch) => {
                const isActive =
                  currentSeconds >= ch.startSeconds && currentSeconds < ch.startSeconds + 300;
                return (
                  <div
                    key={ch.id}
                    onClick={() => handleSeek(ch.startSeconds)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? "bg-surface-container-high border-secondary/40 shadow-sm ring-1 ring-secondary/30"
                        : "bg-surface-container-low border-white/[0.06] hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container-highest text-secondary font-medium">
                        {ch.timestampStr}
                      </span>
                      <span className="text-[11px] font-mono text-outline">{ch.duration}</span>
                    </div>
                    <div className="text-xs font-medium text-on-surface">{ch.title}</div>
                    <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-1">
                      {ch.summary}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= RIGHT COLUMN: Structured Notes, Knowledge Suite & Copilot (58% width) ================= */}
        <section className="lg:col-span-7 flex flex-col justify-between overflow-hidden bg-background">
          {/* Segmented Top Tabs */}
          <div className="border-b border-white/[0.08] px-4 sm:px-6 pt-3 flex items-center gap-3 sm:gap-6 text-xs font-medium bg-surface-container-low overflow-x-auto scrollbar-none">
            {(
              [
                { id: "notes" as const, label: "⚡ Mukhya Baatein", icon: Zap },
                { id: "actions" as const, label: "📝 Action Steps", icon: ListTodo },
                { id: "transcript" as const, label: "📄 Interactive Transcript", icon: FileText },
                { id: "flashcards" as const, label: "🧠 Flashcards", icon: HelpCircle },
                { id: "chat" as const, label: "💬 Video Chat", icon: MessageSquare },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 flex items-center gap-1.5 transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary-action text-primary font-semibold"
                    : "border-transparent text-outline hover:text-on-surface"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Display Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 text-sm text-on-surface-variant">
            {/* TAB 1: Structured Notes / Mukhya Baatein */}
            {activeTab === "notes" && (
              <div className="space-y-6 animate-fade-in">
                {/* Keynote Thesis Callout */}
                <blockquote
                  data-testid="keynote-thesis-card"
                  className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-on-surface text-xs sm:text-sm relative overflow-hidden"
                >
                  <div className="font-semibold text-primary uppercase text-[10px] tracking-wider mb-1 font-mono">
                    ⚡ Keynote Thesis
                  </div>
                  <div className="italic leading-relaxed font-medium text-white/90">
                    “{keynoteThesis}”
                  </div>
                  <div className="mt-2.5 text-[11px] font-mono text-primary flex items-center gap-1.5 not-italic">
                    <Clock className="w-3.5 h-3.5 text-secondary" />
                    <button
                      type="button"
                      onClick={() => handleSeek(thesisSeconds)}
                      className="px-2 py-0.5 rounded bg-surface-container-highest border border-white/[0.08] hover:border-secondary/40 text-secondary hover:text-white transition-all font-semibold flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      Thesis Declaration @ {thesisTimestamp}
                    </button>
                  </div>
                </blockquote>

                {/* Key Takeaways */}
                {keyTakeaways.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="font-headline text-sm font-semibold text-on-surface flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-300" />
                      Key Highlights & Takeaways
                    </h4>
                    <ul className="space-y-2">
                      {keyTakeaways.map((point, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-on-surface-variant bg-surface-container-low/60 p-2.5 rounded-lg border border-white/[0.04]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Executive Summary Markdown */}
                {executiveSummaryMarkdown ? (
                  <div className="space-y-3">
                    <h4 className="font-headline text-sm font-semibold text-on-surface">
                      Executive Summary & Analysis
                    </h4>
                    <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-on-surface-variant whitespace-pre-line bg-surface-container-low/40 p-4 rounded-xl border border-white/[0.04]">
                      {executiveSummaryMarkdown}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="font-headline text-base font-semibold text-on-surface mb-2">
                        1. The Shift to Autonomous Loops
                      </h4>
                      <p className="leading-relaxed text-xs sm:text-sm text-on-surface-variant">
                        Traditional zero-shot querying hits steep performance asymptotes on multi-step software engineering tasks. Modern agentic architectures deploy ReAct schemas for runtime validation, self-healing code execution, and tool selection.
                      </p>
                    </div>

                    {/* Quantitative Impact Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-surface-container border border-white/[0.06]">
                        <div className="text-xl font-bold font-mono text-secondary">64.8%</div>
                        <div className="text-[11px] text-outline mt-1 font-medium">
                          SWE-bench Verified
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface-container border border-white/[0.06]">
                        <div className="text-xl font-bold font-mono text-primary">4.2x</div>
                        <div className="text-[11px] text-outline mt-1 font-medium">
                          Feedback Loop Ratio
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface-container border border-white/[0.06]">
                        <div className="text-xl font-bold font-mono text-emerald-400">-78%</div>
                        <div className="text-[11px] text-outline mt-1 font-medium">
                          Hallucination Compounding
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-headline text-base font-semibold text-on-surface mb-2">
                        2. Sandboxed Tool Execution
                      </h4>
                      <p className="leading-relaxed text-xs sm:text-sm text-on-surface-variant">
                        Allowing models to interface with real terminal runtimes requires zero-trust virtualization. By isolating tool actions inside ephemeral WebAssembly memory spaces, agents can run unit tests and parse logs without host exposure.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: Action Items & Checklist (Wayin AI style) */}
            {activeTab === "actions" && (
              <div className="space-y-3 animate-fade-in">
                <div className="text-xs text-outline mb-2">
                  Actionable execution tasks extracted automatically from the transcript:
                </div>
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`check-${item.id}`}
                      checked={item.completed}
                      onChange={() => {
                        setActionItems((prev) =>
                          prev.map((a) =>
                            a.id === item.id ? { ...a, completed: !a.completed } : a
                          )
                        );
                      }}
                      className="mt-1 rounded bg-surface-container-highest border-white/20 text-primary-action focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor={`check-${item.id}`} className="flex-1 text-xs cursor-pointer">
                      <span
                        className={
                          item.completed ? "line-through text-outline" : "text-on-surface font-medium"
                        }
                      >
                        {item.task}
                      </span>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-outline">
                        <button
                          type="button"
                          data-testid="timecode-seek-btn"
                          data-timestamp={item.timestampStr}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const sec =
                              item.timestampSeconds ??
                              (() => {
                                const parts = item.timestampStr.split(":").map(Number);
                                return parts.length === 2
                                  ? parts[0] * 60 + parts[1]
                                  : parts[0] * 3600 + parts[1] * 60 + parts[2];
                              })();
                            handleSeek(sec);
                          }}
                          className="px-2 py-0.5 rounded bg-surface-container-highest border border-white/[0.08] hover:border-secondary/40 text-secondary hover:text-white flex items-center gap-1 transition-all text-[11px] font-mono cursor-pointer active:scale-95"
                        >
                          <Clock className="w-3 h-3" /> {item.timestampStr}
                        </button>
                        <span>•</span>
                        <span
                          className={`uppercase font-bold text-[10px] ${
                            item.priority === "high"
                              ? "text-red-400"
                              : item.priority === "medium"
                              ? "text-yellow-400"
                              : "text-blue-400"
                          }`}
                        >
                          {item.priority} Priority
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: Interactive Searchable Transcript */}
            {activeTab === "transcript" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 bg-surface-container-low border border-white/[0.08] px-3.5 py-2 rounded-xl text-xs">
                  <Search className="w-4 h-4 text-outline" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search keywords or speakers in transcript..."
                    className="bg-transparent border-0 outline-none w-full text-on-surface placeholder:text-outline"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-outline hover:text-on-surface"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {transcript
                    .filter(
                      (t) =>
                        t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.speaker.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((line, idx) => {
                      const nextLine = transcript[idx + 1];
                      const isLineActive =
                        currentSeconds >= line.seconds &&
                        (!nextLine || currentSeconds < nextLine.seconds);
                      return (
                        <div
                          key={line.id}
                          onClick={() => handleSeek(line.seconds)}
                          className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 text-xs border ${
                            isLineActive
                              ? "bg-fuchsia-500/10 border-fuchsia-500/40 text-on-surface ring-1 ring-fuchsia-500/25 shadow-sm"
                              : "hover:bg-surface-container-low border-transparent hover:border-white/[0.06] text-on-surface-variant"
                          }`}
                        >
                          <span
                            className={`font-mono text-[11px] font-medium px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
                              isLineActive
                                ? "bg-fuchsia-500/20 text-fuchsia-300 font-bold"
                                : "bg-surface-container-highest text-secondary"
                            }`}
                          >
                            {line.timestampStr}
                          </span>
                          <div>
                            <span className="font-semibold text-on-surface mr-2">
                              {line.speaker}:
                            </span>
                            <span
                              className={
                                isLineActive
                                  ? "text-on-surface font-medium"
                                  : "text-on-surface-variant leading-relaxed"
                              }
                            >
                              {line.text}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB 4: Flashcards & Study Mode */}
            {activeTab === "flashcards" && (
              <div className="space-y-6 animate-fade-in flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-xs text-outline px-1">
                  <span>
                    Card {currentCardIndex + 1} of {flashcards.length}
                  </span>
                  <span className="font-mono text-secondary">
                    {Object.values(masteredCards).filter(Boolean).length} / {flashcards.length} Mastered
                  </span>
                </div>

                {/* 3D Interactive Flashcard container */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full min-h-[220px] p-6 rounded-2xl bg-surface-container-low border border-white/[0.08] hover:border-secondary/40 shadow-xl cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container-highest text-secondary font-semibold">
                      {currentCard.concept}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSeek(currentCard.seconds);
                      }}
                      className="flex items-center gap-1 text-[11px] font-mono text-outline hover:text-secondary transition-colors"
                      title="Seek to reference in video"
                    >
                      <Clock className="w-3 h-3" /> {currentCard.timestampStr}
                    </button>
                  </div>

                  <div className="py-4">
                    {!isFlipped ? (
                      <div>
                        <div className="text-[11px] font-mono text-outline mb-1">Question</div>
                        <h3 className="font-headline text-base sm:text-lg font-semibold text-on-surface leading-snug">
                          {currentCard.question}
                        </h3>
                      </div>
                    ) : (
                      <div className="animate-fade-in">
                        <div className="text-[11px] font-mono text-secondary mb-1">Answer</div>
                        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                          {currentCard.answer}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-outline pt-2 border-t border-white/[0.04]">
                    <span>Click anywhere to {isFlipped ? "show question" : "reveal answer"}</span>
                    <span className="text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                      {isFlipped ? "Flip Back ↺" : "Flip ↻"}
                    </span>
                  </div>
                </div>

                {/* Flashcard Actions & Navigation */}
                <div className="w-full flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIndex((prev) =>
                          prev > 0 ? prev - 1 : flashcards.length - 1
                        );
                      }}
                      className="p-2 rounded-xl bg-surface-container border border-white/[0.08] hover:bg-surface-container-high transition-colors"
                      title="Previous Card"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIndex((prev) =>
                          prev < flashcards.length - 1 ? prev + 1 : 0
                        );
                      }}
                      className="p-2 rounded-xl bg-surface-container border border-white/[0.08] hover:bg-surface-container-high transition-colors"
                      title="Next Card"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMasteredCards((prev) => ({
                          ...prev,
                          [currentCard.id]: !prev[currentCard.id],
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                        masteredCards[currentCard.id]
                          ? "bg-secondary/20 border-secondary text-secondary"
                          : "bg-surface-container border-white/[0.08] text-outline hover:text-on-surface"
                      }`}
                    >
                      {masteredCards[currentCard.id] ? "✓ Mastered" : "Mark as Mastered"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIndex(0);
                        setMasteredCards({});
                      }}
                      className="p-2 rounded-xl bg-surface-container border border-white/[0.08] hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
                      title="Reset Deck"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Video Chat / Copilot Dedicated View */}
            {activeTab === "chat" && (
              <div className="space-y-4 animate-fade-in flex flex-col h-full">
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-on-surface">Video AI Copilot</div>
                      <div className="text-[11px] font-mono text-outline">Grounded with interactive video timestamps</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Live Synchronized
                  </span>
                </div>

                {/* Chat message list */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {chatLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 text-xs p-3.5 rounded-xl border ${
                        log.role === "assistant"
                          ? "bg-surface-container-low border-white/[0.06] text-on-surface"
                          : "bg-primary/10 border-primary/20 text-on-surface"
                      }`}
                    >
                      {log.role === "assistant" ? (
                        <Bot className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      ) : (
                        <User className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      )}
                      <div className="leading-relaxed flex-1">
                        <div className="font-mono text-[10px] text-outline mb-1">
                          {log.role === "assistant" ? "SummAI Copilot" : "You"}
                        </div>
                        {log.role === "assistant" ? (
                          <GroundedCitations text={log.text} onSeek={handleSeek} />
                        ) : (
                          log.text
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>
              </div>
            )}
          </div>

          {/* ================= Docked Video Copilot Chat Area ================= */}
          <div className="border-t border-white/[0.08] bg-surface-container-lowest p-4 space-y-3">
            {/* Quick-Prompt Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
              <span className="text-outline shrink-0 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-300 fill-amber-300 -rotate-12" /> Quick Ask:
              </span>
              {[
                { label: "⚡ 60s Tl;dr", query: "Give me a quick 60-second summary of the core thesis and key takeaways." },
                { label: "🎯 Step at 08:42", query: "What was the exact protocol or step discussed at 08:42?" },
                { label: "💡 Quiz me", query: "Quiz me on the main concepts from this video with 3 quick questions." },
                { label: "☕ 3-bullet core takeaways", query: "What are the top 3 high-impact takeaways from this talk?" },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setChatQuestion(chip.query);
                  }}
                  className="px-2.5 py-0.5 rounded-full bg-surface-container border border-white/[0.06] hover:border-fuchsia-500/40 text-on-surface-variant hover:text-white shrink-0 transition-all hover:scale-105 active:scale-95"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Recent Message Snippet if chat logs present and not in dedicated chat tab */}
            {activeTab !== "chat" && chatLogs.length > 1 && (
              <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                {chatLogs.slice(-2).map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 text-xs p-2.5 rounded-lg ${
                      log.role === "assistant"
                        ? "bg-surface-container-low border border-white/[0.06] text-on-surface"
                        : "bg-primary/10 text-primary-action self-end"
                    }`}
                  >
                    {log.role === "assistant" ? (
                      <Bot className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    )}
                    <div className="leading-relaxed">
                      {log.role === "assistant" ? (
                        <GroundedCitations text={log.text} onSeek={handleSeek} />
                      ) : (
                        log.text
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
            )}

            {/* Chat Input Form */}
            <form onSubmit={handleChat} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  placeholder="Ask video copilot (e.g. 'What is the benchmark at 28:15?')..."
                  className="w-full bg-surface-container-low border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-action transition-colors pr-8"
                  disabled={isAsking}
                />
                <MessageSquare className="w-3.5 h-3.5 text-pink-400 absolute right-3 top-3 opacity-70 pointer-events-none" />
              </div>

              <button
                type="submit"
                disabled={!chatQuestion.trim() || isAsking}
                className="px-4 py-2.5 rounded-xl bg-primary-action hover:bg-primary-action/90 text-white font-medium text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary-action/20"
              >
                {isAsking ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Ask Copilot</span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

// ==================== Suspense Fallback Wrapper ====================

function WorkspaceSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-14 border-b border-white/[0.08] bg-surface-container-low animate-pulse" />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
        <div className="lg:col-span-5 h-[400px] rounded-xl bg-surface-container-low animate-pulse" />
        <div className="lg:col-span-7 h-[400px] rounded-xl bg-surface-container-low animate-pulse" />
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <WorkspaceContent />
    </Suspense>
  );
}
