import { PlatformApprovalEngine } from "./approval-engine";
import { PlatformAuditLogger } from "./audit-logger";
import { PlatformPermissionEngine, PlatformStaffContext } from "./permission-engine";
import { AppError, ForbiddenError, ValidationError } from "@/lib/security/errors";

export type ContentStatus = "draft" | "scheduled" | "published" | "archived";

export interface ContentVersionRecord {
  id: string;
  itemId: string;
  versionNumber: number;
  title: string;
  body: string;
  snapshotData: Record<string, any>;
  authorStaffId: string;
  authorStaffName: string;
  changeSummary?: string;
  publishedAt: string;
}

/*
|--------------------------------------------------------------------------
| 1. ANNOUNCEMENTS (Section 6.7)
|--------------------------------------------------------------------------
*/

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  audienceType: "all" | "one_plan" | "one_business_type" | "custom_list";
  targetAudience: string[]; // plan names, business types, or tenant IDs
  startsAt: string;
  endsAt: string;
  isDismissible: boolean;
  status: ContentStatus;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

let inMemoryAnnouncements: AnnouncementItem[] = [
  {
    id: "ann-01",
    title: "Scheduled Paystack Gateway Maintenance",
    message: "Paystack will undergo banking infrastructure maintenance on Sunday 2:00 AM - 4:00 AM WAT. Card settlements will be briefly queued.",
    severity: "warning",
    audienceType: "all",
    targetAudience: [],
    startsAt: "2026-11-09T00:00:00Z",
    endsAt: "2026-11-16T23:59:59Z",
    isDismissible: true,
    status: "published",
    currentVersion: 1,
    createdAt: "2026-11-08T10:00:00Z",
    updatedAt: "2026-11-08T10:00:00Z",
  },
  {
    id: "ann-02",
    title: "NAFDAC Batch Verification Compliance Update",
    message: "New automated batch expiry tracking is now available for all registered pharmacies on Ease Me.",
    severity: "info",
    audienceType: "one_business_type",
    targetAudience: ["pharmacy"],
    startsAt: "2026-11-05T00:00:00Z",
    endsAt: "2026-11-30T23:59:59Z",
    isDismissible: true,
    status: "published",
    currentVersion: 1,
    createdAt: "2026-11-05T09:00:00Z",
    updatedAt: "2026-11-05T09:00:00Z",
  },
];

/*
|--------------------------------------------------------------------------
| 2. HELP CENTER (Section 6.7)
|--------------------------------------------------------------------------
*/

export interface HelpArticleItem {
  id: string;
  title: string;
  category: "pos" | "inventory" | "billing" | "reports" | "compliance";
  body: string;
  searchKeywords: string[];
  roleVisibility: ("owner" | "manager" | "cashier" | "customer")[];
  status: ContentStatus;
  currentVersion: number;
  updatedAt: string;
}

let inMemoryArticles: HelpArticleItem[] = [
  {
    id: "art-01",
    title: "How to Reconcile Cashier Shift Endings",
    category: "pos",
    body: "Follow these 4 steps to count physical cash, verify electronic POS slips, and submit the shift closing balance for owner approval...",
    searchKeywords: ["cashier", "shift", "closing", "reconciliation", "drawer"],
    roleVisibility: ["owner", "manager", "cashier"],
    status: "published",
    currentVersion: 1,
    updatedAt: "2026-10-15T12:00:00Z",
  },
  {
    id: "art-02",
    title: "Paying Outstanding Store Balance via Customer Portal",
    category: "billing",
    body: "You can view your real-time debt statement and settle balances via debit card or direct USSD transfer...",
    searchKeywords: ["debt", "portal", "payment", "statement"],
    roleVisibility: ["customer", "owner", "manager"], // Never cashier!
    status: "published",
    currentVersion: 1,
    updatedAt: "2026-10-20T14:30:00Z",
  },
];

/*
|--------------------------------------------------------------------------
| 3. MESSAGE TEMPLATES & APPROVED VARIABLES (Section 6.7)
|--------------------------------------------------------------------------
*/

export const APPROVED_TEMPLATE_VARIABLES = [
  "{{business_name}}",
  "{{owner_name}}",
  "{{amount}}",
  "{{currency}}",
  "{{due_date}}",
  "{{invoice_number}}",
  "{{reset_link}}",
  "{{login_url}}",
  "{{support_email}}",
] as const;

