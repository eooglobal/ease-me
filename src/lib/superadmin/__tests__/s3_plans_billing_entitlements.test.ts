import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import { CommercialBillingService } from "../commercial-billing-service";
import { PlatformApprovalEngine } from "../approval-engine";
import { PlatformAuditLogger } from "../audit-logger";
import { PlatformStaffContext } from "../permission-engine";
import { ForbiddenError, ValidationError } from "@/lib/security/errors";

describe("Step S3: Plans, Entitlement Service, Webhooks & Commercial Billing", () => {
  const ownerStaff: PlatformStaffContext = {
    id: "usr-owner-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  const financeStaff: PlatformStaffContext = {
    id: "usr-fin-01",
    name: "Ngozi Adeleke",
    email: "ngozi.adeleke@easeme.ng",
    role: "finance",
  };

  const supportStaff: PlatformStaffContext = {
    id: "usr-sup-01",
    name: "Tunde Bakare",
    email: "tunde.bakare@easeme.ng",
    role: "support_agent",
  };

  const contentStaff: PlatformStaffContext = {
    id: "usr-cnt-01",
    name: "Fatima Bello",
    email: "fatima.bello@easeme.ng",
    role: "content",
  };

  beforeEach(() => {
    PlatformAuditLogger.clearForTesting();
    PlatformApprovalEngine.clearForTesting();
  });

  /*
  |--------------------------------------------------------------------------
  | 1. Server-Side Entitlement Guard (Section 6.4 & 11)
  | "A tenant plan limit holds when the API is called directly. Starter tenant
  | cannot exceed its product limit by calling the API directly."
  |--------------------------------------------------------------------------
  */
  describe("1. Server-Side Entitlement Guard", () => {
    it("allows Starter tenant within product quota (<= 250 products)", () => {
      expect(() => {
        CommercialBillingService.enforceProductQuota("Starter", 150);
      }).not.toThrow();

      expect(() => {
        CommercialBillingService.enforceProductQuota("Starter", 249);
      }).not.toThrow();
    });

    it("rejects Starter tenant attempting to exceed 250 products directly via server guard", () => {
      expect(() => {
        CommercialBillingService.enforceProductQuota("Starter", 250);
      }).toThrowError(ForbiddenError);

      expect(() => {
        CommercialBillingService.enforceProductQuota("Starter", 251);
      }).toThrowError(/limited to 250 catalog products/i);
    });

    it("allows Growth tenant to have up to 1000 products", () => {
      expect(() => {
        CommercialBillingService.enforceProductQuota("Growth", 500);
      }).not.toThrow();

      expect(() => {
        CommercialBillingService.enforceProductQuota("Growth", 1000);
      }).toThrowError(ForbiddenError);
    });

    it("enforces user seat limits on the server", () => {
      expect(() => {
        CommercialBillingService.enforceUserQuota("Starter", 1);
      }).not.toThrow();

      expect(() => {
        CommercialBillingService.enforceUserQuota("Starter", 2);
      }).toThrowError(ForbiddenError);
    });

    it("enforces plan feature switches on the server (e.g. batch tracking not in Starter)", () => {
      expect(() => {
        CommercialBillingService.enforceFeatureSwitch("Starter", "batchTracking");
      }).toThrowError(ForbiddenError);

      expect(() => {
        CommercialBillingService.enforceFeatureSwitch("Growth", "batchTracking");
      }).not.toThrow();
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 2. Plan Price Revision Dual Control (Section 4 & 6.4)
  | Changing plan price is a sensitive action that requires dual-control approval.
  |--------------------------------------------------------------------------
  */
  describe("2. Plan Price Revision & Dual Control", () => {
    it("intercepts plan price updates and submits to dual-control approval queue", async () => {
      const res = await CommercialBillingService.updatePlanPrice(
        "plan-starter",
        18000,
        180000,
        ownerStaff
      );

      expect(res.status).toBe("pending_approval");
      expect(res.approvalRequestId).toBeDefined();

      const requests = PlatformApprovalEngine.listRequests();
      const req = requests.find((r) => r.id === res.approvalRequestId);
      expect(req).toBeDefined();
      expect(req?.actionKey).toBe("plans:price_change");
      expect(req?.entityType).toBe("plan");
      expect(req?.requesterId).toBe(ownerStaff.id);
      expect(req?.beforeState?.monthlyPrice).toBe(15000);
      expect(req?.afterState.monthlyPrice).toBe(18000);
    });

    it("prevents the requester from approving their own plan price change", async () => {
      const res = await CommercialBillingService.updatePlanPrice(
        "plan-growth",
        32000,
        320000,
        ownerStaff
      );

      await expect(
        PlatformApprovalEngine.evaluateRequest({
          requestId: res.approvalRequestId!,
          actorId: ownerStaff.id,
          actorName: ownerStaff.name,
          actorEmail: ownerStaff.email,
          actorRole: ownerStaff.role,
          decision: "approve",
        })
      ).rejects.toThrowError(ForbiddenError);
    });

    it("allows a second authorized staff member to approve the plan price change", async () => {
      const res = await CommercialBillingService.updatePlanPrice(
        "plan-growth",
        32000,
        320000,
        ownerStaff
      );

      const decision = await PlatformApprovalEngine.evaluateRequest({
        requestId: res.approvalRequestId!,
        actorId: financeStaff.id,
        actorName: financeStaff.name,
        actorEmail: financeStaff.email,
        actorRole: financeStaff.role,
        decision: "approve",
      });

      expect(decision.request.status).toBe("approved");
      expect(decision.request.approverId).toBe(financeStaff.id);
    });

    it("rejects non-positive plan prices with ValidationError", async () => {
      await expect(
        CommercialBillingService.updatePlanPrice("plan-starter", 0, 150000, ownerStaff)
      ).rejects.toThrowError(ValidationError);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 3. Webhook Verification & Idempotency (Section 6.5 & 11)
  | "A webhook with an invalid signature is rejected and logged; a valid duplicate is processed once."
  |--------------------------------------------------------------------------
  */
  describe("3. Webhook HMAC-SHA512 Verification & Duplicate Idempotency", () => {
    const secret = process.env.PAYSTACK_SECRET_KEY || "paystack_dev_secret_key";

    function computeSignature(body: string): string {
      return crypto.createHmac("sha512", secret).update(body).digest("hex");
    }

    it("rejects webhook with invalid signature, throws ForbiddenError and writes audit log", async () => {
      const payload = JSON.stringify({ event: "charge.success", id: "evt-test-999" });
      const badSig = "0000000000000000000000000000000000000000000000000000000000000000";

      await expect(
        CommercialBillingService.ingestWebhookEvent(payload, badSig)
      ).rejects.toThrowError(ForbiddenError);

      const logs = await PlatformAuditLogger.query();
      const rejectLog = logs.find((l) => l.action === "webhook.rejected_invalid_signature");
      expect(rejectLog).toBeDefined();
    });

    it("rejects webhook with missing signature", async () => {
      const payload = JSON.stringify({ event: "charge.success", id: "evt-test-888" });

      await expect(
        CommercialBillingService.ingestWebhookEvent(payload, null)
      ).rejects.toThrowError(ForbiddenError);
    });

    it("accepts and processes webhook with valid HMAC-SHA512 signature", async () => {
      const eventId = `test-evt-${Date.now()}`;
      const payload = JSON.stringify({
        event: "charge.success",
        id: eventId,
        data: {
          amount: 2800000, // 28,000 NGN in kobo
          customer: { email: "tenant@pharma.ng" },
          metadata: { businessId: "ten-001" },
        },
      });
      const validSig = computeSignature(payload);

      const res = await CommercialBillingService.ingestWebhookEvent(payload, validSig);
      expect(res.status).toBe("processed");
      expect(res.eventId).toBe(eventId);
    });

    it("processes a duplicate webhook event once idempotently", async () => {
      const eventId = `test-evt-dedup-${Date.now()}`;
      const payload = JSON.stringify({
        event: "charge.success",
        id: eventId,
        data: { amount: 4500000 },
      });
      const validSig = computeSignature(payload);

      // First delivery: processed
      const firstRes = await CommercialBillingService.ingestWebhookEvent(payload, validSig);
      expect(firstRes.status).toBe("processed");

      // Second delivery with identical event ID: ignored duplicate
      const secondRes = await CommercialBillingService.ingestWebhookEvent(payload, validSig);
      expect(secondRes.status).toBe("ignored_duplicate");
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 4. Manual Billing Adjustment & Threshold Dual Control (Section 6.5)
  | "Manual adjustments: credit, extension or discount, each with a reason, each
  | audited, and above the threshold each becoming an approval request."
  |--------------------------------------------------------------------------
  */
  describe("4. Manual Billing Adjustments", () => {
    it("routes credit adjustments >= ₦20,000 to dual-control approval queue", async () => {
      const res = await CommercialBillingService.applyManualAdjustment(
        {
          tenantId: "ten-001",
          tenantName: "Alpha Health",
          adjustmentType: "credit",
          amount: 25000,
          reason: "Platform downtime compensation approved by executive team",
        },
        financeStaff
      );

      expect(res.status).toBe("pending_approval");
      expect(res.approvalRequestId).toBeDefined();

      const requests = PlatformApprovalEngine.listRequests();
      const req = requests.find((r) => r.id === res.approvalRequestId);
      expect(req?.actionKey).toBe("billing:credit_adjustment");
      expect(req?.afterState.creditAmount).toBe(25000);
    });

    it("applies credit adjustments below ₦20,000 directly and logs audit event", async () => {
      const res = await CommercialBillingService.applyManualAdjustment(
        {
          tenantId: "ten-002",
          tenantName: "Lekki Superette",
          adjustmentType: "credit",
          amount: 5000,
          reason: "Minor billing glitch credit refund",
        },
        financeStaff
      );

      expect(res.status).toBe("applied");

      const logs = await PlatformAuditLogger.query();
      const auditLog = logs.find((l) => l.action === "billing.manual_adjustment_applied");
      expect(auditLog).toBeDefined();
      expect(auditLog?.entityId).toBe("ten-002");
    });

    it("requires a mandatory written reason for adjustments", async () => {
      await expect(
        CommercialBillingService.applyManualAdjustment(
          {
            tenantId: "ten-001",
            tenantName: "Alpha Health",
            adjustmentType: "credit",
            amount: 5000,
            reason: "   ",
          },
          financeStaff
        )
      ).rejects.toThrowError(ValidationError);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 5. Discount Codes Validation (Section 6.5)
  |--------------------------------------------------------------------------
  */
  describe("5. Discount Codes Engine", () => {
    it("creates a new discount code with uppercase normalization", () => {
      const item = CommercialBillingService.createDiscountCode(
        {
          code: "welcome10",
          discountType: "percent",
          value: 10,
          eligiblePlans: ["Growth", "Business"],
          maxUses: 50,
          expiresAt: "2027-01-01T00:00:00Z",
        },
        financeStaff
      );

      expect(item.code).toBe("WELCOME10");
      expect(item.active).toBe(true);
    });

    it("validates an active, unexpired discount code for an eligible plan", () => {
      const check = CommercialBillingService.validateDiscountCode("EASELAUNCH20", "Growth");
      expect(check.valid).toBe(true);
      expect(check.discountAmount).toBe(20);
    });

    it("rejects discount code when applied to an ineligible plan", () => {
      // EASELAUNCH20 is only eligible for Growth and Business
      const check = CommercialBillingService.validateDiscountCode("EASELAUNCH20", "Starter");
      expect(check.valid).toBe(false);
      expect(check.error).toMatch(/not applicable to the Starter plan/i);
    });

    it("rejects non-existent discount code", () => {
      const check = CommercialBillingService.validateDiscountCode("NONEXISTENT", "Growth");
      expect(check.valid).toBe(false);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 6. Role Permission Matrix Enforcement (Section 11)
  | "A Support Agent cannot change a plan; a Content Editor cannot open billing"
  |--------------------------------------------------------------------------
  */
  describe("6. Role Permission Matrix Enforcement for Plans and Billing", () => {
    it("denies Support Agent from modifying plans (plans:write)", async () => {
      await expect(
        CommercialBillingService.updatePlanPrice("plan-starter", 20000, 200000, supportStaff)
      ).rejects.toThrowError(ForbiddenError);
    });

    it("denies Content Editor from issuing billing adjustments (billing:write)", async () => {
      await expect(
        CommercialBillingService.applyManualAdjustment(
          {
            tenantId: "ten-001",
            tenantName: "Alpha",
            adjustmentType: "credit",
            amount: 5000,
            reason: "Content test",
          },
          contentStaff
        )
      ).rejects.toThrowError(ForbiddenError);
    });

    it("denies Support Agent from creating discount codes (billing:write)", () => {
      expect(() => {
        CommercialBillingService.createDiscountCode(
          {
            code: "SUP10",
            discountType: "percent",
            value: 10,
            eligiblePlans: ["Starter"],
            maxUses: 10,
            expiresAt: "2027-01-01T00:00:00Z",
          },
          supportStaff
        );
      }).toThrowError(ForbiddenError);
    });
  });
});
