"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  X,
  Link as LinkIcon,
  AlertCircle,
  Cpu,
  Zap,
} from "lucide-react";
import { VideoIntelligence } from "@/lib/types";

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (videoUrl: string, intelligence: VideoIntelligence) => void;
  apiKey: string;
  onPromptForApiKey: () => void;
}

export function VideoUploadModal({
  isOpen,
  onClose,
  onSuccess,
  apiKey,
  onPromptForApiKey,
}: VideoUploadModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
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
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen) return null;

  const stages = [
    "Ingesting audio-visual bitstream...",
    "Gemini 3.8 Flash agentic timeline navigation...",
    "Dynamic frame inspection & timestamp alignment...",
    "Synthesizing structured chapters & action items...",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMessage(null);
    }
  };

  const handleStartAnalysis = async () => {
    if (!apiKey) {
      onPromptForApiKey();
      return;
    }

    if (activeTab === "file" && !selectedFile) {
      setErrorMessage("Please select a video file to analyze.");
      return;
    }

    if (activeTab === "url" && !videoUrlInput.trim()) {
      setErrorMessage("Please enter a valid video URL.");
      return;
    }

    setIsProcessing(true);
    setProcessingStage(0);
    setErrorMessage(null);

    // Animate stages for user feedback
    const interval = setInterval(() => {
      setProcessingStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 1800);

    try {
      if (activeTab === "file" && selectedFile) {
        // Convert to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(selectedFile);
        const fileBase64 = await base64Promise;

        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64,
            mimeType: selectedFile.type || "video/mp4",
            userPrompt: customPrompt,
            apiKey,
          }),
        });

        clearInterval(interval);

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Analysis failed");
        }

        const data = await res.json();
        const localVideoUrl = URL.createObjectURL(selectedFile);

        onSuccess(localVideoUrl, data.intelligence);
        onClose();
      } else {
        // Direct URL / YouTube mode
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: videoUrlInput.trim(),
            videoUrl: videoUrlInput.trim(),
            userPrompt: customPrompt,
            apiKey,
          }),
        });

        clearInterval(interval);

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Analysis failed for video URL");
        }

        const data = await res.json();
        onSuccess(videoUrlInput.trim(), data.intelligence);
        onClose();
      }
    } catch (err: unknown) {
      clearInterval(interval);
      setIsProcessing(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An error occurred during analysis."
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={isProcessing ? undefined : onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[#141a27] p-6 shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          type="button"
          aria-label="Close modal"
          className="absolute top-4 right-4 text-slate-400 hover:text-white disabled:opacity-50 p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-action"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/25">
            <div className="w-10 h-10 rounded-[14px] bg-[#090b10] flex items-center justify-center">
              <Zap className="h-5 w-5 text-white fill-amber-300 -rotate-12 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            </div>
          </div>
          <div>
            <h3 id="upload-modal-title" className="text-base font-bold text-white">
              Analyze Video with Gemini 3.8 Flash
            </h3>
            <p className="text-xs text-slate-400">
              Agentic multimodal timeline ingestion and structured chapters
            </p>
          </div>
        </div>

        {/* Tabs: Upload File vs Direct URL */}
        <div className="flex rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0f131c] p-1 mb-4">
          <button
            onClick={() => setActiveTab("file")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "file"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Upload Video File (MP4, WebM)
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "url"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Direct Video URL
          </button>
        </div>

        {/* Dropzone or URL input */}
        {activeTab === "file" ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(255,255,255,0.12)] bg-[#0f131c]/60 p-6 text-center cursor-pointer transition-all hover:border-indigo-500 hover:bg-[#0f131c]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6" />
            </div>
            {selectedFile ? (
              <div>
                <p className="text-xs font-semibold text-emerald-400 font-mono">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Click to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Drag and drop your video file here, or click to browse
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports MP4, WebM, MOV (up to 50MB for direct inline analysis)
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 mb-2">
            <label className="text-xs font-semibold text-slate-300">
              Direct Video Link
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="url"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="https://example.com/recording.mp4"
                className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0f131c] pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Optional Custom Instructions / Prompt Focus */}
        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Analysis Focus (Optional)</span>
            <span className="text-[11px] text-slate-500">
              e.g., &quot;Focus on architecture decisions&quot;
            </span>
          </label>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Focus on technical benchmarks, action items, or key topics..."
            className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0f131c] px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Processing State Indicator */}
        {isProcessing && (
          <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-300 mb-2 font-mono">
              <span className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-emerald-400 animate-spin" />
                {stages[processingStage]}
              </span>
              <span>{Math.round(((processingStage + 1) / stages.length) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-indigo-950 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                style={{
                  width: `${((processingStage + 1) / stages.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between pt-2">
          {!apiKey ? (
            <button
              onClick={onPromptForApiKey}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Set Gemini Key to analyze custom video</span>
            </button>
          ) : (
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Gemini 3.8 Flash Ready
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-lg border border-[rgba(255,255,255,0.08)] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleStartAnalysis}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all"
            >
              <Zap className="h-3.5 w-3.5 text-white fill-amber-300 -rotate-12" />
              <span>Start Analysis</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
