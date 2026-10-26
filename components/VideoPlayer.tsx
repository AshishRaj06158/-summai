"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Gauge,
} from "lucide-react";
import { VideoChapter, VideoPlayerHandle } from "@/lib/types";

interface VideoPlayerProps {
  src: string;
  chapters: VideoChapter[];
  activeChapterId?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onChapterChange?: (chapterId: string) => void;
  title?: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  (
    {
      src,
      chapters = [],
      activeChapterId,
      onTimeUpdate,
      onChapterChange,
      title,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const youtubeId = extractYouTubeId(src);

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(1);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [playbackRate, setPlaybackRate] = useState<number>(1);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverX, setHoverX] = useState<number>(0);
    const [showControls, setShowControls] = useState<boolean>(true);
    const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);

    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Seek imperative handle
    const seekTo = useCallback(
      (seconds: number, autoplay = true) => {
        if (youtubeId && iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({
              event: "command",
              func: "seekTo",
              args: [seconds, true],
            }),
            "*"
          );
          setCurrentTime(seconds);
          onTimeUpdate?.(seconds, duration);
          return;
        }

        if (!videoRef.current) return;
        videoRef.current.currentTime = Math.max(0, seconds);
        setCurrentTime(seconds);
        if (autoplay) {
          videoRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        }
      },
      [youtubeId, duration, onTimeUpdate]
    );

    useImperativeHandle(ref, () => ({
      seekTo,
      play: () => {
        if (youtubeId && iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "playVideo" }),
            "*"
          );
          setIsPlaying(true);
        } else {
          videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      },
      pause: () => {
        if (youtubeId && iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "pauseVideo" }),
            "*"
          );
          setIsPlaying(false);
        } else {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      getCurrentTime: () => currentTime,
      getDuration: () => duration,
    }));

    // Toggle Play/Pause
    const togglePlay = () => {
      if (youtubeId && iframeRef.current) {
        if (isPlaying) {
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "pauseVideo" }),
            "*"
          );
          setIsPlaying(false);
        } else {
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "playVideo" }),
            "*"
          );
          setIsPlaying(true);
        }
        return;
      }

      if (!videoRef.current) return;
      if (videoRef.current.paused) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };

    // Skip jump
    const skip = (deltaSeconds: number) => {
      const target = Math.min(Math.max(0, currentTime + deltaSeconds), duration);
      seekTo(target, isPlaying);
    };

    // Toggle mute
    const toggleMute = () => {
      if (videoRef.current) {
        const nextMuted = !isMuted;
        videoRef.current.muted = nextMuted;
        setIsMuted(nextMuted);
      }
    };

    // Volume change
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setVolume(val);
      if (videoRef.current) {
        videoRef.current.volume = val;
        videoRef.current.muted = val === 0;
        setIsMuted(val === 0);
      }
    };

    // Playback rate
    const handleSpeedChange = (rate: number) => {
      setPlaybackRate(rate);
      if (videoRef.current) {
        videoRef.current.playbackRate = rate;
      }
      setShowSpeedMenu(false);
    };

    // Toggle Fullscreen
    const toggleFullscreen = () => {
      if (!containerRef.current) return;
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    };

    // Scrubber click/drag
    const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetTime = pos * duration;
      seekTo(targetTime, isPlaying);
    };

    // Scrubber hover preview
    const handleScrubMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverTime(pos * duration);
      setHoverX(e.clientX - rect.left);
    };

    const handleScrubMouseLeave = () => {
      setHoverTime(null);
    };

    // Auto-hide controls
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSpeedMenu(false);
        }
      }, 3000);
    };

    // Time update event handler
    const handleTimeUpdate = () => {
      if (!videoRef.current) return;
      const t = videoRef.current.currentTime;
      setCurrentTime(t);
      onTimeUpdate?.(t, duration);

      // Determine active chapter
      if (chapters.length > 0) {
        const currentChapter = chapters.find(
          (c) => t >= c.startSeconds && t <= c.endSeconds
        );
        if (currentChapter && currentChapter.id !== activeChapterId) {
          onChapterChange?.(currentChapter.id);
        }
      }
    };

    // Loaded metadata event handler
    const handleLoadedMetadata = () => {
      if (!videoRef.current) return;
      setDuration(videoRef.current.duration);
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const currentActiveChapter = chapters.find(
      (c) => currentTime >= c.startSeconds && currentTime <= c.endSeconds
    );

    return (
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        aria-label={title || "Video Player"}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0f131c] shadow-2xl shadow-black/80"
      >
        {/* Active Chapter Header Pill */}
        {currentActiveChapter && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full border border-emerald-500/30 bg-[#0f131c]/80 px-3 py-1 backdrop-blur-md transition-all">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-300 font-mono">
              {currentActiveChapter.timestampStr}
            </span>
            <span className="text-slate-400">•</span>
            <span className="max-w-[280px] truncate text-xs font-medium text-slate-200">
              {currentActiveChapter.title}
            </span>
          </div>
        )}

        {/* Video Stage: Dual Support (YouTube iframe or Native HTML5 Video) */}
        <div className="relative aspect-video w-full bg-black/60 flex items-center justify-center overflow-hidden">
          {youtubeId ? (
            <iframe
              ref={iframeRef}
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
                playsInline
                className="h-full w-full object-contain cursor-pointer"
              />

              {/* Centered Large Play Button when Paused */}
              {!isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-2xl shadow-indigo-500/50 backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <Play className="h-8 w-8 ml-1 text-white fill-white" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Lower Control Bar */}
        <div
          className={`relative z-20 flex flex-col bg-[#141a27] p-3.5 border-t border-[rgba(255,255,255,0.06)] transition-opacity duration-300 ${
            showControls || !isPlaying ? "opacity-100" : "opacity-90"
          }`}
        >
          {/* Scrubber Bar Container */}
          <div
            onClick={handleScrub}
            onMouseMove={handleScrubMouseMove}
            onMouseLeave={handleScrubMouseLeave}
            className="group/scrub relative mb-2.5 h-3 w-full cursor-pointer flex items-center"
          >
            {/* Scrubber Track */}
            <div className="h-1.5 w-full rounded-full bg-white/15 transition-all group-hover/scrub:h-2.5 relative">
              {/* Progress Fill (Indigo gradient) */}
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 relative"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Scrubber Thumb */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md shadow-indigo-600 ring-2 ring-indigo-500 transform scale-0 group-hover/scrub:scale-100 transition-transform" />
              </div>

              {/* Chapter Tick Markers on Timeline */}
              {duration > 0 &&
                chapters.map((ch) => {
                  const pct = (ch.startSeconds / duration) * 100;
                  const isChActive =
                    currentTime >= ch.startSeconds && currentTime <= ch.endSeconds;
                  return (
                    <div
                      key={ch.id}
                      style={{ left: `${pct}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        seekTo(ch.startSeconds, true);
                      }}
                      title={`${ch.timestampStr} - ${ch.title}`}
                      className={`absolute top-0 bottom-0 w-1 transform -translate-x-1/2 cursor-pointer z-10 transition-all ${
                        isChActive
                          ? "bg-emerald-400 shadow-sm shadow-emerald-400"
                          : "bg-white/40 hover:bg-emerald-400 hover:h-4"
                      }`}
                    />
                  );
                })}
            </div>

            {/* Hover Timecode Floating Preview */}
            {hoverTime !== null && (
              <div
                style={{ left: `${hoverX}px` }}
                className="absolute -top-8 -translate-x-1/2 rounded-md border border-[rgba(255,255,255,0.12)] bg-[#141a27] px-2 py-0.5 text-[11px] font-mono font-semibold text-emerald-300 shadow-xl pointer-events-none"
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          {/* Lower Control Bar */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Controls: Play, Jump, Time */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={togglePlay}
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5 fill-white" />
                )}
              </button>

              <button
                onClick={() => skip(-10)}
                title="Rewind 10s"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => skip(10)}
                title="Forward 10s"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>

              {/* Timecode display */}
              <div className="flex items-center font-mono text-xs text-slate-300 font-medium ml-1">
                <span className="text-white">{formatTime(currentTime)}</span>
                <span className="mx-1 text-slate-500">/</span>
                <span className="text-slate-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Volume, Speed, Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Volume */}
              <div className="group/volume relative flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  title={isMuted ? "Unmute" : "Mute"}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-rose-400" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="hidden h-1.5 w-16 accent-indigo-500 sm:block cursor-pointer opacity-70 hover:opacity-100"
                />
              </div>

              {/* Playback Speed Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  title="Playback Speed"
                  className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-mono font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  <Gauge className="h-3.5 w-3.5 text-slate-400" />
                  <span>{playbackRate}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-10 right-0 z-30 flex flex-col rounded-xl border border-[rgba(255,255,255,0.12)] bg-[#141a27] p-1.5 shadow-2xl">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleSpeedChange(rate)}
                        className={`rounded-lg px-3 py-1 text-left text-xs font-mono transition-all ${
                          playbackRate === rate
                            ? "bg-indigo-600 font-bold text-white"
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
