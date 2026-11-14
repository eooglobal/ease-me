"use server";

import { requireTenantContext } from "@/lib/security/tenant";
import { BusinessService } from "@/lib/business/business-service";
import { SystemRole } from "@/lib/security/permissions";
import { formatErrorResponse } from "@/lib/security/errors";

export async function listStaffMembersAction() {
  try {
    const ctx = await requireTenantContext();
    const staff = await BusinessService.listStaffMembers(ctx);
    return { success: true, staff };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function addStaffMemberAction(input: {
  userId: string;
  roleName: SystemRole;
}) {
  try {
    const ctx = await requireTenantContext();
    const member = await BusinessService.addStaffMember(ctx, input);
    return { success: true, member };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function updateStaffRoleAction(input: {
  memberId: string;
  newRoleName: SystemRole;
}) {
  try {
    const ctx = await requireTenantContext();
    const result = await BusinessService.updateStaffRole(
      ctx,
      input.memberId,
      input.newRoleName
    );
    return { success: true, result };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function removeStaffMemberAction(memberId: string) {
  try {
    const ctx = await requireTenantContext();
    const result = await BusinessService.removeStaffMember(ctx, memberId);
    return { success: true, result };
  } catch (error) {
    return formatErrorResponse(error);
  }
}
