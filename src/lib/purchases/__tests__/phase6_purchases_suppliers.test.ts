import { describe, it, expect } from "vitest";
import { PurchaseCalc } from "../purchase-calc";

describe("Phase 6: Purchases and Suppliers Business Rules (Sections 6 & 7)", () => {
  describe("1. Landed Cost Distribution by Item Value (Section 6.1)", () => {
    it("should distribute freight and handling proportionally across items based on base value", () => {
      const items = [
        { productId: "prod-1", quantity: 200, unitCost: 550 }, // Base Value = 110,000 (22%)
        { productId: "prod-2", quantity: 150, unitCost: 1200 }, // Base Value = 180,000 (36%)
        { productId: "prod-3", quantity: 10, unitCost: 21000 }, // Base Value = 210,000 (42%)
      ];
      // Total Base Value = 110,000 + 180,000 + 210,000 = 500,000

      const freight = 35000;
      const otherFees = 15000;
      // Total Landed Additions = 50,000 (10% of total value)

      const result = PurchaseCalc.distributeLandedCosts(items, freight, otherFees);

      expect(result.totalBaseValue).toBe(500000);
      expect(result.totalLandedAdditions).toBe(50000);
      expect(result.grandTotal).toBe(550000);

      // Item 1 (22% of 50,000 = 11,000 allocated fee -> 11,000 / 200 = 55 per unit)
      expect(result.items[0].allocatedFee).toBe(11000);
      expect(result.items[0].landedUnitCost).toBe(605.00); // 550 + 55
      expect(result.items[0].landedTotal).toBe(121000);

      // Item 2 (36% of 50,000 = 18,000 allocated fee -> 18,000 / 150 = 120 per unit)
      expect(result.items[1].allocatedFee).toBe(18000);
      expect(result.items[1].landedUnitCost).toBe(1320.00); // 1200 + 120
      expect(result.items[1].landedTotal).toBe(198000);

      // Item 3 (42% of 50,000 = 21,000 allocated fee -> 21,000 / 10 = 2100 per unit)
      expect(result.items[2].allocatedFee).toBe(21000);
      expect(result.items[2].landedUnitCost).toBe(23100.00); // 21,000 + 2,100
      expect(result.items[2].landedTotal).toBe(231000);
    });

    it("should handle zero freight and fees gracefully without altering base unit cost", () => {
      const items = [{ productId: "prod-1", quantity: 50, unitCost: 1000 }];
      const result = PurchaseCalc.distributeLandedCosts(items, 0, 0);

      expect(result.totalLandedAdditions).toBe(0);
      expect(result.items[0].landedUnitCost).toBe(1000);
      expect(result.items[0].allocatedFee).toBe(0);
    });
  });

  describe("2. Weighted Average Cost Recalculation on Intake (Section 4.1 & 7)", () => {
    it("should compute WAC with single-pass final rounding", () => {
      const currentStock = 100;
      const currentWAC = 500; // Val = 50,000
      const receivedQty = 50;
      const landedUnitCost = 650; // Val = 32,500
      // Total Val = 82,500 / 150 = 550.00

      const newWAC = PurchaseCalc.recalculateWAC(
        currentStock,
        currentWAC,
        receivedQty,
        landedUnitCost
      );

      expect(newWAC).toBe(550.00);
    });

    it("should reset WAC to landed cost when current stock is zero or negative", () => {
      const newWAC = PurchaseCalc.recalculateWAC(
        0, // Empty stock
        500, // Old stale WAC
        100, // Intake qty
        620.50 // New landed cost
      );

      expect(newWAC).toBe(620.50);
    });

    it("should preserve current WAC when received quantity is zero", () => {
      const unchangedWAC = PurchaseCalc.recalculateWAC(100, 500, 0, 700);
      expect(unchangedWAC).toBe(500);
    });
  });

  describe("3. Purchase Order Status Determination", () => {
    it("should identify ordered status when zero units received", () => {
      const status = PurchaseCalc.determineOrderStatus([
        { quantityOrdered: 100, quantityReceived: 0 },
        { quantityOrdered: 50, quantityReceived: 0 },
      ]);
      expect(status).toBe("ordered");
    });

    it("should identify partial status when some but not all units received", () => {
      const status = PurchaseCalc.determineOrderStatus([
        { quantityOrdered: 100, quantityReceived: 100 },
        { quantityOrdered: 50, quantityReceived: 20 },
      ]);
      expect(status).toBe("partial");
    });

    it("should identify received status when all units delivered", () => {
      const status = PurchaseCalc.determineOrderStatus([
        { quantityOrdered: 100, quantityReceived: 100 },
        { quantityOrdered: 50, quantityReceived: 50 },
      ]);
      expect(status).toBe("received");
    });
  });
});

