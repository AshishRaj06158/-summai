"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquarePlus, X, Send, CheckCircle2 } from "lucide-react";

export function FeedbackModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        return;
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsOpen(false);
      setFeedback("");
    }, 1800);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        aria-label="Give feedback on video synthesis"
        title="Share Feedback"
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-high border border-white/[0.1] text-xs font-headline font-medium text-on-surface hover:text-white hover:bg-surface-container-highest shadow-2xl transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-action"
      >
        <MessageSquarePlus className="w-4 h-4 text-primary" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={modalRef}
            className="w-full max-w-md rounded-2xl bg-surface-container-low border border-white/[0.12] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-on-surface font-headline font-semibold text-sm">
                <MessageSquarePlus className="w-4 h-4 text-primary" />
                <span id="feedback-dialog-title">Video Intelligence Feedback</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                aria-label="Close feedback dialog"
                className="text-outline hover:text-on-surface p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-action"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitted ? (
              <div
                aria-live="polite"
                className="py-8 text-center space-y-2 animate-in zoom-in-95 duration-200"
              >
                <CheckCircle2 className="w-8 h-8 text-secondary mx-auto" />
                <p className="font-headline font-semibold text-sm text-on-surface">
                  Thank You For Your Feedback!
                </p>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                  Your input directly trains our agentic timeline optimization heuristic.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Notice an inaccurate timestamp, missing chapter, or have an idea to improve
                  video copilot speed? Let our engineering team know:
                </p>
                <textarea
                  ref={textareaRef}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  required
                  placeholder="E.g., Keynote thesis extracted at 01:15 could include slide title context..."
                  className="w-full rounded-xl bg-surface-container-highest/50 border border-white/[0.08] p-3 text-xs text-on-surface outline-none placeholder:text-outline focus:border-primary-action focus:ring-1 focus:ring-primary-action transition-all resize-none"
                />
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-mono text-outline hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-action"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-action text-white hover:bg-opacity-90 text-xs font-headline font-semibold shadow-md shadow-indigo-600/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
