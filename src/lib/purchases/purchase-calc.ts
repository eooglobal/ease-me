/**
 * Pure calculation functions for Purchase Orders, Landed Cost Distribution, and WAC
 * Safe for use in both server actions and browser client components
 */

export interface PurchaseOrderItemInput {
  productId: string;
  productName?: string;
  quantity: number;
  unitCost: number;
}

export interface LandedCostItemResult extends PurchaseOrderItemInput {
  baseTotal: number;
  allocatedFee: number;
  landedUnitCost: number;
  landedTotal: number;
}

export class PurchaseCalc {
  /**
   * Section 6.1 & 7: Distributes freight and handling fees across purchase items proportionally by value
   */
  public static distributeLandedCosts(
    items: PurchaseOrderItemInput[],
    freightCharge: number = 0,
    otherFees: number = 0
  ): {
    items: LandedCostItemResult[];
    totalBaseValue: number;
    totalLandedAdditions: number;
    grandTotal: number;
  } {
    const totalBaseValue = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitCost),
      0
    );

    const totalLandedAdditions = Number(freightCharge) + Number(otherFees);
    const grandTotal = totalBaseValue + totalLandedAdditions;

    if (totalBaseValue <= 0 || totalLandedAdditions <= 0) {
      const defaultItems: LandedCostItemResult[] = items.map((item) => {
        const baseTotal = Math.round(Number(item.quantity) * Number(item.unitCost) * 100) / 100;
        return {
          ...item,
          baseTotal,
          allocatedFee: 0,
          landedUnitCost: Number(item.unitCost),
          landedTotal: baseTotal,
        };
      });

      return {
        items: defaultItems,
        totalBaseValue: Math.round(totalBaseValue * 100) / 100,
        totalLandedAdditions: Math.round(totalLandedAdditions * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
      };
    }

    const calculatedItems: LandedCostItemResult[] = items.map((item) => {
      const lineBaseValue = Number(item.quantity) * Number(item.unitCost);
      const weight = lineBaseValue / totalBaseValue;
      const allocatedFee = Math.round(totalLandedAdditions * weight * 100) / 100;
      const unitAllocatedFee = item.quantity > 0 ? allocatedFee / item.quantity : 0;
      const landedUnitCost = Math.round((Number(item.unitCost) + unitAllocatedFee) * 100) / 100;
      const landedTotal = Math.round((lineBaseValue + allocatedFee) * 100) / 100;

      return {
        ...item,
        baseTotal: Math.round(lineBaseValue * 100) / 100,
        allocatedFee,
        landedUnitCost,
        landedTotal,
      };
    });

    return {
      items: calculatedItems,
      totalBaseValue: Math.round(totalBaseValue * 100) / 100,
      totalLandedAdditions: Math.round(totalLandedAdditions * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }

  /**
   * Section 4.1 & 7: Weighted Average Cost formula on purchase intake
   * New WAC = ((Current Stock * Current WAC) + (Received Qty * Landed Unit Cost)) / (Current Stock + Received Qty)
   * Rounding is applied once, at the end.
   */
  public static recalculateWAC(
    currentStock: number,
    currentWAC: number,
    receivedQty: number,
    landedUnitCost: number
  ): number {
    if (receivedQty <= 0) {
      return Math.round(currentWAC * 100) / 100;
    }

    // If current stock was 0 or negative, new landed cost becomes the pure WAC
    if (currentStock <= 0) {
      return Math.round(landedUnitCost * 100) / 100;
    }

    const currentInventoryValuation = currentStock * currentWAC;
    const incomingValuation = receivedQty * landedUnitCost;
    const newTotalQuantity = currentStock + receivedQty;

    const unroundedWAC = (currentInventoryValuation + incomingValuation) / newTotalQuantity;
    return Math.round(unroundedWAC * 100) / 100;
  }

  /**
   * Computes order status based on quantities received
   */
  public static determineOrderStatus(
    items: Array<{ quantityOrdered: number; quantityReceived: number }>
  ): "ordered" | "partial" | "received" {
    let totalOrdered = 0;
    let totalReceived = 0;

    for (const item of items) {
      totalOrdered += item.quantityOrdered;
      totalReceived += item.quantityReceived;
    }

    if (totalReceived >= totalOrdered && totalOrdered > 0) {
      return "received";
    }
    if (totalReceived > 0) {
      return "partial";
    }
    return "ordered";
  }
}

