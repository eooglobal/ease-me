import { describe, it, expect, beforeEach } from "vitest";
import {
  PlatformContentService,
} from "../content-service";
import { PlatformApprovalEngine } from "../approval-engine";
import { PlatformAuditLogger } from "../audit-logger";
import { PlatformStaffContext } from "../permission-engine";
import { ForbiddenError, ValidationError } from "@/lib/security/errors";

describe("Step S5: Content Management, Versions, Legal Acceptance & Presets", () => {
  const contentStaff: PlatformStaffContext = {
    id: "usr-content-01",
    name: "Fatima Bello",
    email: "fatima.bello@easeme.ng",
    role: "content",
  };

  const auditorStaff: PlatformStaffContext = {
    id: "usr-auditor-01",
    name: "Kelechi Nnamdi",
    email: "kelechi.nnamdi@easeme.ng",
    role: "auditor",
  };

  const ownerStaff: PlatformStaffContext = {
    id: "usr-owner-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  beforeEach(() => {
    PlatformAuditLogger.clearForTesting();
    PlatformApprovalEngine.clearForTesting();
  });

  /*
  |--------------------------------------------------------------------------
  | 1. Legal Documents & Acceptance Gate (Section 6.7 & 11)
  | "Publishing legal documents forces tenant owners to accept them before continuing."
  |--------------------------------------------------------------------------
  */
  describe("1. Legal Documents Dual Control & Acceptance Sign-In Gate", () => {
    it("intercepts legal document revisions into dual-control approval queue", async () => {
      const res = await PlatformContentService.proposeLegalVersion(
        "terms_of_service",
        "3.0",
        "Updated clause 4 regarding electronic payment processing and dispute resolution...",
        contentStaff
      );

      expect(res.status).toBe("pending_approval");
      expect(res.approvalRequestId).toBeDefined();

      const requests = PlatformApprovalEngine.listRequests();
      const req = requests.find((r) => r.id === res.approvalRequestId);
      expect(req?.actionKey).toBe("legal:publish");
      expect(req?.afterState.versionNumber).toBe("3.0");
    });

    it("forces tenant owners to accept newly published legal versions before continuing", async () => {
      // 1. Publish new version 3.0
      await PlatformContentService.executeLegalPublish(
        "terms_of_service",
        "3.0",
        "Master terms version 3.0"
      );

      // 2. An existing tenant owner (e.g. usr-unaccepted-owner) checks status
      const gateCheck = PlatformContentService.checkPendingLegalAcceptance(
        "usr-unaccepted-owner",
        "terms_of_service"
      );

      expect(gateCheck.requiresAcceptance).toBe(true);
      expect(gateCheck.currentVersion).toBe("3.0");

      // 3. Tenant owner reviews and accepts
      PlatformContentService.recordAcceptance({
        tenantId: "ten-999",
        ownerId: "usr-unaccepted-owner",
        ownerEmail: "owner999@retail.ng",
        documentType: "terms_of_service",
        versionNumber: "3.0",
        ipAddress: "197.210.45.12",
      });

      // 4. Gate check now passes
      const afterCheck = PlatformContentService.checkPendingLegalAcceptance(
        "usr-unaccepted-owner",
        "terms_of_service"
      );

      expect(afterCheck.requiresAcceptance).toBe(false);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 2. Business Starter Presets Deep Isolation (Section 6.7 & 11)
  | "Changing a preset does not alter existing tenants."
  |--------------------------------------------------------------------------
  */
  describe("2. Business Presets Deep Copy Isolation", () => {
    it("proves that pharmacy has batch & expiry tracking ON while supermarket has it OFF", () => {
      const pharmacy = PlatformContentService.clonePresetForNewTenant("pharmacy");
      expect(pharmacy.batchTracking).toBe(true);
      expect(pharmacy.expiryTracking).toBe(true);

      const supermarket = PlatformContentService.clonePresetForNewTenant("supermarket");
      expect(supermarket.batchTracking).toBe(false);
      expect(supermarket.expiryTracking).toBe(false);
    });

    it("verifies changing a preset does NOT alter existing tenants", async () => {
      // 1. A tenant is provisioned with a pharmacy starter pack copy
      const existingTenantStore = {
        tenantId: "ten-existing-pharma",
        categories: PlatformContentService.clonePresetForNewTenant("pharmacy").productCategories,
      };

      const initialCount = existingTenantStore.categories.length;

      // 2. Platform operator updates the Pharmacy preset template to add a new category
      await PlatformContentService.updatePreset(
        "pharmacy",
        {
          productCategories: [
            ...existingTenantStore.categories,
            "Veterinary & Animal Care",
          ],
        },
        contentStaff
      );

      // 3. Existing tenant categories remain completely untouched
      expect(existingTenantStore.categories.length).toBe(initialCount);
      expect(existingTenantStore.categories).not.toContain("Veterinary & Animal Care");

      // 4. Newly provisioned tenants get the updated template
      const newTenantPreset = PlatformContentService.clonePresetForNewTenant("pharmacy");
      expect(newTenantPreset.productCategories).toContain("Veterinary & Animal Care");
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 3. Message Templates & Variable Whitelist Validation (Section 6.7)
  | "The editor rejects unknown variables and offers a test send to the operator's own address."
  |--------------------------------------------------------------------------
  */
  describe("3. Message Templates & Variable Validation", () => {
    it("rejects unknown or unapproved variables with ValidationError", async () => {
      await expect(
        PlatformContentService.updateTemplate(
          "welcome_owner_email",
          "Hello {{owner_name}}, your secret password is {{unapproved_secret_token}}", // illegal token
          "Welcome to Ease Me",
          contentStaff
        )
      ).rejects.toThrowError(ValidationError);
    });

    it("allows approved variables ({{business_name}}, {{amount}}, etc.) and updates active version", async () => {
      const updated = await PlatformContentService.updateTemplate(
        "welcome_owner_email",
        "Hello {{owner_name}}, your workspace for {{business_name}} is ready: {{reset_link}}",
        "Welcome {{business_name}}",
        contentStaff
      );

      expect(updated.activeVersion).toBeGreaterThan(1);
    });

    it("renders simulated test send with dummy data", () => {
      const res = PlatformContentService.testSendTemplate("welcome_owner_email", "staff@easeme.ng");
      expect(res.success).toBe(true);
      expect(res.renderedBody).toContain("Alpha Retail Pharmacy Ltd");
      expect(res.renderedBody).not.toContain("{{business_name}}");
      expect(res.recipient).toBe("staff@easeme.ng");
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 4. Content Lifecycle & Announcements (Section 6.7)
  |--------------------------------------------------------------------------
  */
  describe("4. Universal Content Lifecycle & Version Snapshot", () => {
    it("creates announcement in draft status and captures snapshot on explicit publish", async () => {
      const draft = await PlatformContentService.createAnnouncement(
        {
          title: "New POS Offline Sync Engine",
          message: "A new offline sync engine is available for all supermarkets.",
          severity: "info",
          audienceType: "one_business_type",
          targetAudience: ["supermarket"],
          startsAt: "2026-11-01T00:00:00Z",
          endsAt: "2026-11-30T23:59:59Z",
          isDismissible: true,
        },
        contentStaff
      );

      expect(draft.status).toBe("draft");

      const published = await PlatformContentService.publishAnnouncement(draft.id, contentStaff);
      expect(published.status).toBe("published");
      expect(published.currentVersion).toBe(2);
    });

    it("filters active announcements matching tenant audience scope", () => {
      const activeForPharmacy = PlatformContentService.getActiveAnnouncementsForTenant({
        plan: "Growth",
        businessType: "pharmacy",
        tenantId: "ten-001",
      });

      // ann-02 is specifically targeted to pharmacy
      expect(activeForPharmacy.some((a) => a.id === "ann-02")).toBe(true);

      const activeForSupermarket = PlatformContentService.getActiveAnnouncementsForTenant({
        plan: "Starter",
        businessType: "supermarket",
        tenantId: "ten-002",
      });

      // Pharmacy announcement does not appear for supermarket
      expect(activeForSupermarket.some((a) => a.id === "ann-02")).toBe(false);
      // But global 'all' announcements appear
      expect(activeForSupermarket.some((a) => a.id === "ann-01")).toBe(true);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 5. Role Permissions for Content & Isolation (Section 3 & 11)
  | "A Content Editor cannot open billing or tenants; an Auditor cannot write anywhere."
  |--------------------------------------------------------------------------
  */
  describe("5. Role Permissions for Content & Isolation", () => {
    it("denies Auditor from modifying content (content:write)", async () => {
      await expect(
        PlatformContentService.createAnnouncement(
          {
            title: "Auditor announcement",
            message: "test",
            severity: "info",
            audienceType: "all",
            targetAudience: [],
            startsAt: "2026-11-01T00:00:00Z",
            endsAt: "2026-11-30T23:59:59Z",
            isDismissible: true,
          },
          auditorStaff
        )
      ).rejects.toThrowError(ForbiddenError);
    });

    it("denies Auditor from modifying presets (content:write)", async () => {
      await expect(
        PlatformContentService.updatePreset("supermarket", { defaultTaxRate: 5.0 }, auditorStaff)
      ).rejects.toThrowError(ForbiddenError);
    });
  });
});

