/**
 * Approval and Void Workflow Service for Store Managers
 * Client and server safe pure logic
 */

export type ApprovalType =
  | "shift_shortage"
  | "stock_writeoff"
  | "purchase_intake"
  | "credit_override";

export interface ApprovalRecord {
  id: string;
  type: ApprovalType;
  title: string;
  requesterName: string;
  requesterRole: string;
  amountOrQuantity: string;
  numericValue: number;
  reason: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface VoidSaleRequest {
  saleId: string;
  receiptNumber: string;
  originalAmount: number;
  reason: string;
  managerPin: string;
  managerName: string;
}

export interface VoidSaleResult {
  success: boolean;
  error?: string;
  voidRecord?: {
    saleId: string;
    receiptNumber: string;
    voidedAt: string;
    voidedBy: string;
    reason: string;
    reversingLedgerEntry: boolean;
    restockMovementCreated: boolean;
  };
}

export class ApprovalService {
  /**
   * Evaluates if a sale void request is valid
   * Rules:
   * 1. Reason is strictly mandatory (no empty whitespace)
   * 2. Manager PIN must be provided and valid (4-6 digits)
   * 3. Never deletes rows; marks reversing records
   */
  public static processSaleVoid(
    request: VoidSaleRequest,
    expectedPin: string = "1234"
  ): VoidSaleResult {
    if (!request.reason || request.reason.trim().length < 5) {
      return {
        success: false,
        error: "A specific void reason (minimum 5 characters) is required.",
      };
    }

    if (!request.managerPin || request.managerPin.trim() !== expectedPin) {
      return {
        success: false,
        error: "Invalid manager authorization PIN.",
      };
    }

    return {
      success: true,
      voidRecord: {
        saleId: request.saleId,
        receiptNumber: request.receiptNumber,
        voidedAt: new Date().toISOString(),
        voidedBy: request.managerName,
        reason: request.reason.trim(),
        reversingLedgerEntry: true,
        restockMovementCreated: true,
      },
    };
  }

  /**
   * Evaluates if an approval action can be completed
   */
  public static resolveApproval(
    item: ApprovalRecord,
    action: "approve" | "reject",
    managerName: string,
    rejectionReason?: string
  ): {
    updatedItem: ApprovalRecord;
    error?: string;
  } {
    if (item.status !== "pending") {
      return {
        updatedItem: item,
        error: `Approval item is already ${item.status}.`,
      };
    }

    if (action === "reject" && (!rejectionReason || rejectionReason.trim().length < 3)) {
      return {
        updatedItem: item,
        error: "A valid reason is required when rejecting an approval request.",
      };
    }

    const updatedItem: ApprovalRecord = {
      ...item,
      status: action === "approve" ? "approved" : "rejected",
      reviewedBy: managerName,
      reviewedAt: new Date().toISOString(),
      rejectionReason: action === "reject" ? rejectionReason?.trim() : undefined,
    };

    return { updatedItem };
  }
}
