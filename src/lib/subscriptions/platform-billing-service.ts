/**
 * Platform Billing & Tenant Health Service for Super Admins
 * Client and server safe pure logic
 */

export interface SaaSPlanTier {
  id: string;
  name: "Starter" | "Growth" | "Business" | "Enterprise";
  monthlyPrice: number;
  annualPrice: number;
  maxProducts: number;
  maxUsers: number;
  maxRegisters: number;
  features: string[];
}

export const SAAS_PLANS: SaaSPlanTier[] = [
  {
    id: "plan-starter",
    name: "Starter",
    monthlyPrice: 15000,
    annualPrice: 150000,
    maxProducts: 250,
    maxUsers: 2,
    maxRegisters: 1,
    features: ["Single register POS", "Basic inventory", "WhatsApp debtor alerts", "Standard support"],
  },
  {
    id: "plan-growth",
    name: "Growth",
    monthlyPrice: 28000,
    annualPrice: 280000,
    maxProducts: 1000,
    maxUsers: 5,
    maxRegisters: 2,
    features: [
      "Up to 2 POS terminals",
      "WAC stock intake",
      "Batch & FEFO expiry tracking",
      "Customer web portal",
      "Blind shift reconciliation",
    ],
  },
  {
    id: "plan-business",
    name: "Business",
    monthlyPrice: 45000,
    annualPrice: 450000,
    maxProducts: 5000,
    maxUsers: 15,
    maxRegisters: 5,
    features: [
      "Up to 5 POS terminals",
      "Multi-staff role RBAC",
      "Cloudflare R2 document storage",
      "Landed purchase costs",
      "Priority telephone support",
    ],
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    monthlyPrice: 95000,
    annualPrice: 950000,
    maxProducts: 50000,
    maxUsers: 50,
    maxRegisters: 20,
    features: [
      "Unlimited products & orders",
      "Dedicated database shard",
      "Custom API integrations",
      "Dedicated account manager",
      "99.9% uptime SLA",
    ],
  },
];

export interface TenantWorkspace {
  id: string;
  businessName: string;
  businessType: string;
  ownerEmail: string;
  phone: string;
  planName: SaaSPlanTier["name"];
  status: "active" | "suspended" | "trial";
  productCount: number;
  userCount: number;
  createdAt: string;
  mrr: number;
  lastPaymentDate?: string;
  storageUsedMb: number;
}

export interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  monthlyRecurringRevenue: number;
  annualRunRate: number;
  totalStorageMb: number;
  systemHealthStatus: "healthy" | "degraded" | "outage";
}

export class PlatformBillingService {
  /**
   * Computes SaaS platform metrics (MRR, ARR, active counts)
   */
  public static calculatePlatformMetrics(tenants: TenantWorkspace[]): PlatformMetrics {
    let active = 0;
    let suspended = 0;
    let mrr = 0;
    let storage = 0;

    for (const t of tenants) {
      if (t.status === "active") {
        active++;
        mrr += Number(t.mrr || 0);
      } else if (t.status === "suspended") {
        suspended++;
      }
      storage += Number(t.storageUsedMb || 0);
    }

    const roundedMrr = Math.round(mrr * 100) / 100;
    const roundedArr = Math.round(roundedMrr * 12 * 100) / 100;

    return {
      totalTenants: tenants.length,
      activeTenants: active,
      suspendedTenants: suspended,
      monthlyRecurringRevenue: roundedMrr,
      annualRunRate: roundedArr,
      totalStorageMb: Math.round(storage * 100) / 100,
      systemHealthStatus: suspended > 5 ? "degraded" : "healthy",
    };
  }

  /**
   * Verifies if a tenant has exceeded their plan quota limits
   */
  public static checkQuotaUsage(
    tenant: TenantWorkspace,
    plan: SaaSPlanTier
  ): {
    canAddProduct: boolean;
    canAddUser: boolean;
    productUsagePercent: number;
    userUsagePercent: number;
  } {
    const pUsage = Math.round((tenant.productCount / plan.maxProducts) * 10000) / 100;
    const uUsage = Math.round((tenant.userCount / plan.maxUsers) * 10000) / 100;

    return {
      canAddProduct: tenant.productCount < plan.maxProducts,
      canAddUser: tenant.userCount < plan.maxUsers,
      productUsagePercent: Math.min(100, pUsage),
      userUsagePercent: Math.min(100, uUsage),
    };
  }
}

