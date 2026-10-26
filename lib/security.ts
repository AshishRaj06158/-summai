/**
 * Application Security & Input Sanitization Engine for SummAI
 */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254", // AWS/GCP metadata service
  "metadata.google.internal",
]);

// Private IPv4 regex (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8)
const PRIVATE_IP_REGEX =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/;

/**
 * Strips HTML tags and controls characters to prevent XSS and formatting injections.
 */
export function sanitizeText(input: unknown, maxLength = 5000): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[<>]/g, "") // Strip HTML angle brackets
    .slice(0, maxLength)
    .trim();
}

/**
 * Validates and sanitizes incoming video URLs against SSRF, dangerous protocols, and injection.
 */
export function validateAndSanitizeVideoUrl(rawUrl: unknown): {
  isValid: boolean;
  sanitizedUrl: string;
  error?: string;
} {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return { isValid: false, sanitizedUrl: "", error: "Video URL is required." };
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return { isValid: false, sanitizedUrl: "", error: "Malformed video URL format." };
  }

  // Enforce HTTPS or HTTP
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return {
      isValid: false,
      sanitizedUrl: "",
      error: "Only HTTP and HTTPS protocols are allowed.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // SSRF Protection: Block localhost, metadata services, and internal IP addresses
  if (BLOCKED_HOSTS.has(hostname) || PRIVATE_IP_REGEX.test(hostname)) {
    return {
      isValid: false,
      sanitizedUrl: "",
      error: "Access to private or internal network resources is blocked.",
    };
  }

  // Validate allowed platforms / video extensions
  const isYouTube =
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtu.be";

  const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(parsed.pathname);

  if (!isYouTube && !isDirectVideo) {
    return {
      isValid: false,
      sanitizedUrl: "",
      error: "Only valid YouTube links or direct video files (.mp4, .webm, .mov) are supported.",
    };
  }

  return { isValid: true, sanitizedUrl: parsed.href };
}

/**
 * Deep check to guard against Prototype Pollution
 */
export function guardPrototypePollution(obj: unknown): void {
  if (!obj || typeof obj !== "object") return;

  const forbidden = ["__proto__", "constructor", "prototype"];
  for (const key of forbidden) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      delete (obj as Record<string, unknown>)[key];
    }
  }

  // Recursively sanitize nested objects
  for (const val of Object.values(obj as Record<string, unknown>)) {
    if (val && typeof val === "object") {
      guardPrototypePollution(val);
    }
  }
}

/**
 * Validates and parses the /api/summarize request body
 */
export interface ValidatedSummarizePayload {
  url: string;
  videoId?: string;
  length: "short" | "medium" | "detailed";
  language: string;
  mode?: "quick" | "actions" | "flashcards" | "chat" | "notes";
  lang?: string;
  customApiKey?: string;
  userPrompt?: string;
}

export function validateSummarizeSchema(rawBody: unknown): {
  success: boolean;
  data?: ValidatedSummarizePayload;
  error?: string;
} {
  if (!rawBody || typeof rawBody !== "object") {
    return { success: false, error: "Request payload must be a valid JSON object." };
  }

  guardPrototypePollution(rawBody);
  const body = rawBody as Record<string, unknown>;

  const rawUrl =
    body.url ||
    body.videoUrl ||
    (typeof body.videoId === "string" && body.videoId.trim()
      ? `https://www.youtube.com/watch?v=${body.videoId.trim()}`
      : undefined);

  const urlValidation = validateAndSanitizeVideoUrl(rawUrl);
  if (!urlValidation.isValid) {
    return { success: false, error: urlValidation.error || "Invalid video URL" };
  }

  // Validate mode parameter (quick / actions / flashcards / chat / notes)
  const rawMode = typeof body.mode === "string" ? body.mode.toLowerCase().trim() : undefined;
  const mode =
    rawMode === "actions" ||
    rawMode === "flashcards" ||
    rawMode === "chat" ||
    rawMode === "quick" ||
    rawMode === "notes"
      ? (rawMode as ValidatedSummarizePayload["mode"])
      : "quick";

  // Validate length enum
  const rawLength = typeof body.length === "string" ? body.length.toLowerCase().trim() : "medium";
  const length: "short" | "medium" | "detailed" =
    rawLength === "short" || rawLength === "detailed" ? rawLength : "medium";

  // Validate output language parameter (auto, hinglish, hi, en, es, ja, etc.)
  const rawLangInput = body.lang || body.targetLang || body.language;
  let lang = "auto";
  if (typeof rawLangInput === "string") {
    const trimmedLang = rawLangInput.trim().toLowerCase();
    if (/^[a-z0-9_-]{2,15}$/i.test(trimmedLang)) {
      lang = trimmedLang;
    }
  }

  // Validate fallback language code (e.g. en, es, fr, zh, ja, etc.)
  const rawLang = typeof body.language === "string" ? body.language.trim() : "en";
  const language = /^[a-z]{2,5}(-[a-z0-9]{2,5})?$/i.test(rawLang)
    ? sanitizeText(rawLang, 10)
    : "en";

  // Validate custom API key format if present
  let customApiKey: string | undefined = undefined;
  if (typeof body.apiKey === "string" && body.apiKey.trim()) {
    const cleaned = body.apiKey.trim();
    if (cleaned.length > 200) {
      return { success: false, error: "API key format is invalid." };
    }
    customApiKey = cleaned;
  }

  const userPrompt =
    typeof body.userPrompt === "string"
      ? sanitizeText(body.userPrompt, 1000)
      : undefined;

  const videoId =
    typeof body.videoId === "string" && body.videoId.trim()
      ? sanitizeText(body.videoId, 50)
      : undefined;

  return {
    success: true,
    data: {
      url: urlValidation.sanitizedUrl,
      videoId,
      length,
      language,
      mode,
      lang,
      customApiKey,
      userPrompt,
    },
  };
}

/**
 * Validates and parses the /api/chat request body
 */
export interface ValidatedChatPayload {
  question: string;
  transcriptText: string;
}

export function validateChatSchema(rawBody: unknown): {
  success: boolean;
  data?: ValidatedChatPayload;
  error?: string;
} {
  if (!rawBody || typeof rawBody !== "object") {
    return { success: false, error: "Request payload must be a valid JSON object." };
  }

  guardPrototypePollution(rawBody);
  const body = rawBody as Record<string, unknown>;

  if (typeof body.question !== "string" || !body.question.trim()) {
    return { success: false, error: "User question is required and must be non-empty." };
  }

  if (typeof body.transcriptText !== "string" || !body.transcriptText.trim()) {
    return { success: false, error: "Transcript context is required and must be non-empty." };
  }

  const question = sanitizeText(body.question, 1000);
  if (!question) {
    return { success: false, error: "User question cannot be empty after sanitization." };
  }

  const transcriptText = sanitizeText(body.transcriptText, 60000);

  return {
    success: true,
    data: {
      question,
      transcriptText,
    },
  };
}
