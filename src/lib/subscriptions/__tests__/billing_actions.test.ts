import { describe, it, expect } from "vitest";
import { FEATURE_KEYS, PRICING_TIERS, DEFAULT_PLAN_CONFIGS } from "../entitlements";

describe("Commercial Licensing & Pricing Tiers Verification", () => {
  it("should define the exact 4 tiers: Starter, Growth, Business, and Enterprise", () => {
    expect(PRICING_TIERS.starter).toBeDefined();
    expect(PRICING_TIERS.growth).toBeDefined();
    expect(PRICING_TIERS.business).toBeDefined();
    expect(PRICING_TIERS.enterprise).toBeDefined();

    expect(PRICING_TIERS.starter.name).toBe("Starter");
    expect(PRICING_TIERS.growth.name).toBe("Growth");
    expect(PRICING_TIERS.business.name).toBe("Business");
    expect(PRICING_TIERS.enterprise.name).toBe("Enterprise");
  });

  it("should configure Starter as a permanent Freemium tier with strict limits", () => {
    const starter = PRICING_TIERS.starter;

    // Pricing is ₦0 across all cycles
    expect(starter.monthlyPrice).toBe(0);
    expect(starter.sixMonthsPrice).toBe(0);
    expect(starter.yearlyPrice).toBe(0);

    // Strict limits
    expect(starter.features[FEATURE_KEYS.STORE_LOCATIONS]).toBe(1);
    expect(starter.features[FEATURE_KEYS.MULTI_USER]).toBe(1); // 1 Cashier account
    expect(starter.features[FEATURE_KEYS.UNLIMITED_PRODUCTS]).toBe(50); // Max 50 products

    // Disallowed features on Starter
    expect(starter.features[FEATURE_KEYS.ADVANCED_REPORTS]).toBe(0);
    expect(starter.features[FEATURE_KEYS.PROFIT_AND_LOSS]).toBe(0);
    expect(starter.features[FEATURE_KEYS.DAILY_RECONCILIATION]).toBe(0);
    expect(starter.features[FEATURE_KEYS.SUPPLIER_MANAGEMENT]).toBe(0);
    expect(starter.features[FEATURE_KEYS.INVENTORY_AUDIT_LOGS]).toBe(0);
    expect(starter.features[FEATURE_KEYS.DATA_EXPORT]).toBe(0);
  });

  it("should configure Growth tier with ₦28,000 monthly and accurate cycle discounts", () => {
    const growth = PRICING_TIERS.growth;

    expect(growth.monthlyPrice).toBe(28000);
    // 10% discount on 6-month cycle: 28,000 * 0.9 = 25,200
    expect(growth.sixMonthsPrice).toBe(25200);
    // 20% discount on yearly cycle: 28,000 * 0.8 = 22,400
    expect(growth.yearlyPrice).toBe(22400);

    // Growth quotas
    expect(growth.features[FEATURE_KEYS.STORE_LOCATIONS]).toBe(5);
    expect(growth.features[FEATURE_KEYS.MULTI_USER]).toBe(999); // Unlimited cashiers
    expect(growth.features[FEATURE_KEYS.UNLIMITED_PRODUCTS]).toBe(1000);
    expect(growth.features[FEATURE_KEYS.ADVANCED_REPORTS]).toBe(1);
    expect(growth.features[FEATURE_KEYS.PROFIT_AND_LOSS]).toBe(1);
    expect(growth.features[FEATURE_KEYS.DATA_EXPORT]).toBe(1);
    expect(growth.isPopular).toBe(true);
  });

  it("should configure Business tier with ₦38,000 monthly and scaling capabilities", () => {
    const business = PRICING_TIERS.business;

    expect(business.monthlyPrice).toBe(38000);
    // 10% discount on 6-month cycle: 38,000 * 0.9 = 34,200
    expect(business.sixMonthsPrice).toBe(34200);
    // 20% discount on yearly cycle: 38,000 * 0.8 = 30,400
    expect(business.yearlyPrice).toBe(30400);

    // Business quotas
    expect(business.features[FEATURE_KEYS.STORE_LOCATIONS]).toBe(10);
    expect(business.features[FEATURE_KEYS.MULTI_USER]).toBe(999);
    expect(business.features[FEATURE_KEYS.UNLIMITED_PRODUCTS]).toBe(5000);
    expect(business.features[FEATURE_KEYS.CUSTOM_INTEGRATIONS]).toBe(1);
  });

  it("should configure Enterprise MAX tier with ₦58,000 monthly and unlimited scope", () => {
    const enterprise = PRICING_TIERS.enterprise;

    expect(enterprise.monthlyPrice).toBe(58000);
    // 10% discount on 6-month cycle: 58,000 * 0.9 = 52,200
    expect(enterprise.sixMonthsPrice).toBe(52200);
    // 20% discount on yearly cycle: 58,000 * 0.8 = 46,400
    expect(enterprise.yearlyPrice).toBe(46400);

    // Unlimited quotas
    expect(enterprise.features[FEATURE_KEYS.STORE_LOCATIONS]).toBe(999);
    expect(enterprise.features[FEATURE_KEYS.MULTI_USER]).toBe(9999);
    expect(enterprise.features[FEATURE_KEYS.UNLIMITED_PRODUCTS]).toBe(100000);
    expect(enterprise.features[FEATURE_KEYS.DEDICATED_MANAGER]).toBe(1);
    expect(enterprise.badge).toBe("MAX");
  });

  it("should maintain backwards compatibility with DEFAULT_PLAN_CONFIGS", () => {
    expect(DEFAULT_PLAN_CONFIGS.free).toBeDefined();
    expect(DEFAULT_PLAN_CONFIGS.growth).toBeDefined();
    expect(DEFAULT_PLAN_CONFIGS.business).toBeDefined();
    expect(DEFAULT_PLAN_CONFIGS.enterprise).toBeDefined();

    expect(DEFAULT_PLAN_CONFIGS.free.price).toBe(0);
    expect(DEFAULT_PLAN_CONFIGS.growth.price).toBe(28000);
    expect(DEFAULT_PLAN_CONFIGS.business.price).toBe(38000);
    expect(DEFAULT_PLAN_CONFIGS.enterprise.price).toBe(58000);
  });
});

