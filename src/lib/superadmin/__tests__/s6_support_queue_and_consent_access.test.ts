import { describe, it, expect, beforeEach } from "vitest";
import {
  PlatformSupportService,
  SupportAccessGrantEngine,
} from "../support-service";
import { PlatformAuditLogger } from "../audit-logger";
import { PlatformStaffContext } from "../permission-engine";
import { ForbiddenError, ValidationError } from "@/lib/security/errors";

describe("Step S6: Support Queue, SLA Tracking & Consent-Based Access", () => {
  const supportStaff: PlatformStaffContext = {
    id: "usr-sup-01",
    name: "Tunde Bakare",
    email: "tunde.bakare@easeme.ng",
    role: "support_agent",
  };

  const otherStaff: PlatformStaffContext = {
    id: "usr-other-02",
    name: "Ngozi Adeleke",
    email: "ngozi.adeleke@easeme.ng",
    role: "finance",
  };

  const contentStaff: PlatformStaffContext = {
    id: "usr-cnt-01",
    name: "Fatima Bello",
    email: "fatima.bello@easeme.ng",
    role: "content",
  };

  beforeEach(() => {
    PlatformAuditLogger.clearForTesting();
  });

  /*
  |--------------------------------------------------------------------------
  | 1. Consent-Based Support Access Grants (Section 8 & 11)
  | "A support access grant expires on time and its page views are logged."
  | "Impersonation is prohibited."
  |--------------------------------------------------------------------------
  */
  describe("1. Consent-Based Support Access Grants", () => {
    it("creates a time-bounded support grant (<= 24h) and rejects grants > 24 hours", () => {
      // Rejects grant exceeding 24 hours
      expect(() => {
        SupportAccessGrantEngine.createGrant({
          tenantId: "ten-001",
          tenantName: "Alpha Health",
          ownerId: "usr-owner-001",
          ownerEmail: "owner@alpha.ng",
          assignedStaffId: supportStaff.id,
          assignedStaffName: supportStaff.name,
          durationHours: 36, // > 24 hours illegal
        });
      }).toThrowError(ValidationError);

      // Successfully creates valid 4-hour grant
      const grant = SupportAccessGrantEngine.createGrant({
        tenantId: "ten-001",
        tenantName: "Alpha Health",
        ownerId: "usr-owner-001",
        ownerEmail: "owner@alpha.ng",
        assignedStaffId: supportStaff.id,
        assignedStaffName: supportStaff.name,
        durationHours: 4,
      });

      expect(grant.status).toBe("active");
      expect(grant.durationHours).toBe(4);
    });

    it("logs each page viewed under the grant into append-only audit trail", async () => {
      const grant = SupportAccessGrantEngine.createGrant({
        tenantId: "ten-002",
        tenantName: "Lekki Superette",
        ownerId: "usr-owner-002",
        ownerEmail: "owner@lekki.ng",
        assignedStaffId: supportStaff.id,
        assignedStaffName: supportStaff.name,
        durationHours: 2,
      });

      // Staff views configuration screen
      await SupportAccessGrantEngine.logGrantPageView(grant.id, supportStaff, "/owner/settings/receipt");
      await SupportAccessGrantEngine.logGrantPageView(grant.id, supportStaff, "/owner/inventory/categories");

      expect(grant.pageViewsCount).toBe(2);
      expect(grant.pageViewHistory.length).toBe(2);

      const logs = await PlatformAuditLogger.query({ entityId: grant.id });
      // 1 creation log + 2 page view logs = 3 audit records
      expect(logs.length).toBe(3);
      const pageViewLogs = logs.filter((l) => l.action === "support_grant.page_viewed");
      expect(pageViewLogs.length).toBe(2);
      expect(pageViewLogs[0].newValue?.pageUrl).toBe("/owner/inventory/categories");
    });

    it("strictly blocks access to customer PII and raw transaction line items (Section 8)", () => {
      const grant = SupportAccessGrantEngine.createGrant({
        tenantId: "ten-001",
        tenantName: "Alpha Health",
        ownerId: "usr-owner-001",
        ownerEmail: "owner@alpha.ng",
        assignedStaffId: supportStaff.id,
        assignedStaffName: supportStaff.name,
        durationHours: 2,
      });

      // Allowed: configuration screens
      const configAccess = SupportAccessGrantEngine.verifyGrantAccess(grant.id, supportStaff.id, "config_screens");
      expect(configAccess.allowed).toBe(true);

      // Prohibited: customer PII
      expect(() => {
        SupportAccessGrantEngine.verifyGrantAccess(grant.id, supportStaff.id, "customer_pii");
      }).toThrowError(ForbiddenError);

      // Prohibited: raw sales / transaction lines
      expect(() => {
        SupportAccessGrantEngine.verifyGrantAccess(grant.id, supportStaff.id, "raw_transactions");
      }).toThrowError(ForbiddenError);
    });

    it("verifies that only the designated assigned staff member can access the grant", () => {
      const grant = SupportAccessGrantEngine.createGrant({
        tenantId: "ten-001",
        tenantName: "Alpha Health",
        ownerId: "usr-owner-001",
        ownerEmail: "owner@alpha.ng",
        assignedStaffId: supportStaff.id,
        assignedStaffName: supportStaff.name,
        durationHours: 2,
      });

      // Other staff member cannot use this grant
      expect(() => {
        SupportAccessGrantEngine.verifyGrantAccess(grant.id, otherStaff.id, "config_screens");
      }).toThrowError(ForbiddenError);
    });

    it("enforces expiration and owner revocation immediately", () => {
      const grant = SupportAccessGrantEngine.createGrant({
        tenantId: "ten-001",
        tenantName: "Alpha Health",
        ownerId: "usr-owner-001",
        ownerEmail: "owner@alpha.ng",
        assignedStaffId: supportStaff.id,
        assignedStaffName: supportStaff.name,
        durationHours: 1,
      });

      // Owner revokes
      SupportAccessGrantEngine.revokeGrant(grant.id, "usr-owner-001");
      expect(grant.status).toBe("revoked");

      // Attempting access now throws ForbiddenError
      expect(() => {
        SupportAccessGrantEngine.verifyGrantAccess(grant.id, supportStaff.id, "config_screens");
      }).toThrowError(ForbiddenError);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 2. Support Tickets Queue & SLA Tracking (Section 6.9)
  |--------------------------------------------------------------------------
  */
  describe("2. Support Ticket SLA Tracking & Masking", () => {
    it("flags tickets older than 48 hours with isOverdue48h: true", () => {
      const tickets = PlatformSupportService.listTickets();
      const overdue = tickets.find((t) => t.id === "tkt-001");

      expect(overdue).toBeDefined();
      expect(overdue?.ageHours).toBeGreaterThanOrEqual(48);
      expect(overdue?.isOverdue48h).toBe(true);

      const recent = tickets.find((t) => t.id === "tkt-002");
      expect(recent?.isOverdue48h).toBe(false);
    });

    it("ensures tenant owner contact emails are masked in support ticket listings", () => {
      const tickets = PlatformSupportService.listTickets();
      for (const t of tickets) {
        expect(t.maskedOwnerEmail).toMatch(/^[a-zA-Z0-9]\*\*\*.*@.+/);
        expect(t.maskedOwnerEmail).toContain("***");
      }
    });

    it("differentiates internal staff notes from public replies", async () => {
      const publicReply = await PlatformSupportService.replyTicket(
        "tkt-002",
        "Hello customer, your query has been resolved.",
        supportStaff,
        false
      );
      expect(publicReply.isInternalNote).toBe(false);

      const internalNote = await PlatformSupportService.replyTicket(
        "tkt-002",
        "Team note: Verified gateway settlement log pstk_109283.",
        supportStaff,
        true
      );
      expect(internalNote.isInternalNote).toBe(true);

      const ticketDetail = PlatformSupportService.getTicketById("tkt-002");
      const foundNote = ticketDetail.messages.find((m) => m.id === internalNote.id);
      expect(foundNote?.isInternalNote).toBe(true);
    });

    it("updates ticket status and assigns tickets with audit logging", async () => {
      await PlatformSupportService.updateTicketStatus("tkt-001", "in_progress", supportStaff);
      const detail = PlatformSupportService.getTicketById("tkt-001");
      expect(detail.ticket.status).toBe("in_progress");

      const logs = await PlatformAuditLogger.query({ entityId: "tkt-001" });
      expect(logs.some((l) => l.action === "support.status_change")).toBe(true);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 3. Permission Enforcement for Support (Section 3 & 11)
  |--------------------------------------------------------------------------
  */
  describe("3. Permission Enforcement for Support Area", () => {
    it("denies Content Editor from replying to tickets or changing status (support:write)", async () => {
      await expect(
        PlatformSupportService.replyTicket("tkt-001", "Unauthorized reply", contentStaff)
      ).rejects.toThrowError(ForbiddenError);

      await expect(
        PlatformSupportService.updateTicketStatus("tkt-001", "resolved", contentStaff)
      ).rejects.toThrowError(ForbiddenError);
    });
  });
});

