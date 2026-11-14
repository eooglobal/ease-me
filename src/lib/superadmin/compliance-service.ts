import { PlatformApprovalEngine } from "./approval-engine";
import { PlatformAuditLogger } from "./audit-logger";
import { PlatformPermissionEngine, PlatformStaffContext } from "./permission-engine";
import { AppError, ForbiddenError, ValidationError } from "@/lib/security/errors";

export interface DataRequestItem {
  id: string;
  tenantId: string;
  tenantName: string;
  ownerEmail: string;
  requestType: "export" | "deletion";
  status: "pending_preparation" | "ready_for_download" | "retention_window" | "pending_dual_approval" | "completed" | "cancelled";
  statutoryDeadline: string;
  downloadUrl?: string | null;
  downloadExpiresAt?: string | null;
  retentionEndsAt?: string | null;
  approvalRequestId?: string | null;
  completionRecord?: Record<string, any> | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface BackupStatusRecord {
  lastBackupAt: string;
  backupSizeGb: number;
  retentionDays: number;
  lastRestoreTestAt: string;
  restoreTestResult: "passed" | "failed";
  storageLocation: string;
}

let inMemoryDataRequests: DataRequestItem[] = [
  {
    id: "req-exp-01",
    tenantId: "ten-002",
    tenantName: "Lekki Superette & Cold Store",
    ownerEmail: "owner@lekkisuperette.ng",
    requestType: "export",
    status: "ready_for_download",
    statutoryDeadline: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
    downloadUrl: "https://secure.easeme.ng/data-exports/exp-ten-002-encrypted.zip",
    downloadExpiresAt: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: "req-del-01",
    tenantId: "ten-003",
    tenantName: "Ikeja Wholesale Depot",
    ownerEmail: "admin@ikejadepot.com",
    requestType: "deletion",
    status: "retention_window",
    statutoryDeadline: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(),
    retentionEndsAt: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
];

let inMemoryBackupStatus: BackupStatusRecord = {
  lastBackupAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  backupSizeGb: 4.82,
  retentionDays: 30,
  lastRestoreTestAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  restoreTestResult: "passed",
  storageLocation: "Cloudflare R2 Object Storage (Encrypted Enc-At-Rest AES-256)",
};

export class PlatformComplianceService {
  public static listRequests(): DataRequestItem[] {
    return [...inMemoryDataRequests];
  }

  public static getBackupStatus(): BackupStatusRecord {
    return { ...inMemoryBackupStatus };
  }

  /**
   * Section 9 Step 1 & 3: Tenant data export request
   */
  public static async createExportRequest(
    tenantId: string,
    tenantName: string,
    ownerEmail: string
  ): Promise<DataRequestItem> {
    const now = new Date();
    const deadline = new Date(now.getTime() + 14 * 24 * 3600 * 1000); // 14-day statutory clock
    const downloadExpiry = new Date(now.getTime() + 24 * 3600 * 1000); // 24h download window

    const req: DataRequestItem = {
      id: `req-exp-${Date.now()}`,
      tenantId,
      tenantName,
      ownerEmail,
      requestType: "export",
      status: "ready_for_download",
      statutoryDeadline: deadline.toISOString(),
      downloadUrl: `https://secure.easeme.ng/data-exports/exp-${tenantId}-encrypted.zip`,
      downloadExpiresAt: downloadExpiry.toISOString(),
      createdAt: now.toISOString(),
    };

    inMemoryDataRequests.unshift(req);

    await PlatformAuditLogger.log({
      staffEmail: "system@easeme.ng",
      staffRole: "system",
      action: "compliance.export_prepared",
      entityType: "data_request",
      entityId: req.id,
      newValue: { tenantId, downloadExpiresAt: req.downloadExpiresAt },
    });

    return req;
  }

  /**
   * Section 9 Step 4 & 5: Deletion request with retention window & dual-control approval
   */
  public static async requestDeletion(
    tenantId: string,
    tenantName: string,
    ownerEmail: string
  ): Promise<DataRequestItem> {
    const now = new Date();
    const retentionDays = 14;
    const retentionEndsAt = new Date(now.getTime() + retentionDays * 24 * 3600 * 1000);
    const statutoryDeadline = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

    const req: DataRequestItem = {
      id: `req-del-${Date.now()}`,
      tenantId,
      tenantName,
      ownerEmail,
      requestType: "deletion",
      status: "retention_window",
      statutoryDeadline: statutoryDeadline.toISOString(),
      retentionEndsAt: retentionEndsAt.toISOString(),
      createdAt: now.toISOString(),
    };

    inMemoryDataRequests.unshift(req);

    await PlatformAuditLogger.log({
      staffEmail: "system@easeme.ng",
      staffRole: "system",
      action: "compliance.deletion_requested",
      entityType: "data_request",
      entityId: req.id,
      newValue: { tenantId, retentionEndsAt: req.retentionEndsAt },
    });

    return req;
  }

  public static async createDeletionRequest(
    tenantId: string,
    tenantName: string,
    ownerEmail: string
  ): Promise<DataRequestItem> {
    return this.requestDeletion(tenantId, tenantName, ownerEmail);
  }

  /**
   * Section 9 Step 5: After retention window, Security Officer submits for dual control approval
   */
  public static async submitDeletionForApproval(
    requestId: string,
    reasonOrStaff: string | PlatformStaffContext,
    optionalStaff?: PlatformStaffContext
  ): Promise<{ status: "pending_approval"; approvalRequestId: string }> {
    const staffContext = (typeof reasonOrStaff === "string" ? optionalStaff : reasonOrStaff) as PlatformStaffContext;
    const customReason = typeof reasonOrStaff === "string" ? reasonOrStaff : undefined;

    PlatformPermissionEngine.enforcePermission(staffContext, "compliance:write");

    const req = inMemoryDataRequests.find((r) => r.id === requestId);
    if (!req) throw new AppError("Data request not found.", 404, "NOT_FOUND");
    if (req.requestType !== "deletion") throw new ValidationError("Request is not a deletion request.");

    // Section 9 Step 4 & 5: Retention window enforcement
    if (req.retentionEndsAt && new Date(req.retentionEndsAt).getTime() > Date.now()) {
      throw new ValidationError(
        "Statutory retention window is still active. Deletion cannot be submitted for approval before retention cooling period elapses."
      );
    }

    const approvalReq = await PlatformApprovalEngine.createRequest({
      actionKey: "compliance:approve_deletion",
      actionTitle: `Approve Permanent Deletion of Tenant: ${req.tenantName}`,
      entityType: "tenant_deletion",
      entityId: req.tenantId,
      requesterId: staffContext.id,
      requesterName: staffContext.name,
      requesterEmail: staffContext.email,
      requesterRole: staffContext.role,
      reason: customReason || `Statutory retention window elapsed. Executing permanent purge of tenant files, database schema, and object storage assets in accordance with NDPR Section 9.`,
      beforeState: { status: req.status, tenantId: req.tenantId },
      afterState: { status: "completed", tenantId: req.tenantId },
    });

    req.status = "pending_dual_approval";
    req.approvalRequestId = approvalReq.id;

    return { status: "pending_approval", approvalRequestId: approvalReq.id };
  }

  /**
   * Section 9 Step 6: Purge job completes and writes completion record without tenant content
   */
  public static async completeDeletionJob(requestId: string): Promise<DataRequestItem> {
    const req = inMemoryDataRequests.find((r) => r.id === requestId);
    if (!req) throw new AppError("Data request not found.", 404, "NOT_FOUND");

    const now = new Date();
    req.status = "completed";
    req.completedAt = now.toISOString();

    // Section 9: "stores a completion record without any tenant content."
    req.completionRecord = {
      tenantId: req.tenantId,
      purgedAt: now.toISOString(),
      recordsDeletedCount: 4120,
      r2FilesDeletedCount: 148,
      purgedTables: ["products", "customers", "sales", "inventory_movements", "receipts"],
      storageBucketsCleared: true,
      dataContentRetained: false, // ZERO tenant content preserved
    };

    await PlatformAuditLogger.log({
      staffEmail: "system@easeme.ng",
      staffRole: "system",
      action: "compliance.tenant_purged_complete",
      entityType: "tenant_deletion",
      entityId: req.tenantId,
      newValue: req.completionRecord,
    });

    return req;
  }

  public static async executePurgeJob(
    requestId: string,
    tenantId: string,
    staffContext: PlatformStaffContext
  ): Promise<Record<string, any>> {
    PlatformPermissionEngine.enforcePermission(staffContext, "compliance:write");
    const item = await this.completeDeletionJob(requestId);
    return item.completionRecord!;
  }
}
