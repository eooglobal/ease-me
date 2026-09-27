import { RateLimitError } from "./errors";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window store (suitable for single-node / VPS Coolify container, interface ready for Redis)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit: number; // Max requests
  windowMs: number; // Time window in milliseconds
}

export const RATE_LIMIT_TIERS = {
  STRICT_AUTH: { limit: 5, windowMs: 60 * 1000 }, // 5 reqs / 1 min (Login, password reset, OTP)
  MODERATE_PUBLIC: { limit: 20, windowMs: 60 * 1000 }, // 20 reqs / 1 min (Register, public forms)
  NORMAL_API: { limit: 120, windowMs: 60 * 1000 }, // 120 reqs / 1 min (Sales, inventory, normal API)
  RESTRICTED_REPORTS: { limit: 15, windowMs: 60 * 1000 }, // 15 reqs / 1 min (Heavy reports, exports)
} as const;

/**
 * Checks rate limit for an identifier (e.g. IP + endpoint)
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_TIERS.NORMAL_API
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      success: true,
      remaining: options.limit - 1,
      resetTime: now + options.windowMs,
    };
  }

  if (record.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: options.limit - record.count,
    resetTime: record.resetTime,
  };
}

export function enforceRateLimit(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_TIERS.NORMAL_API
): void {
  const result = checkRateLimit(identifier, options);
  if (!result.success) {
    throw new RateLimitError();
  }
}
