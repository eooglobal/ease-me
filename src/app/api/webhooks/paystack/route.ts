import { NextRequest, NextResponse } from "next/server";
import { PaystackService } from "@/lib/subscriptions/paystack-service";
import { formatErrorResponse } from "@/lib/security/errors";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    const result = await PaystackService.processWebhookEvent(rawBody, signature);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return NextResponse.json(formatted, { status: 400 });
  }
}
