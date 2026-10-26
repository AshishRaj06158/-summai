"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Does this really work on 3-hour podcasts and long university lectures?",
    answer:
      "Yes! SummAI is built specifically to digest 3-hour podcasts (Huberman, Lex, Rogan) and multi-hour tech streams. It skips long sponsor breaks and chit-chat, pulling the real insights, timestamps, and quotes while your coffee is still warm.",
  },
  {
    question: "How do the clickable timestamp pills work?",
    answer:
      "Every single takeaway, action item, and transcript line has an exact timestamp pill (like 08:42). Click it, and the video player jumps directly to that second so you can watch the speaker say it yourself. No more scrubbing back and forth.",
  },
  {
    question: "Can I export my notes into Notion, Obsidian, or PDF?",
    answer:
      "Yes! With one click, 'Copy Markdown' gives you perfectly formatted markdown with checkboxes and bold headings ready to paste into Notion or Obsidian. You can also export a crisp, clean PDF cheat-sheet using the Export PDF button.",
  },
  {
    question: "Is it completely free for students, developers, and learners?",
    answer:
      "100% free for everyday learning. Just paste any public YouTube link or upload a clip, choose your preferred vibe (Tl;dr, Action Steps, or Study Flashcards), and get the notes instantly.",
  },
  {
    question: "Can I talk to the video like a personal tutor?",
    answer:
      "Yes! The docked Video Copilot in the workspace lets you ask anything grounded in the video's transcript—like 'What library did they install?' or 'Explain the key formula at 16:30'—and it answers with clickable time citations.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = (idx + 1) % FAQ_ITEMS.length;
      document.getElementById(`faq-btn-${nextIdx}`)?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx = (idx - 1 + FAQ_ITEMS.length) % FAQ_ITEMS.length;
      document.getElementById(`faq-btn-${prevIdx}`)?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      document.getElementById("faq-btn-0")?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      document.getElementById(`faq-btn-${FAQ_ITEMS.length - 1}`)?.focus();
    }
  };

  return (
    <section
      aria-labelledby="faq-heading"
      className="w-full mt-16 max-w-4xl mx-auto text-left"
    >
      <div className="flex flex-col items-center text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-mono mb-2">
          <HelpCircle className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>Curious minds ask</span>
        </div>
        <h2
          id="faq-heading"
          className="font-headline text-2xl sm:text-3xl font-bold text-on-surface"
        >
          Frequently Asked Questions
        </h2>
        <p className="text-on-surface-variant text-xs sm:text-sm mt-1 max-w-md">
          Everything you need to know about turning hours of video into minutes of clean notes.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden backdrop-blur-xl ${
                isOpen
                  ? "bg-surface-container/80 border-fuchsia-500/30 shadow-lg shadow-fuchsia-500/5 ring-1 ring-fuchsia-500/20"
                  : "bg-surface-container-low/60 border-white/[0.08] hover:border-white/[0.16] hover:bg-surface-container-low/90"
              }`}
            >
              <h3>
                <button
                  id={`faq-btn-${idx}`}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-region-${idx}`}
                  onClick={() => toggle(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left text-xs sm:text-sm font-headline font-semibold text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-action transition-colors"
                >
                  <span className="pr-4">{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-fuchsia-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </h3>
              {isOpen && (
                <div
                  id={`faq-region-${idx}`}
                  role="region"
                  aria-labelledby={`faq-btn-${idx}`}
                  className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-on-surface-variant leading-relaxed animate-fade-in border-t border-white/[0.04] pt-3"
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
