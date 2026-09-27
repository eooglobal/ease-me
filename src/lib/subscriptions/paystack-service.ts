import crypto from "crypto";
import { db } from "@/db";
import { subscriptions, subscriptionEvents, plans, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ValidationError, ForbiddenError } from "@/lib/security/errors";

export interface PaystackWebhookPayload {
  event: string;
  data: {
    id?: number | string;
    reference?: string;
    amount?: number;
    status?: string;
    paid_at?: string;
    customer?: {
      email?: string;
      customer_code?: string;
    };
    metadata?: {
      businessId?: string;
      planId?: string;
      userId?: string;
    };
    subscription_code?: string;
    next_payment_date?: string;
  };
}

export class PaystackService {
  /**
   * Validates Paystack webhook HMAC-SHA512 signature against PAYSTACK_SECRET_KEY
   */
  static verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    const secret = process.env.PAYSTACK_SECRET_KEY || "paystack_dev_secret_key";
    if (!signature) return false;

    const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
    return hash === signature;
  }

  /**
   * Processes incoming Paystack webhook events idempotently
   */
  static async processWebhookEvent(rawBody: string, signature: string | null): Promise<{ processed: boolean; reason?: string }> {
    if (!this.verifyWebhookSignature(rawBody, signature)) {
      throw new ForbiddenError("Invalid Paystack webhook signature.");
    }

    const payload: PaystackWebhookPayload = JSON.parse(rawBody);
    const eventType = payload.event;
    const providerEventId = payload.data.id ? payload.data.id.toString() : payload.data.reference;

    if (!providerEventId) {
      throw new ValidationError("Webhook payload missing event identifier.");
    }

    const businessId = payload.data.metadata?.businessId;
    if (!businessId) {
      return { processed: false, reason: "No businessId in event metadata" };
    }

    return db.transaction(async (tx) => {
      // 1. Idempotency Check: check if event was already processed
      const [existingEvent] = await tx
        .select()
        .from(subscriptionEvents)
        .where(
          and(
            eq(subscriptionEvents.businessId, businessId),
            eq(subscriptionEvents.providerEventId, providerEventId)
          )
        );

      if (existingEvent) {
        return { processed: true, reason: "Event already processed (idempotent duplicate)" };
      }

      // 2. Fetch or find plan
      const planId = payload.data.metadata?.planId;

      // 3. Handle specific subscription events
      if (eventType === "charge.success" || eventType === "subscription.create") {
        // Upsert subscription to active
        const [existingSub] = await tx
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.businessId, businessId));

        let activePlanId = planId;
        if (!activePlanId) {
          const [proPlan] = await tx.select().from(plans).where(eq(plans.name, "Pro Plan"));
          if (proPlan) activePlanId = proPlan.id;
        }

        if (activePlanId) {
          if (existingSub) {
            await tx
              .update(subscriptions)
              .set({
                planId: activePlanId,
                status: "active",
                provider: "paystack",
                providerSubscriptionId: payload.data.subscription_code || payload.data.reference,
                currentPeriodStart: new Date(),
                currentPeriodEnd: payload.data.next_payment_date
                  ? new Date(payload.data.next_payment_date)
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, existingSub.id));
          } else {
            await tx.insert(subscriptions).values({
              businessId,
              planId: activePlanId,
              status: "active",
              provider: "paystack",
              providerSubscriptionId: payload.data.subscription_code || payload.data.reference,
              startedAt: new Date(),
              currentPeriodStart: new Date(),
              currentPeriodEnd: payload.data.next_payment_date
                ? new Date(payload.data.next_payment_date)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
          }
        }
      } else if (eventType === "subscription.disable" || eventType === "invoice.payment_failed") {
        await tx
          .update(subscriptions)
          .set({
            status: eventType === "invoice.payment_failed" ? "past_due" : "cancelled",
            cancelledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.businessId, businessId));
      }

      // 4. Record event in immutable subscription_events ledger
      await tx.insert(subscriptionEvents).values({
        businessId,
        eventType,
        providerEventId,
        payload,
      });

      // 5. Log audit event
      await tx.insert(auditLogs).values({
        businessId,
        userId: payload.data.metadata?.userId || "system:paystack_webhook",
        action: `SUBSCRIPTION_EVENT_${eventType.toUpperCase()}`,
        entityType: "subscription",
        newValues: {
          eventType,
          providerEventId,
          amount: payload.data.amount ? payload.data.amount / 100 : undefined,
        },
      });

      return { processed: true };
    });
  }
}
