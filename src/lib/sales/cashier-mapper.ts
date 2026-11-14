import { Product } from "@/db/schema";

/**
 * Cashier-facing product representation with STRICT cost margin shielding.
 * Cost price, purchase intake details, wholesale margins, and reorder costs
 * must NEVER leak to cashier terminals under any circumstance.
 */
export interface CashierProductView {
  id: string;
  name: string;
  category: string;
  sku: string | null;
  barcode: string | null;
  sellingPrice: number;
  currentStock: number;
  unit: string;
  status: string;
}

/**
 * Strips all sensitive cost, margin, and supplier data from a product record.
 */
export function toCashierProductView(product: Partial<Product> & { [key: string]: any }): CashierProductView {
  return {
    id: product.id!,
    name: product.name!,
    category: product.category || "General",
    sku: product.sku || null,
    barcode: product.barcode || null,
    sellingPrice: typeof product.sellingPrice === "string" ? parseFloat(product.sellingPrice) : (product.sellingPrice || 0),
    currentStock: product.currentStock ?? 0,
    unit: product.unit || "unit",
    status: product.status || "active",
  };
}

/**
 * Maps an array of internal product records to strictly sanitized CashierProductViews
 */
export function toCashierProductList(products: Partial<Product>[]): CashierProductView[] {
  return products.map(toCashierProductView);
}

/**
 * Strips unit costs and margins from a sale receipt before cashier display
 */
export function toCashierReceiptView(sale: any) {
  const sanitizedItems = (sale.items || []).map((item: any) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName || item.name,
    quantity: item.quantity,
    unitPrice: typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : item.unitPrice,
    discount: item.discount,
    total: typeof item.total === "string" ? parseFloat(item.total) : item.total,
    // unitCost, costSnapshot, and profit margin are explicitly removed
  }));

  return {
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    subtotal: typeof sale.subtotal === "string" ? parseFloat(sale.subtotal) : sale.subtotal,
    discount: typeof sale.discount === "string" ? parseFloat(sale.discount) : sale.discount,
    tax: typeof sale.tax === "string" ? parseFloat(sale.tax) : sale.tax,
    total: typeof sale.total === "string" ? parseFloat(sale.total) : sale.total,
    paymentStatus: sale.paymentStatus,
    createdAt: sale.createdAt,
    items: sanitizedItems,
    payments: sale.payments || [],
  };
}

