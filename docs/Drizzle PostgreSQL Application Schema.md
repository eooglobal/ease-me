
# Drizzle PostgreSQL Application Schema

## File: `src/db/schema.ts`

```typescript
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
|
| userId references the Better Auth user table.
| It is intentionally represented as text because Better Auth
| uses string user IDs.
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

    /*
     * This is a cached current quantity.
     * The inventory movement ledger remains the source of truth.
     */
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

    /*
     * Positive for stock entering inventory.
     * Negative for stock leaving inventory.
     */
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

    /*
     * Historical cost at time of sale.
     */
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

    total: numeric("total", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),

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

    unitCost: numeric("unit_cost", {
      precision: 14,
      scale: 2,
    }).notNull(),

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

    /*
     * Debit increases what customer owes.
     * Credit reduces what customer owes.
     */
    debit: numeric("debit", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),

    credit: numeric("credit", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),

    description: text("description"),

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

    /*
     * Credit increases what the business owes.
     * Debit reduces what the business owes.
     */
    debit: numeric("debit", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),

    credit: numeric("credit", {
      precision: 14,
      scale: 2,
    }).notNull().default("0"),

    description: text("description"),

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
```

# 2. Drizzle Configuration

## File: `drizzle.config.ts`

```typescript
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",

  out: "./drizzle",

  dialect: "postgresql",

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  strict: true,

  verbose: true,
});
```

# 3. Database Connection

## File: `src/db/index.ts`

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, {
  schema,
});

export { pool };
```

# 4. Environment Variable

```env
DATABASE_URL=postgresql://app_user:password@postgres:5432/business_app
```

The actual production credentials should never be committed to GitHub.

Coolify should inject the production value as an environment variable.

# 5. Package Dependencies

The initial database dependencies are:

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

# 6. Useful Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

For normal development:

```bash
npm run db:generate
npm run db:migrate
```

Use `db:push` mainly during rapid local experimentation. Production should use versioned migrations.

# 7. Better Auth

Better Auth should own authentication related tables such as:

```text
user
session
account
verification
```

Those tables should be generated according to the Better Auth configuration rather than manually duplicating them in this application schema.

Our application then references:

```text
business_members.user_id
audit_logs.user_id
notifications.user_id
```

using the Better Auth user's string ID.

This keeps authentication concerns separate from business data.

# 8. Seed Data

The initial seed should create the system permissions.

```typescript
export const SYSTEM_PERMISSIONS = [
  "sales.view",
  "sales.create",
  "sales.edit",
  "sales.cancel",

  "expenses.view",
  "expenses.create",
  "expenses.edit",
  "expenses.approve",

  "inventory.view",
  "inventory.receive",
  "inventory.adjust",
  "inventory.damage",

  "customers.view",
  "customers.manage",
  "customers.record_payment",

  "suppliers.view",
  "suppliers.manage",
  "suppliers.record_payment",

  "reports.view",
  "financials.view",

  "staff.view",
  "staff.manage",

  "reconciliation.view",
  "reconciliation.perform",
  "reconciliation.close",
  "reconciliation.reopen",

  "audit.view",

  "settings.view",
  "settings.manage",
] as const;
```

System roles should initially map approximately as follows:

```text
OWNER
All permissions

ADMIN
Most operational and management permissions

CASHIER
sales.view
sales.create
customers.view
customers.record_payment
reconciliation.view
reconciliation.perform

INVENTORY_MANAGER
inventory.view
inventory.receive
inventory.adjust
inventory.damage
suppliers.view
suppliers.manage

ACCOUNTANT
sales.view
expenses.view
customers.view
suppliers.view
reports.view
financials.view
audit.view
```

The exact permission matrix should remain configurable in the application.

# 9. Critical Business Transactions

The application services should create related records inside database transactions.

For example, completing a sale should conceptually execute:

```text
BEGIN

Create Sale
Create Sale Items

Create Inventory Movements

Create Payment records

Create Financial Transactions

If credit:
    Create Customer Transaction

Create Audit Log

COMMIT
```

If any operation fails:

```text
ROLLBACK
```

Nothing should be left half completed.

The same principle applies to purchases, expenses, customer payments, supplier payments and inventory adjustments.

# 10. Sale Transaction Example

A ₦100,000 cash sale could create:

```text
sales
    total = 100000

sale_items
    quantity = 10
    unit_price = 10000
    unit_cost = 7000

inventory_movements
    movement_type = sold
    quantity = -10

payments
    payment_method = cash
    amount = 100000

financial_transactions
    transaction_type = SALE
    amount = 100000
    direction = in
    account_type = cash
```

The gross profit is then:

```text
Revenue
₦100,000

COGS
₦70,000

