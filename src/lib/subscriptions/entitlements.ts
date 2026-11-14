import { db } from "@/db";
import { subscriptions, plans, planFeatures, businessMembers, products } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ForbiddenError } from "@/lib/security/errors";

export * from "./pricing-plans";
import { FEATURE_KEYS, PRICING_TIERS, FeatureKey } from "./pricing-plans";

export class EntitlementService {
  /**
   * Retrieves active plan and feature entitlements for a business
   */
  static async getBusinessPlan(businessId: string): Promise<{
    planId: string;
    planName: string;
    isPaid: boolean;
    status: string;
    currentPeriodEnd?: Date | null;
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
      return {
        planId: "starter",
        planName: "Starter (Freemium)",
        isPaid: false,
        status: "active",
        limits: PRICING_TIERS.starter.features,
      };
    }

    const lowerName = sub.planName.toLowerCase();
    const isPaid = !lowerName.includes("free") && !lowerName.includes("starter");

    let matchedTier = PRICING_TIERS.starter;
    if (lowerName.includes("growth") || lowerName.includes("pro")) matchedTier = PRICING_TIERS.growth;
    else if (lowerName.includes("business")) matchedTier = PRICING_TIERS.business;
    else if (lowerName.includes("enterprise")) matchedTier = PRICING_TIERS.enterprise;

    return {
      planId: matchedTier.id,
      planName: sub.planName,
      isPaid,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      limits: matchedTier.features,
    };
  }

  /**
   * Checks if a business is entitled to a specific feature key
   */
  static async checkFeatureEntitlement(businessId: string, featureKey: FeatureKey): Promise<boolean> {
    const plan = await this.getBusinessPlan(businessId);
    const limit = plan.limits[featureKey];
    return limit !== undefined && limit > 0;
  }

  /**
   * Asserts feature entitlement and throws ForbiddenError if not satisfied
   */
  static async requireFeatureEntitlement(businessId: string, featureKey: FeatureKey): Promise<void> {
    const allowed = await this.checkFeatureEntitlement(businessId, featureKey);
    if (!allowed) {
      throw new ForbiddenError(
        `Your current plan does not include '${featureKey}'. Please upgrade to Growth or Business to unlock this capability.`
      );
    }
  }

  /**
   * Checks if staff member quota is exceeded for the business
   */
  static async checkUserSeatQuota(businessId: string): Promise<{ allowed: boolean; used: number; max: number }> {
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
    return {
      allowed: activeMembers < maxSeats,
      used: activeMembers,
      max: maxSeats,
    };
  }

  /**
   * Checks if product catalog quota is exceeded for the business
   */
  static async checkProductQuota(businessId: string): Promise<{ allowed: boolean; used: number; max: number }> {
    const plan = await this.getBusinessPlan(businessId);
    const maxProducts = plan.limits[FEATURE_KEYS.UNLIMITED_PRODUCTS] || 50;

    const [productCountRes] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(products)
      .where(eq(products.businessId, businessId));

    const totalProducts = Number(productCountRes?.count || 0);
    return {
      allowed: totalProducts < maxProducts,
      used: totalProducts,
      max: maxProducts,
    };
  }
}
