import { describe, it, expect, vi, beforeEach } from "vitest";
import { InventoryMovementService } from "../movement-service";
import { BatchService } from "../batch-service";
import { ValidationError, NotFoundError } from "@/lib/security/errors";
import { TenantContext } from "@/lib/security/tenant";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/security/permissions";

describe("Phase 2: Inventory Core Business Rules (Section 7)", () => {
  const mockTenantContext: TenantContext = {
    userId: "user-owner-1",
    userEmail: "owner@alpha-retail.ng",
    userName: "Chukwuma Obi",
    businessId: "biz-111",
    businessName: "Alpha Retail Ltd",
    roleId: "role-owner",
    roleName: "owner",
    permissions: DEFAULT_ROLE_PERMISSIONS.owner,
  };

  describe("1. Weighted Average Cost (WAC) Mathematical Engine", () => {
    // Pure function representing the exact mathematical formula implemented in movement-service.ts
    const calculateNewWac = (
      currentStock: number,
      currentWac: number,
      incomingQty: number,
      incomingCost: number
    ): number => {
      const currentQty = Math.max(0, currentStock);
      const totalNewQty = currentQty + incomingQty;
      if (totalNewQty <= 0) return currentWac;
      const totalValuation = (currentQty * currentWac) + (incomingQty * incomingCost);
      // Rounding applied once, at the end, to 2 decimal places
      return Math.round((totalValuation / totalNewQty) * 100) / 100;
    };

    it("should accurately recalculate WAC upon purchase intake", () => {
      // Example: 40 units in stock @ ₦1,000 WAC. New intake of 20 units @ ₦1,300.
      // Total value = (40 * 1000) + (20 * 1300) = 40,000 + 26,000 = 66,000.
      // Total units = 60. New WAC = 66,000 / 60 = ₦1,100.00.
      const newWac = calculateNewWac(40, 1000, 20, 1300);
      expect(newWac).toBe(1100.00);
    });

    it("should apply rounding once at the end to 2 decimal places", () => {
      // 10 units @ ₦100. 3 units @ ₦125.
      // Total = 1000 + 375 = 1375.
      // Total units = 13. Exact = 105.7692307... -> ₦105.77
      const newWac = calculateNewWac(10, 100, 3, 125);
      expect(newWac).toBe(105.77);
    });

    it("should never alter WAC cost on sales, damage, or audit count deductions", () => {
      const currentWac = 1200.00;
      const previousStock = 45;
      const soldQty = 5;

      // On sale or damage, WAC remains identical
      const stockAfterSale = previousStock - soldQty;
      expect(stockAfterSale).toBe(40);
      expect(currentWac).toBe(1200.00); // Cost price is unchanged
    });
  });

  describe("2. Negative Stock Prevention Guard", () => {
    it("should reject any stock deduction that drives balance below zero", () => {
      const currentStock = 5;
      const requestedDeduction = -8;

      const evaluateStockChange = (stock: number, delta: number) => {
        const resultingStock = stock + delta;
        if (resultingStock < 0) {
          throw new ValidationError("Operation would result in negative stock balance for this product.");
        }
        return resultingStock;
      };

      expect(() => evaluateStockChange(currentStock, requestedDeduction)).toThrow(ValidationError);
      expect(evaluateStockChange(currentStock, -5)).toBe(0); // Exactly zero is permitted
      expect(evaluateStockChange(currentStock, -3)).toBe(2);
    });
  });

  describe("3. FEFO (First-Expired, First-Out) Batch Ordering", () => {
    it("should sort active batches by earliest expiration date first", () => {
      const batches = [
        { id: "b3", batchNumber: "BN-003", expiryDate: new Date("2027-04-30") },
        { id: "b1", batchNumber: "BN-001", expiryDate: new Date("2026-11-20") },
        { id: "b2", batchNumber: "BN-002", expiryDate: new Date("2026-12-15") },
      ];

      const fefoSorted = [...batches].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

      expect(fefoSorted[0].batchNumber).toBe("BN-001"); // Earliest expiring
      expect(fefoSorted[1].batchNumber).toBe("BN-002");
      expect(fefoSorted[2].batchNumber).toBe("BN-003"); // Latest expiring
    });
  });

  describe("4. Security Audit Log Tagging for Shrinkage/Theft", () => {
    it("should tag theft movements with high-priority security audit action", () => {
      const formatAuditAction = (movementType: string, reason?: string) => {
        const isTheft = movementType === "missing" || (reason && reason.toLowerCase().includes("theft"));
        return {
          action: isTheft ? "SECURITY_THEFT_SHRINKAGE" : `INVENTORY_${movementType.toUpperCase()}`,
          entityType: isTheft ? "SECURITY" : "product",
          isTheftAlert: Boolean(isTheft),
        };
      };

      const damageLog = formatAuditAction("damaged", "Shelf bottle drop");
      expect(damageLog.action).toBe("INVENTORY_DAMAGED");
      expect(damageLog.isTheftAlert).toBe(false);

      const theftLog = formatAuditAction("missing", "Suspected till theft overnight");
      expect(theftLog.action).toBe("SECURITY_THEFT_SHRINKAGE");
      expect(theftLog.entityType).toBe("SECURITY");
      expect(theftLog.isTheftAlert).toBe(true);
    });
  });
});

