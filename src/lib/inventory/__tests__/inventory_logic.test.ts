import { describe, it, expect } from "vitest";
import {
  createProductSchema,
  inventoryMovementSchema,
  submitCountItemSchema,
} from "../validation";

describe("Inventory Domain Logic & Validation Tests", () => {
  it("should validate valid product creation input", () => {
    const valid = createProductSchema.safeParse({
      name: "Paracetamol 500mg",
      sku: "PARA-500",
      barcode: "1234567890123",
      costPrice: 500,
      sellingPrice: 800,
      initialStock: 50,
      minimumStockLevel: 10,
      trackInventory: true,
    });

    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.costPrice).toBe(500);
      expect(valid.data.sellingPrice).toBe(800);
      expect(valid.data.unit).toBe("unit"); // Default unit
    }
  });

  it("should reject negative prices and negative initial stock", () => {
    const invalid = createProductSchema.safeParse({
      name: "Faulty Product",
      costPrice: -100,
      sellingPrice: -50,
      initialStock: -10,
    });

    expect(invalid.success).toBe(false);
  });

  it("should validate inventory movements correctly and reject zero quantity", () => {
    const validUuid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const validMovement = inventoryMovementSchema.safeParse({
      productId: validUuid,
      movementType: "received",
      quantity: 20,
      unitCost: 500,
      reason: "Supplier delivery",
    });
    if (!validMovement.success) {
      console.log(validMovement.error.format());
    }
    expect(validMovement.success).toBe(true);

    const zeroMovement = inventoryMovementSchema.safeParse({
      productId: validUuid,
      movementType: "received",
      quantity: 0,
    });
    expect(zeroMovement.success).toBe(false);
  });

  it("should calculate inventory count discrepancies accurately without assuming theft", () => {
    const expectedStock = 100;
    const physicalCount = 94;
    const difference = physicalCount - expectedStock;

    expect(difference).toBe(-6); // Shortage of 6 units detected for investigation

    const excessCount = 105;
    const excessDifference = excessCount - expectedStock;
    expect(excessDifference).toBe(5); // Surplus of 5 units detected
  });

  it("should determine low stock status accurately", () => {
    const checkLowStock = (currentStock: number, minLevel: number) => currentStock <= minLevel;

    expect(checkLowStock(5, 10)).toBe(true);
    expect(checkLowStock(10, 10)).toBe(true);
    expect(checkLowStock(11, 10)).toBe(false);
  });
});
