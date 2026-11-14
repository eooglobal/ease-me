import { PlatformAuditLogger } from "./audit-logger";
import { PlatformPermissionEngine, PlatformStaffContext } from "./permission-engine";
import { AppError, ForbiddenError, ValidationError } from "@/lib/security/errors";

/*
|--------------------------------------------------------------------------
| SUPPORT TICKETS ENGINE (Section 6.9)
|--------------------------------------------------------------------------
*/

export interface SupportTicketItem {
  id: string;
  tenantId: string;
  tenantName: string;
  ownerEmail: string;
  maskedOwnerEmail: string;
  subject: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "waiting_on_tenant" | "resolved" | "closed";
  assigneeStaffId: string | null;
  assigneeStaffName: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  ageHours: number;
  isOverdue48h: boolean;
}

export interface SupportMessageItem {
  id: string;
  ticketId: string;
  authorType: "staff" | "tenant";
  authorId: string;
  authorName: string;
  authorRole: string;
  message: string;
  isInternalNote: boolean;
  createdAt: string;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
}

let inMemoryTickets: SupportTicketItem[] = [
  {
    id: "tkt-001",
    tenantId: "ten-005",
    tenantName: "Victoria Island Gourmet Grocers",
    ownerEmail: "procurement@vigourmet.ng",
    maskedOwnerEmail: "p***t@vigourmet.ng",
    subject: "Thermal receipt printer cutting characters on line items",
    description: "The 80mm ESC/POS network printer cuts off long description text when printing receipts during peak hours.",
    priority: "urgent",
    status: "open",
    assigneeStaffId: "usr-sup-01",
    assigneeStaffName: "Tunde Bakare",
    // Created 52 hours ago -> SLA Overdue (> 48h)
    createdAt: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
    resolvedAt: null,
    ageHours: 52,
    isOverdue48h: true,
  },
  {
    id: "tkt-002",
    tenantId: "ten-001",
    tenantName: "Alpha Health & Retail Emporium Ltd",
    ownerEmail: "owner@alpha-retail.ng",
    maskedOwnerEmail: "o***r@alpha-retail.ng",
    subject: "Assistance configuring multi-branch stock transfer approval workflow",
    description: "Need guidance on setting up transfer authorization between Lekki branch and Ikeja depot warehouse.",
    priority: "medium",
    status: "in_progress",
    assigneeStaffId: "usr-sup-01",
    assigneeStaffName: "Tunde Bakare",
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    resolvedAt: null,
    ageHours: 14,
    isOverdue48h: false,
  },
  {
    id: "tkt-003",
    tenantId: "ten-002",
    tenantName: "Lekki Superette & Cold Store",
    ownerEmail: "info@lekkisuperette.ng",
    maskedOwnerEmail: "i***o@lekkisuperette.ng",
    subject: "Card terminal settlement reconciliation query",
    description: "Weekly settlement amount for 2nd November does not reflect Sunday transaction batch.",
    priority: "high",
    status: "waiting_on_tenant",
    assigneeStaffId: "usr-admin-01",
    assigneeStaffName: "Emeka Okonkwo",
    createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    resolvedAt: null,
    ageHours: 30,
    isOverdue48h: false,
  },
];

