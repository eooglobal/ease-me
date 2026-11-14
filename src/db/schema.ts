import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/*
|--------------------------------------------------------------------------
| ENUMS
|--------------------------------------------------------------------------
*/

export const businessTypeEnum = pgEnum("business_type", [
  "retail",
  "supermarket",
  "pharmacy",
  "wholesaler",
  "restaurant",
  "service",
  "other",
]);

export const businessStatusEnum = pgEnum("business_status", [
  "active",
  "suspended",
  "archived",
]);

export const memberStatusEnum = pgEnum("member_status", [
  "invited",
  "active",
  "suspended",
  "removed",
]);

export const productStatusEnum = pgEnum("product_status", [
  "active",
  "inactive",
  "archived",
]);

export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", [
  "opening",
  "received",
  "sold",
  "damaged",
  "missing",
  "returned",
  "adjustment",
]);

export const inventoryCountStatusEnum = pgEnum("inventory_count_status", [
  "draft",
  "in_progress",
  "completed",
  "approved",
  "cancelled",
]);

export const saleStatusEnum = pgEnum("sale_status", [
  "completed",
  "cancelled",
  "voided",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "card",
  "other",
]);

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "draft",
  "ordered",
  "partial",
  "received",
  "cancelled",
]);

export const expenseStatusEnum = pgEnum("expense_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const financialDirectionEnum = pgEnum("financial_direction", [
  "in",
  "out",
]);

export const financialAccountTypeEnum = pgEnum("financial_account_type", [
  "cash",
  "bank",
  "card",
  "receivable",
  "payable",
]);

export const customerTransactionTypeEnum = pgEnum(
  "customer_transaction_type",
  [
    "credit_sale",
    "payment",
    "refund",
    "adjustment",
  ],
);

export const supplierTransactionTypeEnum = pgEnum(
  "supplier_transaction_type",
  [
    "credit_purchase",
    "payment",
    "refund",
    "adjustment",
  ],
);

export const dailyClosingStatusEnum = pgEnum("daily_closing_status", [
  "open",
  "closed",
  "reopened",
]);

export const shiftStatusEnum = pgEnum("shift_status", [
  "open",
  "closed",
  "locked",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "low_stock",
  "cash_discrepancy",
  "inventory_discrepancy",
  "customer_debt",
  "supplier_obligation",
  "expense_approval",
  "staff_activity",
  "system",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "expired",
]);

export const billingIntervalEnum = pgEnum("billing_interval", [
  "monthly",
  "yearly",
]);

export const attachmentProviderEnum = pgEnum("attachment_provider", [
  "r2",
]);

/*
|--------------------------------------------------------------------------
| BUSINESSES
|--------------------------------------------------------------------------
*/

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    businessType: businessTypeEnum("business_type")
      .notNull()
      .default("retail"),
    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    currency: varchar("currency", { length: 3 })
      .notNull()
      .default("NGN"),
    timezone: varchar("timezone", { length: 100 })
      .notNull()
      .default("Africa/Lagos"),
    status: businessStatusEnum("status")
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
);

/*
|--------------------------------------------------------------------------
| ROLES
|--------------------------------------------------------------------------
*/

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id").references(
      () => businesses.id,
      { onDelete: "cascade" },
    ),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    isSystemRole: boolean("is_system_role")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("roles_business_id_idx").on(table.businessId),
  ],
);

/*
|--------------------------------------------------------------------------
| PERMISSIONS
|--------------------------------------------------------------------------
*/

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 150 })
      .notNull()
      .unique(),
    description: text("description"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
);

/*
|--------------------------------------------------------------------------
| ROLE PERMISSIONS
|--------------------------------------------------------------------------
*/

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, {
        onDelete: "cascade",
      }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    primaryKey({
      columns: [
        table.roleId,
        table.permissionId,
      ],
    }),
  ],
);

/*
|--------------------------------------------------------------------------
| BUSINESS MEMBERS
|--------------------------------------------------------------------------
*/

