"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Zap, BookOpen, Layers, X } from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  category: "Presets" | "Navigation" | "Capabilities";
  action: () => void;
}

export function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

  const items: CommandItem[] = [
    {
      id: "preset-gemini",
      title: "Gemini 3.8 Flash: Agentic Video Intelligence (Demo)",
      category: "Presets",
      action: () => {
        router.push("/video/workspace?source=" + encodeURIComponent("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"));
        handleClose();
      },
    },
    {
      id: "preset-andrej",
      title: "Andrej Karpathy: Intro to Large Language Models",
      category: "Presets",
      action: () => {
        router.push("/video/workspace?source=" + encodeURIComponent("https://www.youtube.com/watch?v=zjkBMFhNj_g"));
        handleClose();
      },
    },
    {
      id: "preset-lex",
      title: "Lex Fridman #412: Yann LeCun on Meta AI",
      category: "Presets",
      action: () => {
        router.push("/video/workspace?source=" + encodeURIComponent("https://www.youtube.com/watch?v=aG0Kz8u9_qU"));
        handleClose();
      },
    },
    {
      id: "nav-dashboard",
      title: "Go to Dashboard",
      category: "Navigation",
      action: () => {
        router.push("/");
        handleClose();
      },
    },
    {
      id: "nav-workspace",
      title: "Open Active Workspace",
      category: "Navigation",
      action: () => {
        router.push("/video/workspace");
        handleClose();
      },
    },
    {
      id: "cap-chapters",
      title: "Synchronized Chapter Timeline Seek",
      category: "Capabilities",
      action: () => {
        router.push("/video/workspace");
        handleClose();
      },
    },
    {
      id: "cap-chat",
      title: "Chat with Video & Timestamp Grounding",
      category: "Capabilities",
      action: () => {
        router.push("/video/workspace");
        handleClose();
      },
    },
  ];

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command search dialog"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-surface-container-low border border-white/[0.12] shadow-2xl overflow-hidden text-on-surface"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownList}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] bg-surface-container-lowest/50">
          <Search className="w-4 h-4 text-outline" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search video presets, features, chapters... (Esc to close)"
            className="w-full bg-transparent text-xs text-on-surface outline-none placeholder:text-outline font-body"
          />
          <button
            onClick={handleClose}
            aria-label="Close command search"
            className="text-outline hover:text-on-surface p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-outline font-mono">
              No matching actions or video presets found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isSelected
                      ? "bg-surface-container-high text-white ring-1 ring-white/10"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.category === "Presets" && <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 -rotate-12" />}
                    {item.category === "Navigation" && <BookOpen className="w-3.5 h-3.5 text-primary" />}
                    {item.category === "Capabilities" && <Layers className="w-3.5 h-3.5 text-tertiary-action" />}
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container-highest text-outline">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/[0.06] bg-surface-container-lowest/80 text-[10px] font-mono text-outline flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>SummAI Fast-Finder</span>
        </div>
      </div>
    </div>
  );
}
