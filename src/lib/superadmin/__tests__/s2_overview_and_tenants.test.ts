import { describe, it, expect, beforeEach } from "vitest";
import { TenantService, maskEmail, maskPhone } from "../tenant-service";
import { PlatformAuditLogger } from "../audit-logger";
import { PlatformApprovalEngine } from "../approval-engine";
import { PlatformStaffContext } from "../permission-engine";

describe("Step S2: Command Overview, Tenants Directory & Privacy Shielding", () => {
  const mockStaff: PlatformStaffContext = {
    id: "usr-admin-01",
    name: "Chidinma Okafor",
    email: "chidinma.okafor@easeme.ng",
    role: "owner",
  };

  beforeEach(() => {
    PlatformAuditLogger.clearForTesting();
    PlatformApprovalEngine.clearForTesting();
  });

  /*
  |--------------------------------------------------------------------------
  | 1. Privacy Masking & Zero Personal Data Leak (Section 2 & 11)
  |--------------------------------------------------------------------------
  */
  describe("1. Personal Data Masking & Zero Raw Sales Leakage", () => {
    it("ensures customer and owner emails are masked with standard j***@domain pattern", () => {
      expect(maskEmail("john.doe@gmail.com")).toBe("j***@gmail.com");
      expect(maskEmail("owner@alpha-retail.ng")).toBe("o***@alpha-retail.ng");
      expect(maskEmail("admin@ikejadepot.com")).toBe("a***@ikejadepot.com");
    });

    it("ensures phone numbers are masked displaying network prefix and last two digits", () => {
      expect(maskPhone("0803 123 4567")).toBe("0803 *** **67");
      expect(maskPhone("08029876543")).toBe("0802 *** **43");
      expect(maskPhone("08051112233")).toBe("0805 *** **33");
    });

    it("ensures all tenant listings return masked emails and masked phones", () => {
      const tenants = TenantService.listTenants();
      for (const t of tenants) {
        expect(t.maskedEmail).toMatch(/^[a-zA-Z0-9]\*\*\*@.+/);
        expect(t.maskedPhone).toMatch(/^\d{4} \*\*\* \*\*\d{2}$/);
      }
    });

    it("ensures tenant detail usage returns aggregate counters only, never individual sales rows", () => {
      const detail = TenantService.getTenantById("ten-001");
      expect(typeof detail.tenant.salesThisMonth).toBe("number");
      expect(typeof detail.tenant.productCount).toBe("number");
      expect(typeof detail.tenant.userCount).toBe("number");

      // Verify no raw sales or items arrays exist in tenant object
      expect((detail.tenant as any).sales).toBeUndefined();
      expect((detail.tenant as any).saleItems).toBeUndefined();
      expect((detail.tenant as any).costs).toBeUndefined();
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 2. Provisioning & Zero Default Password Policy (Section 6.3 & 11)
  |--------------------------------------------------------------------------
  */
  describe("2. Workspace Provisioning & Invitation Protocol", () => {
    it("provisions a workspace with starting preset and returns an invitation token without any default password", async () => {
      const result = await TenantService.provisionTenant(
        {
          businessName: "Enugu Medics Pharmacy Ltd",
          businessType: "Community Pharmacy",
          ownerName: "Dr. Nnamdi Eze",
          ownerEmail: "nnamdi@enugumedics.ng",
          ownerPhone: "0803 999 8877",
          planName: "Growth",
          preset: "Pharmacy",
          trialDays: 14,
        },
        mockStaff
      );

      expect(result.tenant.id).toBeDefined();
      expect(result.tenant.businessName).toBe("Enugu Medics Pharmacy Ltd");
      expect(result.tenant.status).toBe("trial");
      expect(result.invitationToken).toBeDefined();
      expect(result.invitationToken.startsWith("inv-")).toBe(true);

      // Verify no password is created or returned
      expect((result.tenant as any).password).toBeUndefined();
      expect((result.tenant as any).temporaryPassword).toBeUndefined();

      // Verify audit trail entry was recorded
      const logs = await PlatformAuditLogger.query({ action: "tenant.provision" });
      expect(logs.length).toBe(1);
      expect(logs[0].newValue?.invitationTokenGenerated).toBe(true);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 3. Dual-Control Suspension of Paying Tenants (Section 4 & 6.3)
  |--------------------------------------------------------------------------
  */
  describe("3. Suspension Rules (Paying vs Trial)", () => {
    it("submits an approval request to the dual-control queue when attempting to suspend a paying tenant", async () => {
      // ten-001 is active (paying)
      const res = await TenantService.suspendTenant(
        "ten-001",
        "Breach of pharmaceutical regulations reported by NAFDAC.",
        mockStaff
      );

      expect(res.status).toBe("pending_approval");
      expect(res.approvalRequestId).toBeDefined();

      // Verify request is present in dual-control approvals queue
      const pending = PlatformApprovalEngine.listRequests({ tab: "history" });
      const created = pending.find((r) => r.id === res.approvalRequestId) ||
        PlatformApprovalEngine.listRequests({ tab: "waiting_for_me" }).find((r) => r.id === res.approvalRequestId);
      expect(created).toBeDefined();
      expect(created?.actionKey).toBe("tenants:suspend");
    });

    it("permits direct suspension for trial or non-paying tenants without dual approval", async () => {
      // ten-004 is in trial
      const res = await TenantService.suspendTenant(
        "ten-004",
        "Trial period abuse detected across multiple accounts.",
        mockStaff
      );

      expect(res.status).toBe("suspended");

      const tenant = TenantService.getTenantById("ten-004").tenant;
      expect(tenant.status).toBe("suspended");
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 4. Command Overview Requirements (Section 6.1)
  |--------------------------------------------------------------------------
  */
  describe("4. Command Overview Three-Question Metrics", () => {
    it("generates all 7 summary tiles, money panel, health strip and attention list items", () => {
      const overview = TenantService.getOverviewMetrics();

      // 7 Summary tiles
      expect(overview.summaryTiles.activeTenants).toBeDefined();
      expect(overview.summaryTiles.trialTenants).toBeDefined();
      expect(overview.summaryTiles.graceTenants).toBeDefined();
      expect(overview.summaryTiles.suspendedTenants).toBeDefined();
      expect(overview.summaryTiles.mrr).toBeGreaterThan(0);
      expect(overview.summaryTiles.newTenantsThisMonth).toBeDefined();
      expect(overview.summaryTiles.tenantsLostThisMonth).toBeDefined();

      // Money panel
      expect(overview.moneyPanel.revenueCollectedThisMonth).toBeDefined();
      expect(overview.moneyPanel.failedPaymentsCount).toBeDefined();
      expect(overview.moneyPanel.renewalsDueNext7Days).toBeDefined();

      // Health strip (5 services)
      expect(overview.healthStrip.length).toBe(5);
      expect(overview.healthStrip.map((s) => s.status)).toContain("Operational");

      // Attention list
      expect(overview.attentionList.length).toBeGreaterThan(0);
      for (const item of overview.attentionList) {
        expect(item.title).toBeDefined();
        expect(item.href.startsWith("/superadmin")).toBe(true);
      }
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 5. Internal Staff Notes Ledger (Section 6.3)
  |--------------------------------------------------------------------------
  */
  describe("5. Internal Notes Confidential Ledger", () => {
    it("records a staff note and logs an immutable audit entry", async () => {
      const note = await TenantService.addNote(
        "ten-002",
        "Dispatched hardware engineer to calibrate barcode scanner at Register 2.",
        mockStaff
      );

      expect(note.id).toBeDefined();
      expect(note.staffName).toBe("Chidinma Okafor");
      expect(note.content).toContain("calibrate barcode scanner");

      const logs = await PlatformAuditLogger.query({ action: "tenant.add_internal_note" });
      expect(logs.length).toBe(1);
      expect(logs[0].entityId).toBe("ten-002");
    });
  });
});
