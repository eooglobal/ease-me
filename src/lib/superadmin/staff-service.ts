import { PlatformApprovalEngine } from "./approval-engine";
import { PlatformAuditLogger } from "./audit-logger";
import { PlatformPermissionEngine, PlatformStaffContext } from "./permission-engine";
import { PlatformRole, ROLE_DISPLAY_NAMES } from "./permission-matrix";
import { AppError, ForbiddenError, ValidationError } from "@/lib/security/errors";

export interface StaffMemberRecord {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  isActive: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  deactivatedAt: string | null;
}

let inMemoryStaff: StaffMemberRecord[] = [
  {
    id: "usr-owner-01",
    name: "Emeka Okonkwo",
    email: "emeka.okonkwo@easeme.ng",
    role: "owner",
    isActive: true,
    mfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    createdAt: "2026-08-01T00:00:00Z",
    deactivatedAt: null,
  },
  {
    id: "usr-owner-02",
    name: "Chidinma Okafor",
    email: "chidinma.okafor@easeme.ng",
    role: "owner",
    isActive: true,
    mfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    createdAt: "2026-08-01T00:00:00Z",
    deactivatedAt: null,
  },
  {
    id: "usr-fin-01",
    name: "Ngozi Adeleke",
    email: "ngozi.adeleke@easeme.ng",
    role: "finance",
    isActive: true,
    mfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    createdAt: "2026-09-01T00:00:00Z",
    deactivatedAt: null,
  },
  {
    id: "usr-sec-01",
    name: "Ibrahim Danjuma",
    email: "ibrahim.danjuma@easeme.ng",
    role: "security",
    isActive: true,
    mfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    createdAt: "2026-09-01T00:00:00Z",
    deactivatedAt: null,
  },
  {
    id: "usr-sup-01",
    name: "Tunde Bakare",
    email: "tunde.bakare@easeme.ng",
    role: "support_agent",
    isActive: true,
    mfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    createdAt: "2026-09-15T00:00:00Z",
    deactivatedAt: null,
  },
  {
    id: "usr-cnt-01",
    name: "Fatima Bello",
    email: "fatima.bello@easeme.ng",
    role: "content",
    isActive: true,
    mfaEnabled: true,
    lastLoginAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    createdAt: "2026-10-01T00:00:00Z",
    deactivatedAt: null,
  },
];

export class PlatformStaffService {
  public static listStaff(): StaffMemberRecord[] {
    return [...inMemoryStaff];
  }

  public static getActiveOwnerCount(): number {
    return inMemoryStaff.filter((s) => s.role === "owner" && s.isActive).length;
  }

  /**
   * Section 6.9 & Section 11:
   * "The system refuses to remove or demote the last two Platform Owners."
   * "Role changes are approval requests."
   */
  public static async updateStaffRole(
    targetStaffId: string,
    newRole: PlatformRole,
    staffContext: PlatformStaffContext
  ): Promise<{ status: "pending_approval"; approvalRequestId: string }> {
    PlatformPermissionEngine.enforcePermission(staffContext, "staff:write");

    const target = inMemoryStaff.find((s) => s.id === targetStaffId);
    if (!target) throw new AppError("Staff member not found.", 404, "NOT_FOUND");

    // Acceptance Test (Section 11): Refuse demotion of the last two Platform Owners
    if (target.role === "owner" && newRole !== "owner") {
      const activeOwners = this.getActiveOwnerCount();
      if (activeOwners <= 2) {
        throw new ForbiddenError(
          "Safety invariant violation: The platform requires at least two active Platform Owners. Demoting this owner is prohibited."
        );
      }
    }

    // Role changes are sensitive dual-control approval requests!
    const approvalReq = await PlatformApprovalEngine.createRequest({
      actionKey: "staff:role_change",
      actionTitle: `Change Role of ${target.name} from ${ROLE_DISPLAY_NAMES[target.role].label} to ${ROLE_DISPLAY_NAMES[newRole].label}`,
      entityType: "platform_staff",
      entityId: target.id,
      requesterId: staffContext.id,
      requesterName: staffContext.name,
      requesterEmail: staffContext.email,
      requesterRole: staffContext.role,
      reason: `Staff platform role transition from ${target.role} to ${newRole}.`,
      beforeState: { role: target.role },
      afterState: { role: newRole },
    });

    return { status: "pending_approval", approvalRequestId: approvalReq.id };
  }

