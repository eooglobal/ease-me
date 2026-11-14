/**
 * Section 3: Platform Staff Roles and Permission Matrix
 * Source of Truth: adminconsole.md Section 3
 */

export type PlatformRole =
  | "owner"
  | "admin"
  | "finance"
  | "support_lead"
  | "support_agent"
  | "content"
  | "security"
  | "engineer"
  | "auditor"
  | "analyst";

export type AccessLevel = "W" | "R" | "A" | "Req" | "No";

export type PlatformArea =
  | "tenants_list"
  | "tenants_provision"
  | "tenants_suspend"
  | "plans_pricing"
  | "billing_refunds"
  | "content_non_legal"
  | "legal_documents"
  | "platform_settings"
  | "feature_flags"
  | "integrations_secrets"
  | "rate_limits"
  | "health_jobs"
  | "support_tickets"
  | "security_policy"
  | "audit_log"
  | "compliance_requests"
  | "staff_management"
  | "analytics";

export interface AreaDefinition {
  id: PlatformArea;
  label: string;
  readKey: string;
  writeKey: string;
  approveKey?: string;
  requestKey?: string;
}

export const PLATFORM_AREAS: Record<PlatformArea, AreaDefinition> = {
  tenants_list: {
    id: "tenants_list",
    label: "Tenant list and detail",
    readKey: "tenants:read",
    writeKey: "tenants:write",
  },
  tenants_provision: {
    id: "tenants_provision",
    label: "Provision tenant",
    readKey: "tenants:read",
    writeKey: "tenants:provision",
    approveKey: "tenants:approve_provision",
    requestKey: "tenants:request_provision",
  },
  tenants_suspend: {
    id: "tenants_suspend",
    label: "Suspend or reactivate tenant",
    readKey: "tenants:read",
    writeKey: "tenants:suspend",
    approveKey: "tenants:approve_suspend",
    requestKey: "tenants:request_suspend",
  },
  plans_pricing: {
    id: "plans_pricing",
    label: "Plans and pricing",
    readKey: "plans:read",
    writeKey: "plans:write",
    approveKey: "plans:approve_price_change",
  },
  billing_refunds: {
    id: "billing_refunds",
    label: "Billing, refunds, discounts",
    readKey: "billing:read",
    writeKey: "billing:write",
    approveKey: "billing:approve_refund",
  },
  content_non_legal: {
    id: "content_non_legal",
    label: "Content (non legal)",
    readKey: "content:read",
    writeKey: "content:write",
  },
  legal_documents: {
    id: "legal_documents",
    label: "Legal documents",
    readKey: "legal:read",
    writeKey: "legal:write",
    approveKey: "legal:approve_publish",
    requestKey: "legal:request_publish",
  },
  platform_settings: {
    id: "platform_settings",
    label: "Platform settings",
    readKey: "settings:read",
    writeKey: "settings:write",
    approveKey: "settings:approve_maintenance",
  },
  feature_flags: {
    id: "feature_flags",
    label: "Feature flags",
    readKey: "flags:read",
    writeKey: "flags:write",
    approveKey: "flags:approve_rollout",
  },
  integrations_secrets: {
    id: "integrations_secrets",
    label: "Integrations and secrets",
    readKey: "integrations:read",
    writeKey: "integrations:write",
    approveKey: "integrations:approve_secret_rotation",
  },
  rate_limits: {
    id: "rate_limits",
    label: "Rate limits and limits",
    readKey: "limits:read",
    writeKey: "limits:write",
    approveKey: "limits:approve_limit_change",
  },
  health_jobs: {
    id: "health_jobs",
    label: "Health and jobs",
    readKey: "health:read",
    writeKey: "health:write",
  },
  support_tickets: {
    id: "support_tickets",
    label: "Support tickets",
    readKey: "support:read",
    writeKey: "support:write",
  },
  security_policy: {
    id: "security_policy",
    label: "Security policy",
    readKey: "security:read",
    writeKey: "security:write",
    approveKey: "security:approve_policy",
  },
  audit_log: {
    id: "audit_log",
    label: "Audit log",
    readKey: "audit:read",
    writeKey: "audit:write", // immutable/not granted
  },
  compliance_requests: {
    id: "compliance_requests",
    label: "Compliance requests",
    readKey: "compliance:read",
    writeKey: "compliance:write",
    approveKey: "compliance:approve_deletion",
  },
  staff_management: {
    id: "staff_management",
    label: "Staff management",
    readKey: "staff:read",
    writeKey: "staff:write",
    approveKey: "staff:approve_role_change",
    requestKey: "staff:request_role_change",
  },
  analytics: {
    id: "analytics",
    label: "Analytics",
    readKey: "analytics:read",
    writeKey: "analytics:write",
  },
};

/**
 * Section 3 Matrix: Exact cell mapping per role
 */
