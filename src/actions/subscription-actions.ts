"use server";

import { requireTenantContext } from "@/lib/security/tenant";
import { EntitlementService, PRICING_TIERS, PlanTierConfig } from "@/lib/subscriptions/entitlements";
import { db } from "@/db";
import { subscriptions, plans, subscriptionEvents, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { formatErrorResponse } from "@/lib/security/errors";

export interface SubscriptionStatusResponse {
  currentPlan: {
    id: string;
    name: string;
    isPaid: boolean;
    status: string;
    currentPeriodEnd?: string | null;
  };
  quotas: {
    products: { used: number; max: number; percentage: number };
    staff: { used: number; max: number; percentage: number };
  };
  availablePlans: PlanTierConfig[];
}

export async function getSubscriptionStatusAction() {
  try {
    const ctx = await requireTenantContext();
    const planInfo = await EntitlementService.getBusinessPlan(ctx.businessId);
    const productQuota = await EntitlementService.checkProductQuota(ctx.businessId);
    const staffQuota = await EntitlementService.checkUserSeatQuota(ctx.businessId);

    const productPercent = Math.min(100, Math.round((productQuota.used / (productQuota.max || 1)) * 100));
    const staffPercent = Math.min(100, Math.round((staffQuota.used / (staffQuota.max || 1)) * 100));

    return {
      success: true,
      data: {
        currentPlan: {
          id: planInfo.planId,
          name: planInfo.planName,
          isPaid: planInfo.isPaid,
          status: planInfo.status,
          currentPeriodEnd: planInfo.currentPeriodEnd ? planInfo.currentPeriodEnd.toISOString() : null,
        },
        quotas: {
          products: {
            used: productQuota.used,
            max: productQuota.max,
            percentage: productPercent,
          },
          staff: {
            used: staffQuota.used,
            max: staffQuota.max,
            percentage: staffPercent,
          },
        },
        availablePlans: Object.values(PRICING_TIERS),
      },
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function initializeSubscriptionCheckoutAction(input: {
  planId: "growth" | "business" | "enterprise";
  interval?: "monthly" | "six_months" | "yearly";
}) {
  try {
    const ctx = await requireTenantContext();
    const selectedPlan = PRICING_TIERS[input.planId];
    if (!selectedPlan) {
      throw new Error(`Plan tier '${input.planId}' not found.`);
    }

    const interval = input.interval || "monthly";
    const amount =
      interval === "yearly"
        ? selectedPlan.yearlyPrice * 12
        : interval === "six_months"
        ? selectedPlan.sixMonthsPrice * 6
        : selectedPlan.monthlyPrice;

    const amountInKobo = amount * 100;
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // Check if live Paystack credentials exist
    if (paystackSecret && paystackSecret.startsWith("sk_")) {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: ctx.userEmail,
          amount: amountInKobo,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/?payment=success&plan=${input.planId}`,
          metadata: {
            businessId: ctx.businessId,
            planId: input.planId,
            userId: ctx.userId,
            interval,
          },
        }),
      });

      const resData = await response.json();
      if (!resData.status || !resData.data?.authorization_url) {
        throw new Error(resData.message || "Unable to initialize Paystack checkout.");
      }

      return {
        success: true,
        authorizationUrl: resData.data.authorization_url,
        reference: resData.data.reference,
        sandbox: false,
      };
    }

    // Local Development Sandbox Activation
    // In dev mode or without Paystack key, simulate instant checkout activation so the user can test Pro tiers immediately
    const nextPeriod = new Date();
    nextPeriod.setDate(nextPeriod.getDate() + (interval === "yearly" ? 365 : interval === "six_months" ? 180 : 30));

    // Upsert or create plan record
    let [planRecord] = await db
      .select()
      .from(plans)
      .where(eq(plans.name, selectedPlan.name))
      .limit(1);

    if (!planRecord) {
      [planRecord] = await db
        .insert(plans)
        .values({
          name: selectedPlan.name,
          description: selectedPlan.description,
          price: selectedPlan.monthlyPrice.toString(),
          billingInterval: interval === "yearly" ? "yearly" : "monthly",
          status: "active",
        })
        .returning();
    }

    // Update active business subscription
    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.businessId, ctx.businessId))
      .limit(1);

    if (existingSub) {
      await db
        .update(subscriptions)
        .set({
          planId: planRecord.id,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: nextPeriod,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existingSub.id));
    } else {
      await db.insert(subscriptions).values({
        businessId: ctx.businessId,
        planId: planRecord.id,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: nextPeriod,
      });
    }

    await db.insert(auditLogs).values({
      businessId: ctx.businessId,
      userId: ctx.userId,
      action: "SUBSCRIPTION_UPGRADED",
      entityType: "subscription",
      newValues: {
        plan: selectedPlan.name,
        price: amount,
        interval,
        sandbox: true,
      },
    });

    return {
      success: true,
      sandbox: true,
      planName: selectedPlan.name,
      message: `Successfully upgraded to ${selectedPlan.name} Tier (${interval}) in sandbox mode!`,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

