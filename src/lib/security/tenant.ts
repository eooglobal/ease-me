import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { db, pool } from "@/db";
import { businessMembers, roles, rolePermissions, permissions, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "./errors";
import { PermissionKey, hasPermission } from "./permissions";
import { PoolClient } from "pg";

export interface TenantContext {
  userId: string;
  userEmail: string;
  userName: string;
  businessId: string;
  businessName: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

/**
 * Resolves the authenticated user session and verifies membership for a requested or default business.
 * Never trusts client-supplied business ID without membership verification.
 */
export async function getTenantContext(requestedBusinessId?: string): Promise<TenantContext | null> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || !session.user) {
    return null;
  }

  const userId = session.user.id;

  // Query user membership
  let memberQuery = db
    .select({
      memberId: businessMembers.id,
      businessId: businessMembers.businessId,
      businessName: businesses.name,
      businessStatus: businesses.status,
      memberStatus: businessMembers.status,
      roleId: roles.id,
      roleName: roles.name,
    })
    .from(businessMembers)
    .innerJoin(businesses, eq(businessMembers.businessId, businesses.id))
    .innerJoin(roles, eq(businessMembers.roleId, roles.id))
    .where(
      and(
        eq(businessMembers.userId, userId),
        eq(businessMembers.status, "active"),
        eq(businesses.status, "active"),
        requestedBusinessId ? eq(businessMembers.businessId, requestedBusinessId) : undefined
      )
    );

  const memberRecords = await memberQuery;

  if (!memberRecords || memberRecords.length === 0) {
    return null;
  }

  const activeMembership = memberRecords[0];

  // Fetch all permissions assigned to this role
  const rolePerms = await db
    .select({
      permKey: permissions.key,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, activeMembership.roleId));

  const userPermissions = rolePerms.map((p) => p.permKey);

  return {
    userId,
    userEmail: session.user.email,
    userName: session.user.name,
    businessId: activeMembership.businessId,
    businessName: activeMembership.businessName,
    roleId: activeMembership.roleId,
    roleName: activeMembership.roleName,
    permissions: userPermissions,
  };
}

/**
 * Strict tenant context getter that throws UnauthorizedError or ForbiddenError if not satisfied
 */
export async function requireTenantContext(requestedBusinessId?: string): Promise<TenantContext> {
  const ctx = await getTenantContext(requestedBusinessId);
  if (!ctx) {
    throw new UnauthorizedError("You are not authenticated or do not have access to this business workspace.");
  }
  return ctx;
}

/**
 * Asserts that the authenticated user possesses the required permission for the current tenant context
 */
export function requirePermission(ctx: TenantContext, permission: PermissionKey): void {
  if (!hasPermission(ctx.permissions, permission)) {
    throw new ForbiddenError(`You do not have permission '${permission}' to perform this action.`);
  }
}

/**
 * Transaction helper that sets the PostgreSQL transaction-scoped tenant context (SET LOCAL app.current_business_id)
 * and executes the provided database operations inside a single atomic transaction.
 */
export async function withTenantTransaction<T>(
  businessId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Set transaction-scoped RLS variable
    await client.query("SET LOCAL app.current_business_id = $1", [businessId]);
    
    const result = await callback(client);
    
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
