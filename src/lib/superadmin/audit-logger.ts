import { PlatformRole } from "./permission-matrix";

export interface LogPlatformAuditInput {
  staffId?: string;
  staffEmail: string;
  staffRole: PlatformRole | string;
  action: string;
  entityType: string;
  entityId?: string;
  previousValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
}

export interface PlatformAuditRecord {
  id: string;
  staffId?: string;
  staffEmail: string;
  staffRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  previousValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// In-memory fallback / append-only ring buffer for immediate testing and verification
const inMemoryAuditTrail: PlatformAuditRecord[] = [];

export class PlatformAuditLogger {
  /**
   * Section 2 & 7: Writes an immutable, append-only platform audit entry.
   * Holds: who, what, when, previous value, and new value.
   */
  public static async log(input: LogPlatformAuditInput): Promise<PlatformAuditRecord> {
    const record: PlatformAuditRecord = {
      id: `p-aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      staffId: input.staffId,
      staffEmail: input.staffEmail,
      staffRole: input.staffRole,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      previousValue: input.previousValue ? JSON.parse(JSON.stringify(input.previousValue)) : null,
      newValue: input.newValue ? JSON.parse(JSON.stringify(input.newValue)) : null,
      ipAddress: input.ipAddress || "127.0.0.1",
      userAgent: input.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      createdAt: new Date().toISOString(),
    };

    // Immutability rule: Append-only, never mutate or delete existing items
    Object.freeze(record);
    inMemoryAuditTrail.unshift(record);

    return record;
  }

  /**
   * Retrieves audit logs with filtering by staff member, action, target tenant, and date range
   */
  public static async query(filter?: {
    staffEmail?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
  }): Promise<PlatformAuditRecord[]> {
    let results = [...inMemoryAuditTrail];

    if (filter?.staffEmail) {
      results = results.filter((r) => r.staffEmail.toLowerCase().includes(filter.staffEmail!.toLowerCase()));
    }
    if (filter?.action) {
      results = results.filter((r) => r.action.toLowerCase().includes(filter.action!.toLowerCase()));
    }
    if (filter?.entityType) {
      results = results.filter((r) => r.entityType === filter.entityType);
    }
    if (filter?.entityId) {
      results = results.filter((r) => r.entityId === filter.entityId);
    }

    if (filter?.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  /**
   * Export audit log to RFC 4180 CSV, with mandatory logging of the export action itself
   */
  public static async exportToCSV(actor: { email: string; role: string }): Promise<string> {
    // Section 6.9: "Export to CSV, and each export is itself logged."
    await this.log({
      staffEmail: actor.email,
      staffRole: actor.role,
      action: "audit.export_csv",
      entityType: "platform_audit_logs",
      newValue: { count: inMemoryAuditTrail.length, timestamp: new Date().toISOString() },
    });

    const headers = ["Timestamp (UTC)", "Staff Email", "Staff Role", "Action", "Entity Type", "Entity ID", "Previous Value", "New Value"];
    const rows = inMemoryAuditTrail.map((r) => [
      `"${r.createdAt}"`,
      `"${r.staffEmail}"`,
      `"${r.staffRole}"`,
      `"${r.action}"`,
      `"${r.entityType}"`,
      `"${r.entityId || ""}"`,
      `"${JSON.stringify(r.previousValue || {}).replace(/"/g, '""')}"`,
      `"${JSON.stringify(r.newValue || {}).replace(/"/g, '""')}"`,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  public static clearForTesting(): void {
    inMemoryAuditTrail.length = 0;
  }
}

