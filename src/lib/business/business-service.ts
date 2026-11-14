import { db } from "@/db";
import {
  businesses,
  businessMembers,
  roles,
  permissions,
  rolePermissions,
  dailyClosings,
  subscriptions,
  plans,
  auditLogs,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { SYSTEM_PERMISSIONS, SYSTEM_ROLES, DEFAULT_ROLE_PERMISSIONS, SystemRole } from "@/lib/security/permissions";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { ValidationError, NotFoundError, ForbiddenError } from "@/lib/security/errors";

export interface CreateBusinessInput {
  userId: string;
  userEmail: string;
  userName: string;
  businessName: string;
  businessType: "retail" | "supermarket" | "pharmacy" | "wholesaler" | "restaurant" | "service" | "other";
  currency?: string;
  phone?: string;
  address?: string;
  openingCash?: number;
}

export class BusinessService {
  /**
   * Initializes all system permissions in the global permissions table if not already populated.
   */
  static async ensureSystemPermissions(): Promise<Map<string, string>> {
    const existingPerms = await db.select().from(permissions);
    const permMap = new Map<string, string>(existingPerms.map((p) => [p.key, p.id]));

    for (const permKey of SYSTEM_PERMISSIONS) {
      if (!permMap.has(permKey)) {
        const [inserted] = await db
          .insert(permissions)
          .values({
            key: permKey,
            description: `Permission for ${permKey.replace(".", " ")}`,
          })
          .onConflictDoNothing()
          .returning();

        if (inserted) {
          permMap.set(inserted.key, inserted.id);
        }
      }
    }

    return permMap;
  }

  /**
   * Creates a new business workspace, configures standard roles and permissions,
   * adds the owner as the primary member, and initializes baseline closing.
   */
  static async createBusinessWithOwner(input: CreateBusinessInput) {
    if (!input.businessName.trim()) {
      throw new ValidationError("Business name is required.");
    }

    const permMap = await this.ensureSystemPermissions();

    return db.transaction(async (tx) => {
      // 1. Create Business Record
      const [business] = await tx
        .insert(businesses)
        .values({
          name: input.businessName.trim(),
          businessType: input.businessType,
          currency: input.currency?.toUpperCase() || "NGN",
          phone: input.phone || null,
          email: input.userEmail,
          address: input.address || null,
          status: "active",
        })
        .returning();

      // 2. Create Roles for the Business and Map Permissions
      const createdRoles: Record<string, string> = {};

      for (const [roleKey, rolePermissionsList] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
        const [createdRole] = await tx
          .insert(roles)
          .values({
            businessId: business.id,
            name: roleKey,
            description: `${roleKey.toUpperCase()} role for ${business.name}`,
            isSystemRole: true,
          })
          .returning();

        createdRoles[roleKey] = createdRole.id;

        // Associate permissions
        for (const perm of rolePermissionsList) {
          const permissionId = permMap.get(perm);
          if (permissionId) {
            await tx
              .insert(rolePermissions)
              .values({
                roleId: createdRole.id,
                permissionId,
              })
              .onConflictDoNothing();
          }
        }
      }

      // 3. Attach User as Business Owner
      const ownerRoleId = createdRoles[SYSTEM_ROLES.OWNER];
      const [member] = await tx
        .insert(businessMembers)
        .values({
          businessId: business.id,
          userId: input.userId,
          roleId: ownerRoleId,
          status: "active",
          joinedAt: new Date(),
        })
        .returning();

      // 4. Attach Default Free Subscription
      const [freePlan] = await tx
        .select()
        .from(plans)
        .where(eq(plans.name, "Free Plan"))
        .limit(1);

      if (freePlan) {
        await tx.insert(subscriptions).values({
          businessId: business.id,
          planId: freePlan.id,
          status: "active",
        });
      }

      // 5. Initialize Opening Cash Shift if specified
      if (input.openingCash !== undefined && input.openingCash > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await tx.insert(dailyClosings).values({
          businessId: business.id,
          businessDate: today,
          openingCash: input.openingCash.toString(),
          expectedCash: input.openingCash.toString(),
          status: "open",
          notes: "Initial business opening cash",
        });
      }

      // 6. Audit Trail
      await tx.insert(auditLogs).values({
        businessId: business.id,
        userId: input.userId,
        action: "BUSINESS_REGISTERED",
        entityType: "business",
        entityId: business.id,
        newValues: {
          businessName: business.name,
          businessType: business.businessType,
          currency: business.currency,
          ownerId: input.userId,
        },
      });

      return {
        business,
        member,
        roles: createdRoles,
      };
    });
  }

  /**
   * Retrieves all staff members belonging to the current business
   */
  static async listStaffMembers(ctx: TenantContext) {
    requirePermission(ctx, "staff.view");

    return db
      .select({
        memberId: businessMembers.id,
        userId: businessMembers.userId,
        roleId: businessMembers.roleId,
        roleName: roles.name,
        status: businessMembers.status,
        joinedAt: businessMembers.joinedAt,
        createdAt: businessMembers.createdAt,
      })
      .from(businessMembers)
      .innerJoin(roles, eq(businessMembers.roleId, roles.id))
      .where(eq(businessMembers.businessId, ctx.businessId));
  }

  /**
   * Adds or invites a staff member to the business with a specific role
   */
  static async addStaffMember(
    ctx: TenantContext,
    input: {
      userId: string;
      roleName: SystemRole;
    }
  ) {
    requirePermission(ctx, "staff.manage");

    // Fetch the role ID for this business
    const [targetRole] = await db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.businessId, ctx.businessId),
          eq(roles.name, input.roleName)
        )
      );

    if (!targetRole) {
      throw new NotFoundError(`Role '${input.roleName}'`);
    }

    const [member] = await db
      .insert(businessMembers)
      .values({
        businessId: ctx.businessId,
        userId: input.userId,
        roleId: targetRole.id,
        status: "active",
        joinedAt: new Date(),
      })
      .returning();

    await db.insert(auditLogs).values({
      businessId: ctx.businessId,
      userId: ctx.userId,
      action: "STAFF_ADDED",
      entityType: "business_member",
      entityId: member.id,
      newValues: {
        userId: input.userId,
        role: input.roleName,
      },
    });

    return member;
  }

  /**
   * Updates an existing staff member's role
   */
  static async updateStaffRole(
    ctx: TenantContext,
    memberId: string,
    newRoleName: SystemRole
  ) {
    requirePermission(ctx, "staff.manage");

    const [member] = await db
      .select()
      .from(businessMembers)
      .where(
        and(
          eq(businessMembers.id, memberId),
          eq(businessMembers.businessId, ctx.businessId)
        )
      );

    if (!member) {
      throw new NotFoundError("Staff member");
    }

    if (member.userId === ctx.userId && newRoleName !== "owner") {
      throw new ForbiddenError("You cannot downgrade your own owner role.");
    }

    const [targetRole] = await db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.businessId, ctx.businessId),
          eq(roles.name, newRoleName)
        )
      );

    if (!targetRole) {
      throw new NotFoundError(`Role '${newRoleName}'`);
    }

    await db
      .update(businessMembers)
      .set({
        roleId: targetRole.id,
        updatedAt: new Date(),
      })
      .where(eq(businessMembers.id, member.id));

    await db.insert(auditLogs).values({
      businessId: ctx.businessId,
      userId: ctx.userId,
      action: "STAFF_ROLE_UPDATED",
      entityType: "business_member",
      entityId: member.id,
      oldValues: { roleId: member.roleId },
      newValues: { roleId: targetRole.id, roleName: newRoleName },
    });

    return { success: true, memberId, newRole: newRoleName };
  }

  /**
   * Removes or suspends a staff member from the workspace
   */
  static async removeStaffMember(ctx: TenantContext, memberId: string) {
    requirePermission(ctx, "staff.manage");

    const [member] = await db
      .select()
      .from(businessMembers)
      .where(
        and(
          eq(businessMembers.id, memberId),
          eq(businessMembers.businessId, ctx.businessId)
        )
      );

    if (!member) {
      throw new NotFoundError("Staff member");
    }

    if (member.userId === ctx.userId) {
      throw new ForbiddenError("You cannot remove yourself from your own business.");
    }

    await db
      .update(businessMembers)
      .set({
        status: "removed",
        updatedAt: new Date(),
      })
      .where(eq(businessMembers.id, member.id));

    await db.insert(auditLogs).values({
      businessId: ctx.businessId,
      userId: ctx.userId,
      action: "STAFF_REMOVED",
      entityType: "business_member",
      entityId: member.id,
    });

    return { success: true, memberId };
  }
}
