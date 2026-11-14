import crypto from "crypto";
import { PlatformApprovalEngine } from "./approval-engine";
import { PlatformAuditLogger } from "./audit-logger";
import { PlatformPermissionEngine, PlatformStaffContext } from "./permission-engine";
import { AppError, ForbiddenError, ValidationError } from "@/lib/security/errors";

export interface PlanLimits {
  maxUsers: number;
  maxProducts: number;
  maxBranches: number;
  storageMb: number;
}

export interface PlanFeatureSwitches {
  batchTracking: boolean;
  customerPortal: boolean;
  advancedReports: boolean;
  offlineMode: boolean;
  dataExport: boolean;
}

export interface CommercialPlan {
  id: string;
  name: "Starter" | "Growth" | "Business" | "Enterprise";
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  trialDays: number;
  limits: PlanLimits;
  features: PlanFeatureSwitches;
  activeSubscriberCount: number;
}

export interface SubscriptionRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  planName: "Starter" | "Growth" | "Business" | "Enterprise";
  status: "active" | "trial" | "past_due" | "cancelled";
  amount: number;
  currency: string;
  billingInterval: "monthly" | "yearly";
  nextChargeDate: string;
  gatewayReference: string;
  paymentMethod: string;
}

export interface WebhookLogItem {
  id: string;
  providerEventId: string;
  eventType: string;
  tenantId?: string;
  tenantName?: string;
  amount?: number;
  signatureVerified: boolean;
  processingResult: "processed" | "ignored_duplicate" | "failed";
  retryCount: number;
  payload: Record<string, any>;
  receivedAt: string;
}

export interface FailedPaymentItem {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  planName: string;
  failedAt: string;
  gracePeriodEndsAt: string;
  daysRemaining: number;
  gatewayError: string;
}

export interface ManualAdjustmentItem {
  id: string;
  tenantId: string;
  tenantName: string;
  adjustmentType: "credit" | "discount" | "extension";
  amount?: number;
  extensionDays?: number;
  reason: string;
  staffName: string;
  staffRole: string;
  status: "applied" | "pending_approval";
  createdAt: string;
}

export interface DiscountCodeItem {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  value: number;
  eligiblePlans: string[];
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
}

export interface PlatformInvoiceItem {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  planName: string;
  amount: number;
  currency: string;
  status: "paid" | "failed" | "refunded";
  paidAt: string;
  downloadUrl: string;
}

// Canonical SaaS Plans (Section 6.4)
let inMemoryPlans: CommercialPlan[] = [
  {
    id: "plan-starter",
    name: "Starter",
    monthlyPrice: 15000,
    annualPrice: 150000,
    currency: "NGN",
    trialDays: 14,
    limits: {
      maxUsers: 2,
      maxProducts: 250,
      maxBranches: 1,
      storageMb: 100,
    },
    features: {
      batchTracking: false,
      customerPortal: true,
      advancedReports: false,
      offlineMode: true,
      dataExport: true,
    },
    activeSubscriberCount: 2,
  },
  {
    id: "plan-growth",
    name: "Growth",
    monthlyPrice: 28000,
    annualPrice: 280000,
    currency: "NGN",
    trialDays: 14,
    limits: {
      maxUsers: 5,
      maxProducts: 1000,
      maxBranches: 2,
      storageMb: 500,
    },
    features: {
      batchTracking: true,
      customerPortal: true,
      advancedReports: true,
      offlineMode: true,
      dataExport: true,
    },
    activeSubscriberCount: 2,
  },
  {
    id: "plan-business",
    name: "Business",
    monthlyPrice: 45000,
    annualPrice: 450000,
    currency: "NGN",
    trialDays: 14,
    limits: {
      maxUsers: 10,
      maxProducts: 5000,
      maxBranches: 5,
      storageMb: 2000,
    },
    features: {
      batchTracking: true,
      customerPortal: true,
      advancedReports: true,
      offlineMode: true,
      dataExport: true,
    },
    activeSubscriberCount: 1,
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    monthlyPrice: 85000,
    annualPrice: 850000,
    currency: "NGN",
    trialDays: 30,
    limits: {
      maxUsers: 50,
      maxProducts: 25000,
      maxBranches: 20,
      storageMb: 10000,
    },
    features: {
      batchTracking: true,
      customerPortal: true,
      advancedReports: true,
      offlineMode: true,
      dataExport: true,
    },
    activeSubscriberCount: 0,
  },
];

