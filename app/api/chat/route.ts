import { NextRequest, NextResponse } from "next/server";
import { ai, MODEL_NAME } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateChatSchema } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // 1. Rate Limiting Check (60 requests per minute per IP)
  const rateLimit = checkRateLimit(req, "chat", {
    maxRequests: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.success && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const rawBody: unknown = await req.json().catch(() => null);
    const parsed = validateChatSchema(rawBody);

    if (!parsed.success || !parsed.data) {
      return NextResponse.json(
        { error: parsed.error || "Invalid chat payload." },
        { status: 400 }
      );
    }

    const { question, transcriptText } = parsed.data;

    const rawApiKey = process.env.GEMINI_API_KEY || "";
    const cleanApiKey = rawApiKey
      .replace(/^GEMINI_API_KEY\s*=\s*/i, "")
      .trim()
      .replace(/^["']|["']$/g, "");
    const hasLiveApiKey =
      Boolean(cleanApiKey) &&
      cleanApiKey !== "AIzaSy..." &&
      cleanApiKey !== "your_gemini_api_key_here";

    const encoder = new TextEncoder();

    // 2. Fallback stream if no live API key is configured
    if (!hasLiveApiKey) {
      const STOP_WORDS = new Set([
        "what", "when", "where", "which", "who", "whom", "this", "that", "these", "those",
        "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
        "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or",
        "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against",
        "between", "into", "through", "during", "before", "after", "above", "below", "to", "from",
        "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once",
        "how", "why", "can", "could", "would", "should", "tell", "explain", "give"
      ]);

      const rawTokens = question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2);

      // Prioritize informative content tokens over generic query stopwords
      const informativeTokens = rawTokens.filter((t) => !STOP_WORDS.has(t));
      const qTokens = informativeTokens.length > 0 ? informativeTokens : rawTokens;

      const lines = transcriptText.split("\n");
      let bestLine = lines[0] || "[00:00] Video overview.";
      let maxMatches = 0;

      for (const line of lines) {
        const lineLower = line.toLowerCase();
        let matches = 0;
        for (const token of qTokens) {
          const stem = token.replace(/(ing|ed|s|es|ly)$/, "");
          if (lineLower.includes(token)) {
            matches += 2;
          } else if (stem.length >= 3 && lineLower.includes(stem)) {
            matches += 1;
          }
        }
        if (matches > maxMatches) {
          maxMatches = matches;
          bestLine = line;
        }
      }

      const tsMatch = bestLine.match(/\[(\d{1,2}:\d{2})\]/);
      const timestamp = tsMatch ? tsMatch[1] : "00:00";
      const cleanContent = bestLine.replace(/^\[\d{1,2}:\d{2}\]\s*(?:[^:]+:\s*)?/, "").trim();

      const fallbackReply = `At [${timestamp}], the discussion addresses this directly: "${cleanContent}". You can jump to [${timestamp}] in the video timeline to review this section in full context.`;

      const stream = new ReadableStream({
        async start(controller) {
          const words = fallbackReply.split(" ");
          for (let i = 0; i < words.length; i++) {
            const word = (i === 0 ? "" : " ") + words[i];
            controller.enqueue(encoder.encode(word));
            await new Promise((res) => setTimeout(res, 20));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // 3. Live Gemini 3.8 Flash Streaming with Grounded Citations
    const responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are an AI video copilot. Answer strictly based on the provided video transcript.
MANDATORY REQUIREMENT: You MUST cite exact timestamps formatted strictly as [MM:SS] (e.g., [01:15]) whenever making any factual claim or referencing moments in the video.

Transcript Context:
${transcriptText}

User Question:
${question}`,
            },
          ],
        },
      ],
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (streamErr: unknown) {
          const errText =
            streamErr instanceof Error ? streamErr.message : "Stream error occurred";
          controller.enqueue(encoder.encode(`\n\n[Copilot Error: ${errText}]`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to generate chat response";
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
