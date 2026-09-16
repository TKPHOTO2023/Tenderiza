"use client";

import { Suspense, useState } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, CreditCard, Clock } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Me {
  entitlements: {
    plan: "FREE" | "PRO";
    currentPeriodEnd: string | null;
    daysRemaining: number | null;
    draftsUsed: number;
    draftsPerMonth: number;
    canSendFromMailbox: boolean;
  } | null;
}

const OPTIONS = [
  { key: "monthly", price: "R899", label: "1 month", note: "Billed once. Extend whenever you like." },
  { key: "annual", price: "R8 990", label: "12 months", note: "Two months free compared with monthly." },
] as const;

const PRO_FEATURES = [
  "Unlimited AI-drafted bids",
  "Send bids from your own mailbox",
  "RFQ quotations & RFI responses",
  "Compliance checklist & expiry reminders",
  "Full submission audit trail",
];

function BillingContent() {
  const { data, mutate } = useSWR<Me>("/api/auth/me", fetcher);
  const params = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = params.get("status");
  const entitlements = data?.entitlements;
  const isPro = entitlements?.plan === "PRO";

  async function buy(option: string) {
    setBusy(option);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Couldn't start the checkout");
      // Yoco hosts the card form, so this leaves the app entirely.
      window.location.assign(body.redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the checkout");
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Pro is sold as a prepaid period rather than an auto-renewing subscription, so nothing is ever
          charged to your card without you choosing to pay again.
        </p>
      </div>

      {status === "success" && (
        <Alert>
          <AlertDescription>
            Payment received. If your plan still shows Free, give it a moment — Yoco confirms the payment to
            us in the background, and this page updates once it lands.
          </AlertDescription>
        </Alert>
      )}
      {status === "cancelled" && (
        <Alert>
          <AlertDescription>Checkout cancelled — nothing was charged.</AlertDescription>
        </Alert>
      )}
      {status === "failed" && (
        <Alert variant="destructive">
          <AlertDescription>That payment didn&apos;t go through. Nothing was charged — try again below.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Your plan</CardTitle>
            <Badge variant={isPro ? "success" : "outline"}>{entitlements?.plan ?? "…"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          {isPro ? (
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-success" />
              {entitlements?.daysRemaining} day{entitlements?.daysRemaining === 1 ? "" : "s"} remaining — access
              runs to{" "}
              {entitlements?.currentPeriodEnd
                ? new Date(entitlements.currentPeriodEnd).toLocaleDateString("en-ZA")
                : "—"}
              .
            </p>
          ) : (
            <p className="text-muted-foreground">
              You&apos;ve used {entitlements?.draftsUsed ?? 0} of {entitlements?.draftsPerMonth ?? 2} free drafts
              this month. Finding tenders, eligibility checks and downloading your bid pack stay free.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            When a paid period ends you drop back to Free — you keep every document, draft and record already
            in your account.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {OPTIONS.map((option) => (
          <Card key={option.key}>
            <CardHeader>
              <CardTitle className="text-base">{option.label} of Pro</CardTitle>
              <CardDescription>{option.note}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-3xl font-semibold">{option.price}</p>
              <ul className="grid gap-1.5 text-sm text-muted-foreground">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button onClick={() => buy(option.key)} disabled={busy !== null}>
                <CreditCard className="h-4 w-4" />
                {busy === option.key ? "Opening Yoco…" : isPro ? `Add ${option.label}` : `Pay ${option.price}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Payments are processed by Yoco. Tenderiza never sees or stores your card details. Paying again before
        your period ends adds the time on top rather than replacing it.
      </p>

      <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => mutate()}>
        Refresh plan status
      </Button>
    </div>
  );
}

/** useSearchParams needs a boundary, or the page can't be prerendered. */
export default function BillingPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading billing…</p>}>
      <BillingContent />
    </Suspense>
  );
}
