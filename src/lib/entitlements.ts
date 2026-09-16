import { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * What each plan may do. Free is a genuine working tier — you can find
 * tenders, see whether you qualify, and produce a limited number of drafts —
 * so someone can prove the product works before paying.
 */
export const LIMITS = {
  FREE: { draftsPerMonth: 2, canSendFromMailbox: false, canDownloadBidPack: true },
  PRO: { draftsPerMonth: Infinity, canSendFromMailbox: true, canDownloadBidPack: true },
} as const;

export const PRICING = {
  monthly: { months: 1, amountCents: 89900, label: "1 month" },
  annual: { months: 12, amountCents: 899000, label: "12 months (2 months free)" },
} as const;

export type PurchaseOption = keyof typeof PRICING;

export interface Entitlements {
  plan: Plan;
  /** PRO access is time-boxed — Yoco has no recurring billing, so periods are prepaid. */
  currentPeriodEnd: Date | null;
  daysRemaining: number | null;
  draftsUsed: number;
  draftsPerMonth: number;
  draftsRemaining: number;
  canGenerateDraft: boolean;
  canSendFromMailbox: boolean;
}

/**
 * Reads a company's live entitlements, lapsing an expired PRO period back to
 * FREE as it goes. Expiry never locks anyone out of data they already have —
 * it only closes the paid capabilities.
 */
export async function getEntitlements(companyId: string): Promise<Entitlements> {
  let subscription = await prisma.subscription.findUnique({ where: { companyId } });
  if (!subscription) {
    subscription = await prisma.subscription.create({ data: { companyId } });
  }

  const now = new Date();
  const lapsed = subscription.plan === "PRO" && subscription.currentPeriodEnd && subscription.currentPeriodEnd < now;
  if (lapsed) {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { plan: "FREE", currentPeriodEnd: null },
    });
  }

  // The free allowance is per calendar month of use, reset lazily on read.
  const cycleAge = now.getTime() - subscription.cycleStartedAt.getTime();
  if (cycleAge > 30 * 86_400_000) {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { draftsUsedThisCycle: 0, cycleStartedAt: now },
    });
  }

  const limits = LIMITS[subscription.plan];
  const draftsRemaining = Math.max(0, limits.draftsPerMonth - subscription.draftsUsedThisCycle);

  return {
    plan: subscription.plan,
    currentPeriodEnd: subscription.currentPeriodEnd,
    daysRemaining: subscription.currentPeriodEnd
      ? Math.max(0, Math.ceil((subscription.currentPeriodEnd.getTime() - now.getTime()) / 86_400_000))
      : null,
    draftsUsed: subscription.draftsUsedThisCycle,
    draftsPerMonth: limits.draftsPerMonth,
    draftsRemaining: limits.draftsPerMonth === Infinity ? Infinity : draftsRemaining,
    canGenerateDraft: limits.draftsPerMonth === Infinity || draftsRemaining > 0,
    canSendFromMailbox: limits.canSendFromMailbox,
  };
}

/** Counts one draft against the free allowance. PRO is unmetered. */
export async function recordDraftUsage(companyId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({ where: { companyId } });
  if (!subscription || subscription.plan === "PRO") return;
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { draftsUsedThisCycle: { increment: 1 } },
  });
}

/**
 * Adds a paid period. Time stacks on whatever is left, so paying again before
 * expiry extends rather than resets — nobody loses days they've paid for.
 */
export async function grantPaidPeriod(companyId: string, months: number): Promise<void> {
  const subscription = await prisma.subscription.findUnique({ where: { companyId } });
  if (!subscription) return;

  const base =
    subscription.currentPeriodEnd && subscription.currentPeriodEnd > new Date()
      ? subscription.currentPeriodEnd
      : new Date();
  const end = new Date(base);
  end.setMonth(end.getMonth() + months);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { plan: "PRO", currentPeriodEnd: end, draftsUsedThisCycle: 0, cycleStartedAt: new Date() },
  });
}