const inMemorySubscriptions: SubscriptionRecord[] = [
  {
    id: "sub-101",
    tenantId: "ten-001",
    tenantName: "Alpha Health & Retail Emporium Ltd",
    planName: "Growth",
    status: "active",
    amount: 28000,
    currency: "NGN",
    billingInterval: "monthly",
    nextChargeDate: "2026-11-15T00:00:00Z",
    gatewayReference: "SUB_pstk_908213",
    paymentMethod: "Mastercard •••• 4242",
  },
  {
    id: "sub-102",
    tenantId: "ten-002",
    tenantName: "Lekki Superette & Cold Store",
    planName: "Business",
    status: "active",
    amount: 45000,
    currency: "NGN",
    billingInterval: "monthly",
    nextChargeDate: "2026-11-22T00:00:00Z",
    gatewayReference: "SUB_pstk_412985",
    paymentMethod: "Visa •••• 1121",
  },
  {
    id: "sub-103",
    tenantId: "ten-005",
    tenantName: "Victoria Island Gourmet Grocers",
    planName: "Growth",
    status: "past_due",
    amount: 28000,
    currency: "NGN",
    billingInterval: "monthly",
    nextChargeDate: "2026-11-05T00:00:00Z",
    gatewayReference: "SUB_pstk_782109",
    paymentMethod: "Verve •••• 9012",
  },
];

const inMemoryWebhookLogs: WebhookLogItem[] = [
  {
    id: "wbk-01",
    providerEventId: "pstk_evt_1092837",
    eventType: "charge.success",
    tenantId: "ten-001",
    tenantName: "Alpha Health & Retail Emporium Ltd",
    amount: 28000,
    signatureVerified: true,
    processingResult: "processed",
    retryCount: 0,
    payload: { reference: "T90218209", plan: "Growth", channel: "card" },
    receivedAt: "2026-11-06T11:30:00Z",
  },
  {
    id: "wbk-02",
    providerEventId: "pstk_evt_1092838",
    eventType: "invoice.payment_failed",
    tenantId: "ten-005",
    tenantName: "Victoria Island Gourmet Grocers",
    amount: 28000,
    signatureVerified: true,
    processingResult: "processed",
    retryCount: 1,
    payload: { reference: "T90218210", reason: "Insufficient funds in customer card account" },
    receivedAt: "2026-11-05T02:15:00Z",
  },
];

const inMemoryDiscountCodes: DiscountCodeItem[] = [
  {
    id: "dsc-01",
    code: "EASELAUNCH20",
    discountType: "percent",
    value: 20,
    eligiblePlans: ["Growth", "Business"],
    maxUses: 100,
    usedCount: 24,
    expiresAt: "2026-12-31T23:59:59Z",
    active: true,
  },
  {
    id: "dsc-02",
    code: "PHARMA5K",
    discountType: "fixed",
    value: 5000,
    eligiblePlans: ["Starter", "Growth"],
    maxUses: 50,
    usedCount: 12,
    expiresAt: "2026-11-30T23:59:59Z",
    active: true,
  },
];

const inMemoryInvoices: PlatformInvoiceItem[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-EM-2026-0891",
    tenantId: "ten-001",
    tenantName: "Alpha Health & Retail Emporium Ltd",
    planName: "Growth",
    amount: 28000,
    currency: "NGN",
    status: "paid",
    paidAt: "2026-10-15T09:30:00Z",
    downloadUrl: "/api/invoices/INV-EM-2026-0891.pdf",
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-EM-2026-0892",
    tenantId: "ten-002",
    tenantName: "Lekki Superette & Cold Store",
    planName: "Business",
    amount: 45000,
    currency: "NGN",
    status: "paid",
    paidAt: "2026-10-22T10:15:00Z",
    downloadUrl: "/api/invoices/INV-EM-2026-0892.pdf",
  },
];

const inMemoryManualAdjustments: ManualAdjustmentItem[] = [];

export class CommercialBillingService {
  /**
   * Section 6.4: Retrieves all canonical plan definitions
   */
  public static getPlans(): CommercialPlan[] {
    return inMemoryPlans;
  }

