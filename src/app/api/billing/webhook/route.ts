import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { grantPaidPeriod } from "@/lib/entitlements";
import { verifyWebhook, fetchCheckout } from "@/lib/yoco";

/**
 * Yoco payment webhook.
 *
 * Two independent gates before a cent of access is granted:
 *  1. the Standard Webhooks signature must verify, and
 *  2. the checkout is re-read from Yoco's own API and must actually be paid.
 *
 * So a forged or replayed event grants nothing even if the signing secret
 * ever leaked. Handling is idempotent — Yoco retries, and a payment already
 * marked SUCCEEDED is acknowledged without extending the period twice.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifyWebhook(req.headers, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type?: string; payload?: { id?: string; status?: string; metadata?: Record<string, string> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed body" }, { status: 400 });
  }

  const checkoutId = event.payload?.metadata?.checkoutId ?? event.payload?.id;
  if (!checkoutId) return NextResponse.json({ received: true });

  const payment = await prisma.payment.findUnique({
    where: { checkoutId },
    include: { subscription: true },
  });
  // An unknown checkout isn't ours to act on; acknowledge so Yoco stops retrying.
  if (!payment) return NextResponse.json({ received: true });
  if (payment.status === "SUCCEEDED") return NextResponse.json({ received: true, alreadyProcessed: true });

  // Gate 2: ask Yoco directly rather than trusting the event body.
  let paid = false;
  let paymentId: string | null = null;
  try {
    const checkout = await fetchCheckout(checkoutId);
    paid = ["succeeded", "completed", "paid"].includes((checkout.status ?? "").toLowerCase());
    paymentId = checkout.paymentId ?? null;
  } catch {
    // Couldn't confirm — leave PENDING so a retry can settle it. Never guess.
    return NextResponse.json({ received: true, confirmed: false }, { status: 202 });
  }

  if (!paid) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: event.type?.includes("failed") ? "FAILED" : payment.status },
    });
    return NextResponse.json({ received: true, paid: false });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCEEDED", paidAt: new Date(), paymentId },
  });
  await grantPaidPeriod(payment.subscription.companyId, payment.months);

  return NextResponse.json({ received: true, granted: true });
}
