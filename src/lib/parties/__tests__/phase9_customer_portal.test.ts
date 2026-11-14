import { describe, it, expect } from "vitest";
import {
  CustomerPortalService,
  PaymentProofSubmission,
} from "../customer-portal-service";

describe("Phase 9: Customer Portal Financials & Data Shielding Layer", () => {
  describe("Standing & Headroom Calculations", () => {
    it("evaluates available headroom and next due date correctly", () => {
      const creditLimit = 250000;
      const outstandingBalance = 142000;
      const creditTermsDays = 14;
      const basePurchaseDate = "2026-11-01T10:00:00Z";

      const standing = CustomerPortalService.evaluateStanding(
        creditLimit,
        outstandingBalance,
        creditTermsDays,
        basePurchaseDate
      );

      // Headroom: 250,000 - 142,000 = 108,000
      expect(standing.availableHeadroom).toBe(108000);
      expect(standing.nextDueDate).toBeDefined();
    });

    it("clamps headroom to zero if outstanding balance exceeds credit limit", () => {
      const standing = CustomerPortalService.evaluateStanding(100000, 120000, 14);
      expect(standing.availableHeadroom).toBe(0);
    });

    it("flags overdue debts when payment terms expire with outstanding balance", () => {
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const standing = CustomerPortalService.evaluateStanding(100000, 50000, 14, pastDate);

      expect(standing.isOverdue).toBe(true);
      expect(standing.overdueDays).toBeGreaterThanOrEqual(15);
    });
  });

  describe("Proof of Payment Submission Validation", () => {
    it("rejects submission if amount is zero or negative", () => {
      const submission: PaymentProofSubmission = {
        customerId: "cust-1",
        amount: 0,
        transferReference: "GTB/TRF/98124",
        bankUsed: "GTBank",
        proofUrl: "https://r2.easeme.store/receipts/proof.jpg",
      };

      const result = CustomerPortalService.validateProofSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("must be greater than zero");
    });

    it("rejects submission if transaction reference is missing or too short", () => {
      const submission: PaymentProofSubmission = {
        customerId: "cust-1",
        amount: 25000,
        transferReference: "  ",
        bankUsed: "GTBank",
        proofUrl: "https://r2.easeme.store/receipts/proof.jpg",
      };

      const result = CustomerPortalService.validateProofSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("bank transfer transaction reference is required");
    });

    it("rejects submission if proof document URL is missing or invalid", () => {
      const submission: PaymentProofSubmission = {
        customerId: "cust-1",
        amount: 25000,
        transferReference: "GTB/TRF/98124",
        bankUsed: "GTBank",
        proofUrl: "invalid-url",
      };

      const result = CustomerPortalService.validateProofSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("valid receipt image or document upload URL");
    });

    it("accepts valid proof submission", () => {
      const submission: PaymentProofSubmission = {
        customerId: "cust-1",
        amount: 50000,
        transferReference: "GTB/TRF/98124",
        bankUsed: "GTBank",
        proofUrl: "https://r2.easeme.store/debt_proofs/slip-98124.pdf",
      };

      const result = CustomerPortalService.validateProofSubmission(submission);
      expect(result.valid).toBe(true);
    });
  });

  describe("Section 6.4: Customer Data Shielding & Privacy Compliance", () => {
    it("strictly strips internal product costs, margins, stock levels, and staff names from purchase data", () => {
      const internalPurchaseData = {
        id: "PUR-100",
        receiptNumber: "REC-20261106-9012",
        createdAt: "2026-11-06T12:00:00Z",
        totalAmount: 45000,
        paymentMethod: "credit",
        // Sensitive internal fields that must NEVER be returned to customers:
        costSnapshot: 32000,
        grossMargin: 13000,
        cashierStaffName: "Adaeze Okon",
        cashierStaffId: "staff-01",
        warehouseLocation: "Bin A-4",
        items: [
          {
            name: "Golden Penny Vegetable Oil 5L",
            quantity: 3,
            unitPrice: 10000,
            lineTotal: 30000,
            // Sensitive line item fields:
            costPrice: 8500,
            margin: 1500,
            currentStock: 24,
            supplierName: "Olam Distribution",
          },
        ],
      };

      const sanitized = CustomerPortalService.sanitizePurchase(internalPurchaseData);

      // Verify legitimate customer fields exist
      expect(sanitized.receiptNumber).toBe("REC-20261106-9012");
      expect(sanitized.totalAmount).toBe(45000);
      expect(sanitized.items[0].name).toBe("Golden Penny Vegetable Oil 5L");
      expect(sanitized.items[0].unitPrice).toBe(10000);

      // Verify sensitive fields are completely eliminated
      const stringified = JSON.stringify(sanitized);
      expect(stringified).not.toContain("Adaeze Okon");
      expect(stringified).not.toContain("costSnapshot");
      expect(stringified).not.toContain("costPrice");
      expect(stringified).not.toContain("grossMargin");
      expect(stringified).not.toContain("currentStock");
      expect(stringified).not.toContain("Olam Distribution");
    });
  });
});

