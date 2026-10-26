"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const consent = localStorage.getItem("summai_cookie_consent");
        if (!consent) {
          setShow(true);
        }
      } catch {
        // localStorage fallback
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("summai_cookie_consent", "accepted");
    } catch {
      // localStorage fallback
    }
    setShow(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem("summai_cookie_consent", "declined");
    } catch {
      // localStorage fallback
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Storage Notice"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-2xl bg-surface-container-high/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl text-xs space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-on-surface font-headline font-semibold">
          <ShieldCheck className="w-4 h-4 text-secondary flex-shrink-0" />
          <span>Privacy & Workspace Persistence</span>
        </div>
        <button
          onClick={handleDecline}
          aria-label="Close cookie notice"
          className="text-outline hover:text-on-surface p-0.5 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-on-surface-variant leading-relaxed text-[11px]">
        SummAI uses local browser storage strictly to preserve your workspace session,
        recent video summaries, and API preferences. We do not use third-party trackers.
      </p>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={handleDecline}
          className="px-3 py-1.5 rounded-lg border border-white/[0.08] hover:bg-surface-container-highest text-outline hover:text-on-surface text-[11px] font-mono transition-colors"
        >
          Essential Only
        </button>
        <button
          onClick={handleAccept}
          className="px-3.5 py-1.5 rounded-lg bg-primary-action text-white hover:bg-opacity-90 font-headline font-medium text-[11px] shadow-md shadow-indigo-600/20 transition-all"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
