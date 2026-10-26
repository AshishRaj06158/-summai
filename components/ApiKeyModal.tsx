"use client";

import React, { useState, useEffect, useRef } from "react";
import { Key, X, Check, ExternalLink, Eye, EyeOff } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
  currentKey: string;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  onSaveKey,
  currentKey,
}: ApiKeyModalProps) {
  const [prevCurrentKey, setPrevCurrentKey] = useState(currentKey);
  const [keyInput, setKeyInput] = useState(currentKey);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when currentKey prop changes during render
  if (currentKey !== prevCurrentKey) {
    setPrevCurrentKey(currentKey);
    setKeyInput(currentKey);
  }

  // Keyboard escape listener, focus trap, and background scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // Lock background scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus input on open
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveKey(keyInput.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setKeyInput("");
    onSaveKey("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[#141a27] p-6 shadow-2xl space-y-4"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-action"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 id="api-key-modal-title" className="text-base font-bold text-white">
              Gemini API Key
            </h3>
            <p className="text-xs text-slate-400">
              Configure credentials for Gemini 3.8 Flash pipeline
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-200 leading-relaxed">
          <strong>Tip:</strong> Demo presets run immediately with zero configuration. An API key is only needed when analyzing new custom video uploads with live Gemini 3.8 Flash.
        </div>

        {/* Password Input with Visibility Toggle */}
        <div className="space-y-2">
          <label htmlFor="gemini-api-key-input" className="text-xs font-semibold text-slate-300">
            Google AI Studio API Key
          </label>
          <div className="relative">
            <input
              id="gemini-api-key-input"
              ref={inputRef}
              type={showKey ? "text" : "password"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0f131c] pl-3 pr-10 py-2.5 font-mono text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              aria-label={showKey ? "Hide API key" : "Show API key"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-action"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
          >
            <span>Get free API key</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          {keyInput && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-rose-400 text-xs transition-colors"
            >
              Clear key
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[rgba(255,255,255,0.08)] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-action"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save & Apply</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
