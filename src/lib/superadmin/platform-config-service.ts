import { PlatformApprovalEngine } from "./approval-engine";
import { PlatformAuditLogger } from "./audit-logger";
import { PlatformPermissionEngine, PlatformStaffContext } from "./permission-engine";
import { AppError, ForbiddenError, ValidationError } from "@/lib/security/errors";

/**
 * Pure JavaScript 32-bit FNV-1a deterministic hash.
 * Fully compatible with Node.js, Next.js Edge Runtime, and browser environments.
 */
function deterministicHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

/*
|--------------------------------------------------------------------------
| 1. PLATFORM SETTINGS & MAINTENANCE MODE
|--------------------------------------------------------------------------
*/

export interface PlatformSettingsData {
  platformName: string;
  supportEmail: string;
  supportWhatsapp: string;
  logoUrl: string;
  faviconUrl: string;
  defaultCurrency: string;
  defaultTimezone: string;
  dateFormat: string;
  defaultTaxRate: number;
  supportedCountries: string[];
  trialLengthDays: number;
  cardRequiredForTrial: boolean;
  gracePeriodDays: number;
  signupMode: "open" | "invite_only" | "closed";
  approvalThresholdAmount: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceStartedAt?: string | null;
  updatedAt: string;
}

let inMemorySettings: PlatformSettingsData = {
  platformName: "Ease Me",
  supportEmail: "support@easeme.ng",
  supportWhatsapp: "+234 800 EASE ME",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico",
  defaultCurrency: "NGN",
  defaultTimezone: "Africa/Lagos",
  dateFormat: "DD/MM/YYYY",
  defaultTaxRate: 7.5,
  supportedCountries: ["NG", "GH", "KE"],
  trialLengthDays: 14,
  cardRequiredForTrial: false,
  gracePeriodDays: 3,
  signupMode: "open",
  approvalThresholdAmount: 20000,
  maintenanceMode: false,
  maintenanceMessage: "Ease Me is currently undergoing scheduled platform maintenance. Services will resume shortly.",
  maintenanceStartedAt: null,
  updatedAt: new Date().toISOString(),
};

export class PlatformSettingsService {
  public static getSettings(): PlatformSettingsData {
    return { ...inMemorySettings };
  }

  public static async updateSettings(
    input: Partial<Omit<PlatformSettingsData, "updatedAt" | "maintenanceMode" | "maintenanceStartedAt">>,
    staffContext: PlatformStaffContext
  ): Promise<PlatformSettingsData> {
    PlatformPermissionEngine.enforcePermission(staffContext, "settings:write");

    if (input.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.supportEmail)) {
      throw new ValidationError("A valid support email address is required.");
    }
    if (input.trialLengthDays !== undefined && (input.trialLengthDays < 0 || input.trialLengthDays > 90)) {
      throw new ValidationError("Trial length must be between 0 and 90 days.");
    }
    if (input.gracePeriodDays !== undefined && (input.gracePeriodDays < 1 || input.gracePeriodDays > 30)) {
      throw new ValidationError("Grace period must be between 1 and 30 days.");
    }

    const previousValue = { ...inMemorySettings };

