"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDrafts } from "@/lib/use-drafts";
import { formatDate } from "@/lib/format";
import { AlertTriangle } from "lucide-react";
import { DraftStatusBadge } from "@/components/drafts/status-badge";

export default function DraftsPage() {
  const { drafts, isLoading } = useDrafts();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Drafts</h1>
        <p className="text-sm text-muted-foreground">
          First-pass bid documents for tenders you&apos;ve decided to pursue — generated from a
          tender&apos;s Match detail page. Every draft needs your review before it&apos;s ready — head to{" "}
          <Link href="/dashboard/review" className="font-medium text-primary underline">
            Review &amp; submission
          </Link>{" "}
          to take it from here.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading drafts…</p>}

      {!isLoading && drafts?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="font-medium">No drafts yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Go to a tender&apos;s match detail page and click &quot;Generate draft&quot; for one you&apos;ve
              decided to pursue.
            </p>
            <Link href="/dashboard/matches" className="text-sm font-medium text-primary underline">
              Go to Matches
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {drafts?.map((draft) => (
          <Link key={draft.id} href={`/dashboard/drafts/${draft.id}`}>
            <Card className="border-l-4 border-l-destructive transition-colors hover:bg-accent/40">
              <CardContent className="grid gap-2 py-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium leading-snug">{draft.tender.title || "Untitled tender"}</p>
                  <Badge variant="outline" className="flex items-center gap-1 border-destructive text-destructive">
                    <AlertTriangle className="h-3 w-3" /> DRAFT
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>Closes: {formatDate(draft.tender.closingDate)}</span>
                  <DraftStatusBadge status={draft.status} />
                  <span>Generated: {new Date(draft.generatedAt).toLocaleDateString("en-ZA")}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
