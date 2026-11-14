import { db } from "@/db";
import { shiftSessions, ShiftSession, NewShiftSession, notifications } from "@/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/security/errors";
import { AuditLogService } from "@/lib/audit/audit-service";
import {
  calculateExpectedCash,
  evaluateShiftVariance,
  ShiftVarianceEvaluation,
} from "./shift-calc";

export interface StartShiftInput {
  cashierId: string;
  cashierName: string;
  registerId?: string;
  openingFloat: number;
  notes?: string;
}

export interface CloseShiftInput {
  shiftId: string;
  actualCash: number;
  varianceReason?: string;
  notes?: string;
}

export interface CoSignShiftInput {
  shiftId: string;
  managerId: string;
  managerName: string;
  notes: string;
}

export interface ShiftCalculationResult {
  openingFloat: number;
  cashSales: number;
  cashPayouts: number;
  cashRepayments: number;
  digitalSales: number;
  expectedCash: number;
}

export class ShiftService {
  /**
   * Section 7: Expected cash calculation formula:
   * Expected cash includes opening float, cash sales and cash repayments, and subtracts cash payouts.
   */
  public static calculateExpectedCash(
    openingFloat: number,
    cashSales: number,
    cashRepayments: number,
    cashPayouts: number
  ): number {
    return calculateExpectedCash(openingFloat, cashSales, cashRepayments, cashPayouts);
  }

  /**
   * Section 3: Shift Shortage Rules Evaluator
   * - Any shortage requires a written note
   * - Shortages > ₦500 additionally lock the shift until a manager co-signs
   * - Shortages <= ₦500 close with a flag for review
   */
  public static evaluateShiftVariance(
    actualCash: number,
    expectedCash: number,
    note?: string,
    varianceReason?: string
  ): ShiftVarianceEvaluation {
    return evaluateShiftVariance(actualCash, expectedCash, note, varianceReason);
  }

  /**
   * Starts a new shift session
   */
  public static async startShift(
    ctx: TenantContext,
    input: StartShiftInput
  ): Promise<ShiftSession> {
    if (input.openingFloat < 0) {
      throw new ValidationError("Opening float cannot be negative.");
    }

    const registerId = input.registerId || "POS-01";

    // Check for open or locked shift on this register or cashier
    const existing = await db
      .select()
      .from(shiftSessions)
      .where(
        and(
          eq(shiftSessions.businessId, ctx.businessId),
          eq(shiftSessions.cashierId, input.cashierId),
          eq(shiftSessions.status, "open")
        )
      );

    if (existing.length > 0) {
      return existing[0];
    }

    const [newShift] = await db
      .insert(shiftSessions)
      .values({
        businessId: ctx.businessId,
        cashierId: input.cashierId,
        cashierName: input.cashierName,
        registerId,
        openingFloat: input.openingFloat.toFixed(2),
        expectedCash: input.openingFloat.toFixed(2),
        status: "open",
        notes: input.notes,
      })
      .returning();

    await AuditLogService.log({
      businessId: ctx.businessId,
      userId: ctx.userId,
      action: "shift.started",
      entityType: "shift_session",
      entityId: newShift.id,
      metadata: {
        cashierName: input.cashierName,
        registerId,
        openingFloat: input.openingFloat,
      },
    });

    return newShift;
  }

  /**
   * Retrieves active shift for a cashier or register
   */
  public static async getCurrentShift(
    ctx: TenantContext,
    cashierId?: string,
    registerId?: string
  ): Promise<ShiftSession | null> {
    const conditions = [
      eq(shiftSessions.businessId, ctx.businessId),
      sql`${shiftSessions.status} IN ('open', 'locked')`,
    ];

    if (cashierId) {
      conditions.push(eq(shiftSessions.cashierId, cashierId));
    }
    if (registerId) {
      conditions.push(eq(shiftSessions.registerId, registerId));
    }

    const [shift] = await db
      .select()
      .from(shiftSessions)
      .where(and(...conditions))
      .orderBy(desc(shiftSessions.startTime))
      .limit(1);

    return shift || null;
  }