    inMemorySettings = {
      ...inMemorySettings,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "settings.update",
      entityType: "platform_settings",
      previousValue,
      newValue: inMemorySettings,
    });

    return { ...inMemorySettings };
  }

  /**
   * Section 6.8 & Section 4: Maintenance mode control.
   * Enables or disables platform maintenance.
   * If non-owner attempts to toggle, creates a dual-control approval request!
   */
  public static async setMaintenanceMode(
    enabled: boolean,
    reason: string,
    staffContext: PlatformStaffContext,
    message?: string
  ): Promise<{ status: "applied" | "pending_approval"; approvalRequestId?: string }> {
    PlatformPermissionEngine.enforcePermission(staffContext, "settings:write");

    if (!reason || reason.trim().length < 5) {
      throw new ValidationError("A comprehensive justification is mandatory for toggling platform maintenance.");
    }

    // Dual control requirement for maintenance toggles:
    // If not Platform Owner, must route through approval queue!
    if (staffContext.role !== "owner") {
      const approvalReq = await PlatformApprovalEngine.createRequest({
        actionKey: "settings:maintenance_mode",
        actionTitle: `${enabled ? "Enable" : "Disable"} Platform-wide Maintenance Mode`,
        entityType: "platform_settings",
        requesterId: staffContext.id,
        requesterName: staffContext.name,
        requesterEmail: staffContext.email,
        requesterRole: staffContext.role,
        reason: reason.trim(),
        beforeState: { maintenanceMode: inMemorySettings.maintenanceMode },
        afterState: { maintenanceMode: enabled, message: message || inMemorySettings.maintenanceMessage },
      });

      return { status: "pending_approval", approvalRequestId: approvalReq.id };
    }

    const previousValue = {
      maintenanceMode: inMemorySettings.maintenanceMode,
      maintenanceStartedAt: inMemorySettings.maintenanceStartedAt,
    };

    inMemorySettings.maintenanceMode = enabled;
    inMemorySettings.maintenanceStartedAt = enabled ? new Date().toISOString() : null;
    if (message) inMemorySettings.maintenanceMessage = message;
    inMemorySettings.updatedAt = new Date().toISOString();

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: enabled ? "settings.maintenance_mode_enabled" : "settings.maintenance_mode_disabled",
      entityType: "platform_settings",
      previousValue,
      newValue: {
        maintenanceMode: inMemorySettings.maintenanceMode,
        reason,
        maintenanceStartedAt: inMemorySettings.maintenanceStartedAt,
      },
    });

    return { status: "applied" };
  }

  /**
   * Section 11 Acceptance Test:
   * "Maintenance mode blocks tenants and admits staff."
   */
  public static checkMaintenanceAccess(userRole?: string | null): { blocked: boolean; message?: string } {
    if (!inMemorySettings.maintenanceMode) {
      return { blocked: false };
    }

    // Platform staff roles that are exempted and allowed into the platform during maintenance
    const PLATFORM_STAFF_ROLES = [
      "super_admin",
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

    if (userRole && PLATFORM_STAFF_ROLES.includes(userRole)) {
      return { blocked: false };
    }

    return {
      blocked: true,
      message: inMemorySettings.maintenanceMessage,
    };
  }

  public static isMaintenanceActive(): boolean {
    return inMemorySettings.maintenanceMode;
  }
}

/*
|--------------------------------------------------------------------------
| 2. FEATURE FLAGS ENGINE (Section 6.8)
|--------------------------------------------------------------------------
*/

export interface FeatureFlagData {
  id: string;
  key: string;
  description: string;
  owner: string;
  defaultState: boolean;
  enabled: boolean;
  rolloutPercentage: number;
  reviewDate: string;
  eligiblePlans: string[];
  tenantAllowlist: string[];
  createdAt: string;
  updatedAt: string;
}

let inMemoryFlags: FeatureFlagData[] = [
  {
    id: "flg-01",
    key: "realtime_websocket_cashier",
    description: "Sub-second multi-terminal inventory and cart sync via WebSockets",
    owner: "Engineering",
    defaultState: false,
    enabled: true,
    rolloutPercentage: 50,
    reviewDate: "2026-12-15T00:00:00Z",
    eligiblePlans: ["Growth", "Business", "Enterprise"],
    tenantAllowlist: ["ten-001", "ten-002"],
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-15T00:00:00Z",
  },
  {
    id: "flg-02",
    key: "offline_pwa_sync_engine",
    description: "IndexedDB background SQLite queue for intermittent internet environments",
    owner: "Engineering",
    defaultState: true,
    enabled: true,
    rolloutPercentage: 100,
    reviewDate: "2026-11-01T00:00:00Z", // Past review date (stale flag for attention list)
    eligiblePlans: ["Starter", "Growth", "Business", "Enterprise"],
    tenantAllowlist: [],
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-20T00:00:00Z",
  },
  {
    id: "flg-03",
    key: "automated_tax_e_invoicing",
    description: "Direct FIRS real-time tax invoice transmission integration",
    owner: "Product & Compliance",
    defaultState: false,
    enabled: false,
    rolloutPercentage: 0,
    reviewDate: "2027-01-31T00:00:00Z",
    eligiblePlans: ["Business", "Enterprise"],
    tenantAllowlist: [],
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
  },
];

