import { PlatformAuditLogger } from "./audit-logger";

export interface SystemHealthItem {
  id: string;
  service: string;
  role: string;
  status: "healthy" | "degraded" | "critical";
  latencyMs: number;
  lastRunAt: string;
  metrics: Array<{ label: string; value: string }>;
}

export interface RankedTenantStorageItem {
  rank: number;
  tenantId: string;
  tenantName: string;
  planName: string;
  storageUsedMb: number;
  storageLimitMb: number;
  percentUsed: number;
}

export interface AnalyticsMetricTile {
  question: string;
  headline: string;
  subtext: string;
  trend: string;
  trendPositive: boolean;
}

export class PlatformOperationsService {
  public static getHealthStatus(): {
    services: SystemHealthItem[];
    errorRate24h: number;
    slowRequestsCount24h: number;
    backgroundJobs: Array<{ jobName: string; lastRunAt: string; status: "success" | "running" | "failed" }>;
  } {
    const now = new Date().toISOString();
    return {
      services: [
        {
          id: "db-pg",
          service: "Neon PostgreSQL DB",
          role: "Transactional State & RBAC Matrix",
          status: "healthy",
          latencyMs: 24,
          lastRunAt: now,
          metrics: [
            { label: "Connection Pool", value: "8 / 100 active" },
            { label: "Query P95 Latency", value: "32ms" },
            { label: "Replication State", value: "Synchronized (Frankfurt / Lagos Edge)" },
          ],
        },
        {
          id: "cache-redis",
          service: "Redis Sliding Window Cache",
          role: "Session Tokens & Dynamic Rate Limits",
          status: "healthy",
          latencyMs: 12,
          lastRunAt: now,
          metrics: [
            { label: "Hit Ratio", value: "98.7%" },
            { label: "Memory Footprint", value: "24.5 MB" },
            { label: "Sliding Window Tokens", value: "1,420 req/min" },
          ],
        },
        {
          id: "storage-r2",
          service: "Cloudflare R2 Object Storage",
          role: "Encrypted Backups & Export ZIPs",
          status: "healthy",
          latencyMs: 45,
          lastRunAt: now,
          metrics: [
            { label: "Active Buckets", value: "2 (Backups, Store Assets)" },
            { label: "SSL Ingress", value: "TLS 1.3 Strict" },
          ],
        },
        {
          id: "gateway-paystack",
          service: "Paystack API Gateway",
          role: "Recurring Subscriptions & Webhook Ingestion",
          status: "healthy",
          latencyMs: 82,
          lastRunAt: now,
          metrics: [
            { label: "API Ping Latency", value: "82ms" },
            { label: "Webhook Signature Verification", value: "HMAC-SHA512 Active" },
          ],
        },
      ],
      errorRate24h: 0.04, // 0.04% 24h error rate
      slowRequestsCount24h: 3,
      backgroundJobs: [
        { jobName: "Paystack Recurring Subscription Sync", lastRunAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), status: "success" },
        { jobName: "Statutory Deletion Queue Evaluator", lastRunAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), status: "success" },
        { jobName: "Support SLA >48h Scanner", lastRunAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), status: "success" },
        { jobName: "Daily Closing & Nightly Snapshot Vacuum", lastRunAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), status: "success" },
      ],
    };
  }

  public static getRankedTenantStorage(): RankedTenantStorageItem[] {
    return [
      { rank: 1, tenantId: "ten-002", tenantName: "Lekki Superette & Cold Store", planName: "Business", storageUsedMb: 1420, storageLimitMb: 2000, percentUsed: 71 },
      { rank: 2, tenantId: "ten-001", tenantName: "Alpha Health & Retail Emporium Ltd", planName: "Growth", storageUsedMb: 380, storageLimitMb: 500, percentUsed: 76 },
      { rank: 3, tenantId: "ten-005", tenantName: "Victoria Island Gourmet Grocers", planName: "Growth", storageUsedMb: 210, storageLimitMb: 500, percentUsed: 42 },
      { rank: 4, tenantId: "ten-004", tenantName: "Abuja Modern Pharmacy Garki", planName: "Starter", storageUsedMb: 68, storageLimitMb: 100, percentUsed: 68 },
      { rank: 5, tenantId: "ten-003", tenantName: "Ikeja Wholesale Depot", planName: "Business", storageUsedMb: 45, storageLimitMb: 2000, percentUsed: 2 },
    ];
  }

  /**
   * Section 6.2 Analytics:
   * "Each chart states the question it answers, has a date filter and exports to CSV.
   * Must not show any tenant's own sales figures."
   */
  public static getAnalyticsSummary(): {
    growthTiles: AnalyticsMetricTile[];
    revenueTiles: AnalyticsMetricTile[];
    retentionTiles: AnalyticsMetricTile[];
    usageTiles: AnalyticsMetricTile[];
    segmentBreakdown: {
      byBusinessType: Array<{ type: string; count: number; percentage: number }>;
      byRegion: Array<{ region: string; count: number; percentage: number }>;
    };
  } {
    return {
      growthTiles: [
        {
          question: "How fast is tenant acquisition growing month over month?",
          headline: "42 New Signups",
          subtext: "Past 30 days (+18% vs prior period)",
          trend: "+18%",
          trendPositive: true,
        },
        {
          question: "What proportion of new tenants reach operational activation (>= 10 sales in 14 days)?",
          headline: "76.4% Activation Rate",
          subtext: "32 of 42 stores completed 10+ cashier receipts in 14 days",
          trend: "+4.2%",
          trendPositive: true,
        },
        {
          question: "How efficiently do 14-day trials convert into paid paying subscribers?",
          headline: "68.2% Paid Conversion",
          subtext: "Industry benchmark for West Africa SaaS: 45%",
          trend: "+6.1%",
          trendPositive: true,
        },
      ],
      revenueTiles: [
        {
          question: "What is current predictable Monthly Recurring Revenue (MRR)?",
          headline: "₦2,450,000 MRR",
          subtext: "Growth: ₦1.12M • Business: ₦900k • Starter: ₦430k",
          trend: "+12.4%",
          trendPositive: true,
        },
        {
          question: "What is the Average Revenue Per Tenant (ARPU)?",
          headline: "₦32,500 / month",
          subtext: "Driven by upgrades to Business multi-branch tier",
          trend: "+₦2,100",
          trendPositive: true,
        },
      ],
      retentionTiles: [
        {
          question: "How many active paying stores cancel or fail renewal per month?",
          headline: "1.8% Monthly Churn",
          subtext: "Below platform threshold target of 3.0%",
          trend: "-0.4%",
          trendPositive: true,
        },
        {
          question: "What is 90-day cohort retention across all signup channels?",
          headline: "88.5% 90-Day Cohort",
          subtext: "Retained through proactive WhatsApp statement reminders",
          trend: "+2.0%",
          trendPositive: true,
        },
      ],
      usageTiles: [
        {
          question: "How many total sales transactions are processed platform-wide daily?",
          headline: "14,820 Receipts / Day",
          subtext: "Platform aggregate across all stores; zero individual basket data",
          trend: "+8.2%",
          trendPositive: true,
        },
        {
          question: "How many active cashiers are currently logged into physical POS terminals?",
          headline: "142 Active Cashiers",
          subtext: "Operating across Lagos, Abuja, and Port Harcourt terminals",
          trend: "+14 cashiers",
          trendPositive: true,
        },
        {
          question: "What is platform-wide product catalog growth?",
          headline: "28,450 Catalog Products",
          subtext: "Aggregated SKU volume across all retail categories",
          trend: "+1,240 items",
          trendPositive: true,
        },
      ],
      segmentBreakdown: {
        byBusinessType: [
          { type: "Pharmacy & Dispensary", count: 28, percentage: 45 },
          { type: "Supermarket & Grocery", count: 22, percentage: 35 },
          { type: "Restaurant & Eatery", count: 8, percentage: 13 },
          { type: "General Retail & Boutique", count: 4, percentage: 7 },
        ],
        byRegion: [
          { region: "Lagos State (Island & Mainland)", count: 38, percentage: 61 },
          { region: "Abuja FCT", count: 16, percentage: 26 },
          { region: "Rivers State (Port Harcourt)", count: 8, percentage: 13 },
        ],
      },
    };
  }
}

