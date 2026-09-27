import { db } from "@/db";
import {
  dailyClosings,
  dailyClosingEntries,
  financialTransactions,
  auditLogs,
  notifications,
} from "@/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { NotFoundError, ValidationError, ForbiddenError } from "@/lib/security/errors";
import { startDaySchema, closeDaySchema, reopenDaySchema } from "./validation";
import { z } from "zod";

export class ReconciliationService {
  /**
   * Normalizes any timestamp to midnight (00:00:00.000) for consistent daily records
   */
  public static normalizeDay(date: Date = new Date()): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  public static getDayBounds(date: Date = new Date()): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Asserts that the specified date is not inside a closed financial day.
   * Throws ForbiddenError if mutations are attempted on a closed day.
   */
  static async assertFinancialDayOpen(ctx: TenantContext, transactionDate: Date = new Date()): Promise<void> {
    const day = this.normalizeDay(transactionDate);

    const [closing] = await db
      .select()
      .from(dailyClosings)
      .where(
        and(
          eq(dailyClosings.businessId, ctx.businessId),
          eq(dailyClosings.businessDate, day)
        )
      );

    if (closing && closing.status === "closed") {
      throw new ForbiddenError(
        `Financial activity on ${day.toISOString().slice(0, 10)} cannot be modified because the day has been reconciled and closed.`
      );
    }
  }

  /**
   * Starts a business day or retrieves existing record
   */
  static async startDay(ctx: TenantContext, input: z.infer<typeof startDaySchema>) {
    requirePermission(ctx, "reconciliation.perform");
    const validated = startDaySchema.parse(input);

    const businessDate = this.normalizeDay(
      validated.businessDate ? new Date(validated.businessDate) : new Date()
    );

    const [existing] = await db
      .select()
      .from(dailyClosings)
      .where(
        and(
          eq(dailyClosings.businessId, ctx.businessId),
          eq(dailyClosings.businessDate, businessDate)
        )
      );

    if (existing) {
      return existing;
    }

    const [newClosing] = await db
      .insert(dailyClosings)
      .values({
        businessId: ctx.businessId,
        businessDate,
        openingCash: validated.openingCash.toString(),
        expectedCash: validated.openingCash.toString(),
        status: "open",
        notes: validated.notes,
      })
      .returning();

    return newClosing;
  }

