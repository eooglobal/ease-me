export const FEATURE_KEYS = {
  MULTI_USER: "multi_user",
  ADVANCED_REPORTS: "advanced_reports",
  PROFIT_AND_LOSS: "profit_and_loss",
  DAILY_RECONCILIATION: "daily_reconciliation",
  SUPPLIER_MANAGEMENT: "supplier_management",
  INVENTORY_AUDIT_LOGS: "inventory_audit_logs",
  UNLIMITED_PRODUCTS: "unlimited_products",
  DATA_EXPORT: "data_export",
  STORE_LOCATIONS: "store_locations",
  CUSTOM_INTEGRATIONS: "custom_integrations",
  DEDICATED_MANAGER: "dedicated_manager",
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

export interface PlanTierConfig {
  id: string;
  name: string;
  badge?: string;
  isPopular?: boolean;
  description: string;
  monthlyPrice: number;
  sixMonthsPrice: number; // 10% discount
  yearlyPrice: number; // 20% discount
  features: Record<string, number>;
  highlightList: string[];
}

export const PRICING_TIERS: Record<string, PlanTierConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    badge: "+",
    description: "Freemium tier for single-counter retail shops with limited products.",
    monthlyPrice: 0,
    sixMonthsPrice: 0,
    yearlyPrice: 0,
    features: {
      [FEATURE_KEYS.MULTI_USER]: 1, // 1 Cashier / User Account
      [FEATURE_KEYS.STORE_LOCATIONS]: 1, // 1 Store Location
      [FEATURE_KEYS.UNLIMITED_PRODUCTS]: 50, // Max 50 products
      [FEATURE_KEYS.ADVANCED_REPORTS]: 0,
      [FEATURE_KEYS.PROFIT_AND_LOSS]: 0,
      [FEATURE_KEYS.DAILY_RECONCILIATION]: 0,
      [FEATURE_KEYS.SUPPLIER_MANAGEMENT]: 0,
      [FEATURE_KEYS.INVENTORY_AUDIT_LOGS]: 0,
      [FEATURE_KEYS.DATA_EXPORT]: 0,
    },
    highlightList: [
      "1 Store Location",
      "1 Cashier Account",
      "Up to 50 Products",
      "Basic Sales & POS",
      "Petty Cash & Expense Records",
      "Full Web Portal & Mobile Access",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth",
    badge: "++",
    isPopular: true,
    description: "For growing businesses with multiple locations.",
    monthlyPrice: 28000,
    sixMonthsPrice: 25200, // 10% discount
    yearlyPrice: 22400, // 20% discount
    features: {
      [FEATURE_KEYS.MULTI_USER]: 999, // Unlimited Cashiers
      [FEATURE_KEYS.STORE_LOCATIONS]: 5, // Up to 5 Store Locations
      [FEATURE_KEYS.UNLIMITED_PRODUCTS]: 1000,
      [FEATURE_KEYS.ADVANCED_REPORTS]: 1,
      [FEATURE_KEYS.PROFIT_AND_LOSS]: 1,
      [FEATURE_KEYS.DAILY_RECONCILIATION]: 1,
      [FEATURE_KEYS.SUPPLIER_MANAGEMENT]: 1,
      [FEATURE_KEYS.INVENTORY_AUDIT_LOGS]: 1,
      [FEATURE_KEYS.DATA_EXPORT]: 1,
    },
    highlightList: [
      "Up to 5 Store Locations",
      "Unlimited Cashiers",
      "Up to 1,000 Products",
      "Advanced Analytics & P&L",
      "Discrepancy & Stock Audit",
      "Daily Register Reconciliation",
      "Cloud Sync & Data Exports",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    badge: "+++",
    description: "Scaling solutions for multi-branch operations.",
    monthlyPrice: 38000,
    sixMonthsPrice: 34200,
    yearlyPrice: 30400,
    features: {
      [FEATURE_KEYS.MULTI_USER]: 999,
      [FEATURE_KEYS.STORE_LOCATIONS]: 10,
      [FEATURE_KEYS.UNLIMITED_PRODUCTS]: 5000,
      [FEATURE_KEYS.ADVANCED_REPORTS]: 1,
      [FEATURE_KEYS.PROFIT_AND_LOSS]: 1,
      [FEATURE_KEYS.DAILY_RECONCILIATION]: 1,
      [FEATURE_KEYS.SUPPLIER_MANAGEMENT]: 1,
      [FEATURE_KEYS.INVENTORY_AUDIT_LOGS]: 1,
      [FEATURE_KEYS.DATA_EXPORT]: 1,
      [FEATURE_KEYS.CUSTOM_INTEGRATIONS]: 1,
    },
    highlightList: [
      "Up to 10 Store Locations",
      "Unlimited Cashiers",
      "Up to 5,000 Products",
      "Customer Debts & Supplier Payables",
      "Custom Accounting Integrations",
      "Cloud Sync & Priority Backups",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    badge: "MAX",
    description: "High-volume retail chains and multi-warehouse operations.",
    monthlyPrice: 58000,
    sixMonthsPrice: 52200,
    yearlyPrice: 46400,
    features: {
      [FEATURE_KEYS.MULTI_USER]: 9999,
      [FEATURE_KEYS.STORE_LOCATIONS]: 999, // Unlimited Locations
      [FEATURE_KEYS.UNLIMITED_PRODUCTS]: 100000, // Unlimited
      [FEATURE_KEYS.ADVANCED_REPORTS]: 1,
      [FEATURE_KEYS.PROFIT_AND_LOSS]: 1,
      [FEATURE_KEYS.DAILY_RECONCILIATION]: 1,
      [FEATURE_KEYS.SUPPLIER_MANAGEMENT]: 1,
      [FEATURE_KEYS.INVENTORY_AUDIT_LOGS]: 1,
      [FEATURE_KEYS.DATA_EXPORT]: 1,
      [FEATURE_KEYS.CUSTOM_INTEGRATIONS]: 1,
      [FEATURE_KEYS.DEDICATED_MANAGER]: 1,
    },
    highlightList: [
      "Unlimited Locations",
      "Unlimited Cashiers",
      "Unlimited Products",
      "Custom Integrations",
      "Dedicated Account Manager",
      "Instant Cloud Sync & 24/7 SLA",
    ],
  },
};

// Aliases for backward compatibility
export const DEFAULT_PLAN_CONFIGS: Record<
  string,
  { name: string; price: number; features: Record<string, number> }
> = {
  free: {
    name: PRICING_TIERS.starter.name,
    price: PRICING_TIERS.starter.monthlyPrice,
    features: PRICING_TIERS.starter.features,
  },
  starter: {
    name: PRICING_TIERS.starter.name,
    price: PRICING_TIERS.starter.monthlyPrice,
    features: PRICING_TIERS.starter.features,
  },
  growth: {
    name: PRICING_TIERS.growth.name,
    price: PRICING_TIERS.growth.monthlyPrice,
    features: PRICING_TIERS.growth.features,
  },
  pro: {
    name: PRICING_TIERS.growth.name,
    price: PRICING_TIERS.growth.monthlyPrice,
    features: {
      ...PRICING_TIERS.growth.features,
      [FEATURE_KEYS.MULTI_USER]: 10,
    },
  },
  business: {
    name: PRICING_TIERS.business.name,
    price: PRICING_TIERS.business.monthlyPrice,
    features: PRICING_TIERS.business.features,
  },
  enterprise: {
    name: PRICING_TIERS.enterprise.name,
    price: PRICING_TIERS.enterprise.monthlyPrice,
    features: PRICING_TIERS.enterprise.features,
  },
};
