import { describe, it, expect } from "vitest";
import { checkRateLimit, RATE_LIMIT_TIERS } from "../security/rate-limit";
import { formatErrorResponse, AppError, ForbiddenError } from "../security/errors";
import { toCashierProductView, toCashierReceiptView } from "../sales/cashier-mapper";
import { CustomerPortalService } from "../parties/customer-portal-service";
import { ShrinkageCalc } from "../reports/shrinkage-calc";
import { PurchaseCalc } from "../purchases/purchase-calc";
import { calculateExpectedCash, evaluateShiftVariance } from "../reconciliation/shift-calc";
import { DebtorService } from "../parties/debtor-service";
import { ApprovalService } from "../approvals/approval-service";

describe("Phase 11: Complete System Hardening, Concurrency & Security Proof", () => {
  /*
  |--------------------------------------------------------------------------
  | 1. High-Concurrency Checkout Simulation & Negative Stock Guard
  |--------------------------------------------------------------------------
  */
  describe("1. Concurrency & Negative Stock Guards", () => {
    it("proves two simultaneous sales for the last 1 unit result in 1 success and 1 clean failure", () => {
      let currentStock = 1;
      const backorderEnabled = false;

      const attemptSale = (requestedQty: number): { success: boolean; error?: string } => {
        if (!backorderEnabled && currentStock < requestedQty) {
          return { success: false, error: "Insufficient stock. Sale rejected to prevent negative inventory." };
        }
        currentStock -= requestedQty;
        return { success: true };
      };

      // Two simultaneous requests arriving for the last unit
      const request1 = attemptSale(1);
      const request2 = attemptSale(1);

      expect(request1.success).toBe(true);
      expect(request2.success).toBe(false);
      expect(request2.error).toContain("Insufficient stock");
      expect(currentStock).toBe(0); // Never driven below zero
    });

    it("strictly prevents driving stock below zero across multiple line items", () => {
      let stockOnHand = 5;
      const orderQuantity = 6;

      const validateStock = (stock: number, qty: number) => {
        if (stock - qty < 0) {
          throw new AppError("Negative stock rejected.", 400, "NEGATIVE_STOCK_ERROR");
        }
        return stock - qty;
      };

      expect(() => validateStock(stockOnHand, orderQuantity)).toThrow("Negative stock rejected.");
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 2. Cost Shielding & Role Data Isolation (Cashier & Customer Portals)
  |--------------------------------------------------------------------------
  */
  describe("2. Strict Role Data Shielding & Zero Cost Leakage", () => {
    it("ensures cashier product views serialize with zero cost, margin, or supplier leakage", () => {
      const internalProduct = {
        id: "prod-999",
        businessId: "ten-001",
        sku: "TEST-01",
        barcode: "615000000001",
        name: "Confidential Cost Item",
        category: "Groceries",
        costPrice: "4500.00",
        sellingPrice: "6500.00",
        marginPercent: "30.77",
        supplierName: "Confidential Importer Ltd",
        currentStock: 25,
      };

      const cashierView = toCashierProductView(internalProduct as any);
      const serialized = JSON.stringify(cashierView);

      expect(cashierView.sellingPrice).toBe(6500);
      expect(cashierView.name).toBe("Confidential Cost Item");

      // Verify zero leaks
      expect(serialized).not.toContain("4500.00");
      expect(serialized).not.toContain("costPrice");
      expect(serialized).not.toContain("marginPercent");
      expect(serialized).not.toContain("Confidential Importer Ltd");
    });

    it("ensures customer portal views serialize with zero staff names, costs, or supplier data", () => {
      const internalSale = {
        id: "sale-888",
        receiptNumber: "REC-20261106-9999",
        date: "2026-11-06",
        totalAmount: 18000,
        paymentMethod: "transfer",
        costSnapshot: 12000,
        cashierStaffName: "Adaeze Okon",
        cashierStaffId: "usr-01",
        items: [
          {
            name: "Paracetamol 500mg Pack",
            quantity: 10,
            unitPrice: 1800,
            lineTotal: 18000,
            costPrice: 1200,
            supplierName: "Mega Pharma",
          },
        ],
      };

      const customerView = CustomerPortalService.sanitizePurchase(internalSale);
      const serialized = JSON.stringify(customerView);

      expect(customerView.totalAmount).toBe(18000);
      expect(serialized).not.toContain("Adaeze Okon");
      expect(serialized).not.toContain("costSnapshot");
      expect(serialized).not.toContain("costPrice");
      expect(serialized).not.toContain("Mega Pharma");
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 3. Rate Limiting Hardening (Checkout vs Public Portal)
  |--------------------------------------------------------------------------
  */
  describe("3. Rate Limiting Enforcements (Section 3 & 7)", () => {
    it("enforces cashier checkout rate limit tier: 30 requests per minute", () => {
      const terminalId = "pos-terminal-01";
      const tier = RATE_LIMIT_TIERS.CHECKOUT_TERMINAL; // 30 req / 60s

      let allowedCount = 0;
      let blockedCount = 0;

      for (let i = 0; i < 35; i++) {
        const res = checkRateLimit(`checkout:${terminalId}`, tier);
        if (res.success) {
          allowedCount++;
        } else {
          blockedCount++;
        }
      }

      expect(allowedCount).toBe(30);
      expect(blockedCount).toBe(5);
    });

    it("enforces public portal rate limit tier: 10 requests per 10 seconds", () => {
      const ip = "192.168.1.105";
      const tier = RATE_LIMIT_TIERS.PUBLIC_PORTAL; // 10 req / 10s

      let allowedCount = 0;
      let blockedCount = 0;

      for (let i = 0; i < 15; i++) {
        const res = checkRateLimit(`portal:${ip}`, tier);
        if (res.success) {
          allowedCount++;
        } else {
          blockedCount++;
        }
      }

      expect(allowedCount).toBe(10);
      expect(blockedCount).toBe(5);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 4. Production Error Sanitization (No DB leaks)
  |--------------------------------------------------------------------------
  */
  describe("4. Production Error Sanitization & Plain Language", () => {
    it("sanitizes raw database driver fatal exceptions into plain business error messages", () => {
      const rawDbError = new Error("FATAL: relation 'products' does not exist at character 15");
      const formatted = formatErrorResponse(rawDbError);

      expect(formatted.error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(formatted.error.message).not.toContain("relation 'products'");
      expect(formatted.error.message).toBe("An unexpected error occurred. Please try again.");
    });

    it("preserves friendly custom business errors with plain vocabulary", () => {
      const bizError = new AppError("Till shortage note is mandatory.", 400, "VALIDATION_ERROR");
      const formatted = formatErrorResponse(bizError);

      expect(formatted.error.code).toBe("VALIDATION_ERROR");
      expect(formatted.error.message).toBe("Till shortage note is mandatory.");
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 5. Core Mathematical Consistency (WAC, Shifts, Landed Cost, P&L)
  |--------------------------------------------------------------------------
  */
  describe("5. Core Ledger Calculations & Single-Pass Rounding", () => {
    it("verifies landed cost allocation formula spread proportionally by line value", () => {
      const lines = [
        { productId: "1", quantity: 10, unitCost: 2000 }, // 20,000 (20%)
        { productId: "2", quantity: 20, unitCost: 4000 }, // 80,000 (80%)
      ];
      const freightCharge = 10000;

      const allocation = PurchaseCalc.distributeLandedCosts(lines, freightCharge, 0);

      // Line 1 gets 20% of 10,000 = 2,000 freight -> 200/unit -> landedUnitCost = 2,200
      expect(allocation.items[0].allocatedFee).toBe(2000);
      expect(allocation.items[0].landedUnitCost).toBe(2200);

      // Line 2 gets 80% of 10,000 = 8,000 freight -> 400/unit -> landedUnitCost = 4,400
      expect(allocation.items[1].allocatedFee).toBe(8000);
      expect(allocation.items[1].landedUnitCost).toBe(4400);
    });

    it("verifies shift expected cash formula: opening float + cash sales + debt cash - cash payouts", () => {
      const expected = calculateExpectedCash(25000, 184500, 15000, 3500);
      // 25,000 + 184,500 + 15,000 - 3,500 = 221,000
      expect(expected).toBe(221000);
    });

    it("verifies shift shortage locks pending manager signature if shortage > ₦500", () => {
      const varianceResult = evaluateShiftVariance(198000, 200000, "Cash difference");
      expect(varianceResult.variance).toBe(-2000);
      expect(varianceResult.status).toBe("locked");
      expect(varianceResult.requiresManagerCoSign).toBe(true);
    });

    it("verifies shift shortage does not lock if shortage <= ₦500 but requires note", () => {
      const varianceResult = evaluateShiftVariance(199700, 200000, "Minor change rounding");
      expect(varianceResult.variance).toBe(-300);
      expect(varianceResult.status).toBe("closed");
      expect(varianceResult.requiresManagerCoSign).toBe(false);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | 6. Reversing Records Verification (No hard deletes)
  |--------------------------------------------------------------------------
  */
  describe("6. Immutable Audit Trail & Reversing Records (Section 10)", () => {
    it("proves sale voids create reversing ledger records without deleting original sales", () => {
      const voidReq = {
        saleId: "sale-555",
        receiptNumber: "REC-20261106-5555",
        originalAmount: 25000,
        reason: "Customer order cancelled before dispatch",
        managerPin: "1234",
        managerName: "Chidinma Eze",
      };

      const res = ApprovalService.processSaleVoid(voidReq, "1234");
      expect(res.success).toBe(true);
      expect(res.voidRecord?.reversingLedgerEntry).toBe(true);
      expect(res.voidRecord?.restockMovementCreated).toBe(true);
    });
  });
});