let inMemoryMessages: SupportMessageItem[] = [
  {
    id: "msg-01",
    ticketId: "tkt-001",
    authorType: "tenant",
    authorId: "usr-ten-005",
    authorName: "Store Manager",
    authorRole: "manager",
    message: "Our 80mm ESC/POS printer cuts off product titles that exceed 24 characters on physical checkout slips.",
    isInternalNote: false,
    createdAt: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
  },
  {
    id: "msg-02",
    ticketId: "tkt-001",
    authorType: "staff",
    authorId: "usr-sup-01",
    authorName: "Tunde Bakare",
    authorRole: "support_agent",
    message: "Investigating printer character width settings in the receipt layout template. We may need to truncate or wrap text.",
    isInternalNote: true, // Internal staff note (never visible to tenant)
    createdAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
  },
  {
    id: "msg-03",
    ticketId: "tkt-002",
    authorType: "tenant",
    authorId: "usr-ten-001",
    authorName: "Dr. Bolanle Adeleke",
    authorRole: "business_owner",
    message: "Can we mandate that transfer requests above 50 units require two manager approvals?",
    isInternalNote: false,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
  },
  {
    id: "msg-04",
    ticketId: "tkt-002",
    authorType: "staff",
    authorId: "usr-sup-01",
    authorName: "Tunde Bakare",
    authorRole: "support_agent",
    message: "Hello Dr. Adeleke, yes! You can configure the dual-control transfer threshold in Manager Workspace > Inventory Settings.",
    isInternalNote: false,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
];

/*
|--------------------------------------------------------------------------
| CONSENT-BASED SUPPORT ACCESS GRANTS (Section 8 & 11)
|--------------------------------------------------------------------------
*/

export interface SupportAccessGrantItem {
  id: string;
  tenantId: string;
  tenantName: string;
  grantedByOwnerId: string;
  grantedByOwnerEmail: string;
  assignedStaffId: string;
  assignedStaffName: string;
  scope: "config_read_only";
  durationHours: number;
  expiresAt: string;
  status: "active" | "expired" | "revoked";
  allowProfitFigures: boolean;
  pageViewsCount: number;
  pageViewHistory: Array<{ pageUrl: string; timestamp: string }>;
  createdAt: string;
  revokedAt: string | null;
}

let inMemoryGrants: SupportAccessGrantItem[] = [
  {
    id: "grt-01",
    tenantId: "ten-001",
    tenantName: "Alpha Health & Retail Emporium Ltd",
    grantedByOwnerId: "usr-owner-001",
    grantedByOwnerEmail: "owner@alpha-retail.ng",
    assignedStaffId: "usr-sup-01",
    assignedStaffName: "Tunde Bakare",
    scope: "config_read_only",
    durationHours: 4,
    expiresAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(), // 3 hours remaining
    status: "active",
    allowProfitFigures: false,
    pageViewsCount: 2,
    pageViewHistory: [
      { pageUrl: "/owner/settings/receipt", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      { pageUrl: "/owner/inventory/categories", timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    revokedAt: null,
  },
];

export class PlatformSupportService {
  public static listTickets(filter?: {
    status?: string;
    priority?: string;
    assigneeStaffId?: string;
  }): SupportTicketItem[] {
    const now = Date.now();
    let results = inMemoryTickets.map((t) => {
      const ageHours = Math.floor((now - new Date(t.createdAt).getTime()) / (3600 * 1000));
      const isUnresolved = t.status !== "resolved" && t.status !== "closed";
      const isOverdue48h = isUnresolved && ageHours >= 48;
      return {
        ...t,
        ageHours,
        isOverdue48h,
      };
    });

    if (filter?.status && filter.status !== "all") {
      results = results.filter((t) => t.status === filter.status);
    }
    if (filter?.priority && filter.priority !== "all") {
      results = results.filter((t) => t.priority === filter.priority);
    }
    if (filter?.assigneeStaffId && filter.assigneeStaffId !== "all") {
      results = results.filter((t) => t.assigneeStaffId === filter.assigneeStaffId);
    }

    return results;
  }

  public static getTicketById(ticketId: string): {
    ticket: SupportTicketItem;
    messages: SupportMessageItem[];
  } {
    const now = Date.now();
    const t = inMemoryTickets.find((ticket) => ticket.id === ticketId);
    if (!t) throw new AppError("Support ticket not found.", 404, "NOT_FOUND");

    const ageHours = Math.floor((now - new Date(t.createdAt).getTime()) / (3600 * 1000));
    const isUnresolved = t.status !== "resolved" && t.status !== "closed";

    const ticket: SupportTicketItem = {
      ...t,
      ageHours,
      isOverdue48h: isUnresolved && ageHours >= 48,
    };

    const messages = inMemoryMessages
      .filter((m) => m.ticketId === ticketId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return { ticket, messages };
  }

  public static async replyTicket(
    ticketId: string,
    message: string,
    staffContext: PlatformStaffContext,
    isInternalNote: boolean = false
  ): Promise<SupportMessageItem> {
    PlatformPermissionEngine.enforcePermission(staffContext, "support:write");

    if (!message || message.trim().length === 0) {
      throw new ValidationError("Message body cannot be empty.");
    }

    const ticket = inMemoryTickets.find((t) => t.id === ticketId);
    if (!ticket) throw new AppError("Support ticket not found.", 404, "NOT_FOUND");

    const newMsg: SupportMessageItem = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketId,
      authorType: "staff",
      authorId: staffContext.id,
      authorName: staffContext.name,
      authorRole: staffContext.role,
      message: message.trim(),
      isInternalNote,
      createdAt: new Date().toISOString(),
    };

    inMemoryMessages.push(newMsg);
    ticket.updatedAt = new Date().toISOString();

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: isInternalNote ? "support.internal_note_added" : "support.ticket_reply",
      entityType: "support_ticket",
      entityId: ticketId,
      newValue: {
        isInternalNote,
        messageSnippet: message.substring(0, 100),
      },
    });

    return newMsg;
  }

  public static async updateTicketStatus(
    ticketId: string,
    status: SupportTicketItem["status"],
    staffContext: PlatformStaffContext
  ): Promise<SupportTicketItem> {
    PlatformPermissionEngine.enforcePermission(staffContext, "support:write");

    const ticket = inMemoryTickets.find((t) => t.id === ticketId);
    if (!ticket) throw new AppError("Support ticket not found.", 404, "NOT_FOUND");

    const previousStatus = ticket.status;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    if (status === "resolved" || status === "closed") {
      ticket.resolvedAt = new Date().toISOString();
    }

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "support.status_change",
      entityType: "support_ticket",
      entityId: ticketId,
      previousValue: { status: previousStatus },
      newValue: { status },
    });

    return ticket;
  }

  public static async assignTicket(
    ticketId: string,
    assigneeStaffId: string,
    assigneeStaffName: string,
    staffContext: PlatformStaffContext
  ): Promise<SupportTicketItem> {
    PlatformPermissionEngine.enforcePermission(staffContext, "support:write");

    const ticket = inMemoryTickets.find((t) => t.id === ticketId);
    if (!ticket) throw new AppError("Support ticket not found.", 404, "NOT_FOUND");

    ticket.assigneeStaffId = assigneeStaffId;
    ticket.assigneeStaffName = assigneeStaffName;
    ticket.updatedAt = new Date().toISOString();

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "support.ticket_assigned",
      entityType: "support_ticket",
      entityId: ticketId,
      newValue: { assigneeStaffId, assigneeStaffName },
    });

    return ticket;
  }

  public static getOverdueTicketsCount(): number {
    const now = Date.now();
    return inMemoryTickets.filter((t) => {
      const isUnresolved = t.status !== "resolved" && t.status !== "closed";
      const ageHours = (now - new Date(t.createdAt).getTime()) / (3600 * 1000);
      return isUnresolved && ageHours >= 48;
    }).length;
  }
}

