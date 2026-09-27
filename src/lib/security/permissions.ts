export const SYSTEM_PERMISSIONS = [
  // Sales
  "sales.view",
  "sales.create",
  "sales.edit",
  "sales.cancel",

  // Expenses
  "expenses.view",
  "expenses.create",
  "expenses.edit",
  "expenses.approve",

  // Inventory
  "inventory.view",
  "inventory.receive",
  "inventory.adjust",
  "inventory.damage",

  // Customers
  "customers.view",
  "customers.manage",
  "customers.record_payment",

  // Suppliers
  "suppliers.view",
  "suppliers.manage",
  "suppliers.record_payment",

  // Financials & Reports
  "reports.view",
  "financials.view",

  // Staff & Roles
  "staff.view",
  "staff.manage",

  // Reconciliation
  "reconciliation.view",
  "reconciliation.perform",
  "reconciliation.close",
  "reconciliation.reopen",

  // Audit
  "audit.view",

  // Settings
  "settings.view",
  "settings.manage",
] as const;

export type PermissionKey = (typeof SYSTEM_PERMISSIONS)[number];

export const SYSTEM_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  CASHIER: "cashier",
  INVENTORY_MANAGER: "inventory_manager",
  ACCOUNTANT: "accountant",
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, PermissionKey[]> = {
  owner: [...SYSTEM_PERMISSIONS],
  
  admin: [
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
    "reconciliation.view",
    "reconciliation.perform",
    "reconciliation.close",
    "audit.view",
    "settings.view",
  ],

  cashier: [
    "sales.view",
    "sales.create",
    "customers.view",
    "customers.record_payment",
    "reconciliation.view",
    "reconciliation.perform",
  ],

  inventory_manager: [
    "inventory.view",
    "inventory.receive",
    "inventory.adjust",
    "inventory.damage",
    "suppliers.view",
    "suppliers.manage",
  ],

  accountant: [
    "sales.view",
    "expenses.view",
    "customers.view",
    "suppliers.view",
    "reports.view",
    "financials.view",
    "audit.view",
  ],
};

/**
 * Checks whether a given set of permissions includes the required permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: PermissionKey
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Checks whether user has all of the requested permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: PermissionKey[]
): boolean {
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Checks whether user has at least one of the requested permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: PermissionKey[]
): boolean {
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}
