import { z } from "zod";

export const startDaySchema = z.object({
  businessDate: z.string().datetime().optional().or(z.date().optional()),
  openingCash: z.number().min(0, "Opening cash cannot be negative").default(0),
  notes: z.string().optional(),
});

export const closeDaySchema = z.object({
  businessDate: z.string().datetime().optional().or(z.date().optional()),
  actualCash: z.number().min(0, "Actual cash cannot be negative"),
  notes: z.string().optional(),
});

export const reopenDaySchema = z.object({
  dailyClosingId: z.string().uuid("Invalid closing ID"),
  reason: z.string().min(5, "A clear reason (at least 5 characters) is required to reopen a closed day"),
});
