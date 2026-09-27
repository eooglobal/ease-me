import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { FEATURE_KEYS, DEFAULT_PLAN_CONFIGS } from "../entitlements";
import { PaystackService } from "../paystack-service";

describe("Subscription Entitlements & Paystack Webhook Logic Tests", () => {
  it("should configure Free and Pro plan boundaries correctly", () => {
    const freeFeatures = DEFAULT_PLAN_CONFIGS.free.features;
    const proFeatures = DEFAULT_PLAN_CONFIGS.pro.features;

    // Free plan restricts advanced features
    expect(freeFeatures[FEATURE_KEYS.MULTI_USER]).toBe(1);
    expect(freeFeatures[FEATURE_KEYS.PROFIT_AND_LOSS]).toBe(0);
    expect(freeFeatures[FEATURE_KEYS.DAILY_RECONCILIATION]).toBe(0);
    expect(freeFeatures[FEATURE_KEYS.ADVANCED_REPORTS]).toBe(0);

    // Pro plan enables advanced features
    expect(proFeatures[FEATURE_KEYS.MULTI_USER]).toBe(10);
    expect(proFeatures[FEATURE_KEYS.PROFIT_AND_LOSS]).toBe(1);
    expect(proFeatures[FEATURE_KEYS.DAILY_RECONCILIATION]).toBe(1);
    expect(proFeatures[FEATURE_KEYS.ADVANCED_REPORTS]).toBe(1);
  });

  it("should verify valid Paystack HMAC-SHA512 webhook signatures", () => {
    const secret = "paystack_dev_secret_key";
    process.env.PAYSTACK_SECRET_KEY = secret;

    const payload = JSON.stringify({
      event: "charge.success",
      data: {
        id: 123456,
        amount: 1500000,
        metadata: { businessId: "biz-111" },
      },
    });

    const signature = crypto.createHmac("sha512", secret).update(payload).digest("hex");

    expect(PaystackService.verifyWebhookSignature(payload, signature)).toBe(true);
  });

  it("should reject tampered Paystack webhook payloads or invalid signatures", () => {
    const secret = "paystack_dev_secret_key";
    process.env.PAYSTACK_SECRET_KEY = secret;

    const payload = JSON.stringify({
      event: "charge.success",
      data: { id: 123456, amount: 1500000 },
    });

    const tamperedPayload = JSON.stringify({
      event: "charge.success",
      data: { id: 123456, amount: 500000 },
    });

    const signature = crypto.createHmac("sha512", secret).update(payload).digest("hex");

    // Valid against original payload
    expect(PaystackService.verifyWebhookSignature(payload, signature)).toBe(true);
    // Invalid against tampered payload
    expect(PaystackService.verifyWebhookSignature(tamperedPayload, signature)).toBe(false);
    // Invalid against random signature
    expect(PaystackService.verifyWebhookSignature(payload, "invalid_sig_123")).toBe(false);
  });
});
