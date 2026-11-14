import { describe, it, expect } from "vitest";
import { ApprovalService, ApprovalRecord, VoidSaleRequest } from "../approval-service";

describe("Phase 8: Manager Workspace & Approvals Workflows", () => {
  describe("Manager Sale Void Authorization Rules", () => {
    it("rejects void request if reason is missing or too brief", () => {
      const request: VoidSaleRequest = {
        saleId: "sale-101",
        receiptNumber: "REC-20261106-0048",
        originalAmount: 12500,
        reason: "  ",
        managerPin: "1234",
        managerName: "Chidinma Eze",
      };

      const result = ApprovalService.processSaleVoid(request, "1234");
      expect(result.success).toBe(false);
      expect(result.error).toContain("A specific void reason");
    });

    it("rejects void request if manager authorization PIN is incorrect", () => {
      const request: VoidSaleRequest = {
        saleId: "sale-101",
        receiptNumber: "REC-20261106-0048",
        originalAmount: 12500,
        reason: "Customer returned items immediately due to defect",
        managerPin: "9999", // Invalid PIN
        managerName: "Chidinma Eze",
      };

      const result = ApprovalService.processSaleVoid(request, "1234");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid manager authorization PIN");
    });

    it("successfully creates reversing void records without deleting sales rows", () => {
      const request: VoidSaleRequest = {
        saleId: "sale-101",
        receiptNumber: "REC-20261106-0048",
        originalAmount: 12500,
        reason: "Customer was charged twice on POS terminal due to network retry",
        managerPin: "1234",
        managerName: "Chidinma Eze",
      };

      const result = ApprovalService.processSaleVoid(request, "1234");
      expect(result.success).toBe(true);
      expect(result.voidRecord).toBeDefined();
      expect(result.voidRecord?.reversingLedgerEntry).toBe(true);
      expect(result.voidRecord?.restockMovementCreated).toBe(true);
      expect(result.voidRecord?.voidedBy).toBe("Chidinma Eze");
    });
  });

  describe("Approvals Queue Resolution", () => {
    const samplePendingItem: ApprovalRecord = {
      id: "APP-001",
      type: "shift_shortage",
      title: "Till Shift Shortage Co-Sign",
      requesterName: "Adaeze Okon",
      requesterRole: "Cashier",
      amountOrQuantity: "-₦2,200",
      numericValue: 2200,
      reason: "Small change discrepancy during evening rush",
      createdAt: "2026-11-06T12:00:00Z",
      status: "pending",
    };

    it("approves pending request and records authorizing manager details", () => {
      const res = ApprovalService.resolveApproval(
        samplePendingItem,
        "approve",
        "Chidinma Eze (Store Manager)"
      );

      expect(res.error).toBeUndefined();
      expect(res.updatedItem.status).toBe("approved");
      expect(res.updatedItem.reviewedBy).toBe("Chidinma Eze (Store Manager)");
      expect(res.updatedItem.reviewedAt).toBeDefined();
    });

    it("rejects pending request and records mandatory rejection reason", () => {
      const res = ApprovalService.resolveApproval(
        samplePendingItem,
        "reject",
        "Chidinma Eze (Store Manager)",
        "Discrepancy is too large without receipts; re-count drawer physically."
      );

      expect(res.error).toBeUndefined();
      expect(res.updatedItem.status).toBe("rejected");
      expect(res.updatedItem.rejectionReason).toBe(
        "Discrepancy is too large without receipts; re-count drawer physically."
      );
    });

    it("fails rejection if rejection reason is missing", () => {
      const res = ApprovalService.resolveApproval(
        samplePendingItem,
        "reject",
        "Chidinma Eze (Store Manager)",
        ""
      );

      expect(res.error).toContain("A valid reason is required when rejecting");
      expect(res.updatedItem.status).toBe("pending");
    });

    it("prevents modifying an already approved or rejected item", () => {
      const approvedItem: ApprovalRecord = {
        ...samplePendingItem,
        status: "approved",
      };

      const res = ApprovalService.resolveApproval(
        approvedItem,
        "approve",
        "Chidinma Eze"
      );

      expect(res.error).toContain("already approved");
    });
  });
});
