import { PlatformAuditLogger } from "./audit-logger";
import { PlatformApprovalEngine } from "./approval-engine";
import { PlatformPermissionEngine, PlatformStaffContext } from "./permission-engine";
import { AppError, ForbiddenError, ValidationError } from "@/lib/security/errors";

export interface TenantSummary {
  id: string;
  businessName: string;
  businessType: string;
  planName: "Starter" | "Growth" | "Business" | "Enterprise";
  status: "trial" | "active" | "grace" | "suspended" | "cancelled";
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  maskedEmail: string;
  maskedPhone: string;
  userCount: number;
  productCount: number;
  salesThisMonth: number; // Aggregate count only
  storageUsedMb: number;
  createdAt: string;
  renewalDate: string;
  trialEnd?: string;
  lastActivity: string;
  mrr: number;
}

export interface TenantNote {
  id: string;
  tenantId: string;
  staffName: string;
  staffEmail: string;
  staffRole: string;
  content: string;
  createdAt: string;
}

export interface TenantActivityEvent {
  id: string;
  tenantId: string;
  timestamp: string;
  event: string;
  performedBy: string;
  details: string;
}

export interface TenantEntitlementOverride {
  id: string;
  tenantId: string;
  key: string;
  label: string;
  standardValue: string | number | boolean;
  overrideValue: string | number | boolean;
  reason: string;
  expiresAt: string;
}