  /**
   * Section 6.4 & Section 4: Proposes plan modification.
   * If price changes or deletion: creates a dual-control approval request!
   */
  public static async updatePlanPrice(
    planId: string,
    newMonthlyPrice: number,
    newAnnualPrice: number,
    staffContext: PlatformStaffContext
  ): Promise<{ status: "pending_approval" | "applied"; approvalRequestId?: string }> {
    PlatformPermissionEngine.enforcePermission(staffContext, "plans:write");

    const plan = inMemoryPlans.find((p) => p.id === planId);
    if (!plan) throw new AppError("Plan tier not found.", 404, "NOT_FOUND");

    if (newMonthlyPrice <= 0 || newAnnualPrice <= 0) {
      throw new ValidationError("Plan prices must be positive numbers.");
    }

    const affectedTenants = plan.activeSubscriberCount;

    // Section 4 Rule: Changing plan price is a sensitive action requiring dual control!
    const approvalReq = await PlatformApprovalEngine.createRequest({
      actionKey: "plans:price_change",
      actionTitle: `Revise Price for ${plan.name} Tier (${affectedTenants} active subscribers affected)`,
      entityType: "plan",
      entityId: plan.id,
      requesterId: staffContext.id,
      requesterName: staffContext.name,
      requesterEmail: staffContext.email,
      requesterRole: staffContext.role,
      reason: `Price revision to ₦${newMonthlyPrice.toLocaleString()}/mo. Affects ${affectedTenants} existing tenants. Grandfathering rules apply until staff migration.`,
      beforeState: { monthlyPrice: plan.monthlyPrice, annualPrice: plan.annualPrice },
      afterState: { monthlyPrice: newMonthlyPrice, annualPrice: newAnnualPrice },
    });

    return { status: "pending_approval", approvalRequestId: approvalReq.id };
  }

  /**
   * Section 6.4 Server-Side Entitlement Guard:
   * "One server side service that every tenant facing feature calls before acting. Limits are never enforced only in the interface."
   * Section 11 Test: "A Starter tenant cannot exceed its product limit by calling the API directly."
   */
  public static enforceProductQuota(tenantPlanName: string, currentProductCount: number): void {
    const plan = inMemoryPlans.find((p) => p.name.toLowerCase() === tenantPlanName.toLowerCase()) || inMemoryPlans[0];
    if (currentProductCount >= plan.limits.maxProducts) {
      throw new ForbiddenError(
        `Plan quota exceeded: Your '${plan.name}' plan is limited to ${plan.limits.maxProducts} catalog products. Direct API creation rejected. Please upgrade to Growth or Business.`
      );
    }
  }

  public static enforceUserQuota(tenantPlanName: string, currentUserCount: number): void {
    const plan = inMemoryPlans.find((p) => p.name.toLowerCase() === tenantPlanName.toLowerCase()) || inMemoryPlans[0];
    if (currentUserCount >= plan.limits.maxUsers) {
      throw new ForbiddenError(
        `Plan quota exceeded: Your '${plan.name}' plan is limited to ${plan.limits.maxUsers} user seats. Direct API creation rejected.`
      );
    }
  }

  public static enforceFeatureSwitch(tenantPlanName: string, feature: keyof PlanFeatureSwitches): void {
    const plan = inMemoryPlans.find((p) => p.name.toLowerCase() === tenantPlanName.toLowerCase()) || inMemoryPlans[0];
    if (!plan.features[feature]) {
      throw new ForbiddenError(
        `Feature '${feature}' is not included in your '${plan.name}' plan tier. Please upgrade.`
      );
    }
  }