/*
|--------------------------------------------------------------------------
| SUPPORT ACCESS GRANT ENGINE (Section 8)
|--------------------------------------------------------------------------
*/

export class SupportAccessGrantEngine {
  /**
   * Section 8 & 12: Impersonation is prohibited.
   * Owner grants hands-on read-only configuration access for <= 24 hours.
   */
  public static createGrant(input: {
    tenantId: string;
    tenantName: string;
    ownerId: string;
    ownerEmail: string;
    assignedStaffId: string;
    assignedStaffName: string;
    durationHours: number;
    allowProfitFigures?: boolean;
  }): SupportAccessGrantItem {
    if (input.durationHours <= 0 || input.durationHours > 24) {
      throw new ValidationError("Support access grants must be between 1 and 24 hours in duration.");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + input.durationHours * 3600 * 1000);

    const grant: SupportAccessGrantItem = {
      id: `grt-${Date.now()}`,
      tenantId: input.tenantId,
      tenantName: input.tenantName,
      grantedByOwnerId: input.ownerId,
      grantedByOwnerEmail: input.ownerEmail,
      assignedStaffId: input.assignedStaffId,
      assignedStaffName: input.assignedStaffName,
      scope: "config_read_only",
      durationHours: input.durationHours,
      expiresAt: expiresAt.toISOString(),
      status: "active",
      allowProfitFigures: Boolean(input.allowProfitFigures),
      pageViewsCount: 0,
      pageViewHistory: [],
      createdAt: now.toISOString(),
      revokedAt: null,
    };

    inMemoryGrants.unshift(grant);

    PlatformAuditLogger.log({
      staffId: input.assignedStaffId,
      staffEmail: "system@easeme.ng",
      staffRole: "support_agent",
      action: "support_grant.created",
      entityType: "support_grant",
      entityId: grant.id,
      newValue: {
        tenantId: input.tenantId,
        assignedStaffId: input.assignedStaffId,
        expiresAt: grant.expiresAt,
        durationHours: input.durationHours,
      },
    });

    return grant;
  }

