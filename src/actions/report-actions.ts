"use server";

import { requireTenantContext } from "@/lib/security/tenant";
import { ReportService } from "@/lib/reports/report-service";
import { FinancialEngine } from "@/lib/financials/financial-engine";
import { formatErrorResponse } from "@/lib/security/errors";

export async function getSalesReportAction(filters?: {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  limit?: number;
}) {
  try {
    const ctx = await requireTenantContext();
    const report = await ReportService.getSalesReport(ctx, {
      limit: filters?.limit || 100,
      customerId: filters?.customerId,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
    });
    return { success: true, report };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function getFinancialSummaryAction(dateRange?: {
  startDate?: string;
  endDate?: string;
}) {
  try {
    const ctx = await requireTenantContext();
    const summary = await FinancialEngine.getFinancialSummary(ctx, {
      startDate: dateRange?.startDate ? new Date(dateRange.startDate) : undefined,
      endDate: dateRange?.endDate ? new Date(dateRange.endDate) : undefined,
    });
    return { success: true, summary };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function getCustomerDebtReportAction() {
  try {
    const ctx = await requireTenantContext();
    const report = await ReportService.getCustomerDebtReport(ctx);
    return { success: true, report };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function getSupplierObligationsReportAction() {
  try {
    const ctx = await requireTenantContext();
    const report = await ReportService.getSupplierObligationsReport(ctx);
    return { success: true, report };
  } catch (error) {
    return formatErrorResponse(error);
  }
}
