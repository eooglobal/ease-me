import { describe, it, expect } from "vitest";
import { DebtorService } from "../debtor-service";

describe("Phase 5: Customers and Debts Business Rules (Section 7)", () => {
  describe("1. Available Credit Headroom Calculation", () => {
    it("should compute available headroom as Credit Limit - Current Balance", () => {
      const creditLimit = 250000;
      const currentBalance = 142000;

      const headroom = DebtorService.calculateHeadroom(creditLimit, currentBalance);
      expect(headroom).toBe(108000);
    });

    it("should never return negative headroom if balance exceeds credit limit", () => {
      const creditLimit = 100000;
      const currentBalance = 125000; // Over limit

      const headroom = DebtorService.calculateHeadroom(creditLimit, currentBalance);
      expect(headroom).toBe(0);
    });

    it("should allow credit sale within headroom", () => {
      const check = DebtorService.canExtendCredit(
        200000, // Limit
        120000, // Balance (80k headroom)
        50000   // New sale
      );

      expect(check.allowed).toBe(true);
      expect(check.headroom).toBe(80000);
      expect(check.projectedBalance).toBe(170000);
      expect(check.excessAmount).toBe(0);
    });

    it("should reject credit sale exceeding headroom without manager override", () => {
      const check = DebtorService.canExtendCredit(
        200000, // Limit
        170000, // Balance (30k headroom)
        50000   // New sale (exceeds by 20k)
      );

      expect(check.allowed).toBe(false);
      expect(check.headroom).toBe(30000);
      expect(check.projectedBalance).toBe(220000);
      expect(check.excessAmount).toBe(20000);
    });
  });

  describe("2. Due Date Calculation from Customer Terms", () => {
    it("should compute due date as Transaction Date + Terms Days", () => {
      const txDate = new Date("2026-11-01T10:00:00Z");
      const termsDays = 14;

      const dueDate = DebtorService.calculateDueDate(txDate, termsDays);
      expect(dueDate.toISOString().slice(0, 10)).toBe("2026-11-15");
    });

    it("should handle 30-day terms across month boundaries", () => {
      const txDate = new Date("2026-10-15T10:00:00Z");
      const termsDays = 30;

      const dueDate = DebtorService.calculateDueDate(txDate, termsDays);
      expect(dueDate.toISOString().slice(0, 10)).toBe("2026-11-14");
    });
  });

  describe("3. Debtor Aging Schedule Bucketing", () => {
    it("should accurately bucket debts into Current, 1-30d, 31-60d, and Over 60d", () => {
      const asOf = new Date("2026-11-06T12:00:00Z");

      const debts = [
        { amount: 50000, dueDate: new Date("2026-11-10T00:00:00Z") }, // Current (due in future)
        { amount: 30000, dueDate: new Date("2026-10-25T00:00:00Z") }, // 12 days overdue (1-30d)
        { amount: 45000, dueDate: new Date("2026-09-20T00:00:00Z") }, // 47 days overdue (31-60d)
        { amount: 70000, dueDate: new Date("2026-08-01T00:00:00Z") }, // 97 days overdue (>60d)
      ];

      const buckets = DebtorService.calculateAgingBuckets(debts, asOf);

      expect(buckets.current).toBe(50000);
      expect(buckets.days1To30).toBe(30000);
      expect(buckets.days31To60).toBe(45000);
      expect(buckets.over60Days).toBe(70000);
      expect(buckets.totalOutstanding).toBe(195000);
    });
  });

  describe("4. WhatsApp Statement Generation", () => {
    it("should generate professional Nigerian retail reminder statement text", () => {
      const text = DebtorService.generateWhatsAppStatementText({
        customerName: "Alhaji Musa",
        businessName: "Alpha Supermarket",
        outstandingBalance: 142000,
        dueDate: "Nov 15, 2026",
        bankName: "Moniepoint MFB",
        accountNumber: "8035551204",
      });

      expect(text).toContain("Hello Alhaji Musa");
      expect(text).toContain("*Alpha Supermarket*");
      expect(text).toContain("₦142,000.00");
      expect(text).toContain("Due date: Nov 15, 2026");
      expect(text).toContain("Moniepoint MFB");
      expect(text).toContain("8035551204");
    });

    it("should format WhatsApp deep link URI correctly with country code", () => {
      const link = DebtorService.buildWhatsAppLink("08035551204", "Test reminder message");
      expect(link).toContain("https://wa.me/2348035551204?text=Test%20reminder%20message");
    });
  });
});