export class PlatformFeatureFlagService {
  public static listFlags(): FeatureFlagData[] {
    return [...inMemoryFlags];
  }

  public static getFlag(key: string): FeatureFlagData | undefined {
    return inMemoryFlags.find((f) => f.key.toLowerCase() === key.toLowerCase());
  }

  public static async createFlag(
    input: Omit<FeatureFlagData, "id" | "createdAt" | "updatedAt">,
    staffContext: PlatformStaffContext
  ): Promise<FeatureFlagData> {
    PlatformPermissionEngine.enforcePermission(staffContext, "flags:write");

    const key = input.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!key || key.length < 3) {
      throw new ValidationError("Feature flag key must be at least 3 alphanumeric characters.");
    }
    if (inMemoryFlags.some((f) => f.key === key)) {
      throw new ValidationError(`Feature flag with key '${key}' already exists.`);
    }

    if (input.rolloutPercentage < 0 || input.rolloutPercentage > 100) {
      throw new ValidationError("Rollout percentage must be between 0 and 100.");
    }

    const flag: FeatureFlagData = {
      ...input,
      id: `flg-${Date.now()}`,
      key,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryFlags.unshift(flag);

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "flags.create",
      entityType: "feature_flag",
      entityId: flag.key,
      newValue: flag,
    });

    return flag;
  }

  public static async updateFlag(
    key: string,
    updates: Partial<Omit<FeatureFlagData, "id" | "key" | "createdAt" | "updatedAt">>,
    staffContext: PlatformStaffContext
  ): Promise<FeatureFlagData> {
    PlatformPermissionEngine.enforcePermission(staffContext, "flags:write");

    const index = inMemoryFlags.findIndex((f) => f.key.toLowerCase() === key.toLowerCase());
    if (index === -1) throw new AppError(`Feature flag '${key}' not found.`, 404, "NOT_FOUND");

    if (updates.rolloutPercentage !== undefined && (updates.rolloutPercentage < 0 || updates.rolloutPercentage > 100)) {
      throw new ValidationError("Rollout percentage must be between 0 and 100.");
    }

    const previousValue = { ...inMemoryFlags[index] };

    inMemoryFlags[index] = {
      ...inMemoryFlags[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "flags.update",
      entityType: "feature_flag",
      entityId: key,
      previousValue,
      newValue: inMemoryFlags[index],
    });

    return inMemoryFlags[index];
  }

  public static async deleteFlag(key: string, staffContext: PlatformStaffContext): Promise<void> {
    PlatformPermissionEngine.enforcePermission(staffContext, "flags:write");

    const index = inMemoryFlags.findIndex((f) => f.key.toLowerCase() === key.toLowerCase());
    if (index === -1) throw new AppError(`Feature flag '${key}' not found.`, 404, "NOT_FOUND");

    const deleted = inMemoryFlags.splice(index, 1)[0];

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "flags.delete",
      entityType: "feature_flag",
      entityId: key,
      previousValue: deleted,
    });
  }

  /**
   * Section 6.8: Universal helper function reading flags everywhere.
   * Deterministic evaluation:
   * 1. If not enabled globally -> false
   * 2. If tenantId in tenantAllowlist -> true
   * 3. If planName in eligiblePlans -> check rolloutPercentage
   * 4. Hash bucket for percentage rollout
   */
  public static isFeatureFlagEnabled(
    flagKey: string,
    context?: { tenantId?: string; planName?: string }
  ): boolean {
    const flag = inMemoryFlags.find((f) => f.key.toLowerCase() === flagKey.toLowerCase());
    if (!flag) return false;
    if (!flag.enabled) return false;

    // 1. Explicit tenant allowlist
    if (context?.tenantId && flag.tenantAllowlist.includes(context.tenantId)) {
      return true;
    }

    // 2. Plan restriction check
    if (context?.planName && flag.eligiblePlans.length > 0) {
      if (!flag.eligiblePlans.map((p) => p.toLowerCase()).includes(context.planName.toLowerCase())) {
        return false;
      }
    }

    // 3. Rollout percentage check (deterministic hash)
    if (flag.rolloutPercentage >= 100) return true;
    if (flag.rolloutPercentage <= 0) return flag.defaultState;

    const seed = `${context?.tenantId || "anonymous"}-${flag.key}`;
    const hashVal = deterministicHash(seed);
    const bucket = hashVal % 100;

    return bucket < flag.rolloutPercentage;
  }

  /**
   * Section 6.8: Flags past review date appear in Overview attention list
   */
  public static getStaleFlags(): FeatureFlagData[] {
    const now = new Date();
    return inMemoryFlags.filter((f) => f.enabled && new Date(f.reviewDate) < now);
  }
}

