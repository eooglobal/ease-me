import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security/security-headers";
import { PlatformSettingsService } from "@/lib/superadmin/platform-config-service";

// Define public route prefixes that do not require authentication
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/onboarding",
  "/locked",
  "/not-authorised",
  "/maintenance",
  "/api/auth",
  "/api/webhooks",
];

// Define role-specific route prefixes and their authorized roles
const ROLE_ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/superadmin": [
    "super_admin",
    "platform_owner",
    "admin",
    "finance",
    "support_lead",
    "support_agent",
    "content",
    "security",
    "engineer",
    "auditor",
    "analyst",
  ],
  "/owner": ["owner", "business_owner"],
  "/manager": ["manager", "admin", "owner", "business_owner"],
  "/pos": ["cashier", "manager", "admin", "owner", "business_owner"],
  "/portal": ["customer"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. Always apply security headers
  applySecurityHeaders(response.headers);

  // 2. Bypass public paths and static assets
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
  if (isPublic || pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return response;
  }

  // 3. Inspect session token cookies
  const sessionToken =
    request.cookies.get("ease_me.session_token")?.value ||
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("ease_me_session")?.value;

  // Check for role cookie
  const roleCookie = request.cookies.get("ease_me_role")?.value;

  // Maintenance mode interceptor (Section 6.8 & Section 11: blocks tenants, admits staff)
  if (PlatformSettingsService.isMaintenanceActive() && pathname !== "/maintenance") {
    const isStaff =
      pathname.startsWith("/superadmin") ||
      (roleCookie ? ROLE_ROUTE_PERMISSIONS["/superadmin"].includes(roleCookie) : false);

    if (!isStaff) {
      const maintenanceUrl = new URL("/maintenance", request.url);
      const redirectResponse = NextResponse.redirect(maintenanceUrl);
      applySecurityHeaders(redirectResponse.headers);
      return redirectResponse;
    }
  }

  // 4. If visiting protected routes without session or role, redirect to /login
  const isProtectedRoute =
    pathname.startsWith("/owner") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/superadmin") ||
    pathname.startsWith("/account");

  if (isProtectedRoute && !sessionToken && !roleCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    applySecurityHeaders(redirectResponse.headers);
    return redirectResponse;
  }

  // 5. Role-based boundary enforcement (when roleCookie is present)
  if (roleCookie) {
    for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTE_PERMISSIONS)) {
      if (pathname === prefix || pathname.startsWith(prefix + "/")) {
        const isAllowed = allowedRoles.includes(roleCookie);

        if (!isAllowed) {
          const deniedUrl = new URL("/not-authorised", request.url);
          const redirectResponse = NextResponse.redirect(deniedUrl);
          applySecurityHeaders(redirectResponse.headers);
          return redirectResponse;
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
