/**
 * Debtor and Customer Aging Service
 * Handles credit headroom, debt aging schedules, and WhatsApp statement generation
 */

export interface AgingBuckets {
  current: number; // 0 days (not yet due)
  days1To30: number; // 1-30 days overdue
  days31To60: number; // 31-60 days overdue
  over60Days: number; // >60 days overdue
  totalOutstanding: number;
}

export interface DebtorRecord {
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  creditLimit: number;
  currentBalance: number;
  availableHeadroom: number;
  lastPaymentDate?: string;
  earliestDueDate?: string;
  daysOverdue: number;
  aging: AgingBuckets;
}

export class DebtorService {
  /**
   * Section 7: Available credit headroom formula:
   * Headroom = max(0, Credit Limit - Current Balance)
   */
  public static calculateHeadroom(creditLimit: number, currentBalance: number): number {
    const raw = Number(creditLimit) - Number(currentBalance);
    return Math.max(0, Math.round(raw * 100) / 100);
  }

  /**
   * Section 7: Credit Sale Validation
   * Checks if an additional credit sale would exceed available headroom.
   */
  public static canExtendCredit(
    creditLimit: number,
    currentBalance: number,
    saleAmount: number
  ): {
    allowed: boolean;
    headroom: number;
    projectedBalance: number;
    excessAmount: number;
  } {
    const headroom = this.calculateHeadroom(creditLimit, currentBalance);
    const projectedBalance = Math.round((Number(currentBalance) + Number(saleAmount)) * 100) / 100;
    const excess = Math.max(0, Math.round((projectedBalance - Number(creditLimit)) * 100) / 100);

    return {
      allowed: saleAmount <= headroom,
      headroom,
      projectedBalance,
      excessAmount: excess,
    };
  }

  /**
   * Calculates the due date from customer terms:
   * Due Date = Transaction Date + Terms (days)
   */
  public static calculateDueDate(transactionDate: Date, creditTermsDays: number): Date {
    const due = new Date(transactionDate);
    due.setDate(due.getDate() + creditTermsDays);
    return due;
  }

  /**
   * Buckets a list of unpaid debit items into standard accounting aging schedule
   */
  public static calculateAgingBuckets(
    debts: Array<{ amount: number; dueDate: Date }>,
    asOfDate: Date = new Date()
  ): AgingBuckets {
    let current = 0;
    let days1To30 = 0;
    let days31To60 = 0;
    let over60Days = 0;

    for (const item of debts) {
      const diffMs = asOfDate.getTime() - new Date(item.dueDate).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        current += item.amount;
      } else if (diffDays <= 30) {
        days1To30 += item.amount;
      } else if (diffDays <= 60) {
        days31To60 += item.amount;
      } else {
        over60Days += item.amount;
      }
    }

    const total = current + days1To30 + days31To60 + over60Days;

    return {
      current: Math.round(current * 100) / 100,
      days1To30: Math.round(days1To30 * 100) / 100,
      days31To60: Math.round(days31To60 * 100) / 100,
      over60Days: Math.round(over60Days * 100) / 100,
      totalOutstanding: Math.round(total * 100) / 100,
    };
  }

  /**
   * Section 6.1: Generates pre-filled WhatsApp statement reminder
   */
  public static generateWhatsAppStatementText(input: {
    customerName: string;
    businessName: string;
    outstandingBalance: number;
    dueDate?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  }): string {
    const formattedBalance = `₦${input.outstandingBalance.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
    })}`;

    const lines = [
      `Hello ${input.customerName},`,
      ``,
      `This is a friendly statement update from *${input.businessName}*.`,
      `Your outstanding account balance is *${formattedBalance}*${
        input.dueDate ? ` (Due date: ${input.dueDate})` : ""
      }.`,
      ``,
      `Kindly make payment to our settlement account:`,
      `• Bank: ${input.bankName || "Access Bank / Moniepoint"}`,
      `• Account No: ${input.accountNumber || "0123456789"}`,
      `• Name: ${input.accountName || input.businessName}`,
      ``,
      `Please share your transaction receipt or payment reference once completed. Thank you for your continued patronage!`,
    ];

    return lines.join("\n");
  }

  /**
   * Generates a clickable WhatsApp deep link URI
   */
  public static buildWhatsAppLink(phone: string, messageText: string): string {
    // Clean Nigerian phone number (replace +234 or 0 prefix with 234)
    let cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "234" + cleaned.slice(1);
    } else if (!cleaned.startsWith("234")) {
      cleaned = "234" + cleaned;
    }

    const encodedText = encodeURIComponent(messageText);
    return `https://wa.me/${cleaned}?text=${encodedText}`;
  }
}