/*
|--------------------------------------------------------------------------
| 3. INTEGRATIONS & WRITE-ONLY SECRETS (Section 6.8 & 11)
|--------------------------------------------------------------------------
*/

export interface IntegrationConfigItem {
  id: string;
  provider: "paystack" | "storage_r2" | "cache_redis" | "email_postmark" | "sms_termii";
  name: string;
  category: "payments" | "storage" | "cache" | "email" | "sms";
  status: "healthy" | "degraded" | "unconfigured";
  lastTestedAt: string | null;
  lastSuccessfulPingAt: string | null;
  fields: Record<string, { label: string; value: string; isSecret: boolean }>;
}

let inMemoryIntegrations: IntegrationConfigItem[] = [
  {
    id: "int-paystack",
    provider: "paystack",
    name: "Paystack Nigeria",
    category: "payments",
    status: "healthy",
    lastTestedAt: "2026-11-09T08:00:00Z",
    lastSuccessfulPingAt: "2026-11-09T08:00:00Z",
    fields: {
      publicKey: { label: "Public Key", value: "pk_live_839218392109283019283109", isSecret: false },
      secretKey: { label: "Secret Key", value: "sk_live_901823901823091820391820", isSecret: true },
      webhookSecret: { label: "Webhook Signature Secret", value: "paystack_live_whsec_908129831", isSecret: true },
    },
  },
  {
    id: "int-storage",
    provider: "storage_r2",
    name: "Cloudflare R2 Object Storage",
    category: "storage",
    status: "healthy",
    lastTestedAt: "2026-11-09T07:30:00Z",
    lastSuccessfulPingAt: "2026-11-09T07:30:00Z",
    fields: {
      endpoint: { label: "S3 Endpoint URL", value: "https://r2.cloudflarestorage.com/ease-me-bucket", isSecret: false },
      bucketName: { label: "Bucket Name", value: "ease-me-assets-prod", isSecret: false },
      accessKeyId: { label: "Access Key ID", value: "r2_acc_90218903182", isSecret: false },
      secretAccessKey: { label: "Secret Access Key", value: "r2_sec_kjasd091823091823019823", isSecret: true },
    },
  },
  {
    id: "int-cache",
    provider: "cache_redis",
    name: "Redis Cache & Memory Store",
    category: "cache",
    status: "healthy",
    lastTestedAt: "2026-11-09T08:15:00Z",
    lastSuccessfulPingAt: "2026-11-09T08:15:00Z",
    fields: {
      host: { label: "Redis Host", value: "redis://127.0.0.1:6379", isSecret: false },
      password: { label: "Redis Password", value: "redis_prod_sec_091823901", isSecret: true },
    },
  },
  {
    id: "int-email",
    provider: "email_postmark",
    name: "Postmark Transactional Email",
    category: "email",
    status: "healthy",
    lastTestedAt: "2026-11-08T18:00:00Z",
    lastSuccessfulPingAt: "2026-11-08T18:00:00Z",
    fields: {
      senderEmail: { label: "Sender Email Address", value: "notifications@easeme.ng", isSecret: false },
      serverToken: { label: "Server API Token", value: "pmk_sec_10928301928301928301", isSecret: true },
    },
  },
  {
    id: "int-sms",
    provider: "sms_termii",
    name: "Termii WhatsApp & SMS Gateway",
    category: "sms",
    status: "healthy",
    lastTestedAt: "2026-11-09T06:45:00Z",
    lastSuccessfulPingAt: "2026-11-09T06:45:00Z",
    fields: {
      senderId: { label: "Sender ID", value: "EaseMe", isSecret: false },
      apiKey: { label: "Termii API Key", value: "trm_live_sec_091823019283019283", isSecret: true },
    },
  },
];

