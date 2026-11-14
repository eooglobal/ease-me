"use server";

import { requireTenantContext } from "@/lib/security/tenant";
import { DashboardService } from "@/lib/dashboard/dashboard-service";
import { formatErrorResponse } from "@/lib/security/errors";

export async function getDashboardDataAction() {
  try {
    const ctx = await requireTenantContext();
    const data = await DashboardService.getDashboardData(ctx);
    return { success: true, data };
  } catch (error) {
    return formatErrorResponse(error);
  }
}
