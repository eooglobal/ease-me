/**
 * Pure calculation functions for shift reconciliation (safe for client and server)
 */
import { ValidationError } from "@/lib/security/errors";

export interface ShiftVarianceEvaluation {
  variance: number;
  status: "closed" | "locked";
  requiresManagerCoSign: boolean;
  flagForReview: boolean;
}

/**
 * Section 7: Expected cash calculation formula:
 * Expected cash includes opening float, cash sales and cash repayments, and subtracts cash payouts.
 */
export function calculateExpectedCash(
  openingFloat: number,
  cashSales: number,
  cashRepayments: number,
  cashPayouts: number
): number {
  const raw = Number(openingFloat) + Number(cashSales) + Number(cashRepayments) - Number(cashPayouts);
  return Math.round(raw * 100) / 100;
}

/**
 * Section 3: Shift Shortage Rules Evaluator
 * - Any shortage requires a written note
 * - Shortages > ₦500 additionally lock the shift until a manager co-signs
 * - Shortages <= ₦500 close with a flag for review
 */
export function evaluateShiftVariance(
  actualCash: number,
  expectedCash: number,
  note?: string,
  varianceReason?: string
): ShiftVarianceEvaluation {
  const variance = Math.round((actualCash - expectedCash) * 100) / 100;

  // Balanced
  if (Math.abs(variance) < 0.01) {
    return {
      variance: 0,
      status: "closed",
      requiresManagerCoSign: false,
      flagForReview: false,
    };
  }

  // Overage
  if (variance > 0) {
    return {
      variance,
      status: "closed",
      requiresManagerCoSign: false,
      flagForReview: true,
    };
  }

  // Shortage (variance < 0)
  const hasExplanation = Boolean(note?.trim() || varianceReason?.trim());
  if (!hasExplanation) {
    throw new ValidationError(
      "A written explanation is mandatory for any cash shortage before closing the shift."
    );
  }

  const shortageAmount = Math.abs(variance);
  if (shortageAmount > 500) {
    return {
      variance,
      status: "locked",
      requiresManagerCoSign: true,
      flagForReview: true,
    };
  }

  // Shortage <= 500 closes with review flag
  return {
    variance,
    status: "closed",
    requiresManagerCoSign: false,
    flagForReview: true,
  };
}

