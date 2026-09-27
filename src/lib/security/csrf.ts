import { NextRequest } from "next/server";
import { ForbiddenError } from "./errors";

/**
 * Validates request origin against trusted app URLs for state-changing requests (POST, PUT, PATCH, DELETE)
 */
export function validateCsrfOrigin(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin) {
    // Some server-to-server or same-origin direct calls might omit Origin; check Referer
    const referer = req.headers.get("referer");
    if (!referer) {
      // In development, allow non-browser clients (e.g. Postman, curl)
      return process.env.NODE_ENV === "development";
    }
    
    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export function enforceCsrf(req: NextRequest): void {
  if (!validateCsrfOrigin(req)) {
    throw new ForbiddenError("Cross-Site Request Forgery (CSRF) validation failed.");
  }
}
