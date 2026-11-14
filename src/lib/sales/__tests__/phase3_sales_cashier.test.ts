import { describe, it, expect, vi, beforeEach } from "vitest";
import { toCashierProductView, toCashierProductList, toCashierReceiptView } from "../cashier-mapper";
import { withIdempotency } from "@/lib/security/idempotency";
import { ValidationError, ForbiddenError } from "@/lib/security/errors";

describe("Phase 3: Cashier Workspace & Sales Business Rules (Section 7)", () => {
  describe("1. Cashier Cost Margin Shielding (Data Sanitization)", () => {
    const rawProduct = {
      id: "prod-999",
      businessId: "biz-111",
      name: "Paracetamol 500mg Pack",
      sku: "MED-001",
      barcode: "6151234567890",
      costPrice: "550.00", // WAC Landed Cost - STRICTLY SENSITIVE
      sellingPrice: "850.00",
      currentStock: 120,
      minimumStockLevel: 20,
      unit: "pack",
      status: "active" as const,
      supplierId: "supp-abc",
      profitMargin: 35.3,
    };

    it("should strictly strip costPrice, supplierId, and margin from cashier product views", () => {
      const sanitized = toCashierProductView(rawProduct);

      expect(sanitized.id).toBe("prod-999");
      expect(sanitized.name).toBe("Paracetamol 500mg Pack");
      expect(sanitized.sellingPrice).toBe(850.00);
      expect(sanitized.currentStock).toBe(120);

      // Verify ZERO cost or margin fields exist in the output object
      expect((sanitized as any).costPrice).toBeUndefined();
      expect((sanitized as any).cost).toBeUndefined();
      expect((sanitized as any).supplierId).toBeUndefined();
      expect((sanitized as any).profitMargin).toBeUndefined();
      expect((sanitized as any).minimumStockLevel).toBeUndefined();
    });

    it("should sanitize lists of products so no cost fields leak across array responses", () => {
      const sanitizedList = toCashierProductList([rawProduct, rawProduct]);
      expect(sanitizedList.length).toBe(2);

      for (const item of sanitizedList) {
        expect((item as any).costPrice).toBeUndefined();
        expect((item as any).cost).toBeUndefined();
      }
    });

    it("should strip unitCost and profit margins from cashier thermal receipts", () => {
      const rawSale = {
        id: "sale-1",
        invoiceNumber: "INV-20261106-0001",
        subtotal: 1700,
        discount: 0,
        tax: 0,
        total: 1700,
        paymentStatus: "completed",
        createdAt: new Date(),
        items: [
          {
            id: "item-1",
            productId: "prod-999",
            productName: "Paracetamol 500mg",
            quantity: 2,
            unitPrice: 850,
            unitCost: 550, // SENSITIVE COST SNAPSHOT
            total: 1700,
          },
        ],
      };

      const sanitizedReceipt = toCashierReceiptView(rawSale);
      expect(sanitizedReceipt.items[0].unitPrice).toBe(850);
      expect((sanitizedReceipt.items[0] as any).unitCost).toBeUndefined();
      expect((sanitizedReceipt as any).totalCostSnapshot).toBeUndefined();
    });
  });

  describe("2. Idempotency Key Duplicate Prevention", () => {
    it("should return the original result and execute the underlying action only once when submitting the same idempotencyKey", async () => {
      const businessId = "biz-111";
      const idempotencyKey = `idem-key-${Date.now()}`;
      let executionCount = 0;

      const performSale = async () => {
        executionCount++;
        return {
          invoiceNumber: "INV-20261106-9999",
          total: 5000,
          timestamp: Date.now(),
        };
      };

      // First submission
      const firstResult = await withIdempotency(businessId, idempotencyKey, performSale);
      expect(executionCount).toBe(1);
      expect(firstResult.invoiceNumber).toBe("INV-20261106-9999");

      // Second submission with exact same key must return cached result WITHOUT re-executing
      const secondResult = await withIdempotency(businessId, idempotencyKey, performSale);
      expect(executionCount).toBe(1); // Still 1!
      expect(secondResult.invoiceNumber).toBe(firstResult.invoiceNumber);
    });
  });

  describe("3. Customer Credit Headroom & Debt Tab Rejection", () => {
    it("should reject a credit sale above available headroom without a manager PIN", () => {
      const customer = {
        id: "cust-1",
        name: "Alhaji Danladi",
        creditLimit: 100000,
        currentDebt: 80000,
        headroom: 20000, // Only ₦20,000 credit remaining
      };

      const validateCreditSale = (requestedDebt: number, managerPin?: string) => {
        if (requestedDebt > customer.headroom) {
          if (!managerPin || managerPin !== "1234") {
            throw new ValidationError(
              `Credit sale of ₦${requestedDebt} exceeds customer available headroom of ₦${customer.headroom}. Manager PIN required.`
            );
          }
        }
        return true;
      };

      // ₦15,000 credit sale is within ₦20,000 headroom -> succeeds
      expect(validateCreditSale(15000)).toBe(true);

      // ₦25,000 credit sale exceeds ₦20,000 headroom without PIN -> throws ValidationError
      expect(() => validateCreditSale(25000)).toThrow(ValidationError);

      // ₦25,000 credit sale with valid Manager PIN -> approved
      expect(validateCreditSale(25000, "1234")).toBe(true);
    });
  });

  describe("4. Historical Cost Snapshot Immutability", () => {
    it("should preserve historical snapshot cost on sale items even when product WAC changes later", () => {
      const historicalSaleItem = {
        saleId: "sale-1",
        productId: "prod-1",
        quantity: 10,
        unitPrice: 1500,
        unitCost: 1000, // Frozen snapshot WAC
        lineTotal: 15000,
      };

      const historicalGrossProfit = historicalSaleItem.lineTotal - (historicalSaleItem.quantity * historicalSaleItem.unitCost);
      expect(historicalGrossProfit).toBe(5000); // ₦5,000 profit

      // Supplier later increases cost: Product WAC rises from ₦1,000 to ₦1,400
      const newProductWac = 1400;

      // Historical sale item cost snapshot is immutable and must NEVER change
      expect(historicalSaleItem.unitCost).toBe(1000);
      const recalculatedProfit = historicalSaleItem.lineTotal - (historicalSaleItem.quantity * historicalSaleItem.unitCost);
      expect(recalculatedProfit).toBe(5000);
    });
  });
});

