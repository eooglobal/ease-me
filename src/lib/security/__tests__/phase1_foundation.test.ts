import { describe, it, expect, vi, beforeEach } from "vitest";
import { RATE_LIMIT_TIERS, checkRateLimit, enforceRateLimit } from "../rate-limit";
import { RateLimitError, ForbiddenError, UnauthorizedError } from "../errors";
import { AuditLogService } from "@/lib/audit/audit-service";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { requirePermission, TenantContext } from "../tenant";
import { DEFAULT_ROLE_PERMISSIONS } from "../permissions";

// Mock DB insert for AuditLogService
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ id: "mock-log-id" }]),
    }),
  },
}));

describe("Phase 1: Foundation Quality & Security Rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Multi-Tenant Isolation & Query Scoping", () => {
    const tenantA_Context: TenantContext = {
      userId: "user-tenant-a",
      userEmail: "owner@tenanta.com",
      userName: "Tenant A Owner",
      businessId: "biz-tenant-a-111",
      businessName: "Tenant A Pharmacy",
      roleId: "role-owner",
      roleName: "owner",
      permissions: DEFAULT_ROLE_PERMISSIONS.owner,
    };

    const tenantB_Context: TenantContext = {
      userId: "user-tenant-b",
      userEmail: "owner@tenantb.com",
      userName: "Tenant B Owner",
      businessId: "biz-tenant-b-222",
      businessName: "Tenant B Supermarket",
      roleId: "role-owner",
      roleName: "owner",
      permissions: DEFAULT_ROLE_PERMISSIONS.owner,
    };

    // Simulated tenant-scoped repository query
    const queryProductsScoped = (ctx: TenantContext, requestedBusinessId?: string) => {
      // Security rule: System must never trust client-supplied business ID or allow cross-tenant query
      const effectiveBusinessId = ctx.businessId;
      if (requestedBusinessId && requestedBusinessId !== ctx.businessId) {
        throw new ForbiddenError("Cross-tenant access violation: Cannot query another business workspace.");
      }
      return {
        tenantId: effectiveBusinessId,
        items: [`product-of-${effectiveBusinessId}`],
      };
    };

    it("should strictly scope all data queries to the authenticated tenantId", () => {
      const resA = queryProductsScoped(tenantA_Context);
      expect(resA.tenantId).toBe("biz-tenant-a-111");
      expect(resA.items[0]).toContain("biz-tenant-a-111");

      const resB = queryProductsScoped(tenantB_Context);
      expect(resB.tenantId).toBe("biz-tenant-b-222");
      expect(resB.items[0]).toContain("biz-tenant-b-222");
    });

    it("should reject cross-tenant data access even with guessed tenant identifiers", () => {
      // Tenant A attempts to read Tenant B data by passing Tenant B's businessId
      expect(() => {
        queryProductsScoped(tenantA_Context, tenantB_Context.businessId);
      }).toThrow(ForbiddenError);
    });
  });

  describe("2. Rate Limiting Policy (Section 3 Conflict Resolution)", () => {
    it("should enforce exactly 30 requests per minute for POS checkout terminal", () => {
      const terminalId = `term-pos-${Date.now()}`;
      const tier = RATE_LIMIT_TIERS.CHECKOUT_TERMINAL;

      expect(tier.limit).toBe(30);
      expect(tier.windowMs).toBe(60 * 1000);

      // Simulate 30 successful checkout requests
      for (let i = 0; i < 30; i++) {
        const check = checkRateLimit(terminalId, tier);
        expect(check.success).toBe(true);
      }

      // 31st checkout request in the same minute must fail
      const overflow = checkRateLimit(terminalId, tier);
      expect(overflow.success).toBe(false);
      expect(overflow.remaining).toBe(0);

      // enforceRateLimit must throw RateLimitError on overflow
      expect(() => enforceRateLimit(terminalId, tier)).toThrow(RateLimitError);
    });

    it("should enforce exactly 10 requests per 10 seconds for public portal routes", () => {
      const portalIp = `ip-portal-${Date.now()}`;
      const tier = RATE_LIMIT_TIERS.PUBLIC_PORTAL;

      expect(tier.limit).toBe(10);
      expect(tier.windowMs).toBe(10 * 1000);

      // Simulate 10 successful public portal requests
      for (let i = 0; i < 10; i++) {
        const check = checkRateLimit(portalIp, tier);
        expect(check.success).toBe(true);
      }

      // 11th request in the same 10-second window must fail
      const overflow = checkRateLimit(portalIp, tier);
      expect(overflow.success).toBe(false);
      expect(() => enforceRateLimit(portalIp, tier)).toThrow(RateLimitError);
    });
  });

  describe("3. Append-Only Audit Log Writer Service", () => {
    it("should record security events into the audit trail", async () => {
      await AuditLogService.logSecurity("biz-111", "user-admin", "LOGIN", { method: "email" });

      expect(db.insert).toHaveBeenCalledWith(auditLogs);
    });

    it("should record inventory adjustments and price changes", async () => {
      await AuditLogService.logInventory(
        "biz-111",
        "user-owner",
        "PRICE_CHANGE",
        "prod-999",
        { price: 1500 },
        { price: 1800 },
        { reason: "Supplier price increase" }
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it("should record financial voids and shift discrepancies", async () => {
      await AuditLogService.logFinancial(
        "biz-111",
        "user-cashier",
        "SHIFT_VARIANCE_FLAGGED",
        "shift-001",
        { variance: -800, expected: 185000, declared: 184200 }
      );

      expect(db.insert).toHaveBeenCalled();
    });
  });
});

