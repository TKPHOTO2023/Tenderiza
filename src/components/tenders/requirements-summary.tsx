"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Sparkles } from "lucide-react";
import type { Tender } from "@prisma/client";
import type { TenderRequirements } from "@/lib/tender-summary";

export function RequirementsSummary({
  tender,
  onUpdated,
}: {
  tender: Tender;
  onUpdated: (tender: Tender) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = tender.requirementsSummary as (TenderRequirements & { documentsAnalyzed: number }) | null;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenders/${tender.id}/summary`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to generate summary");
      onUpdated(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">What must be delivered</CardTitle>
        <Button onClick={generate} disabled={loading} variant="outline" size="sm">
          <Sparkles className="h-4 w-4" />
          {loading ? "Analyzing…" : summary ? "Regenerate" : "Generate summary"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!summary && !loading && !error && (
          <p className="text-sm text-muted-foreground">
            Generate an AI summary of the scope of work, deliverables, and eligibility/submission
            requirements pulled from this tender&apos;s documents.
          </p>
        )}

        {loading && <p className="text-sm text-muted-foreground">Reading tender documents…</p>}

        {summary && (
          <div className="grid gap-4">
            <p className="text-sm">{summary.overview}</p>

            <Section title="Scope of work">
              <p className="text-sm text-muted-foreground">{summary.scopeOfWork}</p>
            </Section>

            <Section title="Deliverables">
              <BulletList items={summary.deliverables} />
            </Section>

            <Section title="Eligibility requirements">
              <BulletList items={summary.eligibilityRequirements} />
            </Section>

            <Section title="Submission requirements">
              <BulletList items={summary.submissionRequirements} />
            </Section>

            {summary.keyDates?.length > 0 && (
              <Section title="Other key dates">
                <div className="flex flex-wrap gap-2">
                  {summary.keyDates.map((d, i) => (
                    <Badge key={i} variant="outline">
                      {d.label}: {d.date}
                    </Badge>
                  ))}
                </div>
              </Section>
            )}

            <Separator />
            <p className="text-xs text-muted-foreground">
              Based on {summary.documentsAnalyzed} document{summary.documentsAnalyzed === 1 ? "" : "s"}
              {summary.documentsAnalyzed === 0 && " (none could be read — summary is based on the listing only)"}.
              Generated {tender.requirementsSummaryGeneratedAt && new Date(tender.requirementsSummaryGeneratedAt).toLocaleString("en-ZA")}.
              Always verify against the original tender documents before bidding.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">None specified.</p>;
  }
  return (
    <ul className="grid list-disc gap-1 pl-5 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
