import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { PlatformPermissionEngine } from "@/lib/superadmin/permission-engine";
import { performSignOut, authClient } from "@/lib/auth/auth-client";

describe("Access Gating, Route Protection & Login Processing Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Middleware Route Protection & Authentication Gating", () => {
    const createMockRequest = (pathname: string, cookies: Record<string, string> = {}) => {
      const url = `https://app.easeme.ng${pathname}`;
      const cookieHeader = Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");

      return new NextRequest(url, {
        headers: cookieHeader ? { cookie: cookieHeader } : {},
      });
    };

    it("allows public routes without authentication", () => {
      const publicPaths = ["/login", "/signup", "/maintenance", "/locked", "/not-authorised"];

      for (const path of publicPaths) {
        const req = createMockRequest(path);
        const res = middleware(req);
        // Does not redirect
        expect(res.status).toBe(200);
      }
    });

    it("redirects unauthenticated requests on protected routes to /login with callbackUrl", () => {
      const protectedPaths = ["/owner", "/manager", "/pos", "/portal", "/superadmin", "/account"];

      for (const path of protectedPaths) {
        const req = createMockRequest(path);
        const res = middleware(req);

        expect(res.status).toBe(307); // NextResponse.redirect status
        const location = res.headers.get("location");
        expect(location).toContain("/login");
        expect(location).toContain(`callbackUrl=${encodeURIComponent(path)}`);
      }
    });

    it("enforces role boundaries: Cashiers are confined to POS and denied owner/manager/superadmin routes", () => {
      // Cashier accessing /pos is allowed
      const posReq = createMockRequest("/pos", { ease_me_role: "cashier" });
      const posRes = middleware(posReq);
      expect(posRes.status).toBe(200);

      // Cashier accessing /owner is denied -> /not-authorised
      const ownerReq = createMockRequest("/owner", { ease_me_role: "cashier" });
      const ownerRes = middleware(ownerReq);
      expect(ownerRes.status).toBe(307);
      expect(ownerRes.headers.get("location")).toContain("/not-authorised");

      // Cashier accessing /manager is denied
      const mgrReq = createMockRequest("/manager", { ease_me_role: "cashier" });
      const mgrRes = middleware(mgrReq);
      expect(mgrRes.status).toBe(307);
      expect(mgrRes.headers.get("location")).toContain("/not-authorised");

      // Cashier accessing /superadmin is denied
      const saReq = createMockRequest("/superadmin", { ease_me_role: "cashier" });
      const saRes = middleware(saReq);
      expect(saRes.status).toBe(307);
      expect(saRes.headers.get("location")).toContain("/not-authorised");
    });

    it("enforces role boundaries: Store Managers can access /manager and /pos, but not /owner or /superadmin", () => {
      const mgrReq = createMockRequest("/manager", { ease_me_role: "manager" });
      expect(middleware(mgrReq).status).toBe(200);

      const posReq = createMockRequest("/pos", { ease_me_role: "manager" });
      expect(middleware(posReq).status).toBe(200);

      const ownerReq = createMockRequest("/owner", { ease_me_role: "manager" });
      const ownerRes = middleware(ownerReq);
      expect(ownerRes.status).toBe(307);
      expect(ownerRes.headers.get("location")).toContain("/not-authorised");

      const saReq = createMockRequest("/superadmin", { ease_me_role: "manager" });
      const saRes = middleware(saReq);
      expect(saRes.status).toBe(307);
      expect(saRes.headers.get("location")).toContain("/not-authorised");
    });

    it("enforces role boundaries: Store Owners can access /owner, /manager, and /pos, but not /superadmin", () => {
      const ownerReq = createMockRequest("/owner", { ease_me_role: "owner" });
      expect(middleware(ownerReq).status).toBe(200);

      const mgrReq = createMockRequest("/manager", { ease_me_role: "owner" });
      expect(middleware(mgrReq).status).toBe(200);

      const posReq = createMockRequest("/pos", { ease_me_role: "owner" });
      expect(middleware(posReq).status).toBe(200);

      const saReq = createMockRequest("/superadmin", { ease_me_role: "owner" });
      const saRes = middleware(saReq);
      expect(saRes.status).toBe(307);
      expect(saRes.headers.get("location")).toContain("/not-authorised");
    });

    it("enforces role boundaries: Customers are restricted to /portal only", () => {
      const portalReq = createMockRequest("/portal", { ease_me_role: "customer" });
      expect(middleware(portalReq).status).toBe(200);

      const posReq = createMockRequest("/pos", { ease_me_role: "customer" });
      expect(middleware(posReq).status).toBe(307);
      expect(middleware(posReq).headers.get("location")).toContain("/not-authorised");
    });

    it("allows platform staff roles into /superadmin", () => {
      const staffRoles = ["super_admin", "finance", "support_agent", "security", "auditor", "content"];

      for (const role of staffRoles) {
        const req = createMockRequest("/superadmin", { ease_me_role: role });
        expect(middleware(req).status).toBe(200);
      }
    });
  });

  describe("Deep Super Admin Role-Level Route Permissions (Section 3 & 5)", () => {
    it("permits Platform Owner access across all console areas", () => {
      const routes = [
        "/superadmin",
        "/superadmin/analytics",
        "/superadmin/tenants",
        "/superadmin/plans",
        "/superadmin/billing",
        "/superadmin/approvals",
        "/superadmin/content/legal",
        "/superadmin/settings",
        "/superadmin/security",
        "/superadmin/staff",
      ];

      for (const route of routes) {
        expect(PlatformPermissionEngine.canAccessRoute("owner", route)).toBe(true);
      }
    });

    it("restricts Analyst from operational, security, and staff management areas", () => {
      // Allowed
      expect(PlatformPermissionEngine.canAccessRoute("analyst", "/superadmin/analytics")).toBe(true);
      expect(PlatformPermissionEngine.canAccessRoute("analyst", "/superadmin/health")).toBe(true);
      expect(PlatformPermissionEngine.canAccessRoute("analyst", "/superadmin/plans")).toBe(true);

      // Forbidden
      expect(PlatformPermissionEngine.canAccessRoute("analyst", "/superadmin/staff")).toBe(false);
      expect(PlatformPermissionEngine.canAccessRoute("analyst", "/superadmin/security")).toBe(false);
      expect(PlatformPermissionEngine.canAccessRoute("analyst", "/superadmin/compliance")).toBe(false);
      expect(PlatformPermissionEngine.canAccessRoute("analyst", "/superadmin/settings")).toBe(false);
    });

    it("restricts Content Editor to content areas only", () => {
      // Allowed
      expect(PlatformPermissionEngine.canAccessRoute("content", "/superadmin/content/announcements")).toBe(true);
      expect(PlatformPermissionEngine.canAccessRoute("content", "/superadmin/content/legal")).toBe(true);
      expect(PlatformPermissionEngine.canAccessRoute("content", "/superadmin/content/templates")).toBe(true);

      // Forbidden
      expect(PlatformPermissionEngine.canAccessRoute("content", "/superadmin/billing")).toBe(false);
      expect(PlatformPermissionEngine.canAccessRoute("content", "/superadmin/tenants")).toBe(false);
      expect(PlatformPermissionEngine.canAccessRoute("content", "/superadmin/plans")).toBe(false);
      expect(PlatformPermissionEngine.canAccessRoute("content", "/superadmin/staff")).toBe(false);
      expect(PlatformPermissionEngine.canAccessRoute("content", "/superadmin/security")).toBe(false);
    });

    it("restricts Support Agent to support tickets and help center", () => {
      // Allowed
      expect(PlatformPermissionEngine.canAccessRoute("support_agent", "/superadmin/support")).toBe(true);
      expect(PlatformPermissionEngine.canAccessRoute("support_agent", "/superadmin/content/helpcenter")).toBe(true);

      // Forbidden
      expect(PlatformPermissionEngine.canAccessRoute("support_agent", "/superadmin/plans")).toBe(false);
      expect(PlatformPermissionEngine.canAccessRoute("support_agent", "/superadmin/billing")).toBe(false);
      expect(PlatformPermissionEngine.canAccessRoute("support_agent", "/superadmin/security")).toBe(false);
      expect(PlatformPermissionEngine.canAccessRoute("support_agent", "/superadmin/staff")).toBe(false);
    });
  });

  describe("Sign-Out Invalidation Protocol", () => {
    it("clears cookies and browser storage on performSignOut()", async () => {
      // Mock document and localStorage
      const cookieMap: Record<string, string> = {
        ease_me_role: "owner",
        ease_me_session: "valid-token-123",
      };

      const storageMap: Record<string, string> = {
        ease_me_logged_in: "true",
        ease_me_active_role: "owner",
        ease_me_platform_role: "owner",
        ease_me_user_email: "owner@easeme.ng",
      };

      const originalDocument = global.document;
      const originalLocalStorage = global.localStorage;

      // Mock client environment
      (global as any).document = {
        get cookie() {
          return Object.entries(cookieMap)
            .map(([k, v]) => `${k}=${v}`)
            .join("; ");
        },
        set cookie(val: string) {
          const [pair] = val.split(";");
          const [k, v] = pair.split("=");
          if (val.includes("max-age=0")) {
            delete cookieMap[k.trim()];
          } else {
            cookieMap[k.trim()] = v ? v.trim() : "";
          }
        },
      };

      (global as any).localStorage = {
        getItem: (k: string) => storageMap[k] || null,
        setItem: (k: string, v: string) => {
          storageMap[k] = v;
        },
        removeItem: (k: string) => {
          delete storageMap[k];
        },
      };

      await performSignOut();

      // Cookies should be removed
      expect(cookieMap["ease_me_role"]).toBeUndefined();
      expect(cookieMap["ease_me_session"]).toBeUndefined();

      // Storage keys should be removed
      expect(storageMap["ease_me_logged_in"]).toBeUndefined();
      expect(storageMap["ease_me_active_role"]).toBeUndefined();
      expect(storageMap["ease_me_platform_role"]).toBeUndefined();
      expect(storageMap["ease_me_user_email"]).toBeUndefined();

      global.document = originalDocument;
      global.localStorage = originalLocalStorage;
    });
  });
});
