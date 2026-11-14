import { PlatformAuditLogger } from "./audit-logger";
import { PlatformPermissionEngine, PlatformStaffContext } from "./permission-engine";
import { AppError, ForbiddenError, ValidationError } from "@/lib/security/errors";

export interface SecurityPolicySettings {
  mandatoryMfa: boolean;
  sessionLengthHours: number;
  idleTimeoutMinutes: number;
  ipAllowlistEnabled: boolean;
  allowedIps: string[];
  maxFailedLoginsBeforeLock: number;
  breachedPasswordCheckEnabled: boolean;
}

export interface ActiveStaffSession {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffRole: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  signedInAt: string;
  lastActiveAt: string;
}

export interface SecurityAlertItem {
  id: string;
  type: "failed_sign_in" | "new_device" | "webhook_signature_failure";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  target: string;
  timestamp: string;
}

let inMemoryPolicy: SecurityPolicySettings = {
  mandatoryMfa: true,
  sessionLengthHours: 8,
  idleTimeoutMinutes: 15,
  ipAllowlistEnabled: false,
  allowedIps: ["127.0.0.1", "102.89.0.0/16"],
  maxFailedLoginsBeforeLock: 5,
  breachedPasswordCheckEnabled: true,
};

let inMemoryActiveSessions: ActiveStaffSession[] = [
  {
    id: "sess-01",
    staffId: "usr-owner-01",
    staffName: "Emeka Okonkwo",
    staffEmail: "emeka.okonkwo@easeme.ng",
    staffRole: "owner",
    ipAddress: "102.89.34.12",
    userAgent: "Chrome 130 on Windows 11",
    location: "Lagos, Nigeria",
    signedInAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "sess-02",
    staffId: "usr-sup-01",
    staffName: "Tunde Bakare",
    staffEmail: "tunde.bakare@easeme.ng",
    staffRole: "support_agent",
    ipAddress: "102.89.34.19",
    userAgent: "Safari 18 on macOS",
    location: "Lagos, Nigeria",
    signedInAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];

let inMemoryAlerts: SecurityAlertItem[] = [
  {
    id: "alt-01",
    type: "failed_sign_in",
    severity: "medium",
    description: "3 consecutive invalid staff password attempts detected from IP 197.210.45.19",
    target: "Staff Authentication Gateway",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "alt-02",
    type: "webhook_signature_failure",
    severity: "high",
    description: "Paystack webhook request rejected due to invalid HMAC-SHA512 header",
    target: "/api/webhooks/paystack",
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
];

export class PlatformSecurityService {
  public static getPolicy(): SecurityPolicySettings {
    return { ...inMemoryPolicy };
  }

  public static async updatePolicy(
    updates: Partial<SecurityPolicySettings>,
    staffContext: PlatformStaffContext
  ): Promise<SecurityPolicySettings> {
    PlatformPermissionEngine.enforcePermission(staffContext, "security:write");

    if (updates.sessionLengthHours !== undefined && (updates.sessionLengthHours < 1 || updates.sessionLengthHours > 24)) {
      throw new ValidationError("Session length must be between 1 and 24 hours.");
    }
    if (updates.idleTimeoutMinutes !== undefined && (updates.idleTimeoutMinutes < 5 || updates.idleTimeoutMinutes > 60)) {
      throw new ValidationError("Idle timeout must be between 5 and 60 minutes.");
    }

    const previousValue = { ...inMemoryPolicy };
    inMemoryPolicy = { ...inMemoryPolicy, ...updates };

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "security.policy_updated",
      entityType: "security_policy",
      previousValue,
      newValue: inMemoryPolicy,
    });

    return { ...inMemoryPolicy };
  }

  public static getActiveSessions(): ActiveStaffSession[] {
    return [...inMemoryActiveSessions];
  }

  public static listActiveSessions(): ActiveStaffSession[] {
    return this.getActiveSessions();
  }

  public static async terminateSession(
    sessionId: string,
    reasonOrStaff: string | PlatformStaffContext,
    optionalStaff?: PlatformStaffContext
  ): Promise<void> {
    const staffContext = (typeof reasonOrStaff === "string" ? optionalStaff : reasonOrStaff) as PlatformStaffContext;
    const reason = typeof reasonOrStaff === "string" ? reasonOrStaff : "Remote session termination";

    PlatformPermissionEngine.enforcePermission(staffContext, "security:write");

    const index = inMemoryActiveSessions.findIndex((s) => s.id === sessionId);
    if (index === -1) throw new AppError("Active session not found.", 404, "NOT_FOUND");

    const terminated = inMemoryActiveSessions.splice(index, 1)[0];

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "security.remote_sign_out",
      entityType: "staff_session",
      entityId: sessionId,
      newValue: {
        staffEmail: terminated.staffEmail,
        ipAddress: terminated.ipAddress,
        reason,
      },
    });
  }

  public static getAlerts(): SecurityAlertItem[] {
    return [...inMemoryAlerts];
  }

  public static listAlerts(): SecurityAlertItem[] {
    return this.getAlerts();
  }
}
