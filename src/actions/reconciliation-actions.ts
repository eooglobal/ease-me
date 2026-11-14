"use server";

import { requireTenantContext } from "@/lib/security/tenant";
import { ReconciliationService } from "@/lib/reconciliation/reconciliation-service";
import {
  ShiftService,
  StartShiftInput,
  CloseShiftInput,
  CoSignShiftInput,
} from "@/lib/reconciliation/shift-service";
import { startDaySchema, closeDaySchema, reopenDaySchema } from "@/lib/reconciliation/validation";
import { formatErrorResponse } from "@/lib/security/errors";
import { z } from "zod";

export async function getReconciliationStatusAction(targetDate?: string) {
  try {
    const ctx = await requireTenantContext();
    const date = targetDate ? new Date(targetDate) : new Date();
    const status = await ReconciliationService.calculateDailyExpectedCash(ctx, date);
    return { success: true, status };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function startDayAction(input: z.infer<typeof startDaySchema>) {
  try {
    const ctx = await requireTenantContext();
    const result = await ReconciliationService.startDay(ctx, input);
    return { success: true, closing: result };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function closeDayAction(input: z.infer<typeof closeDaySchema>) {
  try {
    const ctx = await requireTenantContext();
    const result = await ReconciliationService.closeDay(ctx, input);
    return { success: true, closing: result };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function reopenDayAction(input: z.infer<typeof reopenDaySchema>) {
  try {
    const ctx = await requireTenantContext();
    const result = await ReconciliationService.reopenDay(ctx, input);
    return { success: true, closing: result };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function startShiftAction(input: StartShiftInput) {
  try {
    const ctx = await requireTenantContext();
    const shift = await ShiftService.startShift(ctx, input);
    return { success: true, shift };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function getCurrentShiftAction(cashierId?: string, registerId?: string) {
  try {
    const ctx = await requireTenantContext();
    const shift = await ShiftService.getCurrentShift(ctx, cashierId, registerId);
    return { success: true, shift };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function closeShiftAction(input: CloseShiftInput) {
  try {
    const ctx = await requireTenantContext();
    const shift = await ShiftService.closeShift(ctx, input);
    return { success: true, shift };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function coSignShiftAction(input: CoSignShiftInput) {
  try {
    const ctx = await requireTenantContext();
    const shift = await ShiftService.coSignShift(ctx, input);
    return { success: true, shift };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function getShiftHistoryAction(filters?: {
  cashierId?: string;
  registerId?: string;
  status?: "open" | "closed" | "locked";
  startDate?: string;
  endDate?: string;
}) {
  try {
    const ctx = await requireTenantContext();
    const shifts = await ShiftService.getShiftHistory(ctx, {
      ...filters,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
    });
    return { success: true, shifts };
  } catch (error) {
    return formatErrorResponse(error);
  }
}
