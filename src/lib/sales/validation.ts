import { z } from "zod";

export const saleItemInputSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  discount: z.number().min(0, "Discount cannot be negative").default(0),
});

export const paymentInputSchema = z.object({
  paymentMethod: z.enum(["cash", "bank_transfer", "card", "other"]),
  amount: z.number().min(0.01, "Payment amount must be greater than zero"),
  externalReference: z.string().max(150).optional(),
});

export const createSaleSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID").optional().nullable(),
  items: z.array(saleItemInputSchema).min(1, "At least one product item is required"),
  discount: z.number().min(0, "Discount cannot be negative").default(0),
  tax: z.number().min(0, "Tax cannot be negative").default(0),
  isCreditSale: z.boolean().default(false),
  payments: z.array(paymentInputSchema).default([]),
  idempotencyKey: z.string().max(100).optional(),
});

export const cancelOrVoidSaleSchema = z.object({
  saleId: z.string().uuid("Invalid sale ID"),
  reason: z.string().min(1, "Reason for cancellation is required").max(500),
});
