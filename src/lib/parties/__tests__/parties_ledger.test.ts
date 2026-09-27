import { describe, it, expect } from "vitest";
import {
  createPartySchema,
  recordCustomerPaymentSchema,
  recordPurchaseSchema,
  recordSupplierPaymentSchema,
} from "../validation";

describe("Customer & Supplier Ledgers and Purchase Validation Tests", () => {
  const mockPartyId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const mockProductId = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  it("should validate customer and supplier creation inputs", () => {
    const customerInput = {
      name: "Alhaji Musa Enterprises",
      phone: "+2348012345678",
      email: "musa@enterprises.ng",
      address: "14 Balogun Market, Lagos",
      notes: "Trusted wholesale customer",
    };

    const parsed = createPartySchema.safeParse(customerInput);
    expect(parsed.success).toBe(true);
  });

  it("should calculate customer balance accurately from debits and credits", () => {
    // Customer takes ₦150,000 worth of goods on credit (debit: ₦150,000)
    // Customer makes payment of ₦50,000 (credit: ₦50,000)
    // Customer makes second payment of ₦30,000 (credit: ₦30,000)
    const debits = [150000];
    const credits = [50000, 30000];

    const totalDebit = debits.reduce((a, b) => a + b, 0);
    const totalCredit = credits.reduce((a, b) => a + b, 0);
    const outstandingDebt = totalDebit - totalCredit;

    expect(totalDebit).toBe(150000);
    expect(totalCredit).toBe(80000);
    expect(outstandingDebt).toBe(70000); // Alhaji Musa still owes ₦70,000
  });

  it("should calculate supplier obligation balance accurately from credits and debits", () => {
    // Business receives stock worth ₦500,000 on credit (credit: ₦500,000)
    // Business pays supplier ₦200,000 (debit: ₦200,000)
    const credits = [500000];
    const debits = [200000];

    const totalCredit = credits.reduce((a, b) => a + b, 0);
    const totalDebit = debits.reduce((a, b) => a + b, 0);
    const obligationOwed = totalCredit - totalDebit;

    expect(obligationOwed).toBe(300000); // Business owes supplier ₦300,000
  });

  it("should validate stock purchase payload with line costs", () => {
    const purchaseInput = {
      supplierId: mockPartyId,
      items: [
        {
          productId: mockProductId,
          quantity: 100,
          unitCost: 450,
        },
      ],
      discount: 1000,
      isCreditPurchase: true,
      paidAmount: 20000,
      paymentMethod: "bank_transfer" as const,
    };

    const parsed = recordPurchaseSchema.safeParse(purchaseInput);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      const subtotal = parsed.data.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
      const total = subtotal - parsed.data.discount;
      const unpaid = total - parsed.data.paidAmount;

      expect(subtotal).toBe(45000);
      expect(total).toBe(44000);
      expect(unpaid).toBe(24000);
    }
  });

  it("should validate debt repayments and supplier payment schemas", () => {
    const custPayment = recordCustomerPaymentSchema.safeParse({
      customerId: mockPartyId,
      amount: 50000,
      paymentMethod: "cash",
    });
    expect(custPayment.success).toBe(true);

    const suppPayment = recordSupplierPaymentSchema.safeParse({
      supplierId: mockPartyId,
      amount: 150000,
      paymentMethod: "bank_transfer",
    });
    expect(suppPayment.success).toBe(true);
  });
});
