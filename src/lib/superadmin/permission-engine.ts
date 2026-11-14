import {
  PlatformRole,
  getPermissionsForRole,
  PLATFORM_AREAS,
  PLATFORM_PERMISSION_MATRIX,
  PlatformArea,
} from "./permission-matrix";
import { ForbiddenError, UnauthorizedError } from "@/lib/security/errors";

export interface PlatformStaffContext {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  mfaEnabled?: boolean;
}

/**
 * Route-to-Permission mapping as mandated by Section 5 of adminconsole.md
 */
export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  "/superadmin": "tenants:read",
  "/superadmin/analytics": "analytics:read",
  "/superadmin/tenants": "tenants:read",
  "/superadmin/plans": "plans:read",
  "/superadmin/billing": "billing:read",
  "/superadmin/approvals": "tenants:read", // Approvals queue visible to staff
  "/superadmin/content/announcements": "content:read",
  "/superadmin/content/helpcenter": "content:read",
  "/superadmin/content/templates": "content:read",
  "/superadmin/content/legal": "legal:read",
  "/superadmin/content/onboarding": "content:read",
  "/superadmin/content/presets": "content:read",
  "/superadmin/settings": "settings:read",
  "/superadmin/flags": "flags:read",
  "/superadmin/integrations": "integrations:read",
  "/superadmin/limits": "limits:read",
  "/superadmin/health": "health:read",
  "/superadmin/support": "support:read",
  "/superadmin/security": "security:read",
  "/superadmin/audit": "audit:read",
  "/superadmin/compliance": "compliance:read",
  "/superadmin/staff": "staff:read",
};

export class PlatformPermissionEngine {
  /**
   * Checks whether a role or staff context holds a specific permission key.
   * "Every server action and route handler checks the permission key, never the role name."
   */
  public static hasPermission(
    contextOrRole: PlatformRole | PlatformStaffContext,
    permissionKey: string
  ): boolean {
    const role: PlatformRole = typeof contextOrRole === "string" ? contextOrRole : contextOrRole.role;
    const permissions = getPermissionsForRole(role);
    return permissions.includes(permissionKey);
  }

  /**
   * Enforces that the actor holds the required permission key on the server.
   * Throws ForbiddenError if permission is missing.
   */
  public static enforcePermission(
    contextOrRole: PlatformRole | PlatformStaffContext,
    permissionKey: string
  ): void {
    if (!this.hasPermission(contextOrRole, permissionKey)) {
      throw new ForbiddenError(
        `Action denied. You do not hold the required platform permission: '${permissionKey}'.`
      );
    }
  }

  /**
   * Evaluates if a role can access a specific route in the console
   */
  public static canAccessRoute(role: PlatformRole, routePath: string): boolean {
    // If exact route matched
    const requiredKey = ROUTE_PERMISSION_MAP[routePath];
    if (requiredKey) {
      return this.hasPermission(role, requiredKey);
    }

    // Check parent matching (e.g. /superadmin/content/*)
    for (const [registeredRoute, permKey] of Object.entries(ROUTE_PERMISSION_MAP)) {
      if (routePath.startsWith(registeredRoute) && registeredRoute !== "/superadmin") {
        return this.hasPermission(role, permKey);
      }
    }

    // Default overview access
    return this.hasPermission(role, "tenants:read") || this.hasPermission(role, "health:read");
  }

  /**
   * Validates access level directly from matrix for testing & strict verification
   */
  public static getAccessLevel(area: PlatformArea, role: PlatformRole) {
    return PLATFORM_PERMISSION_MATRIX[area][role];
  }
}

