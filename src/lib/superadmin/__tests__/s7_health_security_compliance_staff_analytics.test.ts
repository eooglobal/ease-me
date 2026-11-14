import { describe, it, expect, beforeEach } from "vitest";
import { PlatformStaffService } from "../staff-service";
import { PlatformComplianceService } from "../compliance-service";
import { PlatformSecurityService } from "../security-service";
import { PlatformOperationsService } from "../operations-service";
import { PlatformAuditLogger } from "../audit-logger";
import { PlatformApprovalEngine } from "../approval-engine";
import { PlatformPermissionEngine, PlatformStaffContext } from "../permission-engine";
import { ForbiddenError, ValidationError } from "@/lib/security/errors";

describe("Step S7 Acceptance Tests: Health, Security, Compliance, Staff, and Analytics", () => {
  const platformOwner: PlatformStaffContext = {
    id: "usr-owner-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  const securityOfficer: PlatformStaffContext = {
    id: "usr-sec-01",
    name: "Security Officer",
    email: "security@easeme.ng",
    role: "security",
  };

  const supportAgent: PlatformStaffContext = {
    id: "usr-sup-01",
    name: "Tunde Bakare",
    email: "tunde.bakare@easeme.ng",
    role: "support_agent",
  };

  const auditorStaff: PlatformStaffContext = {
    id: "usr-aud-01",
    name: "Platform Auditor",
    email: "auditor@easeme.ng",
    role: "auditor",
  };

  beforeEach(() => {
    PlatformAuditLogger.clearForTesting();
  });

  describe("Staff Management Invariants (Section 6.9 & 11)", () => {
    it("refuses to remove or demote the last two Platform Owners", async () => {
      // In initial state, there are 2 active platform owners: usr-owner-01 and usr-owner-02
      const initialOwners = PlatformStaffService.listStaff().filter(
        (s) => s.role === "owner" && s.isActive
      );
      expect(initialOwners.length).toBe(2);

      // Attempting to deactivate one of the two owners must throw ForbiddenError
      await expect(
        PlatformStaffService.deactivateStaff("usr-owner-01", "Leaving company", platformOwner)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        PlatformStaffService.requestRoleChange(
          "usr-owner-01",
          "analyst",
          "Demoting owner",
          platformOwner
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it("allows deactivation only when more than two Platform Owners exist", async () => {
      // Invite a 3rd Platform Owner
      const thirdOwner = await PlatformStaffService.inviteStaff(
        "third.owner@easeme.ng",
        "Third Owner",
        "owner",
        platformOwner
      );
      expect(thirdOwner.role).toBe("owner");

      const activeOwners = PlatformStaffService.listStaff().filter(
        (s) => s.role === "owner" && s.isActive
      );
      expect(activeOwners.length).toBe(3);

      // Now deactivating the 3rd owner succeeds because count > 2
      const deactivated = await PlatformStaffService.deactivateStaff(
        thirdOwner.id,
        "Temporary offboarding",
        platformOwner
      );
      expect(deactivated.isActive).toBe(false);

      // Record is never deleted from database, only marked inactive
      const found = PlatformStaffService.getStaffById(thirdOwner.id);
      expect(found).toBeDefined();
      expect(found?.isActive).toBe(false);
    });

    it("enforces dual-control approval for changing staff roles", async () => {
      // Requesting role change creates an approval request in PlatformApprovalEngine
      const result = await PlatformStaffService.requestRoleChange(
        "usr-fin-01",
        "security",
        "Promoting finance manager to security officer",
        platformOwner
      );

      expect(result.approvalRequestId).toBeDefined();
      expect(result.message).toContain("submitted for dual-control approval");

      const approvals = PlatformApprovalEngine.listRequests();
      const changeReq = approvals.find((a) => a.actionKey === "staff:role_change");
      expect(changeReq).toBeDefined();
      expect(changeReq?.requesterEmail).toBe(platformOwner.email);
    });

    it("prevents non-authorized roles from modifying staff", async () => {
      await expect(
        PlatformStaffService.inviteStaff("test@easeme.ng", "Test", "support_agent", supportAgent)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        PlatformStaffService.resetMfa("usr-fin-01", supportAgent)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("Compliance & Data Request Workflows (Section 6.11 & 9)", () => {
    it("generates a 24-hour expiring download link for tenant data export", async () => {
      const expReq = await PlatformComplianceService.createExportRequest(
        "ten-099",
        "Lagos Electronics",
        "owner@lagoselectronics.ng"
      );

      expect(expReq.requestType).toBe("export");
      expect(expReq.status).toBe("ready_for_download");
      expect(expReq.downloadUrl).toContain("https://secure.easeme.ng/data-exports/");
      expect(expReq.downloadExpiresAt).toBeDefined();

      const expiryDiffMs = new Date(expReq.downloadExpiresAt!).getTime() - new Date(expReq.createdAt).getTime();
      expect(expiryDiffMs).toBe(24 * 3600 * 1000); // exactly 24 hours
    });

    it("enforces 14-day statutory retention window before deletion approval", async () => {
      const delReq = await PlatformComplianceService.createDeletionRequest(
        "ten-088",
        "Kaduna Stores Ltd",
        "admin@kadunastores.ng"
      );

      expect(delReq.requestType).toBe("deletion");
      expect(delReq.status).toBe("retention_window");
      expect(delReq.retentionEndsAt).toBeDefined();

      // Attempting to submit for dual approval while retention cooling window is active must throw ValidationError
      await expect(
        PlatformComplianceService.submitDeletionForApproval(
          delReq.id,
          "Bypassing retention window",
          securityOfficer
        )
      ).rejects.toThrow(ValidationError);
    });

    it("executes purge job and writes completion record with zero tenant content", async () => {
      // Create a purge job completion record
      const completion = await PlatformComplianceService.executePurgeJob(
        "req-del-01",
        "ten-003",
        securityOfficer
      );

      expect(completion.tenantId).toBe("ten-003");
      expect(completion.purgedAt).toBeDefined();
      expect(completion.recordsDeletedCount).toBeGreaterThan(0);
      expect(completion.r2FilesDeletedCount).toBeGreaterThan(0);

      // Verify completion record has NO tenant content, no customer records, no sales lines
      expect(completion).not.toHaveProperty("sales");
      expect(completion).not.toHaveProperty("customers");
      expect(completion).not.toHaveProperty("transactions");
      expect(completion).not.toHaveProperty("balances");
    });
  });

  describe("Security Policy & Session Control (Section 6.10)", () => {
    it("allows security officer to update security policy and logs the audit event", async () => {
      const updated = await PlatformSecurityService.updatePolicy(
        {
          idleTimeoutMinutes: 20,
          ipAllowlistEnabled: true,
          allowedIps: ["102.89.34.0/24"],
        },
        securityOfficer
      );

      expect(updated.idleTimeoutMinutes).toBe(20);
      expect(updated.ipAllowlistEnabled).toBe(true);

      const auditEntries = await PlatformAuditLogger.query({ action: "security.policy_updated" });
      expect(auditEntries.length).toBe(1);
      expect(auditEntries[0].staffEmail).toBe(securityOfficer.email);
    });

    it("allows terminating active staff sessions with remote revocation", async () => {
      const sessionsBefore = PlatformSecurityService.listActiveSessions();
      expect(sessionsBefore.length).toBeGreaterThan(0);
      const targetSession = sessionsBefore[0];

      await PlatformSecurityService.terminateSession(
        targetSession.id,
        "Security officer manual revocation",
        securityOfficer
      );

      const sessionsAfter = PlatformSecurityService.listActiveSessions();
      expect(sessionsAfter.find((s) => s.id === targetSession.id)).toBeUndefined();

      const auditRevocation = await PlatformAuditLogger.query({ action: "security.remote_sign_out" });
      expect(auditRevocation.length).toBe(1);
    });

    it("forbids non-security roles from altering security policies", async () => {
      await expect(
        PlatformSecurityService.updatePolicy({ mandatoryMfa: false }, supportAgent)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("Health & Operations Telemetry (Section 6.8 & 6.9)", () => {
    it("reports real-time health checks for all platform dependencies", () => {
      const health = PlatformOperationsService.getHealthStatus();
      expect(health.services.length).toBe(4);
      expect(health.services.map((s) => s.id)).toEqual(
        expect.arrayContaining(["db-pg", "cache-redis", "storage-r2", "gateway-paystack"])
      );
      expect(health.errorRate24h).toBeLessThanOrEqual(0.1);
      expect(health.backgroundJobs.length).toBeGreaterThan(0);
    });

    it("ranks tenant storage without revealing tenant transaction details", () => {
      const rankedStorage = PlatformOperationsService.getRankedTenantStorage();
      expect(rankedStorage.length).toBeGreaterThan(0);
      expect(rankedStorage[0].rank).toBe(1);
      expect(rankedStorage[0].storageUsedMb).toBeGreaterThan(0);

      // Verify no transaction payload exists on ranked storage item
      expect(rankedStorage[0]).not.toHaveProperty("transactions");
      expect(rankedStorage[0]).not.toHaveProperty("receipts");
    });
  });

  describe("Platform Analytics & Zero Sales Leakage Invariant (Section 6.2 & 11)", () => {
    it("provides aggregate analytics where each widget states the question it answers", () => {
      const analytics = PlatformOperationsService.getAnalyticsSummary();

      // Check Growth tiles
      for (const tile of analytics.growthTiles) {
        expect(tile.question).toBeDefined();
        expect(tile.question.length).toBeGreaterThan(10);
        expect(tile.headline).toBeDefined();
      }

      // Check Revenue tiles
      for (const tile of analytics.revenueTiles) {
        expect(tile.question).toBeDefined();
        expect(tile.headline).toBeDefined();
      }

      // Check Retention tiles
      for (const tile of analytics.retentionTiles) {
        expect(tile.question).toBeDefined();
        expect(tile.headline).toBeDefined();
      }

      // Check Usage tiles (must be platform-wide aggregate, e.g. "14,820 Receipts / Day")
      for (const tile of analytics.usageTiles) {
        expect(tile.question).toBeDefined();
        expect(tile.headline).toBeDefined();
      }
    });

    it("guarantees zero individual tenant sales, costs, debts or customer records in analytics", () => {
      const analytics = PlatformOperationsService.getAnalyticsSummary();
      const stringified = JSON.stringify(analytics);

      // Verify no individual tenant IDs, debtor lists, or customer names appear in aggregate analytics
      expect(stringified).not.toContain("customerPhone");
      expect(stringified).not.toContain("debtorBalance");
      expect(stringified).not.toContain("basketLineItems");
      expect(stringified).not.toContain("costPrice");
      expect(stringified).not.toContain("profitMargin");
    });
  });

  describe("Audit Logger CSV Export Logging (Section 6.9 & 11)", () => {
    it("exporting audit log to CSV automatically logs the export event", async () => {
      await PlatformAuditLogger.log({
        staffEmail: "emeka.okonkwo@easeme.ng",
        staffRole: "owner",
        action: "test.action",
        entityType: "system",
      });

      const csv = await PlatformAuditLogger.exportToCSV({
        email: "auditor@easeme.ng",
        role: "auditor",
      });

      expect(csv).toContain("Timestamp (UTC)");
      expect(csv).toContain("Staff Email");

      // An audit log for the export action must now exist in the trail
      const logs = await PlatformAuditLogger.query({ action: "audit.export_csv" });
      expect(logs.length).toBe(1);
      expect(logs[0].staffEmail).toBe("auditor@easeme.ng");
    });
  });
});
