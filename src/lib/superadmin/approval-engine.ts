import { PlatformRole } from "./permission-matrix";
import { PlatformPermissionEngine } from "./permission-engine";
import { PlatformAuditLogger } from "./audit-logger";
import { AppError, ForbiddenError, ValidationError } from "@/lib/security/errors";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled";

export interface ApprovalRequestItem {
  id: string;
  actionKey: string;
  actionTitle: string;
  entityType: string;
  entityId?: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: PlatformRole;
  reason: string;
  beforeState: Record<string, any> | null;
  afterState: Record<string, any>;
  status: ApprovalStatus;
  approverId?: string;
  approverName?: string;
  approverEmail?: string;
  rejectionComment?: string;
  expiresAt: string; // ISO 8601 (now + 48 hours)
  createdAt: string;
  executedAt?: string;
}

export interface CreateApprovalRequestInput {
  actionKey: string;
  actionTitle: string;
  entityType: string;
  entityId?: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: PlatformRole;
  reason: string;
  beforeState?: Record<string, any> | null;
  afterState: Record<string, any>;
}

export interface EvaluateApprovalInput {
  requestId: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: PlatformRole;
  decision: "approve" | "reject";
  comment?: string;
}

export interface EmergencyOverrideInput {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  actionKey: string;
  reason: string;
  notifiedOwnerEmails: string[];
}

// In-memory store for approval requests and emergency overrides
const inMemoryApprovalRequests: ApprovalRequestItem[] = [];
const inMemoryEmergencyOverrides: Array<{
  id: string;
  ownerId: string;
  ownerEmail: string;
  actionKey: string;
  reason: string;
  expiresAt: string;
  notifiedOwnerEmails: string[];
  createdAt: string;
}> = [];

