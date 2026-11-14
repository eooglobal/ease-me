import { z } from "zod";

export const createPartySchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  creditLimit: z.number().min(0).default(0),
  creditTermsDays: z.number().int().min(0).default(0),
});

export const updatePartySchema = createPartySchema.partial();

export const recordCustomerPaymentSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  amount: z.number().min(0.01, "Payment amount must be greater than zero"),
  paymentMethod: z.enum(["cash", "bank_transfer", "card", "other"]).default("cash"),
  referenceType: z.string().max(50).default("customer_debt_repayment"),
  externalReference: z.string().max(150).optional(),
  description: z.string().optional(),
  proofUrl: z.string().optional().nullable(),
});

export const purchaseItemInputSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitCost: z.number().min(0, "Unit cost cannot be negative"),
});

export const recordPurchaseSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier ID").optional().nullable(),
  items: z.array(purchaseItemInputSchema).min(1, "At least one purchase item is required"),
  discount: z.number().min(0).default(0),
  isCreditPurchase: z.boolean().default(true), // Default: pay later or pay now
  paidAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(["cash", "bank_transfer", "card", "other"]).optional(),
  referenceNumber: z.string().max(50).optional(),
});

export const recordSupplierPaymentSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier ID"),
  amount: z.number().min(0.01, "Payment amount must be greater than zero"),
  paymentMethod: z.enum(["cash", "bank_transfer", "card", "other"]).default("cash"),
  externalReference: z.string().max(150).optional(),
  description: z.string().optional(),
});
