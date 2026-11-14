"use server";

import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { getTenantContext, requireTenantContext } from "@/lib/security/tenant";
import { BusinessService } from "@/lib/business/business-service";
import { formatErrorResponse } from "@/lib/security/errors";
import { db } from "@/db";
import { businessMembers, businesses, roles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface RegisterBusinessInput {
  name: string;
  email: string;
  password: string;
  businessName: string;
  businessType: "retail" | "supermarket" | "pharmacy" | "wholesaler" | "restaurant" | "service" | "other";
  currency?: string;
  openingCash?: number;
}

/**
 * Server action to create user account with Better Auth and register the business workspace atomically
 */
export async function registerBusinessAction(input: RegisterBusinessInput) {
  try {
    const reqHeaders = await headers();

    // 1. Create user with Better Auth
    const userRes = await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: input.password,
        name: input.name,
      },
      headers: reqHeaders,
    });

    if (!userRes || !userRes.user) {
      throw new Error("Unable to create user account.");
    }

    // 2. Initialize Business Workspace
    const businessData = await BusinessService.createBusinessWithOwner({
      userId: userRes.user.id,
      userEmail: userRes.user.email,
      userName: userRes.user.name,
      businessName: input.businessName,
      businessType: input.businessType,
      currency: input.currency || "NGN",
      openingCash: input.openingCash || 0,
    });

    return {
      success: true as const,
      user: userRes.user,
      business: businessData.business,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Returns current tenant session context (or null if not logged in)
 */
export async function getCurrentContextAction() {
  try {
    const ctx = await getTenantContext();
    return { success: true, context: ctx };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Retrieves all businesses accessible by the authenticated user
 */
export async function getUserBusinessesAction() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return { success: true, businesses: [] };
    }

    const memberships = await db
      .select({
        businessId: businesses.id,
        businessName: businesses.name,
        businessType: businesses.businessType,
        currency: businesses.currency,
        roleName: roles.name,
        status: businessMembers.status,
      })
      .from(businessMembers)
      .innerJoin(businesses, eq(businessMembers.businessId, businesses.id))
      .innerJoin(roles, eq(businessMembers.roleId, roles.id))
      .where(
        and(
          eq(businessMembers.userId, session.user.id),
          eq(businessMembers.status, "active"),
          eq(businesses.status, "active")
        )
      );

    return { success: true, businesses: memberships };
  } catch (error) {
    return formatErrorResponse(error);
  }
}