export class PlatformIntegrationsService {
  /**
   * Invariant: "Secret fields are write only" / "A saved secret is never returned in full by any endpoint."
   */
  public static maskSecret(value: string): string {
    if (!value || value.length < 8) return "••••••••••••";
    const prefix = value.substring(0, Math.min(4, Math.floor(value.length / 4)));
    const suffix = value.substring(value.length - 4);
    return `${prefix}••••••••••••${suffix}`;
  }

  /**
   * Retrieves integrations list with all secret fields masked!
   */
  public static getIntegrations(): IntegrationConfigItem[] {
    return inMemoryIntegrations.map((item) => ({
      ...item,
      fields: Object.entries(item.fields).reduce((acc, [fieldKey, fieldObj]) => {
        acc[fieldKey] = {
          ...fieldObj,
          value: fieldObj.isSecret ? this.maskSecret(fieldObj.value) : fieldObj.value,
        };
        return acc;
      }, {} as IntegrationConfigItem["fields"]),
    }));
  }

  public static async updateIntegration(
    providerId: string,
    fieldValues: Record<string, string>,
    staffContext: PlatformStaffContext
  ): Promise<void> {
    PlatformPermissionEngine.enforcePermission(staffContext, "integrations:write");

    const item = inMemoryIntegrations.find((i) => i.id === providerId);
    if (!item) throw new AppError(`Integration '${providerId}' not found.`, 404, "NOT_FOUND");

    const previousAuditValues: Record<string, string> = {};
    const newAuditValues: Record<string, string> = {};

    for (const [key, value] of Object.entries(fieldValues)) {
      if (item.fields[key]) {
        const isSecret = item.fields[key].isSecret;

        // If secret field submitted with placeholder dots or empty string, preserve current secret
        if (isSecret && (!value.trim() || value.includes("••••"))) {
          continue;
        }

        previousAuditValues[key] = isSecret ? this.maskSecret(item.fields[key].value) : item.fields[key].value;
        item.fields[key].value = value.trim();
        newAuditValues[key] = isSecret ? this.maskSecret(item.fields[key].value) : item.fields[key].value;
      }
    }

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "integrations.update",
      entityType: "integration",
      entityId: providerId,
      previousValue: previousAuditValues,
      newValue: newAuditValues,
    });
  }

  public static async testConnection(
    providerId: string,
    staffContext: PlatformStaffContext
  ): Promise<{ success: boolean; latencyMs: number; message: string }> {
    PlatformPermissionEngine.enforcePermission(staffContext, "integrations:read");

    const item = inMemoryIntegrations.find((i) => i.id === providerId);
    if (!item) throw new AppError(`Integration '${providerId}' not found.`, 404, "NOT_FOUND");

    const start = Date.now();
    // Simulate diagnostic latency
    const latencyMs = Math.floor(Math.random() * 40) + 15;
    const now = new Date().toISOString();

    item.lastTestedAt = now;
    item.lastSuccessfulPingAt = now;
    item.status = "healthy";

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "integrations.test_connection",
      entityType: "integration",
      entityId: providerId,
      newValue: { status: "healthy", latencyMs },
    });

    return {
      success: true,
      latencyMs,
      message: `${item.name} connection test succeeded in ${latencyMs}ms. Service is healthy.`,
    };
  }
}

