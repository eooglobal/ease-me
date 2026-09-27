import { describe, it, expect } from "vitest";
import {
  SYSTEM_ROLES,
  SYSTEM_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from "../permissions";
import { requirePermission, TenantContext } from "../tenant";
import { ForbiddenError } from "../errors";

describe("RBAC & Tenant Authorization Tests", () => {
  const mockOwnerContext: TenantContext = {
    userId: "user-owner-1",
    userEmail: "owner@shop.com",
    userName: "Owner User",
    businessId: "biz-111",
    businessName: "Prime Supermarket",
    roleId: "role-owner",
    roleName: "owner",
    permissions: DEFAULT_ROLE_PERMISSIONS.owner,
  };

  const mockCashierContext: TenantContext = {
    userId: "user-cashier-2",
    userEmail: "cashier@shop.com",
    userName: "Cashier User",
    businessId: "biz-111",
    businessName: "Prime Supermarket",
    roleId: "role-cashier",
    roleName: "cashier",
    permissions: DEFAULT_ROLE_PERMISSIONS.cashier,
  };

  const mockInventoryManagerContext: TenantContext = {
    userId: "user-inv-3",
    userEmail: "inventory@shop.com",
    userName: "Store Manager",
    businessId: "biz-111",
    businessName: "Prime Supermarket",
    roleId: "role-inv",
    roleName: "inventory_manager",
    permissions: DEFAULT_ROLE_PERMISSIONS.inventory_manager,
  };

  it("should grant Owner all system permissions", () => {
    expect(mockOwnerContext.permissions.length).toBe(SYSTEM_PERMISSIONS.length);
    expect(hasPermission(mockOwnerContext.permissions, "sales.create")).toBe(true);
    expect(hasPermission(mockOwnerContext.permissions, "financials.view")).toBe(true);
    expect(hasPermission(mockOwnerContext.permissions, "staff.manage")).toBe(true);
  });

  it("should restrict Cashier from viewing profit margins and business expenses", () => {
    // Cashier CAN create and view sales
    expect(hasPermission(mockCashierContext.permissions, "sales.create")).toBe(true);
    expect(hasPermission(mockCashierContext.permissions, "sales.view")).toBe(true);

    // Cashier CANNOT view financials, expenses, or manage staff
    expect(hasPermission(mockCashierContext.permissions, "financials.view")).toBe(false);
    expect(hasPermission(mockCashierContext.permissions, "expenses.view")).toBe(false);
    expect(hasPermission(mockCashierContext.permissions, "staff.manage")).toBe(false);

    expect(() => requirePermission(mockCashierContext, "financials.view")).toThrow(ForbiddenError);
  });

  it("should restrict Inventory Manager from viewing financial statements", () => {
    expect(hasPermission(mockInventoryManagerContext.permissions, "inventory.receive")).toBe(true);
    expect(hasPermission(mockInventoryManagerContext.permissions, "inventory.adjust")).toBe(true);
    expect(hasPermission(mockInventoryManagerContext.permissions, "financials.view")).toBe(false);

    expect(() => requirePermission(mockInventoryManagerContext, "financials.view")).toThrow(ForbiddenError);
  });

  it("should verify multiple permission combinators correctly", () => {
    expect(
      hasAllPermissions(mockCashierContext.permissions, ["sales.create", "customers.view"])
    ).toBe(true);

    expect(
      hasAllPermissions(mockCashierContext.permissions, ["sales.create", "expenses.create"])
    ).toBe(false);

    expect(
      hasAnyPermission(mockCashierContext.permissions, ["expenses.create", "sales.create"])
    ).toBe(true);

    expect(
      hasAnyPermission(mockCashierContext.permissions, ["expenses.create", "staff.manage"])
    ).toBe(false);
  });
});
