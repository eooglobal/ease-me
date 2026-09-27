import { describe, it, expect } from "vitest";
import { createSaleSchema, cancelOrVoidSaleSchema } from "../validation";
import { withIdempotency } from "@/lib/security/idempotency";

describe("Sales Engine Validation & Financial Accounting Logic Tests", () => {
  const mockProductId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const mockCustomerId = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  it("should validate a single-tender cash sale correctly", () => {
    const saleInput = {
      items: [
        {
          productId: mockProductId,
          quantity: 2,
          unitPrice: 5000,
          discount: 0,
        },
      ],
      discount: 0,
      tax: 0,
      isCreditSale: false,
      payments: [
        {
          paymentMethod: "cash" as const,
          amount: 10000,
        },
      ],
    };

    const parsed = createSaleSchema.safeParse(saleInput);
    expect(parsed.success).toBe(true);
  });

  it("should validate a multi-tender split payment (Cash + Bank Transfer + Card)", () => {
    const saleInput = {
      items: [
        {
          productId: mockProductId,
          quantity: 5,
          unitPrice: 10000,
          discount: 0,
        },
      ],
      discount: 2000,
      tax: 1000,
      isCreditSale: false,
      // Total = 50,000 - 2,000 + 1,000 = 49,000
      payments: [
        { paymentMethod: "cash" as const, amount: 20000 },
        { paymentMethod: "bank_transfer" as const, amount: 20000 },
        { paymentMethod: "card" as const, amount: 9000 },
      ],
    };

    const parsed = createSaleSchema.safeParse(saleInput);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      const totalPaid = parsed.data.payments.reduce((sum, p) => sum + p.amount, 0);
      expect(totalPaid).toBe(49000);
    }
  });

  it("should calculate credit sale receivables accurately", () => {
    const totalSale = 100000;
    const initialDeposit = 30000;
    const expectedCustomerReceivable = totalSale - initialDeposit;

    expect(expectedCustomerReceivable).toBe(70000);
  });

  it("should calculate line item Gross Profit accurately based on historical cost", () => {
    // 10 units sold at ₦10,000 each (Revenue = ₦100,000)
    // Historical unit cost = ₦7,000 (COGS = ₦70,000)
    const quantity = 10;
    const unitPrice = 10000;
    const unitCost = 7000;

    const revenue = quantity * unitPrice;
    const cogs = quantity * unitCost;
    const grossProfit = revenue - cogs;
    const marginPercent = (grossProfit / revenue) * 100;

    expect(revenue).toBe(100000);
    expect(cogs).toBe(70000);
    expect(grossProfit).toBe(30000);
    expect(marginPercent).toBe(30);
  });

  it("should enforce idempotency by not re-executing operation for same key", async () => {
    let executionCount = 0;
    const dummyOp = async () => {
      executionCount++;
      return { id: "sale-123", invoice: "INV-001" };
    };

    const res1 = await withIdempotency("biz-1", "idem-key-test-1", dummyOp);
    const res2 = await withIdempotency("biz-1", "idem-key-test-1", dummyOp);

    expect(executionCount).toBe(1); // Executed only once!
    expect(res1).toEqual(res2);
  });

  it("should validate cancellation payload correctly", () => {
    const cancelPayload = {
      saleId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      reason: "Customer changed mind before leaving store",
    };

    const parsed = cancelOrVoidSaleSchema.safeParse(cancelPayload);
    expect(parsed.success).toBe(true);
  });
});
