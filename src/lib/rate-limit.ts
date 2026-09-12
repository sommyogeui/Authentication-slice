import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

export interface RateLimitThreshold {
  limit: number;
  windowSeconds: number;
}

/**
 * Rate-limit thresholds. Sensible production defaults are set below;
 * adjust these values (or move them to environment variables) before go-live.
 */
export const RATE_LIMIT_THRESHOLDS: {
  SIGN_IN: RateLimitThreshold;
  SIGN_UP: RateLimitThreshold;
  FORGOT_PASSWORD: RateLimitThreshold;
  RESEND_VERIFICATION: RateLimitThreshold;
  VERIFY_EMAIL: RateLimitThreshold;
  RESET_PASSWORD: RateLimitThreshold;
} = {
  SIGN_IN: { limit: 10, windowSeconds: 900 },
  SIGN_UP: { limit: 5, windowSeconds: 3600 },
  FORGOT_PASSWORD: { limit: 5, windowSeconds: 3600 },
  RESEND_VERIFICATION: { limit: 5, windowSeconds: 3600 },
  VERIFY_EMAIL: { limit: 10, windowSeconds: 900 },
  RESET_PASSWORD: { limit: 5, windowSeconds: 3600 },
};

/**
 * Extracts client IP address from incoming request headers.
 */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headerList.get("x-real-ip") || "127.0.0.1";
}

/**
 * Server-side rate limiter stored in PostgreSQL via Prisma.
 * Uses a fixed/sliding window counter per unique key.
 */
export async function checkRateLimit(
  key: string,
  threshold: RateLimitThreshold
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = threshold;
  const now = new Date();

  try {
    const existing = await prisma.rateLimit.findUnique({
      where: { key },
    });

    // If no record exists or previous window has expired, start a new window
    if (!existing || existing.expiresAt <= now) {
      const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
      await prisma.rateLimit.upsert({
        where: { key },
        update: { count: 1, expiresAt },
        create: { key, count: 1, expiresAt },
      });

      return {
        success: true,
        remaining: Math.max(0, limit - 1),
        resetAt: expiresAt,
      };
    }

    // If limit exceeded within current window
    if (existing.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetAt: existing.expiresAt,
      };
    }

    // Increment count within active window
    const updated = await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return {
      success: true,
      remaining: Math.max(0, limit - updated.count),
      resetAt: existing.expiresAt,
    };
  } catch (error) {
    console.error("[Rate Limit DB Error]:", error);
    // Fail open in case of DB connectivity glitch so legitimate users aren't locked out
    return {
      success: true,
      remaining: 1,
      resetAt: new Date(now.getTime() + windowSeconds * 1000),
    };
  }
}