export const businessMembers = pgTable(
  "business_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    userId: text("user_id").notNull(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    status: memberStatusEnum("status")
      .notNull()
      .default("active"),
    joinedAt: timestamp("joined_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("business_members_business_user_idx").on(
      table.businessId,
      table.userId,
    ),
    index("business_members_user_id_idx").on(
      table.userId,
    ),
    index("business_members_business_id_idx").on(
      table.businessId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| PRODUCT CATEGORIES
|--------------------------------------------------------------------------
*/

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "product_categories_business_name_idx",
    ).on(
      table.businessId,
      table.name,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| PRODUCTS
|--------------------------------------------------------------------------
*/

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    categoryId: uuid("category_id").references(
      () => productCategories.id,
      {
        onDelete: "set null",
      },
    ),
    name: varchar("name", { length: 200 }).notNull(),
    sku: varchar("sku", { length: 100 }),
    barcode: varchar("barcode", { length: 100 }),
    description: text("description"),
    unit: varchar("unit", { length: 30 })
      .notNull()
      .default("unit"),
    costPrice: numeric("cost_price", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    sellingPrice: numeric("selling_price", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    currentStock: integer("current_stock")
      .notNull()
      .default(0),
    minimumStockLevel: integer("minimum_stock_level")
      .notNull()
      .default(0),
    trackInventory: boolean("track_inventory")
      .notNull()
      .default(true),
    status: productStatusEnum("status")
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_business_id_idx").on(
      table.businessId,
    ),
    index("products_category_id_idx").on(
      table.categoryId,
    ),
    uniqueIndex("products_business_sku_idx").on(
      table.businessId,
      table.sku,
    ),
    index("products_business_barcode_idx").on(
      table.businessId,
      table.barcode,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| PRODUCT BATCHES & EXPIRY TRACKING (FEFO)
|--------------------------------------------------------------------------
*/

export const productBatches = pgTable(
  "product_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, {
        onDelete: "cascade",
      }),
    batchNumber: varchar("batch_number", { length: 100 }).notNull(),
    quantity: integer("quantity").notNull().default(0),
    costPrice: numeric("cost_price", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    expiryDate: timestamp("expiry_date", {
      withTimezone: true,
    }).notNull(),
    status: varchar("status", { length: 20 })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_batches_business_id_idx").on(table.businessId),
    index("product_batches_product_id_idx").on(table.productId),
    index("product_batches_expiry_date_idx").on(table.expiryDate),
  ],
);

/*
|--------------------------------------------------------------------------
| CUSTOMERS
|--------------------------------------------------------------------------
*/

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    name: varchar("name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    notes: text("notes"),
    status: varchar("status", { length: 30 })
      .notNull()
      .default("active"),
    creditLimit: numeric("credit_limit", {
      precision: 14,
      scale: 2,
    })
      .notNull()
      .default("0"),
    creditTermsDays: integer("credit_terms_days")
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("customers_business_id_idx").on(
      table.businessId,
    ),
    index("customers_business_phone_idx").on(
      table.businessId,
      table.phone,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| SUPPLIERS
|--------------------------------------------------------------------------
*/

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    name: varchar("name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    notes: text("notes"),
    status: varchar("status", { length: 30 })
      .notNull()
      .default("active"),
    creditTermsDays: integer("credit_terms_days")
      .notNull()
      .default(0),
    leadTimeDays: integer("lead_time_days")
      .notNull()
      .default(3),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("suppliers_business_id_idx").on(
      table.businessId,
    ),
    index("suppliers_business_phone_idx").on(
      table.businessId,
      table.phone,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| INVENTORY MOVEMENTS
|--------------------------------------------------------------------------
*/

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    movementType: inventoryMovementTypeEnum(
      "movement_type",
    ).notNull(),
    quantity: integer("quantity").notNull(),
    unitCost: numeric("unit_cost", {
      precision: 14,
      scale: 2,
    }),
    referenceType: varchar("reference_type", {
      length: 50,
    }),
    referenceId: uuid("reference_id"),
    reason: text("reason"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_movements_business_product_idx").on(
      table.businessId,
      table.productId,
    ),
    index("inventory_movements_reference_idx").on(
      table.referenceType,
      table.referenceId,
    ),
    index("inventory_movements_created_at_idx").on(
      table.businessId,
      table.createdAt,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| INVENTORY COUNTS
|--------------------------------------------------------------------------
*/

export const inventoryCounts = pgTable(
  "inventory_counts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    status: inventoryCountStatusEnum("status")
      .notNull()
      .default("draft"),
    countedBy: text("counted_by").notNull(),
    approvedBy: text("approved_by"),
    startedAt: timestamp("started_at", {
      withTimezone: true,
    }),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_counts_business_id_idx").on(
      table.businessId,
    ),
  ],
);

export const inventoryCountItems = pgTable(
  "inventory_count_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inventoryCountId: uuid("inventory_count_id")
      .notNull()
      .references(() => inventoryCounts.id, {
        onDelete: "cascade",
      }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    expectedQuantity: integer(
      "expected_quantity",
    ).notNull(),
    countedQuantity: integer(
      "counted_quantity",
    ).notNull(),
    difference: integer("difference").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "inventory_count_product_idx",
    ).on(
      table.inventoryCountId,
      table.productId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| SALES
|--------------------------------------------------------------------------
*/

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    customerId: uuid("customer_id").references(
      () => customers.id,
      {
        onDelete: "set null",
      },
    ),
    invoiceNumber: varchar("invoice_number", {
      length: 50,
    }).notNull(),
    status: saleStatusEnum("status")
      .notNull()
      .default("completed"),
    subtotal: numeric("subtotal", {
      precision: 14,
      scale: 2,
    }).notNull(),
    discount: numeric("discount", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    tax: numeric("tax", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    total: numeric("total", {
      precision: 14,
      scale: 2,
    }).notNull(),
    paymentStatus: paymentStatusEnum(
      "payment_status",
    )
      .notNull()
      .default("pending"),
    idempotencyKey: varchar("idempotency_key", { length: 100 }),
    soldBy: text("sold_by").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("sales_business_invoice_idx").on(
      table.businessId,
      table.invoiceNumber,
    ),
    uniqueIndex("sales_business_idempotency_idx").on(
      table.businessId,
      table.idempotencyKey,
    ),
    index("sales_business_date_idx").on(
      table.businessId,
      table.createdAt,
    ),
    index("sales_customer_idx").on(
      table.customerId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| SALE ITEMS
|--------------------------------------------------------------------------
*/

export const saleItems = pgTable(
  "sale_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id, {
        onDelete: "cascade",
      }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", {
      precision: 14,
      scale: 2,
    }).notNull(),
    unitCost: numeric("unit_cost", {
      precision: 14,
      scale: 2,
    }).notNull(),
    discount: numeric("discount", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    total: numeric("total", {
      precision: 14,
      scale: 2,
    }).notNull(),
  },
  (table) => [
    index("sale_items_sale_id_idx").on(
      table.saleId,
    ),
    index("sale_items_product_id_idx").on(
      table.productId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| PURCHASES
|--------------------------------------------------------------------------
*/

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    supplierId: uuid("supplier_id").references(
      () => suppliers.id,
      {
        onDelete: "set null",
      },
    ),
    referenceNumber: varchar("reference_number", {
      length: 50,
    }).notNull(),
    status: purchaseStatusEnum("status")
      .notNull()
      .default("draft"),
    subtotal: numeric("subtotal", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    discount: numeric("discount", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    freightCharge: numeric("freight_charge", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    otherFees: numeric("other_fees", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    total: numeric("total", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    notes: text("notes"),
    paymentStatus: paymentStatusEnum(
      "payment_status",
    )
      .notNull()
      .default("pending"),
    purchaseDate: timestamp("purchase_date", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "purchases_business_reference_idx",
    ).on(
      table.businessId,
      table.referenceNumber,
    ),
    index("purchases_business_date_idx").on(
      table.businessId,
      table.purchaseDate,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| PURCHASE ITEMS
|--------------------------------------------------------------------------
*/

export const purchaseItems = pgTable(
  "purchase_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    purchaseId: uuid("purchase_id")
      .notNull()
      .references(() => purchases.id, {
        onDelete: "cascade",
      }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
    receivedQuantity: integer("received_quantity").notNull().default(0),
    unitCost: numeric("unit_cost", {
      precision: 14,
      scale: 2,
    }).notNull(),
    landedUnitCost: numeric("landed_unit_cost", {
      precision: 14,
      scale: 2,
    }),
    total: numeric("total", {
      precision: 14,
      scale: 2,
    }).notNull(),
  },
  (table) => [
    index("purchase_items_purchase_id_idx").on(
      table.purchaseId,
    ),
    index("purchase_items_product_id_idx").on(
      table.productId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| PAYMENTS
|--------------------------------------------------------------------------
*/

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    paymentMethod: paymentMethodEnum(
      "payment_method",
    ).notNull(),
    amount: numeric("amount", {
      precision: 14,
      scale: 2,
    }).notNull(),
    referenceType: varchar("reference_type", {
      length: 50,
    }).notNull(),
    referenceId: uuid("reference_id").notNull(),
    status: paymentStatusEnum("status")
      .notNull()
      .default("completed"),
    externalReference: varchar(
      "external_reference",
      { length: 150 },
    ),
    receivedBy: text("received_by").notNull(),
    paymentDate: timestamp("payment_date", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payments_business_date_idx").on(
      table.businessId,
      table.paymentDate,
    ),
    index("payments_reference_idx").on(
      table.referenceType,
      table.referenceId,
    ),
    uniqueIndex(
      "payments_external_reference_idx",
    ).on(
      table.externalReference,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| EXPENSE CATEGORIES
|--------------------------------------------------------------------------
*/

export const expenseCategories = pgTable(
  "expense_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "expense_categories_business_name_idx",
    ).on(
      table.businessId,
      table.name,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| EXPENSES
|--------------------------------------------------------------------------
*/

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    categoryId: uuid("category_id").references(
      () => expenseCategories.id,
      {
        onDelete: "set null",
      },
    ),
    description: text("description").notNull(),
    amount: numeric("amount", {
      precision: 14,
      scale: 2,
    }).notNull(),
    paymentMethod: paymentMethodEnum(
      "payment_method",
    ).notNull(),
    status: expenseStatusEnum("status")
      .notNull()
      .default("pending"),
    expenseDate: timestamp("expense_date", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    createdBy: text("created_by").notNull(),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", {
      withTimezone: true,
    }),
    receiptUrl: text("receipt_url"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("expenses_business_date_idx").on(
      table.businessId,
      table.expenseDate,
    ),
    index("expenses_business_status_idx").on(
      table.businessId,
      table.status,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| CUSTOMER TRANSACTIONS
|--------------------------------------------------------------------------
*/

export const customerTransactions = pgTable(
  "customer_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    transactionType:
      customerTransactionTypeEnum(
        "transaction_type",
      ).notNull(),
    referenceType: varchar("reference_type", {
      length: 50,
    }),
    referenceId: uuid("reference_id"),
    debit: numeric("debit", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    credit: numeric("credit", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    description: text("description"),
    dueDate: timestamp("due_date", {
      withTimezone: true,
    }),
    proofUrl: text("proof_url"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "customer_transactions_business_customer_idx",
    ).on(
      table.businessId,
      table.customerId,
    ),
    index(
      "customer_transactions_reference_idx",
    ).on(
      table.referenceType,
      table.referenceId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| SUPPLIER TRANSACTIONS
|--------------------------------------------------------------------------
*/

export const supplierTransactions = pgTable(
  "supplier_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    transactionType:
      supplierTransactionTypeEnum(
        "transaction_type",
      ).notNull(),
    referenceType: varchar("reference_type", {
      length: 50,
    }),
    referenceId: uuid("reference_id"),
    debit: numeric("debit", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    credit: numeric("credit", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    description: text("description"),
    dueDate: timestamp("due_date", {
      withTimezone: true,
    }),
    proofUrl: text("proof_url"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "supplier_transactions_business_supplier_idx",
    ).on(
      table.businessId,
      table.supplierId,
    ),
    index(
      "supplier_transactions_reference_idx",
    ).on(
      table.referenceType,
      table.referenceId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| FINANCIAL TRANSACTIONS
|--------------------------------------------------------------------------
*/

export const financialTransactions = pgTable(
  "financial_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    transactionType: varchar(
      "transaction_type",
      { length: 50 },
    ).notNull(),
    referenceType: varchar("reference_type", {
      length: 50,
    }),
    referenceId: uuid("reference_id"),
    amount: numeric("amount", {
      precision: 14,
      scale: 2,
    }).notNull(),
    direction: financialDirectionEnum(
      "direction",
    ).notNull(),
    accountType: financialAccountTypeEnum(
      "account_type",
    ).notNull(),
    description: text("description"),
    transactionDate: timestamp(
      "transaction_date",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "financial_transactions_business_date_idx",
    ).on(
      table.businessId,
      table.transactionDate,
    ),
    index(
      "financial_transactions_reference_idx",
    ).on(
      table.referenceType,
      table.referenceId,
    ),
    index(
      "financial_transactions_account_idx",
    ).on(
      table.businessId,
      table.accountType,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| DAILY CLOSINGS
|--------------------------------------------------------------------------
*/

export const dailyClosings = pgTable(
  "daily_closings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    businessDate: timestamp("business_date", {
      withTimezone: true,
    }).notNull(),
    openingCash: numeric("opening_cash", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    expectedCash: numeric("expected_cash", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    actualCash: numeric("actual_cash", {
      precision: 14,
      scale: 2,
    }),
    cashVariance: numeric("cash_variance", {
      precision: 14,
      scale: 2,
    }),
    status: dailyClosingStatusEnum("status")
      .notNull()
      .default("open"),
    closedBy: text("closed_by"),
    closedAt: timestamp("closed_at", {
      withTimezone: true,
    }),
    reopenedBy: text("reopened_by"),
    reopenedAt: timestamp("reopened_at", {
      withTimezone: true,
    }),
    reopenReason: text("reopen_reason"),
    notes: text("notes"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "daily_closings_business_date_idx",
    ).on(
      table.businessId,
      table.businessDate,
    ),
  ],
);

export const shiftSessions = pgTable(
  "shift_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    cashierId: text("cashier_id").notNull(),
    cashierName: text("cashier_name").notNull(),
    registerId: varchar("register_id", { length: 50 }).notNull().default("POS-01"),
    startTime: timestamp("start_time", { withTimezone: true }).notNull().defaultNow(),
    endTime: timestamp("end_time", { withTimezone: true }),
    openingFloat: numeric("opening_float", { precision: 14, scale: 2 }).notNull().default("0"),
    cashSales: numeric("cash_sales", { precision: 14, scale: 2 }).notNull().default("0"),
    cashPayouts: numeric("cash_payouts", { precision: 14, scale: 2 }).notNull().default("0"),
    cashRepayments: numeric("cash_repayments", { precision: 14, scale: 2 }).notNull().default("0"),
    digitalSales: numeric("digital_sales", { precision: 14, scale: 2 }).notNull().default("0"),
    expectedCash: numeric("expected_cash", { precision: 14, scale: 2 }).notNull().default("0"),
    actualCash: numeric("actual_cash", { precision: 14, scale: 2 }),
    variance: numeric("variance", { precision: 14, scale: 2 }),
    status: shiftStatusEnum("status").notNull().default("open"),
    varianceReason: text("variance_reason"),
    notes: text("notes"),
    managerCoSignId: text("manager_co_sign_id"),
    managerCoSignName: text("manager_co_sign_name"),
    managerCoSignedAt: timestamp("manager_co_signed_at", { withTimezone: true }),
    managerCoSignNotes: text("manager_co_sign_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("shift_sessions_business_idx").on(table.businessId),
    index("shift_sessions_cashier_idx").on(table.businessId, table.cashierId),
    index("shift_sessions_status_idx").on(table.businessId, table.status),
  ]
);

/*
|--------------------------------------------------------------------------
| DAILY CLOSING ENTRIES
|--------------------------------------------------------------------------
*/

export const dailyClosingEntries = pgTable(
  "daily_closing_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dailyClosingId: uuid("daily_closing_id")
      .notNull()
      .references(() => dailyClosings.id, {
        onDelete: "cascade",
      }),
    entryType: varchar("entry_type", {
      length: 50,
    }).notNull(),
    referenceType: varchar("reference_type", {
      length: 50,
    }),
    referenceId: uuid("reference_id"),
    amount: numeric("amount", {
      precision: 14,
      scale: 2,
    }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "daily_closing_entries_closing_idx",
    ).on(
      table.dailyClosingId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| AUDIT LOGS
|--------------------------------------------------------------------------
*/

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    userId: text("user_id").notNull(),
    action: varchar("action", {
      length: 100,
    }).notNull(),
    entityType: varchar("entity_type", {
      length: 100,
    }).notNull(),
    entityId: uuid("entity_id"),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    metadata: jsonb("metadata"),
    ipAddress: varchar("ip_address", {
      length: 45,
    }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "audit_logs_business_created_idx",
    ).on(
      table.businessId,
      table.createdAt,
    ),
    index(
      "audit_logs_entity_idx",
    ).on(
      table.entityType,
      table.entityId,
    ),
    index(
      "audit_logs_user_idx",
    ).on(
      table.userId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| NOTIFICATIONS
|--------------------------------------------------------------------------
*/

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    userId: text("user_id").notNull(),
    type: notificationTypeEnum("type")
      .notNull(),
    title: varchar("title", {
      length: 200,
    }).notNull(),
    message: text("message").notNull(),
    entityType: varchar("entity_type", {
      length: 100,
    }),
    entityId: uuid("entity_id"),
    readAt: timestamp("read_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "notifications_user_read_idx",
    ).on(
      table.userId,
      table.readAt,
    ),
    index(
      "notifications_business_idx",
    ).on(
      table.businessId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| ATTACHMENTS
|--------------------------------------------------------------------------
*/

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    entityType: varchar("entity_type", {
      length: 100,
    }).notNull(),
    entityId: uuid("entity_id").notNull(),
    storageProvider: attachmentProviderEnum(
      "storage_provider",
    )
      .notNull()
      .default("r2"),
    storageKey: text("storage_key").notNull(),
    originalFilename: varchar(
      "original_filename",
      { length: 255 },
    ).notNull(),
    mimeType: varchar("mime_type", {
      length: 100,
    }).notNull(),
    fileSize: integer("file_size").notNull(),
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "attachments_entity_idx",
    ).on(
      table.entityType,
      table.entityId,
    ),
    index(
      "attachments_business_idx",
    ).on(
      table.businessId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| SUBSCRIPTION PLANS
|--------------------------------------------------------------------------
*/

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", {
      length: 50,
    }).notNull(),
    description: text("description"),
    price: numeric("price", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),
    billingInterval: billingIntervalEnum(
      "billing_interval",
    ),
    status: varchar("status", {
      length: 30,
    })
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
);

/*
|--------------------------------------------------------------------------
| PLAN FEATURES
|--------------------------------------------------------------------------
*/

export const planFeatures = pgTable(
  "plan_features",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, {
        onDelete: "cascade",
      }),
    featureKey: varchar("feature_key", {
      length: 100,
    }).notNull(),
    limitValue: integer("limit_value"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "plan_features_plan_feature_idx",
    ).on(
      table.planId,
      table.featureKey,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| SUBSCRIPTIONS
|--------------------------------------------------------------------------
*/

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id),
    provider: varchar("provider", {
      length: 50,
    }),
    providerSubscriptionId: varchar(
      "provider_subscription_id",
      { length: 150 },
    ),
    status: subscriptionStatusEnum("status")
      .notNull(),
    startedAt: timestamp("started_at", {
      withTimezone: true,
    }),
    currentPeriodStart: timestamp(
      "current_period_start",
      {
        withTimezone: true,
      },
    ),
    currentPeriodEnd: timestamp(
      "current_period_end",
      {
        withTimezone: true,
      },
    ),
    cancelledAt: timestamp("cancelled_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "subscriptions_business_idx",
    ).on(
      table.businessId,
    ),
    uniqueIndex(
      "subscriptions_provider_subscription_idx",
    ).on(
      table.providerSubscriptionId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| SUBSCRIPTION EVENTS
|--------------------------------------------------------------------------
*/

export const subscriptionEvents = pgTable(
  "subscription_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, {
        onDelete: "cascade",
      }),
    subscriptionId: uuid("subscription_id")
      .references(() => subscriptions.id, {
        onDelete: "set null",
      }),
    eventType: varchar("event_type", {
      length: 100,
    }).notNull(),
    providerEventId: varchar(
      "provider_event_id",
      { length: 150 },
    ),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "subscription_events_provider_event_idx",
    ).on(
      table.providerEventId,
    ),
    index(
      "subscription_events_business_idx",
    ).on(
      table.businessId,
    ),
  ],
);

/*
|--------------------------------------------------------------------------
| PLATFORM ACCESS CONTROL & CONSOLE (SECTION 3, 4, 7)
|--------------------------------------------------------------------------
*/

export const platformRoleEnum = pgEnum("platform_role", [
  "owner",
  "admin",
  "finance",
  "support_lead",
  "support_agent",
  "content",
  "security",
  "engineer",
  "auditor",
  "analyst",
]);

export const platformStaffStatusEnum = pgEnum("platform_staff_status", [
  "active",
  "deactivated",
]);

export const approvalRequestStatusEnum = pgEnum("approval_request_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
  "cancelled",
]);

export const platformStaff = pgTable(
  "platform_staff",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    platformRole: platformRoleEnum("platform_role").notNull(),
    status: platformStaffStatusEnum("status").notNull().default("active"),
    mfaEnabled: boolean("mfa_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("platform_staff_email_idx").on(table.email),
    index("platform_staff_role_idx").on(table.platformRole),
  ]
);

export const platformPermissions = pgTable(
  "platform_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    area: varchar("area", { length: 50 }).notNull(),
    actionType: varchar("action_type", { length: 20 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("platform_permissions_area_idx").on(table.area),
  ]
);

export const platformRolePermissions = pgTable(
  "platform_role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    role: platformRoleEnum("role").notNull(),
    permissionKey: varchar("permission_key", { length: 100 })
      .notNull()
      .references(() => platformPermissions.key, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("platform_role_permissions_role_idx").on(table.role),
  ]
);

export const approvalRequests = pgTable(
  "approval_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actionKey: varchar("action_key", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: varchar("entity_id", { length: 150 }),
    requesterId: uuid("requester_id").notNull().references(() => platformStaff.id),
    requesterName: varchar("requester_name", { length: 150 }).notNull(),
    requesterRole: platformRoleEnum("requester_role").notNull(),
    reason: text("reason").notNull(),
    beforeState: jsonb("before_state"),
    afterState: jsonb("after_state").notNull(),
    status: approvalRequestStatusEnum("status").notNull().default("pending"),
    approverId: uuid("approver_id").references(() => platformStaff.id),
    approverName: varchar("approver_name", { length: 150 }),
    rejectionComment: text("rejection_comment"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("approval_requests_status_idx").on(table.status),
    index("approval_requests_requester_idx").on(table.requesterId),
  ]
);

export const emergencyOverrides = pgTable(
  "emergency_overrides",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull().references(() => platformStaff.id),
    actionKey: varchar("action_key", { length: 100 }).notNull(),
    reason: text("reason").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    notifiedOwnerEmails: jsonb("notified_owner_emails").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const platformAuditLogs = pgTable(
  "platform_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    staffId: uuid("staff_id").references(() => platformStaff.id),
    staffEmail: varchar("staff_email", { length: 255 }).notNull(),
    staffRole: varchar("staff_role", { length: 50 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: varchar("entity_id", { length: 150 }),
    previousValue: jsonb("previous_value"),
    newValue: jsonb("new_value"),
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("platform_audit_logs_staff_idx").on(table.staffId),
    index("platform_audit_logs_action_idx").on(table.action),
    index("platform_audit_logs_created_idx").on(table.createdAt),
  ]
);

export const discountCodes = pgTable(
  "discount_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    discountType: varchar("discount_type", { length: 20 }).notNull(),
    discountValue: numeric("discount_value", { precision: 12, scale: 2 }).notNull(),
    eligiblePlans: jsonb("eligible_plans").notNull(),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("discount_codes_code_idx").on(table.code),
  ]
);

export const platformInvoices = pgTable(
  "platform_invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
    tenantId: uuid("tenant_id").notNull(),
    tenantName: varchar("tenant_name", { length: 150 }).notNull(),
    planName: varchar("plan_name", { length: 50 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("NGN"),
    status: varchar("status", { length: 30 }).notNull().default("paid"),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull().default("paystack_recurring"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    pdfUrl: text("pdf_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("platform_invoices_tenant_idx").on(table.tenantId),
    index("platform_invoices_status_idx").on(table.status),
  ]
);

/*
|--------------------------------------------------------------------------
| PLATFORM CONFIGURATION & SETTINGS (Section 7)
|--------------------------------------------------------------------------
*/

export const platformSettings = pgTable(
  "platform_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    platformName: varchar("platform_name", { length: 100 }).notNull().default("Ease Me"),
    supportEmail: varchar("support_email", { length: 255 }).notNull().default("support@easeme.ng"),
    supportWhatsapp: varchar("support_whatsapp", { length: 50 }).notNull().default("+234 800 EASE ME"),
    logoUrl: text("logo_url"),
    faviconUrl: text("favicon_url"),
    defaultCurrency: varchar("default_currency", { length: 3 }).notNull().default("NGN"),
    defaultTimezone: varchar("default_timezone", { length: 50 }).notNull().default("Africa/Lagos"),
    dateFormat: varchar("date_format", { length: 30 }).notNull().default("DD/MM/YYYY"),
    defaultTaxRate: numeric("default_tax_rate", { precision: 5, scale: 2 }).notNull().default("7.50"),
    supportedCountries: jsonb("supported_countries").notNull().$type<string[]>(),
    trialLengthDays: integer("trial_length_days").notNull().default(14),
    cardRequiredForTrial: boolean("card_required_for_trial").notNull().default(false),
    gracePeriodDays: integer("grace_period_days").notNull().default(3),
    signupMode: varchar("signup_mode", { length: 30 }).notNull().default("open"), // open | invite_only | closed
    approvalThresholdAmount: numeric("approval_threshold_amount", { precision: 12, scale: 2 }).notNull().default("20000.00"),
    maintenanceMode: boolean("maintenance_mode").notNull().default(false),
    maintenanceMessage: text("maintenance_message").default("Ease Me is currently undergoing scheduled platform maintenance. Services will resume shortly."),
    maintenanceStartedAt: timestamp("maintenance_started_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    description: text("description").notNull(),
    owner: varchar("owner", { length: 150 }).notNull(),
    defaultState: boolean("default_state").notNull().default(false),
    enabled: boolean("enabled").notNull().default(false),
    rolloutPercentage: integer("rollout_percentage").notNull().default(0),
    reviewDate: timestamp("review_date", { withTimezone: true }).notNull(),
    eligiblePlans: jsonb("eligible_plans").notNull().$type<string[]>(),
    tenantAllowlist: jsonb("tenant_allowlist").notNull().$type<string[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("feature_flags_key_idx").on(table.key),
  ]
);

export const rateLimitSettings = pgTable(
  "rate_limit_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    checkoutLimit: integer("checkout_limit").notNull().default(30), // requests/min
    portalLimit: integer("portal_limit").notNull().default(10), // requests/10s
    authLimit: integer("auth_limit").notNull().default(5), // requests/min
    maxUploadSizeMb: integer("max_upload_size_mb").notNull().default(10),
    permittedFileTypes: jsonb("permitted_file_types").notNull().$type<string[]>(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

/*
|--------------------------------------------------------------------------
| CONTENT MANAGEMENT & LIFECYCLE (Section 6.7 & Section 7)
|--------------------------------------------------------------------------
*/

export const contentItems = pgTable(
  "content_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentType: varchar("content_type", { length: 50 }).notNull(), // announcement | help_article | template | legal | onboarding | preset
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("draft"), // draft | scheduled | published | archived
    currentVersion: integer("current_version").notNull().default(1),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    createdBy: varchar("created_by", { length: 150 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("content_items_type_idx").on(table.contentType),
    index("content_items_status_idx").on(table.status),
  ]
);

export const contentVersions = pgTable(
  "content_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentItemId: uuid("content_item_id").notNull().references(() => contentItems.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    snapshotData: jsonb("snapshot_data").$type<Record<string, any>>(),
    authorStaffId: varchar("author_staff_id", { length: 150 }).notNull(),
    authorStaffName: varchar("author_staff_name", { length: 150 }).notNull(),
    changeSummary: text("change_summary"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("content_versions_item_idx").on(table.contentItemId),
  ]
);

export const messageTemplates = pgTable(
  "message_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateKey: varchar("template_key", { length: 100 }).notNull().unique(),
    channel: varchar("channel", { length: 30 }).notNull(), // email | sms | whatsapp | receipt
    name: varchar("name", { length: 150 }).notNull(),
    subject: varchar("subject", { length: 255 }),
    body: text("body").notNull(),
    allowedVariables: jsonb("allowed_variables").notNull().$type<string[]>(),
    activeVersion: integer("active_version").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("message_templates_key_idx").on(table.templateKey),
  ]
);

export const legalDocuments = pgTable(
  "legal_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentType: varchar("document_type", { length: 50 }).notNull().unique(), // terms_of_service | privacy_policy | data_processing_terms
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    versionNumber: varchar("version_number", { length: 30 }).notNull().default("1.0"),
    effectiveDate: timestamp("effective_date", { withTimezone: true }).notNull(),
    approvalRequestId: varchar("approval_request_id", { length: 100 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const legalAcceptances = pgTable(
  "legal_acceptances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id").notNull(),
    versionNumber: varchar("version_number", { length: 30 }).notNull(),
    tenantId: uuid("tenant_id").notNull(),
    ownerId: varchar("owner_id", { length: 150 }).notNull(),
    ownerEmail: varchar("owner_email", { length: 255 }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: varchar("ip_address", { length: 50 }),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("legal_acceptances_tenant_idx").on(table.tenantId),
    index("legal_acceptances_owner_idx").on(table.ownerId),
  ]
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    severity: varchar("severity", { length: 20 }).notNull().default("info"), // info | warning | critical
    audienceType: varchar("audience_type", { length: 50 }).notNull().default("all"), // all | one_plan | one_business_type | custom_list
    targetAudience: jsonb("target_audience").$type<string[]>(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    isDismissible: boolean("is_dismissible").notNull().default(true),
    status: varchar("status", { length: 30 }).notNull().default("draft"), // draft | scheduled | published | archived
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const businessPresets = pgTable(
  "business_presets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessType: varchar("business_type", { length: 50 }).notNull().unique(), // pharmacy | supermarket | restaurant | boutique | general_retail
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    productCategories: jsonb("product_categories").notNull().$type<string[]>(),
    expenseCategories: jsonb("expense_categories").notNull().$type<string[]>(),
    defaultTaxRate: numeric("default_tax_rate", { precision: 5, scale: 2 }).notNull().default("7.50"),
    unitsOfMeasure: jsonb("units_of_measure").notNull().$type<string[]>(),
    reorderDefaults: jsonb("reorder_defaults").$type<Record<string, any>>(),
    batchTracking: boolean("batch_tracking").notNull().default(false),
    expiryTracking: boolean("expiry_tracking").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const onboardingSteps = pgTable(
  "onboarding_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stepKey: varchar("step_key", { length: 100 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    completionRule: varchar("completion_rule", { length: 100 }).notNull(), // first_product_created | first_sale_completed | store_profile_completed | team_member_invited
    sortOrder: integer("sort_order").notNull().default(1),
    isMandatory: boolean("is_mandatory").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

/*
|--------------------------------------------------------------------------
| SUPPORT & CONSENT-BASED ACCESS (Section 6.9, Section 7 & Section 8)
|--------------------------------------------------------------------------
*/

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    tenantName: varchar("tenant_name", { length: 150 }).notNull(),
    ownerEmail: varchar("owner_email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    description: text("description").notNull(),
    priority: varchar("priority", { length: 20 }).notNull().default("medium"), // urgent | high | medium | low
    status: varchar("status", { length: 30 }).notNull().default("open"), // open | in_progress | waiting_on_tenant | resolved | closed
    assigneeStaffId: varchar("assignee_staff_id", { length: 150 }),
    assigneeStaffName: varchar("assignee_staff_name", { length: 150 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("support_tickets_tenant_idx").on(table.tenantId),
    index("support_tickets_status_idx").on(table.status),
    index("support_tickets_priority_idx").on(table.priority),
    index("support_tickets_created_idx").on(table.createdAt),
  ]
);

export const supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
    authorType: varchar("author_type", { length: 20 }).notNull(), // staff | tenant
    authorId: varchar("author_id", { length: 150 }).notNull(),
    authorName: varchar("author_name", { length: 150 }).notNull(),
    authorRole: varchar("author_role", { length: 50 }).notNull(),
    message: text("message").notNull(),
    isInternalNote: boolean("is_internal_note").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("support_messages_ticket_idx").on(table.ticketId),
  ]
);

export const supportAccessGrants = pgTable(
  "support_access_grants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    tenantName: varchar("tenant_name", { length: 150 }).notNull(),
    grantedByOwnerId: varchar("granted_by_owner_id", { length: 150 }).notNull(),
    grantedByOwnerEmail: varchar("granted_by_owner_email", { length: 255 }).notNull(),
    assignedStaffId: varchar("assigned_staff_id", { length: 150 }).notNull(),
    assignedStaffName: varchar("assigned_staff_name", { length: 150 }).notNull(),
    scope: varchar("scope", { length: 50 }).notNull().default("config_read_only"), // config_read_only
    durationHours: integer("duration_hours").notNull().default(2), // max 24
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active | expired | revoked
    pageViewsCount: integer("page_views_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("support_access_grants_tenant_idx").on(table.tenantId),
    index("support_access_grants_staff_idx").on(table.assignedStaffId),
    index("support_access_grants_status_idx").on(table.status),
  ]
);

/*
|--------------------------------------------------------------------------
| SAFETY, HEALTH & COMPLIANCE (Section 6.9, Section 7 & Section 9)
|--------------------------------------------------------------------------
*/

export const dataRequests = pgTable(
  "data_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    tenantName: varchar("tenant_name", { length: 150 }).notNull(),
    ownerEmail: varchar("owner_email", { length: 255 }).notNull(),
    requestType: varchar("request_type", { length: 30 }).notNull(), // export | deletion
    status: varchar("status", { length: 30 }).notNull().default("pending_preparation"), // pending_preparation | ready_for_download | retention_window | pending_dual_approval | completed | cancelled
    statutoryDeadline: timestamp("statutory_deadline", { withTimezone: true }).notNull(),
    downloadUrl: text("download_url"),
    downloadExpiresAt: timestamp("download_expires_at", { withTimezone: true }),
    retentionEndsAt: timestamp("retention_ends_at", { withTimezone: true }),
    approvalRequestId: varchar("approval_request_id", { length: 100 }),
    completionRecord: jsonb("completion_record").$type<Record<string, any>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("data_requests_tenant_idx").on(table.tenantId),
    index("data_requests_status_idx").on(table.status),
  ]
);

export const systemHealthChecks = pgTable(
  "system_health_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceName: varchar("service_name", { length: 100 }).notNull(), // postgres | redis | cloudflare_r2 | paystack | background_queue
    status: varchar("status", { length: 20 }).notNull().default("healthy"), // healthy | degraded | critical
    latencyMs: integer("latency_ms").notNull(),
    details: jsonb("details").$type<Record<string, any>>(),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("system_health_checks_service_idx").on(table.serviceName),
  ]
);

/*
|--------------------------------------------------------------------------
| RELATIONS
|--------------------------------------------------------------------------
*/

export const businessesRelations = relations(businesses, ({ many }) => ({
  roles: many(roles),
  members: many(businessMembers),
  products: many(products),
  categories: many(productCategories),
  customers: many(customers),
  suppliers: many(suppliers),
  sales: many(sales),
  purchases: many(purchases),
  expenses: many(expenses),
  inventoryMovements: many(inventoryMovements),
  dailyClosings: many(dailyClosings),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  business: one(businesses, {
    fields: [products.businessId],
    references: [businesses.id],
  }),
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  inventoryMovements: many(inventoryMovements),
  saleItems: many(saleItems),
  purchaseItems: many(purchaseItems),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  business: one(businesses, {
    fields: [sales.businessId],
    references: [businesses.id],
  }),
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

/*
|--------------------------------------------------------------------------
| INFERRED TYPES
|--------------------------------------------------------------------------
*/

export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type NewInventoryMovement = typeof inventoryMovements.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

export type DailyClosing = typeof dailyClosings.$inferSelect;
export type NewDailyClosing = typeof dailyClosings.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type ProductBatch = typeof productBatches.$inferSelect;
export type NewProductBatch = typeof productBatches.$inferInsert;

export type ShiftSession = typeof shiftSessions.$inferSelect;
export type NewShiftSession = typeof shiftSessions.$inferInsert;

export type PlatformStaff = typeof platformStaff.$inferSelect;
export type NewPlatformStaff = typeof platformStaff.$inferInsert;

export type PlatformPermission = typeof platformPermissions.$inferSelect;
export type NewPlatformPermission = typeof platformPermissions.$inferInsert;

export type PlatformRolePermission = typeof platformRolePermissions.$inferSelect;
export type NewPlatformRolePermission = typeof platformRolePermissions.$inferInsert;

export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type NewApprovalRequest = typeof approvalRequests.$inferInsert;

export type EmergencyOverride = typeof emergencyOverrides.$inferSelect;
export type NewEmergencyOverride = typeof emergencyOverrides.$inferInsert;

export type PlatformAuditLog = typeof platformAuditLogs.$inferSelect;
export type NewPlatformAuditLog = typeof platformAuditLogs.$inferInsert;

export type DiscountCode = typeof discountCodes.$inferSelect;
export type NewDiscountCode = typeof discountCodes.$inferInsert;

export type PlatformInvoice = typeof platformInvoices.$inferSelect;
export type NewPlatformInvoice = typeof platformInvoices.$inferInsert;

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type NewPlatformSetting = typeof platformSettings.$inferInsert;

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;

export type RateLimitSetting = typeof rateLimitSettings.$inferSelect;
export type NewRateLimitSetting = typeof rateLimitSettings.$inferInsert;

export type ContentItem = typeof contentItems.$inferSelect;
export type NewContentItem = typeof contentItems.$inferInsert;

export type ContentVersion = typeof contentVersions.$inferSelect;
export type NewContentVersion = typeof contentVersions.$inferInsert;

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type NewMessageTemplate = typeof messageTemplates.$inferInsert;

export type LegalDocument = typeof legalDocuments.$inferSelect;
export type NewLegalDocument = typeof legalDocuments.$inferInsert;

export type LegalAcceptance = typeof legalAcceptances.$inferSelect;
export type NewLegalAcceptance = typeof legalAcceptances.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type BusinessPreset = typeof businessPresets.$inferSelect;
export type NewBusinessPreset = typeof businessPresets.$inferInsert;

export type OnboardingStep = typeof onboardingSteps.$inferSelect;
export type NewOnboardingStep = typeof onboardingSteps.$inferInsert;

export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;

export type SupportMessage = typeof supportMessages.$inferSelect;
export type NewSupportMessage = typeof supportMessages.$inferInsert;

export type SupportAccessGrant = typeof supportAccessGrants.$inferSelect;
export type NewSupportAccessGrant = typeof supportAccessGrants.$inferInsert;

export type DataRequest = typeof dataRequests.$inferSelect;
export type NewDataRequest = typeof dataRequests.$inferInsert;

export type SystemHealthCheck = typeof systemHealthChecks.$inferSelect;
export type NewSystemHealthCheck = typeof systemHealthChecks.$inferInsert;