  /**
   * Section 8 & 11:
   * "The grant gives a named support staff member read only access to that tenant's configuration screens,
   * never customer personal data and never cost or profit figures unless the owner expressly includes them."
   * Acceptance Test: "A support access grant expires on time and its page views are logged."
   */
  public static verifyGrantAccess(
    grantId: string,
    staffId: string,
    targetScreenCategory: "config_screens" | "customer_pii" | "raw_transactions" | "financial_profits"
  ): { allowed: boolean; grant: SupportAccessGrantItem } {
    const grant = inMemoryGrants.find((g) => g.id === grantId);
    if (!grant) {
      throw new ForbiddenError("Support access grant not found.");
    }

    // 1. Check expiration
    const now = new Date();
    if (now > new Date(grant.expiresAt) || grant.status !== "active") {
      if (grant.status === "active") grant.status = "expired";
      throw new ForbiddenError("Support access grant has expired or been revoked.");
    }

    // 2. Named staff verification
    if (grant.assignedStaffId !== staffId) {
      throw new ForbiddenError("Dual control violation: You are not the assigned staff member for this support grant.");
    }

    // 3. Data Boundary Invariants (Section 8)
    if (targetScreenCategory === "customer_pii") {
      throw new ForbiddenError("Support grant policy violation: Customer personal data cannot be accessed under support access.");
    }

    if (targetScreenCategory === "raw_transactions") {
      throw new ForbiddenError("Support grant policy violation: Individual tenant transaction lines cannot be accessed under support access.");
    }

    if (targetScreenCategory === "financial_profits" && !grant.allowProfitFigures) {
      throw new ForbiddenError("Support grant policy violation: Cost and profit data is restricted unless expressly granted by owner.");
    }

    return { allowed: true, grant };
  }

  public static async logGrantPageView(
    grantId: string,
    staffContext: PlatformStaffContext,
    pageUrl: string
  ): Promise<void> {
    const grant = inMemoryGrants.find((g) => g.id === grantId);
    if (!grant) return;

    grant.pageViewsCount += 1;
    grant.pageViewHistory.push({
      pageUrl,
      timestamp: new Date().toISOString(),
    });

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "support_grant.page_viewed",
      entityType: "support_grant",
      entityId: grantId,
      newValue: {
        pageUrl,
        pageViewsCount: grant.pageViewsCount,
        tenantId: grant.tenantId,
      },
    });
  }

  public static revokeGrant(grantId: string, ownerId: string): void {
    const grant = inMemoryGrants.find((g) => g.id === grantId);
    if (!grant) throw new AppError("Grant not found.", 404, "NOT_FOUND");

    grant.status = "revoked";
    grant.revokedAt = new Date().toISOString();

    PlatformAuditLogger.log({
      staffEmail: "system@easeme.ng",
      staffRole: "system",
      action: "support_grant.revoked",
      entityType: "support_grant",
      entityId: grantId,
      newValue: { revokedBy: ownerId, revokedAt: grant.revokedAt },
    });
  }

  public static getActiveGrants(): SupportAccessGrantItem[] {
    const now = new Date();
    return inMemoryGrants.filter(
      (g) => g.status === "active" && new Date(g.expiresAt) > now
    );
  }

  public static listGrantsForTenant(tenantId: string): SupportAccessGrantItem[] {
    return inMemoryGrants.filter((g) => g.tenantId === tenantId);
  }
}

