"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Tender } from "@prisma/client";
import type { TenderCostEstimate } from "@/lib/tender-cost-estimate";

const CONFIDENCE_VARIANT = {
  low: "outline",
  medium: "warning",
  high: "success",
} as const;

export function CostEstimate({
  tender,
  onUpdated,
}: {
  tender: Tender;
  onUpdated: (tender: Tender) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimate = tender.costEstimate as (TenderCostEstimate & { documentsAnalyzed: number }) | null;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenders/${tender.id}/cost-estimate`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to generate cost estimate");
      onUpdated(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate cost estimate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Quote guidance</CardTitle>
        <Button onClick={generate} disabled={loading} variant="outline" size="sm">
          <Calculator className="h-4 w-4" />
          {loading ? "Estimating…" : estimate ? "Regenerate" : "Estimate cost"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!estimate && !loading && !error && (
          <p className="text-sm text-muted-foreground">
            Get a rough, generic market-rate range for what a company might quote on this tender —
            independent of the official estimated value, if any.
          </p>
        )}

        {loading && <p className="text-sm text-muted-foreground">Sizing up the scope of work…</p>}

        {estimate && (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-2xl font-semibold">
                  {formatCurrency(estimate.lowEstimate, tender.currency)} –{" "}
                  {formatCurrency(estimate.highEstimate, tender.currency)}
                </p>
                <p className="text-xs text-muted-foreground">Rough guidance range, not a formal quote</p>
              </div>
              <Badge variant={CONFIDENCE_VARIANT[estimate.confidence]}>
                {estimate.confidence} confidence
              </Badge>
            </div>

            {tender.estimatedValue != null && (
              <div className="rounded-md border border-border bg-secondary/50 p-3 text-sm">
                <span className="font-medium">Official OCDS estimate: </span>
                {formatCurrency(tender.estimatedValue, tender.currency)}
                {estimate.comparisonToOfficialValue && (
                  <p className="mt-1 text-muted-foreground">{estimate.comparisonToOfficialValue}</p>
                )}
              </div>
            )}

            <div className="grid gap-1.5">
              <p className="text-sm font-medium">Basis of estimate</p>
              <p className="text-sm text-muted-foreground">{estimate.basisOfEstimate}</p>
            </div>

            <div className="grid gap-1.5">
              <p className="text-sm font-medium">What moves the price</p>
              {estimate.costDrivers.length === 0 ? (
                <p className="text-sm text-muted-foreground">None specified.</p>
              ) : (
                <ul className="grid list-disc gap-1 pl-5 text-sm text-muted-foreground">
                  {estimate.costDrivers.map((driver, i) => (
                    <li key={i}>{driver}</li>
                  ))}
                </ul>
              )}
            </div>

            <Separator />
            <p className="text-xs text-muted-foreground">
              Generic market-rate estimate, not personalized to your company&apos;s cost structure. Based on{" "}
              {estimate.documentsAnalyzed} document{estimate.documentsAnalyzed === 1 ? "" : "s"}
              {estimate.documentsAnalyzed === 0 && " (none could be read — estimate is based on the listing only)"}.
              Generated {tender.costEstimateGeneratedAt && new Date(tender.costEstimateGeneratedAt).toLocaleString("en-ZA")}.
              Always prepare your own detailed costing before submitting a bid.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
