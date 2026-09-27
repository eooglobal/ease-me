import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  unit: z.string().max(30).default("unit"),
  costPrice: z.number().min(0, "Cost price cannot be negative").default(0),
  sellingPrice: z.number().min(0, "Selling price cannot be negative").default(0),
  initialStock: z.number().int().min(0).default(0),
  minimumStockLevel: z.number().int().min(0).default(0),
  trackInventory: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial().omit({ initialStock: true });

export const inventoryMovementSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  movementType: z.enum([
    "opening",
    "received",
    "sold",
    "damaged",
    "missing",
    "returned",
    "adjustment",
  ]),
  quantity: z.number().int().refine((val) => val !== 0, {
    message: "Quantity cannot be zero",
  }),
  unitCost: z.number().min(0).optional(),
  referenceType: z.string().max(50).optional(),
  referenceId: z.string().uuid().optional(),
  reason: z.string().optional(),
});

export const createInventoryCountSchema = z.object({
  notes: z.string().optional(),
});

export const submitCountItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  countedQuantity: z.number().int().min(0, "Counted quantity must be non-negative"),
  reason: z.string().optional(),
});

export const submitInventoryCountSchema = z.object({
  countId: z.string().uuid("Invalid count ID"),
  items: z.array(submitCountItemSchema).min(1, "At least one item must be counted"),
});
