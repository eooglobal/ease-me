import { RateLimitError } from "./errors";
import { PlatformRateLimitService } from "@/lib/superadmin/platform-config-service";

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
  CHECKOUT_TERMINAL: { limit: 30, windowMs: 60 * 1000 }, // 30 reqs / 1 min per cashier terminal (Section 3 decision)
  PUBLIC_PORTAL: { limit: 10, windowMs: 10 * 1000 }, // 10 reqs / 10s per IP for public portal routes (Section 3 decision)
} as const;

/**
 * Checks rate limit for an identifier (e.g. IP + endpoint)
 * Dynamically adapts to effective limits configured via Super Admin (Section 6.8).
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = RATE_LIMIT_TIERS.NORMAL_API
): { success: boolean; remaining: number; resetTime: number } {
  // Check if options correspond to dynamically configured limits
  let effectiveOptions = options;
  if (options === RATE_LIMIT_TIERS.CHECKOUT_TERMINAL) {
    effectiveOptions = PlatformRateLimitService.getEffectiveLimit("checkout");
  } else if (options === RATE_LIMIT_TIERS.PUBLIC_PORTAL) {
    effectiveOptions = PlatformRateLimitService.getEffectiveLimit("portal");
  } else if (options === RATE_LIMIT_TIERS.STRICT_AUTH) {
    effectiveOptions = PlatformRateLimitService.getEffectiveLimit("auth");
  }

  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + effectiveOptions.windowMs,
    });
    return {
      success: true,
      remaining: effectiveOptions.limit - 1,
      resetTime: now + effectiveOptions.windowMs,
    };
  }

  if (record.count >= effectiveOptions.limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: effectiveOptions.limit - record.count,
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