export interface MessageTemplateItem {
  id: string;
  templateKey: string;
  channel: "email" | "sms" | "whatsapp" | "receipt";
  name: string;
  subject?: string;
  body: string;
  allowedVariables: string[];
  activeVersion: number;
  updatedAt: string;
}

let inMemoryTemplates: MessageTemplateItem[] = [
  {
    id: "tmpl-01",
    templateKey: "welcome_owner_email",
    channel: "email",
    name: "Owner Welcome & Password Setup",
    subject: "Welcome to Ease Me - Set up your store account for {{business_name}}",
    body: "Hello {{owner_name}},\n\nYour Ease Me store workspace for {{business_name}} is ready. Please click the link below to configure your secure password and start your 14-day trial:\n\n{{reset_link}}\n\nNeed assistance? Reply directly to this email or reach us at {{support_email}}.\n\nWarm regards,\nThe Ease Me Team",
    allowedVariables: ["{{business_name}}", "{{owner_name}}", "{{reset_link}}", "{{support_email}}"],
    activeVersion: 1,
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "tmpl-02",
    templateKey: "subscription_payment_failed_email",
    channel: "email",
    name: "Subscription Renewal Charge Failed",
    subject: "Urgent: Subscription payment failed for {{business_name}}",
    body: "Dear {{owner_name}},\n\nWe were unable to process your renewal charge of {{currency}} {{amount}} for {{business_name}}. A 3-day grace period has been activated. Please update your card mandate at:\n\n{{login_url}}",
    allowedVariables: ["{{business_name}}", "{{owner_name}}", "{{amount}}", "{{currency}}", "{{login_url}}"],
    activeVersion: 1,
    updatedAt: "2026-10-10T00:00:00Z",
  },
  {
    id: "tmpl-03",
    templateKey: "debt_reminder_sms",
    channel: "sms",
    name: "Customer Debt Reminder SMS",
    body: "Hello from {{business_name}}: Your store account balance of {{currency}} {{amount}} is due on {{due_date}}. View statement and pay securely: {{login_url}}",
    allowedVariables: ["{{business_name}}", "{{amount}}", "{{currency}}", "{{due_date}}", "{{login_url}}"],
    activeVersion: 1,
    updatedAt: "2026-10-12T00:00:00Z",
  },
];

/*
|--------------------------------------------------------------------------
| 4. LEGAL DOCUMENTS & ACCEPTANCE GATE (Section 6.7 & 11)
|--------------------------------------------------------------------------
*/

export interface LegalDocumentItem {
  id: string;
  documentType: "terms_of_service" | "privacy_policy" | "data_processing_terms";
  title: string;
  body: string;
  versionNumber: string;
  effectiveDate: string;
  approvalRequestId?: string | null;
  publishedAt: string;
  updatedAt: string;
}

export interface LegalAcceptanceRecord {
  id: string;
  documentType: string;
  versionNumber: string;
  tenantId: string;
  ownerId: string;
  ownerEmail: string;
  acceptedAt: string;
  ipAddress: string;
}

let inMemoryLegalDocs: LegalDocumentItem[] = [
  {
    id: "leg-01",
    documentType: "terms_of_service",
    title: "Ease Me Platform Master Terms of Service",
    body: "These Master Terms of Service govern all tenant subscriptions, POS terminal software licensing, multi-branch inventory tracking, and payment processing...",
    versionNumber: "2.1",
    effectiveDate: "2026-09-01T00:00:00Z",
    publishedAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
  },
  {
    id: "leg-02",
    documentType: "privacy_policy",
    title: "Ease Me Nigeria Data Privacy & NDPR Policy",
    body: "In compliance with the Nigeria Data Protection Act (NDPA) and NDPR regulations, this Privacy Policy outlines data controller and processor obligations...",
    versionNumber: "2.0",
    effectiveDate: "2026-08-15T00:00:00Z",
    publishedAt: "2026-08-15T00:00:00Z",
    updatedAt: "2026-08-15T00:00:00Z",
  },
];

const inMemoryLegalAcceptances: LegalAcceptanceRecord[] = [
  {
    id: "acc-01",
    documentType: "terms_of_service",
    versionNumber: "2.1",
    tenantId: "ten-001",
    ownerId: "usr-ten-owner-01",
    ownerEmail: "owner@alpha-retail.ng",
    acceptedAt: "2026-09-02T10:00:00Z",
    ipAddress: "102.89.23.11",
  },
];

