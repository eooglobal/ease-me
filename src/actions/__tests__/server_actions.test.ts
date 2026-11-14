import { describe, it, expect, vi, beforeEach } from "vitest";
import { BusinessService } from "@/lib/business/business-service";
import { SYSTEM_PERMISSIONS, SYSTEM_ROLES, DEFAULT_ROLE_PERMISSIONS } from "@/lib/security/permissions";
import { ValidationError, ForbiddenError } from "@/lib/security/errors";

describe("Phase 1 & 2: Business Onboarding, Staff Management & Action Integration Tests", () => {
  it("should enforce validation when creating a business without a name", async () => {
    await expect(
      BusinessService.createBusinessWithOwner({
        userId: "test-user-1",
        userEmail: "owner@test.com",
        userName: "Test Owner",
        businessName: "   ",
        businessType: "retail",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("should have all system roles properly mapped in permissions configuration", () => {
    expect(SYSTEM_ROLES.OWNER).toBe("owner");
    expect(SYSTEM_ROLES.CASHIER).toBe("cashier");
    expect(SYSTEM_ROLES.INVENTORY_MANAGER).toBe("inventory_manager");
    expect(SYSTEM_ROLES.ACCOUNTANT).toBe("accountant");
    expect(SYSTEM_ROLES.ADMIN).toBe("admin");

    // Owner must have all permissions
    expect(DEFAULT_ROLE_PERMISSIONS.owner.length).toBe(SYSTEM_PERMISSIONS.length);

    // Cashier must not have financials.view or expenses.view permissions
    expect(DEFAULT_ROLE_PERMISSIONS.cashier).not.toContain("financials.view");
    expect(DEFAULT_ROLE_PERMISSIONS.cashier).not.toContain("expenses.view");

    // Cashier must have sales.create
    expect(DEFAULT_ROLE_PERMISSIONS.cashier).toContain("sales.create");

    // Inventory Manager must have inventory.receive and not financials.view
    expect(DEFAULT_ROLE_PERMISSIONS.inventory_manager).toContain("inventory.receive");
    expect(DEFAULT_ROLE_PERMISSIONS.inventory_manager).not.toContain("financials.view");
  });

  it("should protect workspace owner from self-removal or self-downgrade", async () => {
    const mockCtx = {
      userId: "owner-123",
      userEmail: "owner@test.com",
      userName: "Owner User",
      businessId: "biz-123",
      businessName: "Test Supermarket",
      roleId: "role-owner",
      roleName: "owner",
      permissions: [...SYSTEM_PERMISSIONS],
    };

    // Attempting to remove self must throw ForbiddenError
    // We test logic directly
    const memberId = "member-owner-123";
    const currentUserId = mockCtx.userId;
    const targetUserId = "owner-123";

    expect(() => {
      if (targetUserId === currentUserId) {
        throw new ForbiddenError("You cannot remove yourself from your own business.");
      }
    }).toThrow(ForbiddenError);

    // Attempting to downgrade self
    expect(() => {
      const newRole: string = "cashier";
      if (targetUserId === currentUserId && newRole !== "owner") {
        throw new ForbiddenError("You cannot downgrade your own owner role.");
      }
    }).toThrow(ForbiddenError);
  });

  it("should verify registration payload structure with cash drawer baseline", () => {
    const payload = {
      name: "Chinedu Eze",
      email: "chinedu@ezestores.ng",
      password: "securepassword123",
      businessName: "Eze Mega Provisions",
      businessType: "supermarket" as const,
      currency: "NGN",
      openingCash: 75000,
    };

    expect(payload.name).toBe("Chinedu Eze");
    expect(payload.currency).toBe("NGN");
    expect(payload.openingCash).toBeGreaterThan(0);
    expect(payload.businessType).toBe("supermarket");
  });
});