Gross Profit
₦30,000
```

# 11. Credit Sale Example

A ₦100,000 sale where the customer pays nothing immediately:

```text
sales
    total = 100000
    payment_status = pending

inventory_movements
    quantity = -10

customer_transactions
    transaction_type = credit_sale
    debit = 100000
    credit = 0
```

When the customer pays ₦40,000:

```text
payments
    amount = 40000

customer_transactions
    transaction_type = payment
    debit = 0
    credit = 40000

financial_transactions
    amount = 40000
    direction = in
    account_type = cash
```

Customer balance:

```text
₦100,000
− ₦40,000
= ₦60,000
```

# 12. Inventory Principle

`products.current_stock` is deliberately present as a cached value for fast dashboard and product queries.

It is **not** the historical source of truth.

The source of truth is:

```text
inventory_movements
```

Therefore:

```text
Current Stock
=
SUM(all valid inventory movements)
```

The application can update `current_stock` within the same database transaction that creates the movement.

That means:

```text
Inventory movement
+
current_stock update
```

must succeed or fail together.

# 13. Financial Principle

Do not allow the UI to directly create arbitrary financial transactions.

For example, the frontend should not be able to say:

```text
amount = 500000
direction = in
accountType = cash
```

and directly insert that into `financial_transactions`.

Instead:

```text
Record Sale
      ↓
Business Service
      ↓
Validated Transaction
      ↓
Financial Transaction
```

This prevents users from manipulating the financial ledger directly.

The same applies to inventory.

Users create:

```text
Sale
Purchase
Damage
Adjustment
Payment
Expense
```

and the application creates the appropriate downstream records.

# 14. Tenant Isolation

Every business owned table has:

```text
business_id
```

The application must establish the active business from the authenticated user's membership.

A request such as:

```text
GET /api/products?businessId=ABC
```

should not be trusted simply because the browser supplied `ABC`.

The server should effectively perform:

```text
Current User
    ↓
Business Membership
    ↓
Authorized Business
    ↓
Query
```

The query should always contain the appropriate tenant restriction.

# 15. PostgreSQL RLS

We should also add PostgreSQL Row Level Security through a migration.

The important point is that RLS is a PostgreSQL feature. It does not require Supabase.

The eventual production setup should have policies conceptually equivalent to:

```text
business_id = current application tenant
```

However, I would **not** put the RLS policies into the first TypeScript schema file.

They belong in SQL migrations because the policy implementation needs to match the exact database connection and transaction context strategy we choose.

That should be implemented immediately after the first schema migration and tested with two separate businesses.

# 16. Migration Sequence

The initial migrations should roughly become:

```text
0001_auth_and_business_foundation
0002_products_and_inventory
0003_sales_and_purchases
0004_payments_and_ledgers
0005_expenses_and_financial_transactions
0006_daily_reconciliation
0007_audit_and_notifications
0008_attachments
0009_subscriptions
0010_tenant_rls
```

The actual generated migration names will be created by Drizzle.

# 17. What This Schema Does Not Yet Include

These should deliberately stay outside the first migration:

```text
Payroll
Bank feed integrations
WhatsApp
SMS
Tax automation
Multiple branches
Advanced forecasting
AI insights
Accounting software integrations
Payment processing for customers
Hardware POS integrations
```

The schema is being designed so these can be added later without redesigning the core transaction system.

# 18. One Important Decision Before Production

The schema currently supports the product direction, but one accounting decision remains open:

```text
Inventory Costing
```

We need to decide whether the financial engine uses:

```text
Weighted Average Cost
```

or:

```text
FIFO
```

I recommend starting with **Weighted Average Cost** for the first version because it keeps the calculation engine considerably simpler.

That decision should be confirmed with whoever will validate the client's financial reporting requirements before we build the final P&L calculations.

# 19. Final Data Architecture

The core relationship is now:

```text
                    BUSINESS
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      PEOPLE        PRODUCTS        MONEY
        │              │              │
        │              │              │
        │         INVENTORY           │
        │              │              │
        │              └──────┐       │
        │                     │       │
        │                   SALES     │
        │                     │       │
        │                     └───────┤
        │                             │
        │                         PAYMENTS
        │                             │
        │                      FINANCIAL TXNS
        │                             │
        └──────────────┬──────────────┘
                       │
                RECONCILIATION
                       │
                    REPORTS

              Everything important
                       │
                       ▼
                  AUDIT LOG
```

The key architectural rule is:

**Users do not manipulate the financial or inventory ledger directly.**

They perform business actions.

The application converts those actions into the appropriate inventory, payment, financial, receivable, payable and audit records.

That is the foundation that will allow the dashboard and reports to remain trustworthy as the product grows.