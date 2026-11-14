"use server";

import { requireTenantContext } from "@/lib/security/tenant";
import { CustomerService } from "@/lib/parties/customer-service";
import { SupplierService } from "@/lib/parties/supplier-service";
import {
  createPartySchema,
  recordCustomerPaymentSchema,
  recordSupplierPaymentSchema,
} from "@/lib/parties/validation";
import { formatErrorResponse } from "@/lib/security/errors";
import { z } from "zod";

export async function listCustomersAction(search?: string) {
  try {
    const ctx = await requireTenantContext();
    const customers = await CustomerService.listCustomers(ctx, { search });
    return { success: true, customers };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function createCustomerAction(input: z.infer<typeof createPartySchema>) {
  try {
    const ctx = await requireTenantContext();
    const customer = await CustomerService.createCustomer(ctx, input);
    return { success: true, customer };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function recordCustomerRepaymentAction(
  input: z.infer<typeof recordCustomerPaymentSchema>
) {
  try {
    const ctx = await requireTenantContext();
    const payment = await CustomerService.recordCustomerPayment(ctx, input);
    return { success: true, payment };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function listSuppliersAction(search?: string) {
  try {
    const ctx = await requireTenantContext();
    const suppliers = await SupplierService.listSuppliers(ctx);
    return { success: true, suppliers };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function createSupplierAction(input: z.infer<typeof createPartySchema>) {
  try {
    const ctx = await requireTenantContext();
    const supplier = await SupplierService.createSupplier(ctx, input);
    return { success: true, supplier };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function recordSupplierPaymentAction(
  input: z.infer<typeof recordSupplierPaymentSchema>
) {
  try {
    const ctx = await requireTenantContext();
    const payment = await SupplierService.recordSupplierPayment(ctx, input);
    return { success: true, payment };
  } catch (error) {
    return formatErrorResponse(error);
  }
}
