import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCompany } from "@/lib/current-company";
import { PRICING, type PurchaseOption } from "@/lib/entitlements";
import { createCheckout, yocoConfigured } from "@/lib/yoco";

/**
 * Starts a Yoco checkout for a prepaid access period and returns the URL to
 * send the customer to. Nothing is granted here — access is only opened once
 * the payment is confirmed against Yoco itself.
 */
export async function POST(req: NextRequest) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!yocoConfigured()) {
    return NextResponse.json({ error: "Payments aren't configured yet. Set YOCO_SECRET_KEY." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const option = (typeof body.option === "string" ? body.option : "monthly") as PurchaseOption;
  const plan = PRICING[option];
  if (!plan) return NextResponse.json({ error: "Choose a valid plan." }, { status: 400 });

  const subscription =
    (await prisma.subscription.findUnique({ where: { companyId: company.id } })) ??
    (await prisma.subscription.create({ data: { companyId: company.id } }));

  const origin = req.nextUrl.origin;

  try {
    const checkout = await createCheckout({
      amountCents: plan.amountCents,
      successUrl: `${origin}/dashboard/billing?status=success`,
      cancelUrl: `${origin}/dashboard/billing?status=cancelled`,
      failureUrl: `${origin}/dashboard/billing?status=failed`,
      metadata: { companyId: company.id, option, months: String(plan.months) },
    });

    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        checkoutId: checkout.id,
        amountCents: plan.amountCents,
        months: plan.months,
        status: "PENDING",
      },
    });

    return NextResponse.json({ redirectUrl: checkout.redirectUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't start the checkout" },
      { status: 502 }
    );
  }
}
