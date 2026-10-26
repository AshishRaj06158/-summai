"use client";

import { useEffect } from "react";

const UTM_STORAGE_KEY = "summai_utm_params";

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  ref?: string;
  timestamp?: number;
}

/**
 * Captures UTM parameters and ref from window.location and stores them in sessionStorage
 */
export function captureUtmParameters(): UtmParams | null {
  if (typeof window === "undefined") return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");
    const utmTerm = params.get("utm_term");
    const utmContent = params.get("utm_content");
    const ref = params.get("ref");

    if (utmSource || utmMedium || utmCampaign || ref) {
      const captured: UtmParams = {
        ...(utmSource ? { utm_source: utmSource } : {}),
        ...(utmMedium ? { utm_medium: utmMedium } : {}),
        ...(utmCampaign ? { utm_campaign: utmCampaign } : {}),
        ...(utmTerm ? { utm_term: utmTerm } : {}),
        ...(utmContent ? { utm_content: utmContent } : {}),
        ...(ref ? { ref } : {}),
        timestamp: Date.now(),
      };
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(captured));
      return captured;
    }

    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UtmParams;
    }
  } catch {
    // SessionStorage fallback
  }

  return null;
}

/**
 * Appends preserved UTM & ref parameters to internal navigation URLs
 */
export function appendPreservedUtmParams(targetUrl: string): string {
  if (typeof window === "undefined") return targetUrl;

  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return targetUrl;

    const utm = JSON.parse(stored) as UtmParams;
    const [baseUrl, existingSearch] = targetUrl.split("?");
    const params = new URLSearchParams(existingSearch || "");

    if (utm.utm_source && !params.has("utm_source")) params.set("utm_source", utm.utm_source);
    if (utm.utm_medium && !params.has("utm_medium")) params.set("utm_medium", utm.utm_medium);
    if (utm.utm_campaign && !params.has("utm_campaign")) params.set("utm_campaign", utm.utm_campaign);
    if (utm.utm_term && !params.has("utm_term")) params.set("utm_term", utm.utm_term);
    if (utm.utm_content && !params.has("utm_content")) params.set("utm_content", utm.utm_content);
    if (utm.ref && !params.has("ref")) params.set("ref", utm.ref);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  } catch {
    return targetUrl;
  }
}

/**
 * Hook to automatically preserve UTM parameters across route navigation
 */
export function useUtmPreservation(): void {
  useEffect(() => {
    captureUtmParameters();
  }, []);
}
