import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShiftService } from "../shift-service";
import { ValidationError, ForbiddenError } from "@/lib/security/errors";

describe("Phase 4: Shifts and Reconciliation Business Rules (Sections 3 & 7)", () => {
  describe("1. Expected Cash Formula (Section 7)", () => {
    it("should compute expected cash as openingFloat + cashSales + cashRepayments - cashPayouts", () => {
      const openingFloat = 25000;
      const cashSales = 150000;
      const cashRepayments = 12500;
      const cashPayouts = 4000;

      const expected = ShiftService.calculateExpectedCash(
        openingFloat,
        cashSales,
        cashRepayments,
        cashPayouts
      );

      // 25,000 + 150,000 + 12,500 - 4,000 = 183,500
      expect(expected).toBe(183500);
    });

    it("should handle zero payouts and fractional currency accurately with 2 decimals", () => {
      const expected = ShiftService.calculateExpectedCash(
        10000.50,
        25430.25,
        0,
        1500.00
      );

      expect(expected).toBe(33930.75);
    });
  });

  describe("2. Shift Shortage Rules (Section 3 Conflict Resolution)", () => {
    it("should close cleanly when actual cash exactly balances expected cash", () => {
      const result = ShiftService.evaluateShiftVariance(
        200000,
        200000
      );

      expect(result.variance).toBe(0);
      expect(result.status).toBe("closed");
      expect(result.requiresManagerCoSign).toBe(false);
      expect(result.flagForReview).toBe(false);
    });

    it("should close with review flag for cash overage without locking register", () => {
      const result = ShiftService.evaluateShiftVariance(
        201200,
        200000
      );

      expect(result.variance).toBe(1200);
      expect(result.status).toBe("closed");
      expect(result.requiresManagerCoSign).toBe(false);
      expect(result.flagForReview).toBe(true);
    });

    it("should strictly reject any cash shortage without a written explanation", () => {
      expect(() => {
        ShiftService.evaluateShiftVariance(
          199800, // Shortage of ₦200
          200000,
          "", // No note
          ""  // No reason
        );
      }).toThrowError(ValidationError);
    });

    it("should close with review flag if shortage is <= ₦500 and note is provided", () => {
      const result = ShiftService.evaluateShiftVariance(
        199700, // Shortage of ₦300
        200000,
        "Customer ₦300 coin change shortage",
        "Customer change rounding error"
      );

      expect(result.variance).toBe(-300);
      expect(result.status).toBe("closed");
      expect(result.requiresManagerCoSign).toBe(false);
      expect(result.flagForReview).toBe(true);
    });

    it("should LOCK shift if shortage exceeds ₦500, requiring manager co-signature", () => {
      const result = ShiftService.evaluateShiftVariance(
        197500, // Shortage of ₦2,500 (> ₦500)
        200000,
        "Petty cash missing from drawer during count",
        "Suspected theft / loss"
      );

      expect(result.variance).toBe(-2500);
      expect(result.status).toBe("locked");
      expect(result.requiresManagerCoSign).toBe(true);
      expect(result.flagForReview).toBe(true);
    });
  });

  describe("3. Manager Co-Signature and Role Guard", () => {
    it("should reject co-signing without a review note", async () => {
      const mockManagerCtx = {
        businessId: "biz-111",
        userId: "usr-mgr",
        roleName: "admin",
        permissions: ["reconciliation.perform"],
      };

      await expect(
        ShiftService.coSignShift(mockManagerCtx as any, {
          shiftId: "shift-123",
          managerId: "usr-mgr",
          managerName: "Chinedu Obi",
          notes: "", // Empty notes
        })
      ).rejects.toThrowError(ValidationError);
    });

    it("should reject cashier attempting to co-sign their own shift", async () => {
      const mockCashierCtx = {
        businessId: "biz-111",
        userId: "usr-cashier",
        roleName: "cashier",
        permissions: ["reconciliation.view"],
      };

      await expect(
        ShiftService.coSignShift(mockCashierCtx as any, {
          shiftId: "shift-123",
          managerId: "usr-cashier",
          managerName: "Adaeze Okon",
          notes: "Approved by myself",
        })
      ).rejects.toThrowError(ForbiddenError);
    });
  });
});

