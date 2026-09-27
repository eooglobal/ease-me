import { db } from "@/db";
import { subscriptions, plans, planFeatures, businessMembers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ForbiddenError } from "@/lib/security/errors";

export const FEATURE_KEYS = {
  MULTI_USER: "multi_user",
  ADVANCED_REPORTS: "advanced_reports",
  PROFIT_AND_LOSS: "profit_and_loss",
  DAILY_RECONCILIATION: "daily_reconciliation",
  SUPPLIER_MANAGEMENT: "supplier_management",
  INVENTORY_AUDIT_LOGS: "inventory_audit_logs",
  UNLIMITED_PRODUCTS: "unlimited_products",
  DATA_EXPORT: "data_export",
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

export const DEFAULT_PLAN_CONFIGS = {
  free: {
    name: "Free Plan",
    price: 0,
    features: {
      [FEATURE_KEYS.MULTI_USER]: 1, // Max 1 user
      [FEATURE_KEYS.ADVANCED_REPORTS]: 0, // Disabled
      [FEATURE_KEYS.PROFIT_AND_LOSS]: 0, // Disabled
      [FEATURE_KEYS.DAILY_RECONCILIATION]: 0, // Disabled
      [FEATURE_KEYS.SUPPLIER_MANAGEMENT]: 0, // Disabled
      [FEATURE_KEYS.INVENTORY_AUDIT_LOGS]: 0, // Disabled
      [FEATURE_KEYS.UNLIMITED_PRODUCTS]: 50, // Max 50 products
      [FEATURE_KEYS.DATA_EXPORT]: 0, // Disabled
    },
  },
  pro: {
    name: "Pro Plan",
    price: 15000, // ₦15,000 / month
    features: {
      [FEATURE_KEYS.MULTI_USER]: 10, // Up to 10 staff members
      [FEATURE_KEYS.ADVANCED_REPORTS]: 1, // Enabled
      [FEATURE_KEYS.PROFIT_AND_LOSS]: 1, // Enabled
      [FEATURE_KEYS.DAILY_RECONCILIATION]: 1, // Enabled
      [FEATURE_KEYS.SUPPLIER_MANAGEMENT]: 1, // Enabled
      [FEATURE_KEYS.INVENTORY_AUDIT_LOGS]: 1, // Enabled
      [FEATURE_KEYS.UNLIMITED_PRODUCTS]: 10000, // Unlimited
      [FEATURE_KEYS.DATA_EXPORT]: 1, // Enabled
    },
  },
};

export class EntitlementService {
  /**
   * Retrieves active plan and feature entitlements for a business
   */
  static async getBusinessPlan(businessId: string): Promise<{
    planName: string;
    isPro: boolean;
    status: string;
    limits: Record<string, number>;
  }> {
    const [sub] = await db
      .select({
        subscriptionId: subscriptions.id,
        status: subscriptions.status,
        planName: plans.name,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.businessId, businessId),
          sql`${subscriptions.status} IN ('active', 'trialing')`
        )
      )
      .limit(1);

    if (!sub) {
      // Default to Free plan
      return {
        planName: "Free",
        isPro: false,
        status: "active",
        limits: DEFAULT_PLAN_CONFIGS.free.features,
      };
    }

    const isPro = sub.planName.toLowerCase().includes("pro");
    return {
      planName: sub.planName,
      isPro,
      status: sub.status,
      limits: isPro ? DEFAULT_PLAN_CONFIGS.pro.features : DEFAULT_PLAN_CONFIGS.free.features,
    };
  }

  /**
   * Checks if a business is entitled to a specific feature key
   */
  static async checkFeatureEntitlement(businessId: string, featureKey: FeatureKey): Promise<boolean> {
    const plan = await this.getBusinessPlan(businessId);
    const limit = plan.limits[featureKey];

    // Boolean features: 1 = enabled, 0 = disabled
    return limit !== undefined && limit > 0;
  }

  /**
   * Asserts feature entitlement and throws ForbiddenError if not satisfied
   */
  static async requireFeatureEntitlement(businessId: string, featureKey: FeatureKey): Promise<void> {
    const allowed = await this.checkFeatureEntitlement(businessId, featureKey);
    if (!allowed) {
      throw new ForbiddenError(
        `Your current subscription plan does not include '${featureKey}'. Please upgrade to Pro to unlock this feature.`
      );
    }
  }

  /**
   * Checks if staff member quota is exceeded for the business
   */
  static async checkUserSeatQuota(businessId: string): Promise<boolean> {
    const plan = await this.getBusinessPlan(businessId);
    const maxSeats = plan.limits[FEATURE_KEYS.MULTI_USER] || 1;

    const [memberCountRes] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(businessMembers)
      .where(
        and(
          eq(businessMembers.businessId, businessId),
          eq(businessMembers.status, "active")
        )
      );

    const activeMembers = Number(memberCountRes?.count || 0);
    return activeMembers < maxSeats;
  }
}
