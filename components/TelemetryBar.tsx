"use client";

import React from "react";
import { Zap, Activity, Clock } from "lucide-react";
import { VideoTelemetry } from "@/lib/types";

interface TelemetryBarProps {
  telemetry: VideoTelemetry;
}

export function TelemetryBar({ telemetry }: TelemetryBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#141a27]/90 px-4 py-3 backdrop-blur-md shadow-lg">
      {/* Engine & Mode */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <Activity className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-white">
              {telemetry.modelName}
            </span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-300 font-mono">
              Agentic Flash
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {telemetry.processingMode}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs">
        {/* Token Count */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            Context Tokens
          </span>
          <div className="flex items-baseline gap-1 text-slate-200">
            <span className="font-bold text-white">
              {telemetry.totalTokens.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">
              ({Math.round((telemetry.promptTokens / telemetry.totalTokens) * 100)}% prompt)
            </span>
          </div>
        </div>

        {/* Efficiency Gain */}
        <div className="flex flex-col">
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider">
            Efficiency vs 1fps
          </span>
          <div className="flex items-center gap-1 font-bold text-emerald-400">
            <Zap className="h-3 w-3" />
            <span>+{telemetry.efficiencyGainPercent}%</span>
          </div>
        </div>

        {/* Latency */}
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            Inference Latency
          </span>
          <div className="flex items-center gap-1 font-bold text-indigo-300">
            <Clock className="h-3 w-3 text-indigo-400" />
            <span>{telemetry.latencyMs} ms</span>
          </div>
        </div>

        {/* Timestamp Precision */}
        <div className="hidden sm:flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            Sync Drift
          </span>
          <span className="font-bold text-slate-300">
            {telemetry.timestampPrecision}
          </span>
        </div>
      </div>
    </div>
  );
}
