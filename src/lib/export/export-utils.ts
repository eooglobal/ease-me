/**
 * Utility functions for generating and downloading RFC 4180-compliant CSV files in the browser
 */

import { SaleTransaction } from "@/components/modals/ReceiptDetailModal";
import { ProductItem } from "@/components/modals/AddProductModal";
import { CustomerItem } from "@/components/modals/CustomerRepaymentModal";
import { SupplierItem } from "@/components/modals/AddSupplierModal";

/**
 * Escapes a single CSV field following RFC 4180 rules
 */
export function escapeCSVField(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  // If field contains comma, double quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a formatted CSV string from headers and data rows
 */
export function buildCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCSVField).join(",");
  const dataLines = rows.map((row) => row.map(escapeCSVField).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Triggers a browser file download of CSV content with UTF-8 BOM
 */
export function downloadCSV(filename: string, csvContent: string): void {
  if (typeof window === "undefined") return;

  // Prepend UTF-8 BOM so Excel opens accented characters and symbols cleanly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. Exports Sales Transactions
 */
export function exportSalesToCSV(sales: SaleTransaction[]): void {
  const headers = [
    "Invoice No",
    "Time / Date",
    "Cashier",
    "Customer / Debtor",
    "Items Sold",
    "Tender Method",
    "Total Amount (NGN)",
  ];

  const rows = sales.map((sale) => [
    sale.id,
    sale.time,
    sale.cashier,
    sale.customer || "Walk-in Customer",
    sale.items,
    sale.method.toUpperCase(),
    sale.amount,
  ]);

  const csv = buildCSV(headers, rows);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(`EaseMe_Sales_History_${dateStr}`, csv);
}

/**
 * 2. Exports Inventory Stock Catalog
 */
export function exportInventoryToCSV(products: ProductItem[]): void {
  const headers = [
    "SKU",
    "Product Name",
    "Category",
    "Cost Price (NGN)",
    "Selling Price (NGN)",
    "Current Stock",
    "Min Stock Threshold",
    "Inventory Valuation (NGN)",
    "Stock Status",
  ];

  const rows = products.map((p) => {
    const valuation = p.stock * p.cost;
    const status = p.stock <= 0 ? "Out of Stock" : p.stock <= p.minStock ? "Low Stock" : "In Stock";
    return [
      p.sku,
      p.name,
      p.category,
      p.cost,
      p.price,
      p.stock,
      p.minStock,
      valuation,
      status,
    ];
  });

  const csv = buildCSV(headers, rows);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(`EaseMe_Inventory_Catalog_${dateStr}`, csv);
}

/**
 * 3. Exports Customer Debtor Ledgers
 */
export function exportCustomersToCSV(customers: CustomerItem[]): void {
  const headers = [
    "Customer Name",
    "Phone Number",
    "Outstanding Debt (NGN)",
    "Credit Limit (NGN)",
    "Available Credit (NGN)",
    "Account Status",
  ];

  const rows = customers.map((c) => {
    const available = Math.max(0, c.limit - c.balance);
    return [c.name, c.phone, c.balance, c.limit, available, c.status];
  });

  const csv = buildCSV(headers, rows);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(`EaseMe_Customer_Debtors_${dateStr}`, csv);
}

/**
 * 4. Exports Supplier Payables Obligations
 */
export function exportSuppliersToCSV(suppliers: SupplierItem[]): void {
  const headers = [
    "Supplier Name",
    "Contact Information",
    "Outstanding Obligation (NGN)",
    "Payment Terms",
  ];

  const rows = suppliers.map((s) => [
    s.name,
    s.contact,
    s.balance,
    s.term,
  ]);

  const csv = buildCSV(headers, rows);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(`EaseMe_Supplier_Payables_${dateStr}`, csv);
}

/**
 * 5. Exports Profit & Loss Summary Statement
 */
export function exportPnLToCSV(pnlData: {
  salesRevenue: number;
  cogs: number;
  grossProfit: number;
  expensesTotal: number;
  netProfit: number;
  cashInDrawer: number;
  bankCollections: number;
  dateStr?: string;
}): void {
  const date = pnlData.dateStr || new Date().toISOString().slice(0, 10);
  const grossMargin = pnlData.salesRevenue > 0 ? ((pnlData.grossProfit / pnlData.salesRevenue) * 100).toFixed(1) : "0.0";
  const netMargin = pnlData.salesRevenue > 0 ? ((pnlData.netProfit / pnlData.salesRevenue) * 100).toFixed(1) : "0.0";

  const headers = ["Financial Metric", "Amount (NGN)", "Margin % / Notes"];
  const rows = [
    ["Statement Date", date, ""],
    ["Total Sales Revenue", pnlData.salesRevenue, "100.0%"],
    ["Cost of Goods Sold (COGS)", pnlData.cogs, ""],
    ["Gross Profit", pnlData.grossProfit, `${grossMargin}%`],
    ["Operating Expenses", pnlData.expensesTotal, ""],
    ["Estimated Net Profit", pnlData.netProfit, `${netMargin}%`],
    ["Cash in Drawer", pnlData.cashInDrawer, "Physical Tender"],
    ["Electronic Bank Balance", pnlData.bankCollections, "Transfers & POS"],
    ["Total Available Liquidity", pnlData.cashInDrawer + pnlData.bankCollections, "Combined Cash & Bank"],
  ];

  const csv = buildCSV(headers, rows);
  downloadCSV(`EaseMe_Financial_Statement_${date}`, csv);
}

