import { db } from "@/db";
import { auditLogs, NewAuditLog } from "@/db/schema";
import { headers } from "next/headers";

export interface LogAuditParams {
  businessId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditLogService {
  /**
   * Records an audit log entry in the append-only audit trail
   */
  static async log(params: LogAuditParams): Promise<void> {
    try {
      let ip = params.ipAddress;
      let ua = params.userAgent;

      // Extract client headers if not explicitly supplied
      if (!ip || !ua) {
        try {
          const reqHeaders = await headers();
          ip = ip || reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "127.0.0.1";
          ua = ua || reqHeaders.get("user-agent") || "unknown";
        } catch {
          // If headers() is not available (e.g. background job or test context), fallback gracefully
          ip = ip || "internal";
          ua = ua || "system";
        }
      }

      await db.insert(auditLogs).values({
        businessId: params.businessId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        oldValues: params.oldValues || null,
        newValues: params.newValues || null,
        metadata: params.metadata || null,
        ipAddress: ip ? ip.slice(0, 45) : null,
        userAgent: ua || null,
      });
    } catch (error) {
      // Audit failures must be reported to stdout/telemetry but not crash the primary operational workflow
      console.error("[AuditLogService] Failed to record audit log:", error);
    }
  }

  /**
   * Helper for logging security and auth actions (logins, overrides, permission modifications)
   */
  static async logSecurity(
    businessId: string,
    userId: string,
    action: "LOGIN" | "LOGOUT" | "PASSWORD_CHANGE" | "MANAGER_OVERRIDE" | "ROLE_CHANGE" | "PERMISSION_REVOKED",
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log({
      businessId,
      userId,
      action,
      entityType: "SECURITY",
      metadata,
    });
  }

  /**
   * Helper for logging inventory corrections, shrinkage, and cost/price alterations
   */
  static async logInventory(
    businessId: string,
    userId: string,
    action: "PRICE_CHANGE" | "COST_CHANGE" | "STOCK_ADJUSTMENT" | "SHRINKAGE_THEFT" | "BATCH_EXPIRED",
    productId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log({
      businessId,
      userId,
      action,
      entityType: "INVENTORY",
      entityId: productId,
      oldValues,
      newValues,
      metadata,
    });
  }

  /**
   * Helper for financial transactions, voids, refunds, and shift closures
   */
  static async logFinancial(
    businessId: string,
    userId: string,
    action: "SALE_VOID" | "REFUND_ISSUED" | "SHIFT_VARIANCE_FLAGGED" | "DEBT_OVERRIDE",
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.log({
      businessId,
      userId,
      action,
      entityType: "FINANCIAL",
      entityId,
      metadata,
    });
  }
}

