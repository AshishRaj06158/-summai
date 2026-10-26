export interface VideoChapter {
  id: string;
  title: string;
  startSeconds: number;
  endSeconds: number;
  timestampStr: string;
  summary: string;
  keyPoints: string[];
  confidenceScore?: number;
}

export interface ActionItem {
  id: string;
  task: string;
  timestampSeconds: number;
  timestampStr: string;
  priority: "high" | "medium" | "low";
  completed?: boolean;
}

export interface TranscriptItem {
  id: string;
  startSeconds: number;
  endSeconds: number;
  timestampStr: string;
  speaker: string;
  text: string;
}

export interface VideoTelemetry {
  modelName: string;
  processingMode: string;
  totalTokens: number;
  promptTokens: number;
  candidateTokens: number;
  latencyMs: number;
  efficiencyGainPercent: number;
  timestampPrecision: string;
}

export interface VideoIntelligence {
  id: string;
  title: string;
  sourceUrl?: string;
  durationSeconds: number;
  durationStr: string;
  executiveSummary: string;
  keyTakeaways: string[];
  chapters: VideoChapter[];
  actionItems: ActionItem[];
  transcript: TranscriptItem[];
  telemetry: VideoTelemetry;
  tags: string[];
}

export interface VideoPlayerHandle {
  seekTo: (seconds: number, autoplay?: boolean) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

export interface PresetVideo {
  id: string;
  title: string;
  description: string;
  durationStr: string;
  videoUrl: string;
  intelligence: VideoIntelligence;
}
