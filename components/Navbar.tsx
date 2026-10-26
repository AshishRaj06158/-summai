"use client";

import React from "react";
import {
  Key,
  FileDown,
  Layers,
  Cpu,
  Zap,
} from "lucide-react";
import { PresetVideo } from "@/lib/types";

interface NavbarProps {
  presets: PresetVideo[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenUpload: () => void;
  onOpenApiKey: () => void;
  hasApiKey: boolean;
  onExport: (format: "markdown" | "json") => void;
}

export function Navbar({
  presets,
  selectedPresetId,
  onSelectPreset,
  onOpenUpload,
  onOpenApiKey,
  hasApiKey,
  onExport,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[rgba(255,255,255,0.08)] bg-[#0f131c]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/25">
            <div className="w-10 h-10 rounded-[14px] bg-[#090b10] flex items-center justify-center relative">
              <Zap className="h-5 w-5 text-white fill-amber-300 -rotate-12 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-pink-500 border-2 border-[#090b10]" />
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-lg">
                Summ<span className="text-indigo-400">AI</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Free for Humans
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              High-Velocity Video Intelligence
            </p>
          </div>

          {/* Model Badge */}
          <div className="ml-3 hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 md:flex">
            <Cpu className="h-3.5 w-3.5 text-emerald-400" />
            <span>gemini-3.8-flash</span>
            <span className="text-emerald-500/50">•</span>
            <span className="text-emerald-400/90 font-mono text-[11px]">Agentic Video</span>
          </div>
        </div>

        {/* Center: Preset Selector */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-slate-500" /> Demo Presets:
          </span>
          <div className="flex gap-1.5 p-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#141a27]/90">
            {presets.map((preset) => {
              const isActive = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset.id)}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {preset.title.split(":")[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Analyze New Video Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:bg-indigo-500 active:scale-95"
          >
            <Zap className="h-3.5 w-3.5 text-white fill-amber-300 -rotate-12" />
            <span>Analyze Video</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              title="Export Intelligence Brief"
              className="flex items-center gap-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#182030] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-all"
            >
              <FileDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <div className="absolute right-0 mt-1 hidden w-36 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[#141a27] p-1 shadow-xl group-hover:block z-50">
              <button
                onClick={() => onExport("markdown")}
                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:bg-indigo-600 hover:text-white rounded"
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => onExport("json")}
                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:bg-indigo-600 hover:text-white rounded"
              >
                JSON Payload (.json)
              </button>
            </div>
          </div>

          {/* API Key Modal Button */}
          <button
            onClick={onOpenApiKey}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              hasApiKey
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                : "border-[rgba(255,255,255,0.08)] bg-[#182030] text-slate-300 hover:border-slate-500 hover:text-white"
            }`}
            title="Configure Gemini API Key"
          >
            <Key className={`h-3.5 w-3.5 ${hasApiKey ? "text-emerald-400" : "text-slate-400"}`} />
            <span className="hidden sm:inline">
              {hasApiKey ? "Key Active" : "Set API Key"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
