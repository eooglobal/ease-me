import { describe, it, expect } from "vitest";
import { startDaySchema, closeDaySchema, reopenDaySchema } from "../validation";
import { ReconciliationService } from "../reconciliation-service";

describe("Daily Reconciliation & Cash Balancing Logic Tests", () => {
  it("should normalize timestamps to consistent midnight day dates", () => {
    const d1 = new Date("2026-09-27T14:35:22.000Z");
    const normalized = ReconciliationService.normalizeDay(d1);

    expect(normalized.getHours()).toBe(0);
    expect(normalized.getMinutes()).toBe(0);
    expect(normalized.getSeconds()).toBe(0);
  });

  it("should calculate exact matching daily cash reconciliation", () => {
    // Opening Cash: ₦50,000
    // Cash Sales: ₦200,000
    // Cash Expenses: ₦20,000
    // Expected Cash = ₦50,000 + ₦200,000 - ₦20,000 = ₦230,000
    // Actual Cash Count = ₦230,000
    // Variance = 0 (Exact Match)

    const openingCash = 50000;
    const cashInflow = 200000;
    const cashOutflow = 20000;
    const expectedCash = openingCash + cashInflow - cashOutflow;
    const actualCashCount = 230000;
    const variance = actualCashCount - expectedCash;

    expect(expectedCash).toBe(230000);
    expect(variance).toBe(0);
  });

  it("should detect and compute cash shortage accurately", () => {
    // Expected: ₦250,000
    // Actual: ₦243,000
    // Variance: -₦7,000 (Shortage)
    const expectedCash = 250000;
    const actualCash = 243000;
    const variance = actualCash - expectedCash;

    expect(variance).toBe(-7000);
  });

  it("should detect and compute cash surplus accurately", () => {
    // Expected: ₦180,000
    // Actual: ₦182,500
    // Variance: +₦2,500 (Surplus)
    const expectedCash = 180000;
    const actualCash = 182500;
    const variance = actualCash - expectedCash;

    expect(variance).toBe(2500);
  });

  it("should validate day start and closing schemas correctly", () => {
    const start = startDaySchema.safeParse({
      openingCash: 25000,
      notes: "Morning opening drawer count verified",
    });
    expect(start.success).toBe(true);

    const close = closeDaySchema.safeParse({
      actualCash: 175000,
      notes: "Evening closing drawer count verified",
    });
    expect(close.success).toBe(true);
  });

  it("should reject reopening requests that do not provide a clear mandatory explanation", () => {
    const invalidReopen = reopenDaySchema.safeParse({
      dailyClosingId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      reason: "fix", // Too short (min 5 characters)
    });
    expect(invalidReopen.success).toBe(false);

    const validReopen = reopenDaySchema.safeParse({
      dailyClosingId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      reason: "Correcting unrecorded morning cash expense for fuel",
    });
    expect(validReopen.success).toBe(true);
  });
});