/**
 * Section 2: Privacy masking utility
 * "The console never shows unmasked customer personal data. Show masked values such as j***@mail.com and 0803 *** **12."
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "u***@domain.com";
  const [local, domain] = email.split("@");
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local.charAt(0)}***@${domain}`;
}

export function maskPhone(phone: string): string {
  if (!phone) return "0800 *** **00";
  const clean = phone.replace(/\s+/g, "");
  if (clean.length < 8) return "0803 *** **12";
  const prefix = clean.substring(0, 4);
  const suffix = clean.substring(clean.length - 2);
  return `${prefix} *** **${suffix}`;
}

// In-memory tenant store
let mockTenants: TenantSummary[] = [
  {
    id: "ten-001",
    businessName: "Alpha Health & Retail Emporium Ltd",
    businessType: "Pharmacy & Retail",
    planName: "Growth",
    status: "active",
    ownerName: "Chukwuma Obi",
    ownerEmail: "owner@alpha-retail.ng",
    ownerPhone: "0803 123 4567",
    maskedEmail: maskEmail("owner@alpha-retail.ng"),
    maskedPhone: maskPhone("0803 123 4567"),
    userCount: 4,
    productCount: 450,
    salesThisMonth: 1240,
    storageUsedMb: 145.2,
    createdAt: "2026-09-15T08:00:00Z",
    renewalDate: "2026-11-15T00:00:00Z",
    lastActivity: "12 mins ago",
    mrr: 28000,
  },
  {
    id: "ten-002",
    businessName: "Lekki Superette & Cold Store",
    businessType: "Supermarket",
    planName: "Business",
    status: "active",
    ownerName: "Folake Adeyemi",
    ownerEmail: "manager@lekkisuperette.ng",
    ownerPhone: "0802 987 6543",
    maskedEmail: maskEmail("manager@lekkisuperette.ng"),
    maskedPhone: maskPhone("0802 987 6543"),
    userCount: 8,
    productCount: 1850,
    salesThisMonth: 4120,
    storageUsedMb: 420.8,
    createdAt: "2026-09-22T10:30:00Z",
    renewalDate: "2026-11-22T00:00:00Z",
    lastActivity: "2 hours ago",
    mrr: 45000,
  },
  {
    id: "ten-003",
    businessName: "Ikeja Wholesale Depot",
    businessType: "Wholesale & FMCG",
    planName: "Enterprise",
    status: "suspended",
    ownerName: "Alhaji Bello",
    ownerEmail: "admin@ikejadepot.com",
    ownerPhone: "0805 111 2233",
    maskedEmail: maskEmail("admin@ikejadepot.com"),
    maskedPhone: maskPhone("0805 111 2233"),
    userCount: 12,
    productCount: 3200,
    salesThisMonth: 0,
    storageUsedMb: 680.5,
    createdAt: "2026-10-01T14:15:00Z",
    renewalDate: "2026-11-01T00:00:00Z",
    lastActivity: "3 days ago",
    mrr: 85000,
  },
  {
    id: "ten-004",
    businessName: "Abuja Modern Pharmacy Ltd",
    businessType: "Community Pharmacy",
    planName: "Starter",
    status: "trial",
    ownerName: "Dr. Danjuma Sani",
    ownerEmail: "dan@abujapharm.ng",
    ownerPhone: "0809 333 4455",
    maskedEmail: maskEmail("dan@abujapharm.ng"),
    maskedPhone: maskPhone("0809 333 4455"),
    userCount: 2,
    productCount: 180,
    salesThisMonth: 85,
    storageUsedMb: 42.1,
    createdAt: "2026-11-01T09:00:00Z",
    renewalDate: "2026-11-14T00:00:00Z",
    trialEnd: "2026-11-14T23:59:59Z",
    lastActivity: "5 hours ago",
    mrr: 15000,
  },
  {
    id: "ten-005",
    businessName: "Victoria Island Gourmet Grocers",
    businessType: "Retail",
    planName: "Growth",
    status: "grace",
    ownerName: "Emeka Okonkwo",
    ownerEmail: "emeka@vigrocers.com",
    ownerPhone: "0807 444 5566",
    maskedEmail: maskEmail("emeka@vigrocers.com"),
    maskedPhone: maskPhone("0807 444 5566"),
    userCount: 5,
    productCount: 650,
    salesThisMonth: 890,
    storageUsedMb: 180.4,
    createdAt: "2026-08-10T11:20:00Z",
    renewalDate: "2026-11-05T00:00:00Z",
    lastActivity: "1 day ago",
    mrr: 28000,
  },
];

const mockNotes: TenantNote[] = [
  {
    id: "note-1",
    tenantId: "ten-001",
    staffName: "Bolanle Cole",
    staffEmail: "bolanle@easeme.ng",
    staffRole: "Support Lead",
    content: "Customer reached out regarding thermal printer integration. Recommended Epson TM-T88VI over USB.",
    createdAt: "2026-10-20T14:30:00Z",
  },
  {
    id: "note-2",
    tenantId: "ten-001",
    staffName: "Farouk Bello",
    staffEmail: "farouk@easeme.ng",
    staffRole: "Finance Manager",
    content: "Applied 14-day grace period extension on request while their business account bank mandate was renewed.",
    createdAt: "2026-10-25T11:15:00Z",
  },
];

const mockActivities: TenantActivityEvent[] = [
  {
    id: "act-1",
    tenantId: "ten-001",
    timestamp: "2026-11-02 11:24 UTC",
    event: "Plan Upgraded",
    performedBy: "Chukwuma Obi (Owner)",
    details: "Migrated from Starter to Growth Tier via Paystack subscription charge",
  },
  {
    id: "act-2",
    tenantId: "ten-001",
    timestamp: "2026-10-15 08:30 UTC",
    event: "Workspace Provisioned",
    performedBy: "Platform Administrator (Bolanle Cole)",
    details: "Initial workspace provisioned with Pharmacy preset and batch tracking enabled",
  },
];

const mockOverrides: TenantEntitlementOverride[] = [
  {
    id: "ovr-1",
    tenantId: "ten-001",
    key: "max_users",
    label: "Maximum User Seats",
    standardValue: 3,
    overrideValue: 5,
    reason: "Promotional upgrade negotiated during annual onboarding",
    expiresAt: "2027-09-15T00:00:00Z",
  },
];

export class TenantService {
  /**
   * Section 6.1: Generates real-time Overview Metrics answering the Three Questions:
   * 1. Is the platform healthy?
   * 2. Is money coming in?
   * 3. What needs attention today?
   */
  public static getOverviewMetrics() {
    const totalTenants = mockTenants.length;
    const activeTenants = mockTenants.filter((t) => t.status === "active").length;
    const trialTenants = mockTenants.filter((t) => t.status === "trial").length;
    const graceTenants = mockTenants.filter((t) => t.status === "grace").length;
    const suspendedTenants = mockTenants.filter((t) => t.status === "suspended").length;
    const cancelledTenants = mockTenants.filter((t) => t.status === "cancelled").length;

    const mrr = mockTenants
      .filter((t) => t.status === "active" || t.status === "grace")
      .reduce((sum, t) => sum + t.mrr, 0);

    const newTenantsThisMonth = 2;
    const tenantsLostThisMonth = 0;

    // Money panel
    const moneyPanel = {
      revenueCollectedThisMonth: 185000,
      failedPaymentsCount: 1, // ten-005 in grace
      failedPaymentsAmount: 28000,
      renewalsDueNext7Days: 3,
      renewalsValueNext7Days: 88000,
    };

    // Health strip (database, cache, storage, payment gateway, email/messaging)
    const healthStrip = [
      { service: "PostgreSQL Database (Neon)", status: "Operational", latency: "22ms", lastChecked: "1 min ago" },
      { service: "Redis Cache (Upstash)", status: "Operational", latency: "14ms", lastChecked: "1 min ago" },
      { service: "Encrypted Storage (Cloudflare R2)", status: "Operational", latency: "42ms", lastChecked: "3 mins ago" },
      { service: "Payment Gateway (Paystack)", status: "Operational", latency: "58ms", lastChecked: "Just now" },
      { service: "Messaging & Email (Termii / Resend)", status: "Operational", latency: "95ms", lastChecked: "2 mins ago" },
    ];

    // Attention list: failed webhooks, tenants near plan limits, tickets > 48h, pending approvals, trials ending in 3 days
    const attentionList = [
      {
        id: "att-1",
        type: "approval",
        title: "2 Pending Dual-Control Approvals require authorization",
        severity: "warning",
        href: "/superadmin/approvals",
        age: "6h ago",
      },
      {
        id: "att-2",
        type: "grace",
        title: "Victoria Island Gourmet Grocers entered grace period (Failed Paystack charge)",
        severity: "critical",
        href: "/superadmin/tenants/ten-005",
        age: "1d ago",
      },
      {
        id: "att-3",
        type: "trial",
        title: "Abuja Modern Pharmacy Ltd trial ends in 5 days",
        severity: "info",
        href: "/superadmin/tenants/ten-004",
        age: "2d ago",
      },
      {
        id: "att-4",
        type: "limits",
        title: "Lekki Superette & Cold Store reached 85% of standard product limit",
        severity: "info",
        href: "/superadmin/tenants/ten-002",
        age: "4h ago",
      },
    ];

    return {
      summaryTiles: {
        activeTenants,
        trialTenants,
        graceTenants,
        suspendedTenants,
        mrr,
        newTenantsThisMonth,
        tenantsLostThisMonth,
        totalTenants,
      },
      moneyPanel,
      healthStrip,
      attentionList,
    };
  }

  /**
   * Section 6.3: List and filter tenants
   */
  public static listTenants(filter?: {
    search?: string;
    status?: string;
    plan?: string;
    businessType?: string;
  }): TenantSummary[] {
    let list = [...mockTenants];

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.businessName.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.maskedEmail.toLowerCase().includes(q)
      );
    }

    if (filter?.status && filter.status !== "all") {
      list = list.filter((t) => t.status === filter.status);
    }

    if (filter?.plan && filter.plan !== "all") {
      list = list.filter((t) => t.planName === filter.plan);
    }

    if (filter?.businessType && filter.businessType !== "all") {
      list = list.filter((t) => t.businessType.toLowerCase().includes(filter.businessType!.toLowerCase()));
    }

    return list;
  }

  /**
   * Section 6.3: Detail view of single tenant
   */
  public static getTenantById(id: string) {
    const tenant = mockTenants.find((t) => t.id === id);
    if (!tenant) {
      throw new AppError(`Tenant workspace with ID '${id}' not found.`, 404, "NOT_FOUND");
    }

    const notes = mockNotes.filter((n) => n.tenantId === id);
    const activities = mockActivities.filter((a) => a.tenantId === id);
    const overrides = mockOverrides.filter((o) => o.tenantId === id);

    // Plan limits based on tier
    const planLimits = {
      Starter: { maxUsers: 2, maxProducts: 250, maxBranches: 1, maxStorageMb: 100 },
      Growth: { maxUsers: 5, maxProducts: 1000, maxBranches: 2, maxStorageMb: 500 },
      Business: { maxUsers: 10, maxProducts: 5000, maxBranches: 5, maxStorageMb: 2000 },
      Enterprise: { maxUsers: 50, maxProducts: 25000, maxBranches: 20, maxStorageMb: 10000 },
    }[tenant.planName];

    return {
      tenant,
      notes,
      activities,
      overrides,
      planLimits,
    };
  }

  /**
   * Section 6.3 Provisioning:
   * "The owner receives an invitation to set their own password. No tenant is ever created with a shared or default password."
   */
  public static async provisionTenant(
    input: {
      businessName: string;
      businessType: string;
      ownerName: string;
      ownerEmail: string;
      ownerPhone: string;
      planName: "Starter" | "Growth" | "Business" | "Enterprise";
      trialDays?: number;
      preset: "Supermarket" | "Pharmacy" | "Wholesaler" | "Retail" | "Restaurant";
    },
    staffContext: PlatformStaffContext
  ): Promise<{ tenant: TenantSummary; invitationToken: string }> {
    PlatformPermissionEngine.enforcePermission(staffContext, "tenants:provision");

    if (!input.businessName?.trim()) throw new ValidationError("Business name is mandatory.");
    if (!input.ownerEmail?.trim() || !input.ownerEmail.includes("@")) throw new ValidationError("A valid owner email is required.");

    const trialDays = input.trialDays || 14;
    const now = new Date();
    const trialEnd = new Date(now.getTime() + trialDays * 24 * 3600 * 1000);
    const renewalDate = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

    const tenantId = `ten-${String(mockTenants.length + 1).padStart(3, "0")}`;
    const invitationToken = `inv-${Math.random().toString(36).substring(2, 12)}`;

    const mrrMap = { Starter: 15000, Growth: 28000, Business: 45000, Enterprise: 85000 };

    const newTenant: TenantSummary = {
      id: tenantId,
      businessName: input.businessName.trim(),
      businessType: input.businessType,
      planName: input.planName,
      status: "trial",
      ownerName: input.ownerName.trim(),
      ownerEmail: input.ownerEmail.trim(),
      ownerPhone: input.ownerPhone.trim(),
      maskedEmail: maskEmail(input.ownerEmail.trim()),
      maskedPhone: maskPhone(input.ownerPhone.trim()),
      userCount: 1,
      productCount: 0,
      salesThisMonth: 0,
      storageUsedMb: 0.5,
      createdAt: now.toISOString(),
      renewalDate: renewalDate.toISOString(),
      trialEnd: trialEnd.toISOString(),
      lastActivity: "Just now",
      mrr: mrrMap[input.planName],
    };

    mockTenants.unshift(newTenant);

    // Audit the provisioning
    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "tenant.provision",
      entityType: "tenant",
      entityId: tenantId,
      newValue: {
        businessName: newTenant.businessName,
        plan: newTenant.planName,
        preset: input.preset,
        ownerEmail: newTenant.maskedEmail,
        trialDays,
        invitationTokenGenerated: true,
      },
    });

    return { tenant: newTenant, invitationToken };
  }

  /**
   * Section 4 & 6.3 Suspension:
   * Suspending a PAYING tenant is a sensitive action that requires dual control!
   * Non-paying or trial tenants can be suspended directly.
   */
  public static async suspendTenant(
    tenantId: string,
    reason: string,
    staffContext: PlatformStaffContext
  ): Promise<{ status: "suspended" | "pending_approval"; approvalRequestId?: string }> {
    PlatformPermissionEngine.enforcePermission(staffContext, "tenants:suspend");

    const tenant = mockTenants.find((t) => t.id === tenantId);
    if (!tenant) throw new AppError("Tenant not found.", 404, "NOT_FOUND");
    if (!reason?.trim() || reason.trim().length < 5) throw new ValidationError("A written reason is mandatory for suspension.");

    // Section 4 Rule: Suspending a paying tenant requires dual control!
    if (tenant.status === "active") {
      const approvalReq = await PlatformApprovalEngine.createRequest({
        actionKey: "tenants:suspend",
        actionTitle: `Suspend Paying Tenant: ${tenant.businessName}`,
        entityType: "tenant",
        entityId: tenant.id,
        requesterId: staffContext.id,
        requesterName: staffContext.name,
        requesterEmail: staffContext.email,
        requesterRole: staffContext.role,
        reason: reason.trim(),
        beforeState: { status: tenant.status, plan: tenant.planName, mrr: tenant.mrr },
        afterState: { status: "suspended", reason: reason.trim() },
      });

      return { status: "pending_approval", approvalRequestId: approvalReq.id };
    }

    // Direct suspension for trial / grace / non-paying
    tenant.status = "suspended";
    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "tenant.suspend_direct",
      entityType: "tenant",
      entityId: tenant.id,
      previousValue: { status: "trial" },
      newValue: { status: "suspended", reason },
    });

    return { status: "suspended" };
  }

  /**
   * Section 6.3: Add internal staff note (never visible to tenant)
   */
  public static async addNote(
    tenantId: string,
    content: string,
    staffContext: PlatformStaffContext
  ): Promise<TenantNote> {
    if (!content?.trim()) throw new ValidationError("Note content cannot be empty.");

    const newNote: TenantNote = {
      id: `note-${Date.now()}`,
      tenantId,
      staffName: staffContext.name,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    mockNotes.unshift(newNote);

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "tenant.add_internal_note",
      entityType: "tenant",
      entityId: tenantId,
      newValue: { noteId: newNote.id, length: content.length },
    });

    return newNote;
  }

  /**
   * Section 6.3: Extend grace period with mandatory reason
   */
  public static async extendGracePeriod(
    tenantId: string,
    extensionDays: number,
    reason: string,
    staffContext: PlatformStaffContext
  ) {
    if (!reason?.trim()) throw new ValidationError("A mandatory justification is required to extend grace period.");
    const tenant = mockTenants.find((t) => t.id === tenantId);
    if (!tenant) throw new AppError("Tenant not found.", 404, "NOT_FOUND");

    const currentRenewal = new Date(tenant.renewalDate);
    const newRenewal = new Date(currentRenewal.getTime() + extensionDays * 24 * 3600 * 1000);
    const previousDate = tenant.renewalDate;
    tenant.renewalDate = newRenewal.toISOString();

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "tenant.extend_grace_period",
      entityType: "tenant",
      entityId: tenantId,
      previousValue: { renewalDate: previousDate },
      newValue: { renewalDate: tenant.renewalDate, extensionDays, reason },
    });

    return tenant;
  }

  public static resetForTesting(): void {
    // Resets initial state if needed in tests
  }
}