  /**
   * Computes the real-time expected cash position for a business date
   */
  static async calculateDailyExpectedCash(
    ctx: TenantContext,
    date: Date = new Date()
  ): Promise<{
    openingCash: number;
    cashSales: number;
    customerDebtCash: number;
    totalCashInflows: number;
    cashExpenses: number;
    supplierCashPayments: number;
    totalCashOutflows: number;
    expectedCash: number;
    digitalSales: number;
  }> {
    requirePermission(ctx, "reconciliation.view");

    const businessDate = this.normalizeDay(date);
    const { start, end } = this.getDayBounds(businessDate);

    // 1. Fetch closing record for opening cash
    const [closing] = await db
      .select()
      .from(dailyClosings)
      .where(
        and(
          eq(dailyClosings.businessId, ctx.businessId),
          eq(dailyClosings.businessDate, businessDate)
        )
      );

    const openingCash = closing ? parseFloat(closing.openingCash) : 0;

    // 2. Cash Inflows in the day
    const [cashInRes] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${financialTransactions.amount}), 0)`,
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.businessId, ctx.businessId),
          eq(financialTransactions.direction, "in"),
          eq(financialTransactions.accountType, "cash"),
          gte(financialTransactions.transactionDate, start),
          lte(financialTransactions.transactionDate, end)
        )
      );

    // 3. Cash Outflows in the day
    const [cashOutRes] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${financialTransactions.amount}), 0)`,
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.businessId, ctx.businessId),
          eq(financialTransactions.direction, "out"),
          eq(financialTransactions.accountType, "cash"),
          gte(financialTransactions.transactionDate, start),
          lte(financialTransactions.transactionDate, end)
        )
      );

    // 4. Digital payments in the day (Bank + Card)
    const [digitalRes] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${financialTransactions.amount}), 0)`,
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.businessId, ctx.businessId),
          eq(financialTransactions.direction, "in"),
          sql`${financialTransactions.accountType} IN ('bank', 'card')`,
          gte(financialTransactions.transactionDate, start),
          lte(financialTransactions.transactionDate, end)
        )
      );

    const totalCashInflows = parseFloat(cashInRes?.total || "0");
    const totalCashOutflows = parseFloat(cashOutRes?.total || "0");
    const digitalSales = parseFloat(digitalRes?.total || "0");
    const expectedCash = openingCash + totalCashInflows - totalCashOutflows;

    return {
      openingCash,
      cashSales: totalCashInflows,
      customerDebtCash: 0,
      totalCashInflows,
      cashExpenses: totalCashOutflows,
      supplierCashPayments: 0,
      totalCashOutflows,
      expectedCash,
      digitalSales,
    };
  }

  /**
   * Reconciles the day: compares actual counted cash with expected cash, creates entries snapshot, locks day
   */
  static async closeDay(ctx: TenantContext, input: z.infer<typeof closeDaySchema>) {
    requirePermission(ctx, "reconciliation.close");
    const validated = closeDaySchema.parse(input);

    const businessDate = this.normalizeDay(
      validated.businessDate ? new Date(validated.businessDate) : new Date()
    );

    return db.transaction(async (tx) => {
      // 1. Fetch or create the daily closing
      let [closing] = await tx
        .select()
        .from(dailyClosings)
        .where(
          and(
            eq(dailyClosings.businessId, ctx.businessId),
            eq(dailyClosings.businessDate, businessDate)
          )
        );

      if (!closing) {
        [closing] = await tx
          .insert(dailyClosings)
          .values({
            businessId: ctx.businessId,
            businessDate,
            openingCash: "0",
            status: "open",
          })
          .returning();
      }

      if (closing.status === "closed") {
        throw new ValidationError("This business day is already closed.");
      }

      // 2. Compute expected figures
      const calc = await this.calculateDailyExpectedCash(ctx, businessDate);
      const actualCash = validated.actualCash;
      const cashVariance = actualCash - calc.expectedCash;

      // 3. Update closing record to closed
      const [closedRecord] = await tx
        .update(dailyClosings)
        .set({
          expectedCash: calc.expectedCash.toString(),
          actualCash: actualCash.toString(),
          cashVariance: cashVariance.toString(),
          status: "closed",
          closedBy: ctx.userId,
          closedAt: new Date(),
          notes: validated.notes,
          updatedAt: new Date(),
        })
        .where(eq(dailyClosings.id, closing.id))
        .returning();

      // 4. Insert Snapshot Entries
      await tx.insert(dailyClosingEntries).values([
        {
          dailyClosingId: closing.id,
          entryType: "OPENING_CASH",
          amount: calc.openingCash.toString(),
          description: "Opening cash balance",
        },
        {
          dailyClosingId: closing.id,
          entryType: "CASH_INFLOWS",
          amount: calc.totalCashInflows.toString(),
          description: "Recorded cash inflows",
        },
        {
          dailyClosingId: closing.id,
          entryType: "CASH_OUTFLOWS",
          amount: calc.totalCashOutflows.toString(),
          description: "Recorded cash outflows",
        },
        {
          dailyClosingId: closing.id,
          entryType: "DIGITAL_COLLECTIONS",
          amount: calc.digitalSales.toString(),
          description: "Recorded bank & card digital collections",
        },
        {
          dailyClosingId: closing.id,
          entryType: "ACTUAL_COUNT",
          amount: actualCash.toString(),
          description: "Physical cash count at closing",
        },
      ]);

      // 5. If discrepancy detected, alert owner
      if (Math.abs(cashVariance) > 0.01) {
        await tx.insert(notifications).values({
          businessId: ctx.businessId,
          userId: ctx.userId,
          type: "cash_discrepancy",
          title: "Cash Reconciliation Discrepancy",
          message: `Day ${businessDate.toISOString().slice(0, 10)} closed with a variance of ₦${cashVariance.toFixed(2)} (Expected: ₦${calc.expectedCash.toFixed(2)}, Actual: ₦${actualCash.toFixed(2)}).`,
          entityType: "daily_closing",
          entityId: closing.id,
        });
      }

      // 6. Audit Log
      await tx.insert(auditLogs).values({
        businessId: ctx.businessId,
        userId: ctx.userId,
        action: "DAILY_CLOSING_COMPLETED",
        entityType: "daily_closing",
        entityId: closing.id,
        newValues: {
          expectedCash: calc.expectedCash,
          actualCash,
          cashVariance,
          status: "closed",
        },
        metadata: {
          notes: validated.notes,
        },
      });

      return {
        closing: closedRecord,
        breakdown: calc,
        actualCash,
        cashVariance,
      };
    });
  }

  /**
   * Reopens a closed financial day. Requires reconciliation.reopen permission, mandatory reason, and audit logging.
   */
  static async reopenDay(ctx: TenantContext, input: z.infer<typeof reopenDaySchema>) {
    requirePermission(ctx, "reconciliation.reopen");
    const validated = reopenDaySchema.parse(input);

    return db.transaction(async (tx) => {
      const [closing] = await tx
        .select()
        .from(dailyClosings)
        .where(
          and(
            eq(dailyClosings.id, validated.dailyClosingId),
            eq(dailyClosings.businessId, ctx.businessId)
          )
        );

      if (!closing) {
        throw new NotFoundError("Daily closing record");
      }

      if (closing.status !== "closed") {
        throw new ValidationError(`Daily closing is not closed (current status: '${closing.status}').`);
      }

      const [reopened] = await tx
        .update(dailyClosings)
        .set({
          status: "reopened",
          reopenedBy: ctx.userId,
          reopenedAt: new Date(),
          reopenReason: validated.reason,
          updatedAt: new Date(),
        })
        .where(eq(dailyClosings.id, closing.id))
        .returning();

      // Audit Log
      await tx.insert(auditLogs).values({
        businessId: ctx.businessId,
        userId: ctx.userId,
        action: "DAILY_CLOSING_REOPENED",
        entityType: "daily_closing",
        entityId: closing.id,
        oldValues: { status: "closed" },
        newValues: { status: "reopened", reopenReason: validated.reason },
      });

      return reopened;
    });
  }

  /**
   * Retrieves list of daily closing records
   */
  static async listClosings(ctx: TenantContext, limit: number = 30) {
    requirePermission(ctx, "reconciliation.view");

    return db
      .select()
      .from(dailyClosings)
      .where(eq(dailyClosings.businessId, ctx.businessId))
      .orderBy(desc(dailyClosings.businessDate))
      .limit(limit);
  }
}
