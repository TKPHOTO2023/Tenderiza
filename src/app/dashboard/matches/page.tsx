"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import { ProcurementTypeBadge } from "@/components/tenders/procurement-type-badge";
import { useMatches } from "@/lib/use-matches";
import { formatDate } from "@/lib/format";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MatchesPage() {
  const { matches, isLoading, mutate } = useMatches();
  const [recomputing, setRecomputing] = useState(false);

  async function recomputeAll() {
    setRecomputing(true);
    try {
      await fetch("/api/matches/recompute", { method: "POST" });
      await mutate();
    } finally {
      setRecomputing(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Matches</h1>
          <p className="text-sm text-muted-foreground">
            Open tenders scored against your company profile — best matches first.
          </p>
        </div>
        <Button onClick={recomputeAll} disabled={recomputing} variant="outline" size="sm">
          <RefreshCw className={cn("h-4 w-4", recomputing && "animate-spin")} />
          {recomputing ? "Recomputing…" : "Recompute all"}
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading matches…</p>}

      {!isLoading && matches?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="font-medium">No matches yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Matches are computed automatically each time tenders sync. Sync tenders first, or click
              &quot;Recompute all&quot; if you&apos;ve just updated your company profile.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {matches?.map((match) => (
          <Link key={match.id} href={`/dashboard/matches/${match.tenderId}`}>
            <Card className="transition-colors hover:bg-accent/40">
              <CardContent className="grid gap-2 py-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium leading-snug">{match.tender.title || "Untitled tender"}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <ProcurementTypeBadge type={match.tender.procurementType} />
                    <MatchStatusBadge status={match.status} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {match.tender.buyerName && <span>{match.tender.buyerName}</span>}
                  <span>Closes: {formatDate(match.tender.closingDate)}</span>
                </div>
                {match.reasons.length > 0 && (
                  <p className="text-sm text-muted-foreground">{match.reasons[0]}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
