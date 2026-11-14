/**
 * Customer Portal Service & Data Shielding Layer
 * Enforces Section 6.4 rules:
 * - Must not expose product costs, stock levels, staff names, or other customers' data.
 * - Client and server safe.
 */

export interface CustomerPortalAccount {
  id: string;
  name: string;
  phone: string;
  email?: string;
  storeName: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  creditLimit: number;
  outstandingBalance: number;
  availableHeadroom: number;
  creditTermsDays: number;
  nextDueDate: string;
  isOverdue: boolean;
  overdueDays: number;
}

export interface ShieldedCustomerTransaction {
  id: string;
  date: string;
  type: "credit_purchase" | "payment_received";
  description: string;
  amount: number;
  balanceAfter: number;
  referenceNumber: string;
  proofUrl?: string;
  status: "completed" | "pending_verification";
}

export interface ShieldedCustomerPurchase {
  id: string;
  receiptNumber: string;
  date: string;
  totalAmount: number;
  paymentMethod: "cash" | "card" | "transfer" | "credit" | "split";
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export interface PaymentProofSubmission {
  customerId: string;
  amount: number;
  transferReference: string;
  bankUsed: string;
  proofUrl: string;
  notes?: string;
}

export class CustomerPortalService {
  /**
   * Computes customer financial standing with single-pass rounding
   */
  public static evaluateStanding(
    creditLimit: number,
    outstandingBalance: number,
    creditTermsDays: number = 14,
    lastPurchaseDateStr?: string
  ): {
    availableHeadroom: number;
    nextDueDate: string;
    isOverdue: boolean;
    overdueDays: number;
  } {
    const limit = Math.max(0, Number(creditLimit));
    const balance = Math.max(0, Number(outstandingBalance));
    const headroom = Math.max(0, Math.round((limit - balance) * 100) / 100);

    const baseDate = lastPurchaseDateStr ? new Date(lastPurchaseDateStr) : new Date();
    const dueDate = new Date(baseDate.getTime() + creditTermsDays * 24 * 60 * 60 * 1000);

    const now = new Date();
    const diffMs = now.getTime() - dueDate.getTime();
    const overdueDays = diffMs > 0 && balance > 0 ? Math.floor(diffMs / (24 * 60 * 60 * 1000)) : 0;
    const isOverdue = overdueDays > 0;

    return {
      availableHeadroom: headroom,
      nextDueDate: dueDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      isOverdue,
      overdueDays,
    };
  }

  /**
   * Validates a proof of payment submission
   */
  public static validateProofSubmission(submission: PaymentProofSubmission): {
    valid: boolean;
    error?: string;
  } {
    if (!submission.amount || Number(submission.amount) <= 0) {
      return { valid: false, error: "Payment amount must be greater than zero." };
    }

    if (!submission.transferReference || submission.transferReference.trim().length < 4) {
      return { valid: false, error: "A valid bank transfer transaction reference is required." };
    }

    if (!submission.proofUrl || !submission.proofUrl.startsWith("http")) {
      return { valid: false, error: "A valid receipt image or document upload URL is required." };
    }

    return { valid: true };
  }

  /**
   * Sanitizes customer purchase history:
   * Strips any cost price, profit, cashier staff name, or warehouse stock data.
   */
  public static sanitizePurchase(rawPurchase: any): ShieldedCustomerPurchase {
    return {
      id: String(rawPurchase.id),
      receiptNumber: String(rawPurchase.receiptNumber || rawPurchase.id),
      date: String(rawPurchase.date || rawPurchase.createdAt || new Date().toISOString()),
      totalAmount: Math.round(Number(rawPurchase.totalAmount || rawPurchase.total) * 100) / 100,
      paymentMethod: rawPurchase.paymentMethod || "transfer",
      items: Array.isArray(rawPurchase.items)
        ? rawPurchase.items.map((it: any) => ({
            name: String(it.name || it.productName),
            quantity: Number(it.quantity || it.qty || 1),
            unitPrice: Math.round(Number(it.unitPrice || it.price) * 100) / 100,
            lineTotal: Math.round(Number(it.lineTotal || (it.quantity * it.price)) * 100) / 100,
            // Explicitly NO costPrice, NO margin, NO stockLevel, NO cashierName!
          }))
        : [],
    };
  }
}