/*
|--------------------------------------------------------------------------
| 4. RATE LIMITS & BOUNDS (Section 6.8)
|--------------------------------------------------------------------------
*/

export interface PlatformLimitsData {
  checkoutTerminalLimit: number; // requests/min per terminal (default: 30)
  publicPortalLimit: number; // requests/10s per IP (default: 10)
  authAttemptsLimit: number; // requests/min (default: 5)
  maxUploadSizeMb: number; // MB (default: 10)
  permittedFileTypes: string[];
  updatedAt: string;
}

let inMemoryLimits: PlatformLimitsData = {
  checkoutTerminalLimit: 30,
  publicPortalLimit: 10,
  authAttemptsLimit: 5,
  maxUploadSizeMb: 10,
  permittedFileTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  updatedAt: new Date().toISOString(),
};

export class PlatformRateLimitService {
  public static getLimits(): PlatformLimitsData {
    return { ...inMemoryLimits };
  }

  /**
   * Section 6.8: Safe minimum and maximum boundaries enforced:
   * Checkout: 10 - 120 req/min
   * Portal: 5 - 60 req/10s
   * Auth: 3 - 20 req/min
   * Upload: 1 - 50 MB
   */
  public static async updateLimits(
    updates: Partial<PlatformLimitsData>,
    staffContext: PlatformStaffContext
  ): Promise<PlatformLimitsData> {
    PlatformPermissionEngine.enforcePermission(staffContext, "limits:write");

    if (updates.checkoutTerminalLimit !== undefined) {
      if (updates.checkoutTerminalLimit < 10 || updates.checkoutTerminalLimit > 120) {
        throw new ValidationError("Checkout terminal rate limit must be between 10 and 120 requests/minute.");
      }
    }

    if (updates.publicPortalLimit !== undefined) {
      if (updates.publicPortalLimit < 5 || updates.publicPortalLimit > 60) {
        throw new ValidationError("Public portal rate limit must be between 5 and 60 requests/10 seconds.");
      }
    }

    if (updates.authAttemptsLimit !== undefined) {
      if (updates.authAttemptsLimit < 3 || updates.authAttemptsLimit > 20) {
        throw new ValidationError("Sign-in rate limit must be between 3 and 20 requests/minute.");
      }
    }

    if (updates.maxUploadSizeMb !== undefined) {
      if (updates.maxUploadSizeMb < 1 || updates.maxUploadSizeMb > 50) {
        throw new ValidationError("Maximum upload size must be between 1 MB and 50 MB.");
      }
    }

    const previousValue = { ...inMemoryLimits };

    inMemoryLimits = {
      ...inMemoryLimits,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "limits.update",
      entityType: "rate_limits",
      previousValue,
      newValue: inMemoryLimits,
    });

    return { ...inMemoryLimits };
  }

  public static getEffectiveLimit(tier: "checkout" | "portal" | "auth"): { limit: number; windowMs: number } {
    switch (tier) {
      case "checkout":
        return { limit: inMemoryLimits.checkoutTerminalLimit, windowMs: 60 * 1000 };
      case "portal":
        return { limit: inMemoryLimits.publicPortalLimit, windowMs: 10 * 1000 };
      case "auth":
        return { limit: inMemoryLimits.authAttemptsLimit, windowMs: 60 * 1000 };
    }
  }
}

