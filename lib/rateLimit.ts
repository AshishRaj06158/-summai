import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic memory garbage collection every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 300_000);
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  response?: NextResponse;
}

/**
 * Extracts client IP safely across proxies and direct connections
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * Sliding window rate limiter for Next.js API route handlers
 */
export function checkRateLimit(
  req: NextRequest,
  keyPrefix = "api",
  config: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 }
): RateLimitResult {
  const ip = getClientIp(req);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetMs: config.windowMs,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, config.maxRequests - record.count);
  const resetMs = Math.max(0, record.resetAt - now);

  if (record.count > config.maxRequests) {
    const retryAfterSec = Math.ceil(resetMs / 1000);
    const response = NextResponse.json(
      {
        error: "Too many requests. Please slow down and try again.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfterSec.toString(),
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(record.resetAt / 1000).toString(),
        },
      }
    );

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetMs,
      response,
    };
  }

  return {
    success: true,
    limit: config.maxRequests,
    remaining,
    resetMs,
  };
}