/*
|--------------------------------------------------------------------------
| 5. ONBOARDING STEPS (Section 6.7)
|--------------------------------------------------------------------------
*/

export interface OnboardingStepItem {
  id: string;
  stepKey: string;
  title: string;
  description: string;
  completionRule: "store_profile_completed" | "first_product_created" | "first_sale_completed" | "team_member_invited";
  sortOrder: number;
  isMandatory: boolean;
  updatedAt: string;
}

let inMemoryOnboardingSteps: OnboardingStepItem[] = [
  {
    id: "onb-01",
    stepKey: "store_profile",
    title: "Complete Store Profile & Tax Info",
    description: "Provide store address, WhatsApp contact, and default VAT setting for customer receipts.",
    completionRule: "store_profile_completed",
    sortOrder: 1,
    isMandatory: true,
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "onb-02",
    stepKey: "first_product",
    title: "Add or Import First 5 Products",
    description: "Create items manually or upload your CSV catalog with cost prices, selling prices, and reorder levels.",
    completionRule: "first_product_created",
    sortOrder: 2,
    isMandatory: true,
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "onb-03",
    stepKey: "first_sale",
    title: "Process a Test Checkout Sale",
    description: "Open your POS terminal, add an item to the basket, and generate your first printed or WhatsApp receipt.",
    completionRule: "first_sale_completed",
    sortOrder: 3,
    isMandatory: true,
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "onb-04",
    stepKey: "invite_cashier",
    title: "Invite a Cashier or Store Manager",
    description: "Assign role-based access so your team can record sales without seeing financial profit reports.",
    completionRule: "team_member_invited",
    sortOrder: 4,
    isMandatory: false,
    updatedAt: "2026-10-01T00:00:00Z",
  },
];

/*
|--------------------------------------------------------------------------
| 6. BUSINESS PRESETS (Section 6.7 & 11)
|--------------------------------------------------------------------------
*/

export interface BusinessPresetItem {
  id: string;
  businessType: "pharmacy" | "supermarket" | "restaurant" | "boutique" | "general_retail";
  name: string;
  description: string;
  productCategories: string[];
  expenseCategories: string[];
  defaultTaxRate: number;
  unitsOfMeasure: string[];
  batchTracking: boolean;
  expiryTracking: boolean;
  updatedAt: string;
}

let inMemoryPresets: BusinessPresetItem[] = [
  {
    id: "prs-01",
    businessType: "pharmacy",
    name: "Pharmacy & Healthcare Starter Pack",
    description: "Pre-configured for retail and wholesale drug dispensaries. Turns batch tracking and expiry alerts ON.",
    productCategories: ["Prescription Drugs", "OTC Medications", "Medical Supplies", "Personal Care", "Baby Care"],
    expenseCategories: ["Stock Purchase", "Pharmacist Council Dues", "Cold-Chain Electricity", "Store Rent"],
    defaultTaxRate: 0.0, // Prescription drugs typically exempt
    unitsOfMeasure: ["Pack", "Card/Blister", "Bottle", "Vial", "Piece"],
    batchTracking: true,
    expiryTracking: true,
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "prs-02",
    businessType: "supermarket",
    name: "Supermarket & Grocery Pack",
    description: "Fast-moving grocery and consumer goods. Turns batch tracking OFF to maximize checkout speed.",
    productCategories: ["Beverages", "Snacks & Confectionery", "Dairy & Frozen", "Household Cleaning", "Toiletries"],
    expenseCategories: ["Stock Replenishment", "Store Generator Fuel", "Equipment Maintenance", "Salaries"],
    defaultTaxRate: 7.5,
    unitsOfMeasure: ["Carton", "Piece", "Kg", "Bottle"],
    batchTracking: false,
    expiryTracking: false,
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "prs-03",
    businessType: "restaurant",
    name: "Restaurant & Quick-Service Eatery",
    description: "Portion ingredients, daily cooked items, and beverage service.",
    productCategories: ["Hot Meals", "Sides", "Pastries", "Chilled Drinks", "Packaging"],
    expenseCategories: ["Market Food Ingredients", "Cooking Gas", "Store Generator", "Kitchen Staff"],
    defaultTaxRate: 7.5,
    unitsOfMeasure: ["Plate", "Portion", "Bottle", "Cup"],
    batchTracking: false,
    expiryTracking: false,
    updatedAt: "2026-10-01T00:00:00Z",
  },
];