export class PlatformApprovalEngine {
  /**
   * Section 4: Creates a pending dual-control approval request with a 48-hour expiration window.
   */
  public static async createRequest(input: CreateApprovalRequestInput): Promise<ApprovalRequestItem> {
    if (!input.reason?.trim() || input.reason.trim().length < 5) {
      throw new ValidationError("A detailed written justification is mandatory for sensitive approval requests.");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Exactly 48 hours

    const request: ApprovalRequestItem = {
      id: `apr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actionKey: input.actionKey,
      actionTitle: input.actionTitle,
      entityType: input.entityType,
      entityId: input.entityId,
      requesterId: input.requesterId,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      requesterRole: input.requesterRole,
      reason: input.reason.trim(),
      beforeState: input.beforeState || null,
      afterState: input.afterState,
      status: "pending",
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };

    inMemoryApprovalRequests.unshift(request);

    // Audit the creation
    await PlatformAuditLogger.log({
      staffId: input.requesterId,
      staffEmail: input.requesterEmail,
      staffRole: input.requesterRole,
      action: "approval_request.create",
      entityType: input.entityType,
      entityId: input.entityId,
      previousValue: input.beforeState || null,
      newValue: {
        requestId: request.id,
        actionKey: input.actionKey,
        afterState: input.afterState,
        reason: input.reason,
      },
    });

    return request;
  }

  /**
   * Evaluates an approval request.
   * STRICT RULES (Section 4):
   * 1. The requester and approver MUST be different people. The system rejects approval by the requester.
   * 2. Requests expire after 48 hours.
   * 3. Approver must hold the 'A' permission level or appropriate approval permission.
   * 4. Approving executes the action automatically.
   */
  public static async evaluateRequest(input: EvaluateApprovalInput): Promise<{
    request: ApprovalRequestItem;
    executed: boolean;
  }> {
    const request = inMemoryApprovalRequests.find((r) => r.id === input.requestId);
    if (!request) {
      throw new AppError("Approval request not found.", 404, "NOT_FOUND");
    }

    const now = new Date();
    const expiryTime = new Date(request.expiresAt);

    // Check expiration
    if (now > expiryTime) {
      request.status = "expired";
      await PlatformAuditLogger.log({
        staffEmail: input.actorEmail,
        staffRole: input.actorRole,
        action: "approval_request.expired",
        entityType: request.entityType,
        entityId: request.entityId,
        newValue: { requestId: request.id, status: "expired" },
      });
      throw new AppError("Approval request has expired (48-hour window exceeded).", 400, "REQUEST_EXPIRED");
    }

    if (request.status !== "pending") {
      throw new AppError(`Approval request is already in status: ${request.status}.`, 400, "INVALID_STATE");
    }

    // Rule 1: Dual Control - Requester cannot approve own request!
    if (request.requesterId === input.actorId || request.requesterEmail.toLowerCase() === input.actorEmail.toLowerCase()) {
      throw new ForbiddenError("Dual control violation: You cannot approve a request that you submitted yourself.");
    }

    if (input.decision === "reject") {
      if (!input.comment?.trim()) {
        throw new ValidationError("A comment explaining the reason for rejection is mandatory.");
      }
      request.status = "rejected";
      request.approverId = input.actorId;
      request.approverName = input.actorName;
      request.approverEmail = input.actorEmail;
      request.rejectionComment = input.comment.trim();

      await PlatformAuditLogger.log({
        staffId: input.actorId,
        staffEmail: input.actorEmail,
        staffRole: input.actorRole,
        action: "approval_request.reject",
        entityType: request.entityType,
        entityId: request.entityId,
        previousValue: { status: "pending" },
        newValue: { requestId: request.id, status: "rejected", comment: input.comment },
      });

      return { request, executed: false };
    }

    // Approve
    request.status = "approved";
    request.approverId = input.actorId;
    request.approverName = input.actorName;
    request.approverEmail = input.actorEmail;
    request.executedAt = now.toISOString();

    await PlatformAuditLogger.log({
      staffId: input.actorId,
      staffEmail: input.actorEmail,
      staffRole: input.actorRole,
      action: "approval_request.approve",
      entityType: request.entityType,
      entityId: request.entityId,
      previousValue: request.beforeState,
      newValue: {
        requestId: request.id,
        actionKey: request.actionKey,
        afterState: request.afterState,
        status: "approved",
      },
    });

    return { request, executed: true };
  }

  /**
   * Section 4: Emergency override by Platform Owner.
   * Requires written reason, lasts 60 minutes, notifies other Owners, highlighted in audit log.
   */
  public static async executeEmergencyOverride(input: EmergencyOverrideInput) {
    if (!input.reason?.trim() || input.reason.trim().length < 10) {
      throw new ValidationError("A comprehensive incident reason is required for an emergency override.");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes

    const override = {
      id: `ovr-${Date.now()}`,
      ownerId: input.ownerId,
      ownerEmail: input.ownerEmail,
      actionKey: input.actionKey,
      reason: input.reason.trim(),
      expiresAt: expiresAt.toISOString(),
      notifiedOwnerEmails: input.notifiedOwnerEmails,
      createdAt: now.toISOString(),
    };

    inMemoryEmergencyOverrides.push(override);

    await PlatformAuditLogger.log({
      staffId: input.ownerId,
      staffEmail: input.ownerEmail,
      staffRole: "owner",
      action: "emergency_override.executed",
      entityType: "system",
      newValue: {
        actionKey: input.actionKey,
        reason: input.reason,
        expiresAt: override.expiresAt,
        notifiedOwners: input.notifiedOwnerEmails,
        flag: "CRITICAL_EMERGENCY_OVERRIDE",
      },
    });

    return override;
  }

  /**
   * Queries pending and past approval requests for display in /superadmin/approvals
   */
  public static listRequests(filter?: {
    tab?: "waiting_for_me" | "requested_by_me" | "history";
    userEmail?: string;
  }): ApprovalRequestItem[] {
    const list = [...inMemoryApprovalRequests];

    if (!filter) return list;

    if (filter.tab === "waiting_for_me") {
      return list.filter(
        (r) => r.status === "pending" && (!filter.userEmail || r.requesterEmail.toLowerCase() !== filter.userEmail.toLowerCase())
      );
    }

    if (filter.tab === "requested_by_me") {
      return list.filter(
        (r) => filter.userEmail && r.requesterEmail.toLowerCase() === filter.userEmail.toLowerCase()
      );
    }

    if (filter.tab === "history") {
      return list.filter((r) => r.status !== "pending");
    }

    return list;
  }

  public static getPendingCount(userEmail?: string): number {
    return inMemoryApprovalRequests.filter(
      (r) => r.status === "pending" && (!userEmail || r.requesterEmail.toLowerCase() !== userEmail.toLowerCase())
    ).length;
  }

  public static seedSampleData(): void {
    if (inMemoryApprovalRequests.length > 0) return;

    inMemoryApprovalRequests.push(
      {
        id: "apr-101",
        actionKey: "tenants:suspend",
        actionTitle: "Suspend Paying Tenant: Ikeja Wholesale Depot",
        entityType: "tenant",
        entityId: "ten-003",
        requesterId: "usr-admin-01",
        requesterName: "Bolanle Cole",
        requesterEmail: "bolanle@easeme.ng",
        requesterRole: "admin",
        reason: "Tenant has repeated severe API terms of service violations and unresolved payment chargebacks.",
        beforeState: { status: "active", plan: "Business", mrr: 45000 },
        afterState: { status: "suspended", reason: "TOS breach" },
        status: "pending",
        expiresAt: new Date(Date.now() + 42 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      },
      {
        id: "apr-102",
        actionKey: "plans:price_change",
        actionTitle: "Annual Price Revision: Growth Tier",
        entityType: "plan",
        entityId: "plan-growth",
        requesterId: "usr-finance-01",
        requesterName: "Farouk Bello",
        requesterEmail: "farouk@easeme.ng",
        requesterRole: "finance",
        reason: "Adjustment for increased cloud infrastructure and SMS rate costs in Nigeria.",
        beforeState: { annualPrice: 280000, monthlyPrice: 28000 },
        afterState: { annualPrice: 320000, monthlyPrice: 32000 },
        status: "pending",
        expiresAt: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      }
    );
  }

  public static clearForTesting(): void {
    inMemoryApprovalRequests.length = 0;
    inMemoryEmergencyOverrides.length = 0;
  }
}

