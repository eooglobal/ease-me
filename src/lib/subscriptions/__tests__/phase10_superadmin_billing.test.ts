import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  PlatformBillingService,
  TenantWorkspace,
  SAAS_PLANS,
} from "../platform-billing-service";
import { PaystackService } from "../paystack-service";

describe("Phase 10: Super Admin Console, SaaS Billing & Webhook Verifications", () => {
  describe("Paystack Webhook HMAC-SHA512 Verification (Section 3)", () => {
    const rawPayload = JSON.stringify({
      event: "charge.success",
      data: {
        id: 991823,
        reference: "ref_109283",
        amount: 2800000, // 28,000 NGN in kobo
        metadata: {
          businessId: "ten-001",
          planId: "plan-growth",
        },
      },
    });

    it("accepts valid HMAC-SHA512 signature computed with platform secret key", () => {
      const secret = process.env.PAYSTACK_SECRET_KEY || "paystack_dev_secret_key";
      const validSignature = crypto.createHmac("sha512", secret).update(rawPayload).digest("hex");

      const isValid = PaystackService.verifyWebhookSignature(rawPayload, validSignature);
      expect(isValid).toBe(true);
    });

    it("rejects forged, modified, or invalid webhook signature", () => {
      const invalidSignature = "deadbeef1234567890abcdef";

      const isValid = PaystackService.verifyWebhookSignature(rawPayload, invalidSignature);
      expect(isValid).toBe(false);
    });

    it("rejects null or missing signature header", () => {
      const isValid = PaystackService.verifyWebhookSignature(rawPayload, null);
      expect(isValid).toBe(false);
    });
  });

  describe("Platform Revenue & MRR / ARR Calculations", () => {
    const sampleTenants: TenantWorkspace[] = [
      {
        id: "ten-1",
        businessName: "Store 1",
        businessType: "Retail",
        ownerEmail: "owner1@mail.com",
        phone: "08011111111",
        planName: "Growth",
        status: "active",
        productCount: 300,
        userCount: 3,
        createdAt: "2026-09-01",
        mrr: 28000,
        storageUsedMb: 120,
      },
      {
        id: "ten-2",
        businessName: "Store 2",
        businessType: "Pharmacy",
        ownerEmail: "owner2@mail.com",
        phone: "08022222222",
        planName: "Business",
        status: "active",
        productCount: 1500,
        userCount: 6,
        createdAt: "2026-09-10",
        mrr: 45000,
        storageUsedMb: 350,
      },
      {
        id: "ten-3",
        businessName: "Store 3",
        businessType: "Supermarket",
        ownerEmail: "owner3@mail.com",
        phone: "08033333333",
        planName: "Starter",
        status: "suspended", // Suspended tenants are excluded from active MRR
        productCount: 80,
        userCount: 1,
        createdAt: "2026-10-01",
        mrr: 15000,
        storageUsedMb: 40,
      },
    ];

    it("calculates active tenants count and MRR accurately", () => {
      const metrics = PlatformBillingService.calculatePlatformMetrics(sampleTenants);

      expect(metrics.totalTenants).toBe(3);
      expect(metrics.activeTenants).toBe(2);
      expect(metrics.suspendedTenants).toBe(1);

      // Active MRR = 28000 + 45000 = 73000
      expect(metrics.monthlyRecurringRevenue).toBe(73000);
      // ARR = 73000 * 12 = 876000
      expect(metrics.annualRunRate).toBe(876000);
      // Total storage = 120 + 350 + 40 = 510 MB
      expect(metrics.totalStorageMb).toBe(510);
    });
  });

  describe("SaaS Plan Quota Enforcement", () => {
    const growthPlan = SAAS_PLANS.find((p) => p.name === "Growth")!;

    it("allows adding products and users when within plan quota limits", () => {
      const tenant: TenantWorkspace = {
        id: "ten-10",
        businessName: "Under Limit Store",
        businessType: "Retail",
        ownerEmail: "under@mail.com",
        phone: "08044444444",
        planName: "Growth",
        status: "active",
        productCount: 450, // Limit is 1,000
        userCount: 3,     // Limit is 5
        createdAt: "2026-10-01",
        mrr: 28000,
        storageUsedMb: 50,
      };

      const quota = PlatformBillingService.checkQuotaUsage(tenant, growthPlan);

      expect(quota.canAddProduct).toBe(true);
      expect(quota.canAddUser).toBe(true);
      expect(quota.productUsagePercent).toBe(45);
      expect(quota.userUsagePercent).toBe(60);
    });

    it("blocks adding products and users when quota is reached or exceeded", () => {
      const tenant: TenantWorkspace = {
        id: "ten-11",
        businessName: "At Limit Store",
        businessType: "Retail",
        ownerEmail: "atlimit@mail.com",
        phone: "08055555555",
        planName: "Growth",
        status: "active",
        productCount: 1000, // Limit is 1,000
        userCount: 5,      // Limit is 5
        createdAt: "2026-10-01",
        mrr: 28000,
        storageUsedMb: 150,
      };

      const quota = PlatformBillingService.checkQuotaUsage(tenant, growthPlan);

      expect(quota.canAddProduct).toBe(false);
      expect(quota.canAddUser).toBe(false);
      expect(quota.productUsagePercent).toBe(100);
      expect(quota.userUsagePercent).toBe(100);
    });
  });
});