  /**
   * Closes a shift via blind counting
   */
  public static async closeShift(
    ctx: TenantContext,
    input: CloseShiftInput
  ): Promise<ShiftSession> {
    const [shift] = await db
      .select()
      .from(shiftSessions)
      .where(
        and(
          eq(shiftSessions.businessId, ctx.businessId),
          eq(shiftSessions.id, input.shiftId)
        )
      );

    if (!shift) {
      throw new NotFoundError("Shift session not found.");
    }

    if (shift.status === "closed") {
      throw new ValidationError("Shift is already finalized and closed.");
    }

    const openingFloat = parseFloat(shift.openingFloat);
    const cashSales = parseFloat(shift.cashSales);
    const cashRepayments = parseFloat(shift.cashRepayments);
    const cashPayouts = parseFloat(shift.cashPayouts);

    const expectedCash = this.calculateExpectedCash(
      openingFloat,
      cashSales,
      cashRepayments,
      cashPayouts
    );

    const evaluation = this.evaluateShiftVariance(
      input.actualCash,
      expectedCash,
      input.notes,
      input.varianceReason
    );

    const [updatedShift] = await db
      .update(shiftSessions)
      .set({
        expectedCash: expectedCash.toFixed(2),
        actualCash: input.actualCash.toFixed(2),
        variance: evaluation.variance.toFixed(2),
        status: evaluation.status,
        varianceReason: input.varianceReason,
        notes: input.notes,
        endTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(shiftSessions.id, shift.id))
      .returning();

    // If shortage > ₦500 or discrepancy detected, send alert to manager/owner
    if (Math.abs(evaluation.variance) > 0.01) {
      await db.insert(notifications).values({
        businessId: ctx.businessId,
        userId: ctx.userId,
        type: "cash_discrepancy",
        title: evaluation.status === "locked" ? "CRITICAL: Shift Locked for Shortage" : "Shift Cash Discrepancy",
        message: `Register ${shift.registerId} closed by ${shift.cashierName} with a variance of ₦${evaluation.variance.toFixed(2)}. ${
          evaluation.status === "locked" ? "Shift is locked pending manager co-signature." : ""
        }`,
        entityType: "shift_session",
        entityId: shift.id,
      });
    }

    await AuditLogService.log({
      businessId: ctx.businessId,
      userId: ctx.userId,
      action: evaluation.status === "locked" ? "shift.locked" : "shift.closed",
      entityType: "shift_session",
      entityId: shift.id,
      metadata: {
        registerId: shift.registerId,
        cashierName: shift.cashierName,
        actualCash: input.actualCash,
        expectedCash,
        variance: evaluation.variance,
        status: evaluation.status,
      },
    });

    return updatedShift;
  }

  /**
   * Manager co-sign action: Unlocks a locked shift or co-signs an open discrepancy
   */
  public static async coSignShift(
    ctx: TenantContext,
    input: CoSignShiftInput
  ): Promise<ShiftSession> {
    // Only manager, store owner, or superadmin can co-sign
    const role = (ctx.roleName || "").toLowerCase();
    if (!["business_owner", "admin", "super_admin", "manager", "owner"].includes(role)) {
      throw new ForbiddenError("Only a store manager or owner can co-sign shift reconciliation.");
    }

    if (!input.notes || !input.notes.trim()) {
      throw new ValidationError("Manager co-signing requires a review note.");
    }

    const [shift] = await db
      .select()
      .from(shiftSessions)
      .where(
        and(
          eq(shiftSessions.businessId, ctx.businessId),
          eq(shiftSessions.id, input.shiftId)
        )
      );

    if (!shift) {
      throw new NotFoundError("Shift session not found.");
    }

    const [coSignedShift] = await db
      .update(shiftSessions)
      .set({
        status: "closed",
        managerCoSignId: input.managerId,
        managerCoSignName: input.managerName,
        managerCoSignedAt: new Date(),
        managerCoSignNotes: input.notes.trim(),
        updatedAt: new Date(),
      })
      .where(eq(shiftSessions.id, shift.id))
      .returning();

    await AuditLogService.log({
      businessId: ctx.businessId,
      userId: ctx.userId,
      action: "shift.co_signed",
      entityType: "shift_session",
      entityId: shift.id,
      metadata: {
        registerId: shift.registerId,
        cashierName: shift.cashierName,
        managerName: input.managerName,
        variance: shift.variance,
        notes: input.notes,
      },
    });

    return coSignedShift;
  }

  /**
   * Fetches shift history with filters
   */
  public static async getShiftHistory(
    ctx: TenantContext,
    filters?: {
      cashierId?: string;
      registerId?: string;
      status?: "open" | "closed" | "locked";
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ShiftSession[]> {
    const conditions = [eq(shiftSessions.businessId, ctx.businessId)];

    if (filters?.cashierId) {
      conditions.push(eq(shiftSessions.cashierId, filters.cashierId));
    }
    if (filters?.registerId) {
      conditions.push(eq(shiftSessions.registerId, filters.registerId));
    }
    if (filters?.status) {
      conditions.push(eq(shiftSessions.status, filters.status));
    }
    if (filters?.startDate) {
      conditions.push(gte(shiftSessions.startTime, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(shiftSessions.startTime, filters.endDate));
    }

    return db
      .select()
      .from(shiftSessions)
      .where(and(...conditions))
      .orderBy(desc(shiftSessions.startTime));
  }
}

