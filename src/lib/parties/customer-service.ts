import { db } from "@/db";
import { customers, customerTransactions, payments, financialTransactions, auditLogs } from "@/db/schema";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import { TenantContext, requirePermission } from "@/lib/security/tenant";
import { NotFoundError, ValidationError } from "@/lib/security/errors";
import { createPartySchema, updatePartySchema, recordCustomerPaymentSchema } from "./validation";
import { z } from "zod";

export class CustomerService {
  /**
   * Lists customers with their current outstanding debt balance
   */
  static async listCustomers(ctx: TenantContext, filters?: { search?: string }) {
    requirePermission(ctx, "customers.view");

    return db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        address: customers.address,
        notes: customers.notes,
        status: customers.status,
        totalDebit: sql<string>`COALESCE(SUM(${customerTransactions.debit}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${customerTransactions.credit}), 0)`,
        currentBalance: sql<string>`COALESCE(SUM(${customerTransactions.debit}), 0) - COALESCE(SUM(${customerTransactions.credit}), 0)`,
      })
      .from(customers)
      .leftJoin(customerTransactions, eq(customers.id, customerTransactions.customerId))
      .where(eq(customers.businessId, ctx.businessId))
      .groupBy(customers.id)
      .orderBy(asc(customers.name));
  }

  static async getCustomerById(ctx: TenantContext, customerId: string) {
    requirePermission(ctx, "customers.view");

    const [customer] = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        address: customers.address,
        notes: customers.notes,
        status: customers.status,
        totalDebit: sql<string>`COALESCE(SUM(${customerTransactions.debit}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${customerTransactions.credit}), 0)`,
        currentBalance: sql<string>`COALESCE(SUM(${customerTransactions.debit}), 0) - COALESCE(SUM(${customerTransactions.credit}), 0)`,
      })
      .from(customers)
      .leftJoin(customerTransactions, eq(customers.id, customerTransactions.customerId))
      .where(
        and(
          eq(customers.id, customerId),
          eq(customers.businessId, ctx.businessId)
        )
      )
      .groupBy(customers.id);

    if (!customer) {
      throw new NotFoundError("Customer");
    }

    return customer;
  }

  static async createCustomer(ctx: TenantContext, input: z.infer<typeof createPartySchema>) {
    requirePermission(ctx, "customers.manage");
    const validated = createPartySchema.parse(input);

    const [customer] = await db
      .insert(customers)
      .values({
        businessId: ctx.businessId,
        name: validated.name,
        phone: validated.phone,
        email: validated.email,
        address: validated.address,
        notes: validated.notes,
        status: "active",
      })
      .returning();

    return customer;
  }

  static async updateCustomer(ctx: TenantContext, customerId: string, input: z.infer<typeof updatePartySchema>) {
    requirePermission(ctx, "customers.manage");
    const validated = updatePartySchema.parse(input);

    const [updated] = await db
      .update(customers)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customers.id, customerId),
          eq(customers.businessId, ctx.businessId)
        )
      )
      .returning();

    if (!updated) {
      throw new NotFoundError("Customer");
    }

    return updated;
  }

  /**
   * Records a customer payment towards outstanding debt.
   * Atomically creates customer transaction credit, payment record, and financial transaction inflow.
   */
  static async recordCustomerPayment(ctx: TenantContext, input: z.infer<typeof recordCustomerPaymentSchema>) {
    requirePermission(ctx, "customers.record_payment");
    const validated = recordCustomerPaymentSchema.parse(input);

    return db.transaction(async (tx) => {
      // 1. Verify customer exists
      const [customer] = await tx
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.id, validated.customerId),
            eq(customers.businessId, ctx.businessId)
          )
        );

      if (!customer) {
        throw new NotFoundError("Customer");
      }

      // 2. Insert Payment Record
      const [paymentRecord] = await tx
        .insert(payments)
        .values({
          businessId: ctx.businessId,
          paymentMethod: validated.paymentMethod,
          amount: validated.amount.toString(),
          referenceType: validated.referenceType,
          referenceId: customer.id,
          status: "completed",
          externalReference: validated.externalReference,
          receivedBy: ctx.userId,
        })
        .returning();

      // 3. Insert Customer Transaction (Credit to reduce customer balance)
      const [customerTxn] = await tx
        .insert(customerTransactions)
        .values({
          businessId: ctx.businessId,
          customerId: customer.id,
          transactionType: "payment",
          referenceType: "payment",
          referenceId: paymentRecord.id,
          debit: "0",
          credit: validated.amount.toString(),
          description: validated.description || `Debt repayment by ${customer.name}`,
          createdBy: ctx.userId,
        })
        .returning();

      // 4. Insert Financial Transaction (Cash / Bank Inflow reducing Receivables)
      const accountType = validated.paymentMethod === "bank_transfer" ? "bank" : validated.paymentMethod === "card" ? "card" : "cash";

      await tx.insert(financialTransactions).values({
        businessId: ctx.businessId,
        transactionType: "CUSTOMER_PAYMENT",
        referenceType: "customer_transaction",
        referenceId: customerTxn.id,
        amount: validated.amount.toString(),
        direction: "in",
        accountType,
        description: `Customer payment received from ${customer.name} (${validated.paymentMethod})`,
        createdBy: ctx.userId,
      });

      // 5. Audit Log
      await tx.insert(auditLogs).values({
        businessId: ctx.businessId,
        userId: ctx.userId,
        action: "CUSTOMER_PAYMENT_RECORDED",
        entityType: "customer",
        entityId: customer.id,
        newValues: {
          amount: validated.amount,
          paymentMethod: validated.paymentMethod,
          paymentId: paymentRecord.id,
        },
      });

      return {
        payment: paymentRecord,
        customerTransaction: customerTxn,
      };
    });
  }

  /**
   * Retrieves full statement of account / transaction ledger for a customer
   */
  static async getCustomerLedger(ctx: TenantContext, customerId: string) {
    requirePermission(ctx, "customers.view");

    return db
      .select()
      .from(customerTransactions)
      .where(
        and(
          eq(customerTransactions.businessId, ctx.businessId),
          eq(customerTransactions.customerId, customerId)
        )
      )
      .orderBy(desc(customerTransactions.createdAt));
  }
}