  /**
   * Section 6.9 & Section 11:
   * "The system refuses to remove or demote the last two Platform Owners."
   * "Departing staff are deactivated, never deleted, so audit history stays intact."
   */
  public static async deactivateStaff(
    targetStaffId: string,
    reason: string,
    staffContext: PlatformStaffContext
  ): Promise<StaffMemberRecord> {
    PlatformPermissionEngine.enforcePermission(staffContext, "staff:write");

    const target = inMemoryStaff.find((s) => s.id === targetStaffId);
    if (!target) throw new AppError("Staff member not found.", 404, "NOT_FOUND");

    if (target.role === "owner") {
      const activeOwners = this.getActiveOwnerCount();
      if (activeOwners <= 2) {
        throw new ForbiddenError(
          "Safety invariant violation: The system refuses to remove or deactivate the last two Platform Owners."
        );
      }
    }

    target.isActive = false;
    target.deactivatedAt = new Date().toISOString();

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "staff.deactivated",
      entityType: "platform_staff",
      entityId: target.id,
      newValue: {
        deactivatedStaffId: target.id,
        name: target.name,
        role: target.role,
        reason,
      },
    });

    return target;
  }

  public static async resetStaffMFA(
    targetStaffId: string,
    staffContext: PlatformStaffContext
  ): Promise<void> {
    PlatformPermissionEngine.enforcePermission(staffContext, "staff:write");

    const target = inMemoryStaff.find((s) => s.id === targetStaffId);
    if (!target) throw new AppError("Staff member not found.", 404, "NOT_FOUND");

    target.mfaEnabled = false;

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "staff.mfa_reset",
      entityType: "platform_staff",
      entityId: target.id,
      newValue: { mfaResetFor: target.email },
    });
  }

  public static getStaffById(id: string): StaffMemberRecord | undefined {
    return inMemoryStaff.find((s) => s.id === id);
  }

  public static async requestRoleChange(
    targetStaffId: string,
    newRole: PlatformRole,
    reasonOrStaff: string | PlatformStaffContext,
    optionalStaff?: PlatformStaffContext
  ): Promise<{ status: "pending_approval"; approvalRequestId: string; message: string }> {
    const staffContext = (typeof reasonOrStaff === "string" ? optionalStaff : reasonOrStaff) as PlatformStaffContext;
    const res = await this.updateStaffRole(targetStaffId, newRole, staffContext);
    return {
      ...res,
      message: `Role change for staff member ${targetStaffId} submitted for dual-control approval.`,
    };
  }

  public static async resetMfa(
    targetStaffId: string,
    staffContext: PlatformStaffContext
  ): Promise<void> {
    return this.resetStaffMFA(targetStaffId, staffContext);
  }

  public static async inviteStaff(
    inputOrEmail: { name: string; email: string; role: PlatformRole } | string,
    nameOrStaffContext: string | PlatformStaffContext,
    roleOrNothing?: PlatformRole,
    staffContextOrNothing?: PlatformStaffContext
  ): Promise<StaffMemberRecord> {
    let input: { name: string; email: string; role: PlatformRole };
    let staffContext: PlatformStaffContext;

    if (typeof inputOrEmail === "string") {
      input = {
        email: inputOrEmail,
        name: nameOrStaffContext as string,
        role: roleOrNothing as PlatformRole,
      };
      staffContext = staffContextOrNothing as PlatformStaffContext;
    } else {
      input = inputOrEmail;
      staffContext = nameOrStaffContext as PlatformStaffContext;
    }
    PlatformPermissionEngine.enforcePermission(staffContext, "staff:write");

    if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      throw new ValidationError("Valid platform staff email is required.");
    }

    if (inMemoryStaff.some((s) => s.email.toLowerCase() === input.email.toLowerCase())) {
      throw new ValidationError(`Staff member with email '${input.email}' already exists.`);
    }

    const newStaff: StaffMemberRecord = {
      id: `usr-staff-${Date.now()}`,
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      isActive: true,
      mfaEnabled: true, // Mandatory MFA for every staff account
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      deactivatedAt: null,
    };

    inMemoryStaff.push(newStaff);

    await PlatformAuditLogger.log({
      staffId: staffContext.id,
      staffEmail: staffContext.email,
      staffRole: staffContext.role,
      action: "staff.invited",
      entityType: "platform_staff",
      entityId: newStaff.id,
      newValue: { name: newStaff.name, email: newStaff.email, role: newStaff.role },
    });

    return newStaff;
  }
}
