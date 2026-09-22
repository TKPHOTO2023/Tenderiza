"use client";

import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import { ProcurementTypeBadge } from "@/components/tenders/procurement-type-badge";
import { PricingScheduleTable } from "@/components/tenders/pricing-schedule-table";
import { AtAGlance } from "@/components/tenders/at-a-glance";
import { BidSteps } from "@/components/tenders/bid-steps";
import { BidButton } from "@/components/tenders/bid-button";
import type { BidStep } from "@/lib/bid-readiness";
import { formatDate } from "@/lib/format";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, HelpCircle, Info, RefreshCw, FileEdit } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Match, Tender } from "@prisma/client";
import type { HardCheck } from "@/lib/match-eligibility";
import type { ExtractedRequirements } from "@/lib/tender-extraction";
import { fetchJson, readJson } from "@/lib/api-client";


const CHECK_ICON = {
  pass: <CheckCircle2 className="h-4 w-4 text-success" />,
  fail: <XCircle className="h-4 w-4 text-destructive" />,
  needs_review: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
  info: <Info className="h-4 w-4 text-muted-foreground" />,
};

export default function MatchDetailPage({ params }: { params: Promise<{ tenderId: string }> }) {
  const { tenderId } = use(params);
  const { data: match, isLoading, mutate } = useSWR<Match & { tender: Tender }>(
    `/api/matches/${tenderId}`,
    fetchJson
  );
  const { data: bidSteps, mutate: mutateSteps } = useSWR<{ steps: BidStep[]; draftId: string | null }>(
    `/api/matches/${tenderId}/bid-steps`,
    fetchJson
  );
  const [rechecking, setRechecking] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function generateDraft() {
    setGeneratingDraft(true);
    setError(null);
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId }),
      });
      const body = await readJson(res);
      await mutateSteps();
      router.push(`/dashboard/drafts/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate draft");
      setGeneratingDraft(false);
    }
  }

  async function recheck() {
    setRechecking(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches/${tenderId}/recheck`, { method: "POST" });
      const body = await readJson(res);
      mutate(body, { revalidate: false });
      await mutateSteps();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to re-check");
    } finally {
      setRechecking(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!match) return <p className="text-sm text-muted-foreground">No match found for this tender.</p>;

  const extracted = match.tender.extractedRequirements as ExtractedRequirements | null;
  const hardChecks = match.hardChecks as unknown as HardCheck[];

  return (
    <div className="grid gap-6">
      <Link href="/dashboard/matches">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" /> Back to matches
        </Button>
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{match.tender.title || "Untitled tender"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Closes {formatDate(match.tender.closingDate)} · Last scored{" "}
            {new Date(match.computedAt).toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProcurementTypeBadge type={match.tender.procurementType} />
          <MatchStatusBadge status={match.status} />
          <Button onClick={recheck} disabled={rechecking} variant="outline" size="sm">
            <RefreshCw className={cn("h-4 w-4", rechecking && "animate-spin")} />
            {rechecking ? "Re-checking…" : "Re-check"}
          </Button>
          {bidSteps?.draftId ? (
            <Button onClick={generateDraft} disabled={generatingDraft} size="sm">
              <FileEdit className="h-4 w-4" />
              {generatingDraft ? "Regenerating…" : "Regenerate draft"}
            </Button>
          ) : (
            <BidButton tenderId={tenderId} size="sm" />
          )}
        </div>
      </div>

      <p className="-mt-4 text-xs text-muted-foreground">
        Only generate a draft for a tender you&apos;ve actually decided to pursue — it produces real
        documents (compliance summary + technical proposal) using a Claude API call.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <AtAGlance tender={match.tender} />

      {bidSteps?.steps && (
        <BidSteps
          steps={bidSteps.steps}
          onAction={(key) => {
            if (key === "draft") generateDraft();
            if (key === "eligibility") recheck();
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Structural match</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant={match.categoryMatch ? "success" : "outline"}>
              Category {match.categoryMatch ? "match" : "no match"}
            </Badge>
            <Badge variant={match.provinceMatch ? "success" : "outline"}>
              Province {match.provinceMatch ? "match" : "no match"}
            </Badge>
          </div>
          <ul className="grid list-disc gap-1 pl-5 text-sm text-muted-foreground">
            {match.reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requirement checks</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {hardChecks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {match.categoryMatch || match.provinceMatch
                ? "No requirement extraction available yet for this tender — click Re-check, or wait for the next sync."
                : "Skipped — this tender didn't pass the structural match, so requirements weren't extracted."}
            </p>
          ) : (
            hardChecks.map((check, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                {CHECK_ICON[check.status]}
                <div>
                  <p className="font-medium">{check.requirement}</p>
                  <p className="text-muted-foreground">{check.detail}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {extracted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scope (from tender documents)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{extracted.scopeSummary}</p>
          </CardContent>
        </Card>
      )}

      {(extracted?.requiredDocuments?.length || extracted?.contactPersonName || extracted?.contactEmail) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {extracted.requiredDocuments?.length > 0 && (
            <Card className="border-l-4 border-l-warning">
              <CardHeader>
                <CardTitle className="text-base">Documents this tender asks for</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-1.5 text-sm">
                  {extracted.requiredDocuments.map((doc, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted-foreground">•</span>
                      {doc}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(extracted.contactPersonName || extracted.contactEmail || extracted.contactPhone) && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="text-base">Enquiries</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {extracted.contactPersonName && (
                  <p>
                    <span className="text-muted-foreground">Contact: </span>
                    {extracted.contactPersonName}
                  </p>
                )}
                {extracted.contactEmail && (
                  <p className="break-words">
                    <span className="text-muted-foreground">Email: </span>
                    <a href={`mailto:${extracted.contactEmail}`} className="font-mono text-xs text-primary underline">
                      {extracted.contactEmail}
                    </a>
                  </p>
                )}
                {extracted.contactPhone && (
                  <p>
                    <span className="text-muted-foreground">Phone: </span>
                    <span className="font-mono text-xs">{extracted.contactPhone}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {match.tender.pricingSchedule != null &&
        Array.isArray(match.tender.pricingSchedule) &&
        match.tender.pricingSchedule.length > 0 && (
          <PricingScheduleTable
            items={match.tender.pricingSchedule as unknown as ExtractedRequirements["pricingScheduleItems"]}
          />
        )}

      <Link href={`/dashboard/tenders/${match.tenderId}`}>
        <Button variant="outline" size="sm">
          View full tender details <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