const inMemoryVersions: ContentVersionRecord[] = [];

/*
|--------------------------------------------------------------------------
| PLATFORM CONTENT SERVICE
|--------------------------------------------------------------------------
*/

export class PlatformContentService {
  /*
  | Announcements
  */
  public static getAnnouncements(): AnnouncementItem[] {
    return [...inMemoryAnnouncements];
  }

  public static async createAnnouncement(
    input: Omit<AnnouncementItem, "id" | "status" | "currentVersion" | "createdAt" | "updatedAt">,
    staffContext: PlatformStaffContext
  ): Promise<AnnouncementItem> {
    PlatformPermissionEngine.enforcePermission(staffContext, "content:write");

    if (!input.title?.trim() || !input.message?.trim()) {
      throw new ValidationError("Announcement title and message are mandatory.");
    }

    const item: AnnouncementItem = {
      ...input,
      id: `ann-${Date.now()}`,
      status: "draft",
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryAnnouncements.unshift(item);

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "content.announcement_create",
      entityType: "announcement",
      entityId: item.id,
      newValue: item,
    });

    return item;
  }

  public static async publishAnnouncement(
    id: string,
    staffContext: PlatformStaffContext
  ): Promise<AnnouncementItem> {
    PlatformPermissionEngine.enforcePermission(staffContext, "content:write");

    const item = inMemoryAnnouncements.find((a) => a.id === id);
    if (!item) throw new AppError("Announcement not found.", 404, "NOT_FOUND");

    const previousValue = { status: item.status, currentVersion: item.currentVersion };
    item.status = "published";
    item.currentVersion += 1;
    item.updatedAt = new Date().toISOString();

    // Capture version snapshot
    const versionRecord: ContentVersionRecord = {
      id: `ver-${Date.now()}`,
      itemId: item.id,
      versionNumber: item.currentVersion,
      title: item.title,
      body: item.message,
      snapshotData: { ...item },
      authorStaffId: staffContext.id,
      authorStaffName: staffContext.name,
      changeSummary: "Published announcement to tenant dashboards",
      publishedAt: new Date().toISOString(),
    };
    inMemoryVersions.unshift(versionRecord);

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "content.announcement_publish",
      entityType: "announcement",
      entityId: item.id,
      previousValue,
      newValue: item,
    });

    return item;
  }

  public static getActiveAnnouncementsForTenant(tenant: {
    plan: string;
    businessType: string;
    tenantId: string;
  }): AnnouncementItem[] {
    const now = new Date();
    return inMemoryAnnouncements.filter((a) => {
      if (a.status !== "published") return false;
      const start = new Date(a.startsAt);
      const end = new Date(a.endsAt);
      if (now < start || now > end) return false;

      if (a.audienceType === "all") return true;
      if (a.audienceType === "one_plan") {
        return a.targetAudience.map((p) => p.toLowerCase()).includes(tenant.plan.toLowerCase());
      }
      if (a.audienceType === "one_business_type") {
        return a.targetAudience.map((b) => b.toLowerCase()).includes(tenant.businessType.toLowerCase());
      }
      if (a.audienceType === "custom_list") {
        return a.targetAudience.includes(tenant.tenantId);
      }
      return false;
    });
  }

  /*
  | Help Center
  */
  public static getArticles(): HelpArticleItem[] {
    return [...inMemoryArticles];
  }

  public static getArticlesForRole(role: "owner" | "manager" | "cashier" | "customer"): HelpArticleItem[] {
    return inMemoryArticles.filter((a) => a.status === "published" && a.roleVisibility.includes(role));
  }

  /*
  | Message Templates & Approved Variables
  */
  public static getTemplates(): MessageTemplateItem[] {
    return [...inMemoryTemplates];
  }

  /**
   * Section 6.7: The editor rejects unknown variables.
   */
  public static validateTemplateVariables(body: string, allowed: string[]): void {
    const tokens = body.match(/\{\{[a-zA-Z0-9_]+\}\}/g) || [];
    for (const token of tokens) {
      if (!allowed.includes(token)) {
        throw new ValidationError(
          `Unapproved template variable '${token}' detected. Only sanctioned variables (${allowed.join(", ")}) are permitted.`
        );
      }
    }
  }

  public static async updateTemplate(
    templateKey: string,
    body: string,
    subject: string | undefined,
    staffContext: PlatformStaffContext
  ): Promise<MessageTemplateItem> {
    PlatformPermissionEngine.enforcePermission(staffContext, "content:write");

    const template = inMemoryTemplates.find((t) => t.templateKey === templateKey);
    if (!template) throw new AppError("Template not found.", 404, "NOT_FOUND");

    // Strictly validate variables before saving
    this.validateTemplateVariables(body, template.allowedVariables);
    if (subject) {
      this.validateTemplateVariables(subject, template.allowedVariables);
    }

    const previousValue = { body: template.body, subject: template.subject, activeVersion: template.activeVersion };
    template.body = body;
    if (subject !== undefined) template.subject = subject;
    template.activeVersion += 1;
    template.updatedAt = new Date().toISOString();

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "content.template_update",
      entityType: "template",
      entityId: templateKey,
      previousValue,
      newValue: { activeVersion: template.activeVersion, updatedAt: template.updatedAt },
    });

    return template;
  }

  public static testSendTemplate(
    templateKey: string,
    recipientStaffEmail: string
  ): { success: boolean; renderedBody: string; recipient: string } {
    const template = inMemoryTemplates.find((t) => t.templateKey === templateKey);
    if (!template) throw new AppError("Template not found.", 404, "NOT_FOUND");

    let rendered = template.body
      .replace(/\{\{business_name\}\}/g, "Alpha Retail Pharmacy Ltd")
      .replace(/\{\{owner_name\}\}/g, "Dr. Bolanle Adeleke")
      .replace(/\{\{amount\}\}/g, "₦28,000")
      .replace(/\{\{currency\}\}/g, "NGN")
      .replace(/\{\{due_date\}\}/g, "15/11/2026")
      .replace(/\{\{reset_link\}\}/g, "https://app.easeme.ng/set-password?token=test_908123")
      .replace(/\{\{login_url\}\}/g, "https://app.easeme.ng/login")
      .replace(/\{\{support_email\}\}/g, "support@easeme.ng");

    return {
      success: true,
      renderedBody: rendered,
      recipient: recipientStaffEmail,
    };
  }

  /*
  | Legal Documents & Tenant Acceptance Gate (Section 6.7 & 11)
  */
  public static getLegalDocuments(): LegalDocumentItem[] {
    return [...inMemoryLegalDocs];
  }

  /**
   * Section 4 & 6.7: Proposing new legal version requires dual control approval!
   */
  public static async proposeLegalVersion(
    documentType: "terms_of_service" | "privacy_policy" | "data_processing_terms",
    newVersionNumber: string,
    newBody: string,
    staffContext: PlatformStaffContext
  ): Promise<{ status: "pending_approval"; approvalRequestId: string }> {
    const canPropose =
      PlatformPermissionEngine.hasPermission(staffContext, "legal:request_publish") ||
      PlatformPermissionEngine.hasPermission(staffContext, "legal:write");

    if (!canPropose) {
      throw new ForbiddenError(
        "Action denied. You do not hold permission to request or write legal document revisions ('legal:request_publish' or 'legal:write')."
      );
    }

    const currentDoc = inMemoryLegalDocs.find((d) => d.documentType === documentType);
    if (!currentDoc) throw new AppError("Legal document type not found.", 404, "NOT_FOUND");

    const approvalReq = await PlatformApprovalEngine.createRequest({
      actionKey: "legal:publish",
      actionTitle: `Publish ${currentDoc.title} v${newVersionNumber}`,
      entityType: "legal_document",
      entityId: currentDoc.id,
      requesterId: staffContext.id,
      requesterName: staffContext.name,
      requesterEmail: staffContext.email,
      requesterRole: staffContext.role,
      reason: `Publishing legal document revision v${newVersionNumber}. Forces tenant owners to accept before accessing dashboards.`,
      beforeState: { versionNumber: currentDoc.versionNumber, effectiveDate: currentDoc.effectiveDate },
      afterState: { versionNumber: newVersionNumber, body: newBody, effectiveDate: new Date().toISOString() },
    });

    return { status: "pending_approval", approvalRequestId: approvalReq.id };
  }

  public static async executeLegalPublish(
    documentType: "terms_of_service" | "privacy_policy" | "data_processing_terms",
    versionNumber: string,
    body: string
  ): Promise<LegalDocumentItem> {
    const doc = inMemoryLegalDocs.find((d) => d.documentType === documentType);
    if (!doc) throw new AppError("Legal document not found.", 404, "NOT_FOUND");

    doc.versionNumber = versionNumber;
    doc.body = body;
    doc.effectiveDate = new Date().toISOString();
    doc.publishedAt = new Date().toISOString();
    doc.updatedAt = new Date().toISOString();

    return doc;
  }

  /**
   * Section 11 Acceptance Test:
   * "Publishing legal documents forces tenant owners to accept them before continuing."
   */
  public static checkPendingLegalAcceptance(
    ownerId: string,
    documentType: "terms_of_service" | "privacy_policy" | "data_processing_terms" = "terms_of_service"
  ): { requiresAcceptance: boolean; currentVersion: string; docTitle?: string } {
    const currentDoc = inMemoryLegalDocs.find((d) => d.documentType === documentType);
    if (!currentDoc) return { requiresAcceptance: false, currentVersion: "1.0" };

    const accepted = inMemoryLegalAcceptances.find(
      (a) => a.ownerId === ownerId && a.documentType === documentType && a.versionNumber === currentDoc.versionNumber
    );

    if (!accepted) {
      return {
        requiresAcceptance: true,
        currentVersion: currentDoc.versionNumber,
        docTitle: currentDoc.title,
      };
    }

    return { requiresAcceptance: false, currentVersion: currentDoc.versionNumber };
  }

  public static recordAcceptance(input: {
    tenantId: string;
    ownerId: string;
    ownerEmail: string;
    documentType: string;
    versionNumber: string;
    ipAddress?: string;
  }): LegalAcceptanceRecord {
    const record: LegalAcceptanceRecord = {
      id: `acc-${Date.now()}`,
      ...input,
      ipAddress: input.ipAddress || "127.0.0.1",
      acceptedAt: new Date().toISOString(),
    };

    inMemoryLegalAcceptances.unshift(record);
    return record;
  }

  /*
  | Onboarding Checklist
  */
  public static getOnboardingSteps(): OnboardingStepItem[] {
    return [...inMemoryOnboardingSteps].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public static async updateOnboardingStep(
    stepKey: string,
    updates: Partial<Omit<OnboardingStepItem, "id" | "stepKey">>,
    staffContext: PlatformStaffContext
  ): Promise<OnboardingStepItem> {
    PlatformPermissionEngine.enforcePermission(staffContext, "content:write");

    const step = inMemoryOnboardingSteps.find((s) => s.stepKey === stepKey);
    if (!step) throw new AppError("Onboarding step not found.", 404, "NOT_FOUND");

    Object.assign(step, updates, { updatedAt: new Date().toISOString() });

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "content.onboarding_update",
      entityType: "onboarding_step",
      entityId: stepKey,
      newValue: step,
    });

    return step;
  }

  /*
  | Business Presets (Section 6.7 & 11)
  */
  public static getPresets(): BusinessPresetItem[] {
    return [...inMemoryPresets];
  }

  /**
   * Section 11 Acceptance Test:
   * "Changing a preset does not alter existing tenants."
   * Clones a deep copy when a new tenant signs up.
   */
  public static clonePresetForNewTenant(businessType: string): BusinessPresetItem {
    const preset = inMemoryPresets.find((p) => p.businessType.toLowerCase() === businessType.toLowerCase()) || inMemoryPresets[0];
    return JSON.parse(JSON.stringify(preset));
  }

  public static async updatePreset(
    businessType: string,
    updates: Partial<Omit<BusinessPresetItem, "id" | "businessType">>,
    staffContext: PlatformStaffContext
  ): Promise<BusinessPresetItem> {
    PlatformPermissionEngine.enforcePermission(staffContext, "content:write");

    const preset = inMemoryPresets.find((p) => p.businessType.toLowerCase() === businessType.toLowerCase());
    if (!preset) throw new AppError("Business preset not found.", 404, "NOT_FOUND");

    const previousValue = JSON.parse(JSON.stringify(preset));
    Object.assign(preset, updates, { updatedAt: new Date().toISOString() });

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "content.preset_update",
      entityType: "business_preset",
      entityId: businessType,
      previousValue,
      newValue: preset,
    });

    return preset;
  }
}