  /**
   * Section 6.5: Webhook verification with raw body HMAC-SHA512
   */
  public static verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    const secret = process.env.PAYSTACK_SECRET_KEY || "paystack_dev_secret_key";
    if (!signature) return false;
    const computed = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
    return computed === signature;
  }

  /**
   * Ingests webhook event with raw HMAC validation and idempotency
   */
  public static async ingestWebhookEvent(
    rawBody: string,
    signature: string | null
  ): Promise<{ status: "processed" | "ignored_duplicate"; eventId: string }> {
    const isValid = this.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      await PlatformAuditLogger.log({
        staffEmail: "system@easeme.ng",
        staffRole: "system",
        action: "webhook.rejected_invalid_signature",
        entityType: "webhook",
        newValue: { signatureProvided: Boolean(signature) },
      });
      throw new ForbiddenError("Invalid Paystack webhook signature. Raw body rejected.");
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.id ? String(payload.id) : (payload.data?.id ? String(payload.data.id) : `evt-${Date.now()}`);

    // Idempotency check: duplicate processed once
    const existing = inMemoryWebhookLogs.find((w) => w.providerEventId === eventId);
    if (existing) {
      return { status: "ignored_duplicate", eventId };
    }

    const logEntry: WebhookLogItem = {
      id: `wbk-${Date.now()}`,
      providerEventId: eventId,
      eventType: payload.event || "charge.success",
      tenantId: payload.data?.metadata?.businessId,
      tenantName: payload.data?.customer?.email || "Tenant Store",
      amount: payload.data?.amount ? payload.data.amount / 100 : undefined,
      signatureVerified: true,
      processingResult: "processed",
      retryCount: 0,
      payload,
      receivedAt: new Date().toISOString(),
    };

    inMemoryWebhookLogs.unshift(logEntry);
    return { status: "processed", eventId };
  }

  /**
   * Section 6.5: Manual billing credit / adjustment.
   * If amount >= 20,000 NGN, routes to dual-control approval queue!
   */
  public static async applyManualAdjustment(
    input: {
      tenantId: string;
      tenantName: string;
      adjustmentType: "credit" | "discount" | "extension";
      amount?: number;
      extensionDays?: number;
      reason: string;
    },
    staffContext: PlatformStaffContext
  ): Promise<{ status: "applied" | "pending_approval"; approvalRequestId?: string }> {
    PlatformPermissionEngine.enforcePermission(staffContext, "billing:write");

    if (!input.reason?.trim() || input.reason.trim().length < 5) {
      throw new ValidationError("A detailed written rationale is mandatory for billing adjustments.");
    }

    const threshold = 20000; // ₦20,000 threshold for dual control
    const isSensitive = Boolean(input.amount && input.amount >= threshold);

    if (isSensitive) {
      const approvalReq = await PlatformApprovalEngine.createRequest({
        actionKey: "billing:credit_adjustment",
        actionTitle: `Issue Manual Credit of ₦${input.amount?.toLocaleString()} to ${input.tenantName}`,
        entityType: "billing",
        entityId: input.tenantId,
        requesterId: staffContext.id,
        requesterName: staffContext.name,
        requesterEmail: staffContext.email,
        requesterRole: staffContext.role,
        reason: input.reason.trim(),
        beforeState: { creditAmount: 0 },
        afterState: { creditAmount: input.amount, reason: input.reason },
      });

      return { status: "pending_approval", approvalRequestId: approvalReq.id };
    }

    // Direct application under threshold
    const record: ManualAdjustmentItem = {
      id: `adj-${Date.now()}`,
      ...input,
      staffName: staffContext.name,
      staffRole: staffContext.role,
      status: "applied",
      createdAt: new Date().toISOString(),
    };

    inMemoryManualAdjustments.unshift(record);

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "billing.manual_adjustment_applied",
      entityType: "tenant_billing",
      entityId: input.tenantId,
      newValue: { adjustmentType: input.adjustmentType, amount: input.amount, reason: input.reason },
    });

    return { status: "applied" };
  }

  /**
   * Section 6.5: Discount codes management
   */
  public static createDiscountCode(
    input: {
      code: string;
      discountType: "percent" | "fixed";
      value: number;
      eligiblePlans: string[];
      maxUses: number;
      expiresAt: string;
    },
    staffContext: PlatformStaffContext
  ): DiscountCodeItem {
    PlatformPermissionEngine.enforcePermission(staffContext, "billing:write");

    const code = input.code.trim().toUpperCase();
    if (inMemoryDiscountCodes.some((d) => d.code === code)) {
      throw new ValidationError(`Discount code '${code}' already exists.`);
    }

    const newItem: DiscountCodeItem = {
      id: `dsc-${Date.now()}`,
      code,
      discountType: input.discountType,
      value: input.value,
      eligiblePlans: input.eligiblePlans,
      maxUses: input.maxUses,
      usedCount: 0,
      expiresAt: input.expiresAt,
      active: true,
    };

    inMemoryDiscountCodes.unshift(newItem);
    return newItem;
  }

  public static validateDiscountCode(code: string, planName: string): { valid: boolean; discountAmount: number; error?: string } {
    const item = inMemoryDiscountCodes.find((d) => d.code === code.trim().toUpperCase() && d.active);
    if (!item) return { valid: false, discountAmount: 0, error: "Invalid discount code." };

    if (new Date() > new Date(item.expiresAt)) {
      return { valid: false, discountAmount: 0, error: "Discount code has expired." };
    }

    if (item.usedCount >= item.maxUses) {
      return { valid: false, discountAmount: 0, error: "Discount code redemption limit reached." };
    }

    if (!item.eligiblePlans.includes(planName)) {
      return { valid: false, discountAmount: 0, error: `Code is not applicable to the ${planName} plan.` };
    }

    return { valid: true, discountAmount: item.value };
  }

  // Data retrieval helpers for Section 6.5 tabs
  public static getSubscriptions() { return inMemorySubscriptions; }
  public static getWebhookLogs() { return inMemoryWebhookLogs; }
  public static getDiscountCodes() { return inMemoryDiscountCodes; }
  public static getInvoices() { return inMemoryInvoices; }
  public static getManualAdjustments() { return inMemoryManualAdjustments; }
  public static getFailedPayments(): FailedPaymentItem[] {
    return [
      {
        id: "fail-01",
        tenantId: "ten-005",
        tenantName: "Victoria Island Gourmet Grocers",
        amount: 28000,
        planName: "Growth",
        failedAt: "2026-11-05T02:15:00Z",
        gracePeriodEndsAt: "2026-11-08T02:15:00Z",
        daysRemaining: 1,
        gatewayError: "Insufficient funds on card mandate",
      },
    ];
  }
}

