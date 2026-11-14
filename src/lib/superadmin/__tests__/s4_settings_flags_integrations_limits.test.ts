import { describe, it, expect, beforeEach } from "vitest";
import {
  PlatformSettingsService,
  PlatformFeatureFlagService,
  PlatformIntegrationsService,
  PlatformRateLimitService,
} from "../platform-config-service";
import { PlatformApprovalEngine } from "../approval-engine";
import { PlatformAuditLogger } from "../audit-logger";
import { PlatformStaffContext } from "../permission-engine";
import { ForbiddenError, ValidationError } from "@/lib/security/errors";
import { checkRateLimit, RATE_LIMIT_TIERS } from "@/lib/security/rate-limit";

describe("Step S4: Platform Settings, Feature Flags, Integrations & Rate Limits", () => {
  const ownerStaff: PlatformStaffContext = {
    id: "usr-owner-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
  };

  const adminStaff: PlatformStaffContext = {
    id: "usr-admin-01",
    name: "Chidinma Okafor",
    email: "chidinma.okafor@easeme.ng",
    role: "admin",
  };

  const supportStaff: PlatformStaffContext = {
    id: "usr-sup-01",
    name: "Tunde Bakare",
    email: "tunde.bakare@easeme.ng",
    role: "support_agent",
  };

  const auditorStaff: PlatformStaffContext = {
    id: "usr-aud-01",
    name: "Kelechi Nnamdi",
    email: "kelechi.nnamdi@easeme.ng",
    role: "auditor",
  };

  beforeEach(async () => {
    PlatformAuditLogger.clearForTesting();
    PlatformApprovalEngine.clearForTesting();
    // Reset maintenance mode to false for clean test state
    if (PlatformSettingsService.isMaintenanceActive()) {
      await PlatformSettingsService.setMaintenanceMode(false, "Test teardown", ownerStaff);
    }
  });

  /*
  |--------------------------------------------------------------------------
  | 1. Maintenance Mode Enforcement (Section 6.8 & 11)
  | "Maintenance mode blocks tenants and admits staff."
  |--------------------------------------------------------------------------
  */
  describe("1. Maintenance Mode Access Guard", () => {
    it("admits platform staff (super_admin, owner, engineer) when maintenance mode is active", async () => {
      await PlatformSettingsService.setMaintenanceMode(true, "Scheduled database vacuum and upgrade", ownerStaff);
      expect(PlatformSettingsService.isMaintenanceActive()).toBe(true);

      const staffCheck1 = PlatformSettingsService.checkMaintenanceAccess("super_admin");
      expect(staffCheck1.blocked).toBe(false);

      const staffCheck2 = PlatformSettingsService.checkMaintenanceAccess("owner");
      expect(staffCheck2.blocked).toBe(false);

      const staffCheck3 = PlatformSettingsService.checkMaintenanceAccess("engineer");
      expect(staffCheck3.blocked).toBe(false);
    });

    it("blocks tenants (business_owner, cashier, customer) and unauthenticated users when active", async () => {
      await PlatformSettingsService.setMaintenanceMode(true, "Emergency security upgrade", ownerStaff);

      const tenantOwnerCheck = PlatformSettingsService.checkMaintenanceAccess("business_owner");
      expect(tenantOwnerCheck.blocked).toBe(true);
      expect(tenantOwnerCheck.message).toBeDefined();

      const cashierCheck = PlatformSettingsService.checkMaintenanceAccess("cashier");
      expect(cashierCheck.blocked).toBe(true);

      const customerCheck = PlatformSettingsService.checkMaintenanceAccess("customer");
      expect(customerCheck.blocked).toBe(true);

      const unauthenticatedCheck = PlatformSettingsService.checkMaintenanceAccess(null);
      expect(unauthenticatedCheck.blocked).toBe(true);
    });

    it("allows everyone when maintenance mode is disabled", async () => {
      await PlatformSettingsService.setMaintenanceMode(false, "Restoring normal service", ownerStaff);
      expect(PlatformSettingsService.isMaintenanceActive()).toBe(false);

      expect(PlatformSettingsService.checkMaintenanceAccess("business_owner").blocked).toBe(false);
      expect(PlatformSettingsService.checkMaintenanceAccess("cashier").blocked).toBe(false);
      expect(PlatformSettingsService.checkMaintenanceAccess(null).blocked).toBe(false);
    });

    it("routes maintenance toggle by non-owner (e.g. admin) to dual-control approval queue", async () => {
      const res = await PlatformSettingsService.setMaintenanceMode(
        true,
        "Admin initiated planned maintenance window",
        adminStaff
      );

      expect(res.status).toBe("pending_approval");
      expect(res.approvalRequestId).toBeDefined();

      const requests = PlatformApprovalEngine.listRequests();
      const req = requests.find((r) => r.id === res.approvalRequestId);
      expect(req?.actionKey).toBe("settings:maintenance_mode");
      expect(req?.requesterId).toBe(adminStaff.id);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 2. Secrets Handling Invariant (Section 6.8, 11 & 12)
  | "A saved secret is never returned in full by any endpoint."
  | "Secret fields are write only."
  |--------------------------------------------------------------------------
  */
  describe("2. Write-Only Secrets Protection", () => {
    it("ensures secret fields are never returned in full in the integrations list", () => {
      const integrations = PlatformIntegrationsService.getIntegrations();

      for (const item of integrations) {
        for (const [key, field] of Object.entries(item.fields)) {
          if (field.isSecret) {
            // Must contain bullets and cannot be raw cleartext
            expect(field.value).toContain("••••");
            expect(field.value).not.toMatch(/^sk_live_[a-zA-Z0-9]{20,}$/);
            expect(field.value).not.toMatch(/^paystack_live_whsec_/);
          }
        }
      }
    });

    it("preserves existing secret when empty or bullet placeholder is submitted", async () => {
      const initialIntegrations = PlatformIntegrationsService.getIntegrations();
      const paystack = initialIntegrations.find((i) => i.id === "int-paystack");
      const maskedBefore = paystack?.fields.secretKey.value;

      // Update public field only and leave secretKey blank
      await PlatformIntegrationsService.updateIntegration(
        "int-paystack",
        {
          publicKey: "pk_live_updated_1234567890",
          secretKey: "••••••••••••", // Placeholder submitted
        },
        ownerStaff
      );

      const after = PlatformIntegrationsService.getIntegrations();
      const paystackAfter = after.find((i) => i.id === "int-paystack");
      expect(paystackAfter?.fields.publicKey.value).toBe("pk_live_updated_1234567890");
      // Secret remains intact and still masked
      expect(paystackAfter?.fields.secretKey.value).toBe(maskedBefore);
    });

    it("records masked secret in audit log, never cleartext", async () => {
      await PlatformIntegrationsService.updateIntegration(
        "int-sms",
        {
          apiKey: "trm_live_sec_newsecretvalue1234",
        },
        ownerStaff
      );

      const logs = await PlatformAuditLogger.query({ entityId: "int-sms" });
      const lastLog = logs[0];
      expect(lastLog).toBeDefined();
      expect(lastLog.newValue?.apiKey).toContain("••••");
      expect(lastLog.newValue?.apiKey).not.toBe("trm_live_sec_newsecretvalue1234");
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 3. Feature Flags Engine & Universal Resolution (Section 6.8)
  |--------------------------------------------------------------------------
  */
  describe("3. Feature Flags Resolution Engine", () => {
    it("resolves flag enabled status deterministically via isFeatureFlagEnabled", () => {
      // Flag: realtime_websocket_cashier has tenantAllowlist: ["ten-001", "ten-002"]
      const enabledForTenant = PlatformFeatureFlagService.isFeatureFlagEnabled(
        "realtime_websocket_cashier",
        { tenantId: "ten-001" }
      );
      expect(enabledForTenant).toBe(true);

      // Disabled for unlisted plan
      const disabledForPlan = PlatformFeatureFlagService.isFeatureFlagEnabled(
        "automated_tax_e_invoicing", // disabled globally
        { tenantId: "ten-001", planName: "Starter" }
      );
      expect(disabledForPlan).toBe(false);
    });

    it("identifies stale feature flags past their review date", () => {
      const staleFlags = PlatformFeatureFlagService.getStaleFlags();
      // offline_pwa_sync_engine had reviewDate 2026-11-01
      expect(staleFlags.some((f) => f.key === "offline_pwa_sync_engine")).toBe(true);
    });

    it("creates a new feature flag and validates key uniqueness", async () => {
      const flag = await PlatformFeatureFlagService.createFlag(
        {
          key: "biometric_fingerprint_pos",
          description: "Hardware fingerprint reader authentication for cashier shifts",
          owner: "Hardware Team",
          defaultState: false,
          enabled: true,
          rolloutPercentage: 25,
          reviewDate: "2027-01-01T00:00:00Z",
          eligiblePlans: ["Enterprise"],
          tenantAllowlist: [],
        },
        ownerStaff
      );

      expect(flag.key).toBe("biometric_fingerprint_pos");
      expect(flag.rolloutPercentage).toBe(25);

      // Duplicate key rejected
      await expect(
        PlatformFeatureFlagService.createFlag(
          {
            key: "biometric_fingerprint_pos",
            description: "Duplicate",
            owner: "Hardware",
            defaultState: false,
            enabled: false,
            rolloutPercentage: 0,
            reviewDate: "2027-01-01T00:00:00Z",
            eligiblePlans: [],
            tenantAllowlist: [],
          },
          ownerStaff
        )
      ).rejects.toThrowError(ValidationError);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 4. Dynamic Rate Limits & Bounds Enforcement (Section 6.8)
  |--------------------------------------------------------------------------
  */
  describe("4. Dynamic Rate Limits & Safe Boundaries", () => {
    it("updates rate limits dynamically and applies in-memory without server restart", async () => {
      const updated = await PlatformRateLimitService.updateLimits(
        {
          checkoutTerminalLimit: 45,
          publicPortalLimit: 15,
        },
        ownerStaff
      );

      expect(updated.checkoutTerminalLimit).toBe(45);
      expect(updated.publicPortalLimit).toBe(15);

      const effectiveCheckout = PlatformRateLimitService.getEffectiveLimit("checkout");
      expect(effectiveCheckout.limit).toBe(45);

      // Reset to 30 for baseline
      await PlatformRateLimitService.updateLimits({ checkoutTerminalLimit: 30 }, ownerStaff);
    });

    it("enforces safe minimum and maximum boundaries on rate limit settings", async () => {
      // Checkout safe bounds: 10 - 120
      await expect(
        PlatformRateLimitService.updateLimits({ checkoutTerminalLimit: 5 }, ownerStaff)
      ).rejects.toThrowError(/between 10 and 120/i);

      await expect(
        PlatformRateLimitService.updateLimits({ checkoutTerminalLimit: 200 }, ownerStaff)
      ).rejects.toThrowError(/between 10 and 120/i);

      // Public portal safe bounds: 5 - 60
      await expect(
        PlatformRateLimitService.updateLimits({ publicPortalLimit: 2 }, ownerStaff)
      ).rejects.toThrowError(/between 5 and 60/i);

      // Max upload size bounds: 1 - 50 MB
      await expect(
        PlatformRateLimitService.updateLimits({ maxUploadSizeMb: 100 }, ownerStaff)
      ).rejects.toThrowError(/between 1 MB and 50 MB/i);
    });

    it("integrates with checkRateLimit to dynamically throttle when updated", async () => {
      // Set portal limit to 5
      await PlatformRateLimitService.updateLimits({ publicPortalLimit: 5 }, ownerStaff);

      const ip = `192.168.1.${Date.now() % 1000}`;
      for (let i = 0; i < 5; i++) {
        const res = checkRateLimit(ip, RATE_LIMIT_TIERS.PUBLIC_PORTAL);
        expect(res.success).toBe(true);
      }

      // 6th request is throttled
      const throttled = checkRateLimit(ip, RATE_LIMIT_TIERS.PUBLIC_PORTAL);
      expect(throttled.success).toBe(false);

      // Restore to 10
      await PlatformRateLimitService.updateLimits({ publicPortalLimit: 10 }, ownerStaff);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 5. Permission Enforcement for Configuration Areas (Section 3 & 11)
  |--------------------------------------------------------------------------
  */
  describe("5. Permission Enforcement for Step S4 Areas", () => {
    it("denies Support Agent from editing platform settings (settings:write)", async () => {
      await expect(
        PlatformSettingsService.updateSettings({ platformName: "Hacked" }, supportStaff)
      ).rejects.toThrowError(ForbiddenError);
    });

    it("denies Auditor from modifying feature flags (flags:write)", async () => {
      await expect(
        PlatformFeatureFlagService.createFlag(
          {
            key: "auditor_test",
            description: "test",
            owner: "test",
            defaultState: false,
            enabled: true,
            rolloutPercentage: 0,
            reviewDate: "2027-01-01T00:00:00Z",
            eligiblePlans: [],
            tenantAllowlist: [],
          },
          auditorStaff
        )
      ).rejects.toThrowError(ForbiddenError);
    });

    it("denies Support Agent from rotating integration secrets (integrations:write)", async () => {
      await expect(
        PlatformIntegrationsService.updateIntegration("int-paystack", { secretKey: "abc" }, supportStaff)
      ).rejects.toThrowError(ForbiddenError);
    });

    it("denies Support Agent from modifying rate limits (limits:write)", async () => {
      await expect(
        PlatformRateLimitService.updateLimits({ checkoutTerminalLimit: 50 }, supportStaff)
      ).rejects.toThrowError(ForbiddenError);
    });
  });
});