export const PLATFORM_PERMISSION_MATRIX: Record<PlatformArea, Record<PlatformRole, AccessLevel>> = {
  tenants_list: {
    owner: "W",
    admin: "W",
    finance: "R",
    support_lead: "W",
    support_agent: "R",
    content: "No",
    security: "R",
    engineer: "R",
    auditor: "R",
    analyst: "R",
  },
  tenants_provision: {
    owner: "A",
    admin: "W",
    finance: "No",
    support_lead: "Req",
    support_agent: "No",
    content: "No",
    security: "No",
    engineer: "No",
    auditor: "No",
    analyst: "No",
  },
  tenants_suspend: {
    owner: "A",
    admin: "W",
    finance: "Req",
    support_lead: "Req",
    support_agent: "No",
    content: "No",
    security: "Req",
    engineer: "No",
    auditor: "No",
    analyst: "No",
  },
  plans_pricing: {
    owner: "A",
    admin: "R",
    finance: "W",
    support_lead: "No",
    support_agent: "No",
    content: "No",
    security: "No",
    engineer: "No",
    auditor: "R",
    analyst: "R",
  },
  billing_refunds: {
    owner: "A",
    admin: "R",
    finance: "W",
    support_lead: "No",
    support_agent: "No",
    content: "No",
    security: "No",
    engineer: "No",
    auditor: "R",
    analyst: "R",
  },
  content_non_legal: {
    owner: "W",
    admin: "W",
    finance: "No",
    support_lead: "R",
    support_agent: "R",
    content: "W",
    security: "No",
    engineer: "No",
    auditor: "R",
    analyst: "No",
  },
  legal_documents: {
    owner: "A",
    admin: "Req",
    finance: "No",
    support_lead: "No",
    support_agent: "No",
    content: "Req",
    security: "A",
    engineer: "No",
    auditor: "R",
    analyst: "No",
  },
  platform_settings: {
    owner: "A",
    admin: "W",
    finance: "No",
    support_lead: "No",
    support_agent: "No",
    content: "No",
    security: "R",
    engineer: "R",
    auditor: "R",
    analyst: "No",
  },
  feature_flags: {
    owner: "A",
    admin: "W",
    finance: "No",
    support_lead: "No",
    support_agent: "No",
    content: "No",
    security: "No",
    engineer: "W",
    auditor: "R",
    analyst: "No",
  },
  integrations_secrets: {
    owner: "A",
    admin: "R",
    finance: "No",
    support_lead: "No",
    support_agent: "No",
    content: "No",
    security: "W",
    engineer: "W",
    auditor: "R",
    analyst: "No",
  },
  rate_limits: {
    owner: "A",
    admin: "R",
    finance: "No",
    support_lead: "No",
    support_agent: "No",
    content: "No",
    security: "W",
    engineer: "W",
    auditor: "R",
    analyst: "No",
  },
  health_jobs: {
    owner: "R",
    admin: "R",
    finance: "No",
    support_lead: "R",
    support_agent: "R",
    content: "No",
    security: "R",
    engineer: "W",
    auditor: "R",
    analyst: "R",
  },
  support_tickets: {
    owner: "R",
    admin: "W",
    finance: "No",
    support_lead: "W",
    support_agent: "W",
    content: "No",
    security: "R",
    engineer: "R",
    auditor: "R",
    analyst: "No",
  },
  security_policy: {
    owner: "A",
    admin: "R",
    finance: "No",
    support_lead: "No",
    support_agent: "No",
    content: "No",
    security: "W",
    engineer: "No",
    auditor: "R",
    analyst: "No",
  },
  audit_log: {
    owner: "R",
    admin: "R",
    finance: "R",
    support_lead: "No",
    support_agent: "No",
    content: "No",
    security: "R",
    engineer: "R",
    auditor: "R",
    analyst: "No",
  },
  compliance_requests: {
    owner: "A",
    admin: "R",
    finance: "No",
    support_lead: "No",
    support_agent: "No",
    content: "No",
    security: "W",
    engineer: "No",
    auditor: "R",
    analyst: "No",
  },
  staff_management: {
    owner: "W",
    admin: "No",
    finance: "No",
    support_lead: "No",
    support_agent: "No",
    content: "No",
    security: "Req",
    engineer: "No",
    auditor: "R",
    analyst: "No",
  },
  analytics: {
    owner: "R",
    admin: "R",
    finance: "R",
    support_lead: "R",
    support_agent: "No",
    content: "No",
    security: "No",
    engineer: "R",
    auditor: "R",
    analyst: "R",
  },
};

/**
 * Returns the set of permission keys possessed by a given role
 */
export function getPermissionsForRole(role: PlatformRole): string[] {
  const permissions: string[] = [];

  for (const [areaKey, areaDef] of Object.entries(PLATFORM_AREAS)) {
    const level = PLATFORM_PERMISSION_MATRIX[areaKey as PlatformArea][role];

    if (level === "No") continue;

    // Everyone with R, W, A, Req can read the area
    permissions.push(areaDef.readKey);

    // W and A can write
    if (level === "W" || level === "A") {
      permissions.push(areaDef.writeKey);
    }

    // A can approve
    if (level === "A" && areaDef.approveKey) {
      permissions.push(areaDef.approveKey);
    }

    // Req can request
    if (level === "Req" && areaDef.requestKey) {
      permissions.push(areaDef.requestKey);
    }
  }

  return Array.from(new Set(permissions));
}

export const ROLE_DISPLAY_NAMES: Record<PlatformRole, { label: string; badgeClass: string }> = {
  owner: { label: "Platform Owner", badgeClass: "bg-purple-100 text-purple-800 border-purple-200" },
  admin: { label: "Platform Administrator", badgeClass: "bg-blue-100 text-blue-800 border-blue-200" },
  finance: { label: "Finance Manager", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  support_lead: { label: "Support Lead", badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  support_agent: { label: "Support Agent", badgeClass: "bg-sky-100 text-sky-800 border-sky-200" },
  content: { label: "Content Editor", badgeClass: "bg-amber-100 text-amber-800 border-amber-200" },
  security: { label: "Security & Compliance", badgeClass: "bg-rose-100 text-rose-800 border-rose-200" },
  engineer: { label: "Platform Engineer", badgeClass: "bg-slate-100 text-slate-800 border-slate-300" },
  auditor: { label: "Auditor", badgeClass: "bg-teal-100 text-teal-800 border-teal-200" },
  analyst: { label: "Analyst", badgeClass: "bg-violet-100 text-violet-800 border-violet-200" },
};

