import { describe, it, expect, beforeEach } from "vitest";
import {
  PlatformRole,
  PLATFORM_AREAS,
  PLATFORM_PERMISSION_MATRIX,
  getPermissionsForRole,
} from "../permission-matrix";
import { PlatformPermissionEngine } from "../permission-engine";
import { PlatformAuditLogger } from "../audit-logger";
import { PlatformApprovalEngine } from "../approval-engine";
import { ForbiddenError, ValidationError, AppError } from "@/lib/security/errors";

describe("Step S1: Super Admin Access Control, Dual Approvals & Audit Trail", () => {
  beforeEach(() => {
    PlatformAuditLogger.clearForTesting();
    PlatformApprovalEngine.clearForTesting();
  });

  /*
  |--------------------------------------------------------------------------
  | 1. Permission Matrix Comprehensive Enforcement (Section 3 & 11)
  |--------------------------------------------------------------------------
  */
  describe("1. Permission Matrix & Granular Key Checks", () => {
    const roles: PlatformRole[] = [
      "owner",
      "admin",
      "finance",
      "support_lead",
      "support_agent",
      "content",
      "security",
      "engineer",
      "auditor",
      "analyst",
    ];

    it("verifies every single cell of the Section 3 permission matrix matches exact specifications", () => {
      for (const area of Object.keys(PLATFORM_AREAS) as Array<keyof typeof PLATFORM_AREAS>) {
        for (const role of roles) {
          const expectedLevel = PLATFORM_PERMISSION_MATRIX[area][role];
          const actualLevel = PlatformPermissionEngine.getAccessLevel(area, role);
          expect(actualLevel).toBe(expectedLevel);
        }
      }
    });

    it("strictly prevents a Support Agent from changing or writing plans", () => {
      const agentRole: PlatformRole = "support_agent";
      const hasPlanWrite = PlatformPermissionEngine.hasPermission(agentRole, "plans:write");
      expect(hasPlanWrite).toBe(false);

      expect(() => {
        PlatformPermissionEngine.enforcePermission(agentRole, "plans:write");
      }).toThrow(ForbiddenError);
    });

    it("strictly prevents a Content Editor from accessing billing or tenants", () => {
      const contentRole: PlatformRole = "content";
      expect(PlatformPermissionEngine.hasPermission(contentRole, "billing:read")).toBe(false);
      expect(PlatformPermissionEngine.hasPermission(contentRole, "tenants:read")).toBe(false);

      expect(PlatformPermissionEngine.canAccessRoute(contentRole, "/superadmin/billing")).toBe(false);
      expect(PlatformPermissionEngine.canAccessRoute(contentRole, "/superadmin/tenants")).toBe(false);
    });

    it("strictly prevents an Auditor from writing anywhere (Read-Only across all areas)", () => {
      const auditorRole: PlatformRole = "auditor";
      const writeKeys = [
        "tenants:write",
        "tenants:provision",
        "tenants:suspend",
        "plans:write",
        "billing:write",
        "content:write",
        "legal:write",
        "settings:write",
        "flags:write",
        "integrations:write",
        "limits:write",
        "health:write",
        "support:write",
        "security:write",
        "compliance:write",
        "staff:write",
      ];

      for (const key of writeKeys) {
        expect(PlatformPermissionEngine.hasPermission(auditorRole, key)).toBe(false);
        expect(() => {
          PlatformPermissionEngine.enforcePermission(auditorRole, key);
        }).toThrow(ForbiddenError);
      }
    });

    it("strictly prevents an Analyst from accessing tenant-level details or support tickets", () => {
      const analystRole: PlatformRole = "analyst";
      expect(PlatformPermissionEngine.hasPermission(analystRole, "support:read")).toBe(false);
      expect(PlatformPermissionEngine.hasPermission(analystRole, "tenants:provision")).toBe(false);
      expect(PlatformPermissionEngine.hasPermission(analystRole, "analytics:read")).toBe(true);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 2. Dual-Control Approval Engine (Section 4, 6.6 & 11)
  |--------------------------------------------------------------------------
  */
  describe("2. Dual-Control Approvals & Anti-Self-Approval Proof", () => {
    it("creates a sensitive approval request with full before and after state diff and a 48h expiration window", async () => {
      const request = await PlatformApprovalEngine.createRequest({
        actionKey: "tenants:suspend",
        actionTitle: "Suspend Paying Tenant: Ikeja Superette",
        entityType: "tenant",
        entityId: "ten-888",
        requesterId: "usr-admin-01",
        requesterName: "Bolanle Cole",
        requesterEmail: "bolanle@easeme.ng",
        requesterRole: "admin",
        reason: "Severe Terms of Service violation and uncontactable owner.",
        beforeState: { status: "active", plan: "Business" },
        afterState: { status: "suspended", reason: "TOS breach" },
      });

      expect(request.id).toBeDefined();
      expect(request.status).toBe("pending");
      expect(request.beforeState).toEqual({ status: "active", plan: "Business" });
      expect(request.afterState).toEqual({ status: "suspended", reason: "TOS breach" });

      const createdTime = new Date(request.createdAt).getTime();
      const expiryTime = new Date(request.expiresAt).getTime();
      const diffHours = (expiryTime - createdTime) / (1000 * 60 * 60);

      // Exactly 48-hour expiration
      expect(Math.round(diffHours)).toBe(48);
    });

    it("strictly blocks a requester from approving their own request (Dual-Control Invariant)", async () => {
      const request = await PlatformApprovalEngine.createRequest({
        actionKey: "plans:price_change",
        actionTitle: "Price Revision: Starter Tier",
        entityType: "plan",
        entityId: "plan-starter",
        requesterId: "usr-finance-01",
        requesterName: "Farouk Bello",
        requesterEmail: "farouk@easeme.ng",
        requesterRole: "finance",
        reason: "Scheduled price inflation adjustment.",
        beforeState: { price: 15000 },
        afterState: { price: 18000 },
      });

      // Self-approval attempt
      await expect(
        PlatformApprovalEngine.evaluateRequest({
          requestId: request.id,
          actorId: "usr-finance-01",
          actorName: "Farouk Bello",
          actorEmail: "farouk@easeme.ng",
          actorRole: "finance",
          decision: "approve",
        })
      ).rejects.toThrow("Dual control violation");
    });

    it("allows a different qualified approver to approve and execute automatically", async () => {
      const request = await PlatformApprovalEngine.createRequest({
        actionKey: "legal:publish",
        actionTitle: "Publish Terms of Service v2.4",
        entityType: "legal",
        requesterId: "usr-content-01",
        requesterName: "Ngozi Obi",
        requesterEmail: "ngozi@easeme.ng",
        requesterRole: "content",
        reason: "Updated data protection clause for NDPR compliance.",
        afterState: { version: "2.4", effectiveDate: "2026-12-01" },
      });

      const result = await PlatformApprovalEngine.evaluateRequest({
        requestId: request.id,
        actorId: "usr-owner-01",
        actorName: "Chidinma Okafor",
        actorEmail: "chidinma@easeme.ng",
        actorRole: "owner",
        decision: "approve",
      });

      expect(result.executed).toBe(true);
      expect(result.request.status).toBe("approved");
      expect(result.request.approverName).toBe("Chidinma Okafor");
      expect(result.request.executedAt).toBeDefined();
    });

    it("strictly rejects approval of an expired request (> 48 hours)", async () => {
      const request = await PlatformApprovalEngine.createRequest({
        actionKey: "integrations:rotate_secret",
        actionTitle: "Rotate Paystack Live Secret Key",
        entityType: "secret",
        requesterId: "usr-sec-01",
        requesterName: "Kabir Lawal",
        requesterEmail: "kabir@easeme.ng",
        requesterRole: "security",
        reason: "Quarterly key rotation policy.",
        afterState: { keyLastFour: "9914" },
      });

      // Simulate passage of 49 hours
      request.expiresAt = new Date(Date.now() - 3600 * 1000).toISOString();

      await expect(
        PlatformApprovalEngine.evaluateRequest({
          requestId: request.id,
          actorId: "usr-owner-01",
          actorName: "Chidinma Okafor",
          actorEmail: "chidinma@easeme.ng",
          actorRole: "owner",
          decision: "approve",
        })
      ).rejects.toThrow("Approval request has expired");
    });

    it("requires a mandatory written justification when rejecting a request", async () => {
      const request = await PlatformApprovalEngine.createRequest({
        actionKey: "settings:maintenance_mode",
        actionTitle: "Enable Platform Maintenance Mode",
        entityType: "settings",
        requesterId: "usr-admin-01",
        requesterName: "Bolanle Cole",
        requesterEmail: "bolanle@easeme.ng",
        requesterRole: "admin",
        reason: "Database index maintenance scheduled for tonight.",
        afterState: { maintenanceMode: true },
      });

      // Reject without comment
      await expect(
        PlatformApprovalEngine.evaluateRequest({
          requestId: request.id,
          actorId: "usr-owner-01",
          actorName: "Chidinma Okafor",
          actorEmail: "chidinma@easeme.ng",
          actorRole: "owner",
          decision: "reject",
          comment: "",
        })
      ).rejects.toThrow(ValidationError);

      // Reject with valid comment
      const result = await PlatformApprovalEngine.evaluateRequest({
        requestId: request.id,
        actorId: "usr-owner-01",
        actorName: "Chidinma Okafor",
        actorEmail: "chidinma@easeme.ng",
        actorRole: "owner",
        decision: "reject",
        comment: "Cannot schedule during peak evening shopping hours. Reschedule to Sunday 02:00 AM.",
      });

      expect(result.request.status).toBe("rejected");
      expect(result.request.rejectionComment).toContain("Cannot schedule during peak evening");
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 3. Append-Only Platform Audit Trail (Section 2, 7 & 11)
  |--------------------------------------------------------------------------
  */
  describe("3. Append-Only Platform Audit Log & CSV Export", () => {
    it("creates an immutable audit entry recording who, what, when, previous and new values", async () => {
      const entry = await PlatformAuditLogger.log({
        staffId: "usr-sec-01",
        staffEmail: "sec-officer@easeme.ng",
        staffRole: "security",
        action: "security.policy_update",
        entityType: "platform_settings",
        previousValue: { idleTimeoutMinutes: 30 },
        newValue: { idleTimeoutMinutes: 15 },
      });

      expect(entry.id).toBeDefined();
      expect(entry.staffEmail).toBe("sec-officer@easeme.ng");
      expect(entry.staffRole).toBe("security");
      expect(entry.previousValue).toEqual({ idleTimeoutMinutes: 30 });
      expect(entry.newValue).toEqual({ idleTimeoutMinutes: 15 });
      expect(entry.createdAt).toBeDefined();
    });

    it("verifies exporting audit logs to RFC 4180 CSV creates a logged audit entry of the export action", async () => {
      await PlatformAuditLogger.log({
        staffEmail: "admin@easeme.ng",
        staffRole: "admin",
        action: "tenant.provision",
        entityType: "tenant",
        entityId: "ten-999",
        newValue: { name: "Ibadan Mart" },
      });

      const csv = await PlatformAuditLogger.exportToCSV({
        email: "auditor@easeme.ng",
        role: "auditor",
      });

      expect(csv).toContain("Timestamp (UTC)");
      expect(csv).toContain("Staff Email");
      expect(csv).toContain("Ibadan Mart");

      // Check that the export action itself is recorded in audit logs (Section 6.9 requirement)
      const allLogs = await PlatformAuditLogger.query({ action: "audit.export_csv" });
      expect(allLogs.length).toBe(1);
      expect(allLogs[0].staffEmail).toBe("auditor@easeme.ng");
    });
  });
});

