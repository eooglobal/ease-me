import { describe, it, expect } from "vitest";
import { AppError, UnauthorizedError, ForbiddenError, formatErrorResponse } from "../errors";
import { checkRateLimit } from "../rate-limit";
import { SECURITY_HEADERS, applySecurityHeaders } from "../security-headers";
import { formatCurrency } from "../../utils";

describe("Security & Error Utilities", () => {
  it("should create well-formed AppErrors", () => {
    const unauth = new UnauthorizedError();
    expect(unauth.statusCode).toBe(401);
    expect(unauth.code).toBe("UNAUTHORIZED");

    const forbidden = new ForbiddenError();
    expect(forbidden.statusCode).toBe(403);
    expect(forbidden.code).toBe("FORBIDDEN");
  });

  it("should format error responses safely without leaking sensitive internals", () => {
    const appError = new AppError("Test message", 400, "BAD_REQUEST");
    const response = formatErrorResponse(appError);
    expect(response.success).toBe(false);
    expect(response.error.message).toBe("Test message");
    expect(response.error.code).toBe("BAD_REQUEST");
  });

  it("should enforce rate limit quotas correctly", () => {
    const testId = `test-ip-${Date.now()}`;
    const opts = { limit: 3, windowMs: 10000 };

    expect(checkRateLimit(testId, opts).success).toBe(true);
    expect(checkRateLimit(testId, opts).success).toBe(true);
    expect(checkRateLimit(testId, opts).success).toBe(true);
    // 4th request should fail
    expect(checkRateLimit(testId, opts).success).toBe(false);
  });

  it("should apply security headers correctly", () => {
    const headers = new Headers();
    applySecurityHeaders(headers);

    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("should format currency consistently", () => {
    expect(formatCurrency(1000, "NGN")).toContain("1,000.00");
  });
});
