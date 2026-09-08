"use client";

import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import { formatDate } from "@/lib/format";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, HelpCircle, Info, RefreshCw, FileEdit } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Match, Tender } from "@prisma/client";
import type { HardCheck } from "@/lib/match-eligibility";
import type { ExtractedRequirements } from "@/lib/tender-extraction";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
    fetcher
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
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to generate draft");
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
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to re-check");
      mutate(body, { revalidate: false });
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
          <MatchStatusBadge status={match.status} />
          <Button onClick={recheck} disabled={rechecking} variant="outline" size="sm">
            <RefreshCw className={cn("h-4 w-4", rechecking && "animate-spin")} />
            {rechecking ? "Re-checking…" : "Re-check"}
          </Button>
          <Button onClick={generateDraft} disabled={generatingDraft} size="sm">
            <FileEdit className="h-4 w-4" />
            {generatingDraft ? "Generating draft…" : "Generate draft"}
          </Button>
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

      <Link href={`/dashboard/tenders/${match.tenderId}`}>
        <Button variant="outline" size="sm">
          View full tender details <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
