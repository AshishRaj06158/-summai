import { GoogleGenAI } from "@google/genai";

const rawKey = process.env.GEMINI_API_KEY || "";
const cleanApiKey = rawKey
  .replace(/^GEMINI_API_KEY\s*=\s*/i, "")
  .trim()
  .replace(/^["']|["']$/g, "");

export const ai = new GoogleGenAI(cleanApiKey ? { apiKey: cleanApiKey } : {});
export const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
