"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDrafts } from "@/lib/use-drafts";
import { useReminders } from "@/lib/use-reminders";
import { RemindersList } from "@/components/drafts/reminders-list";
import { DraftStatusBadge } from "@/components/drafts/status-badge";
import { ClosingBadge } from "@/components/tenders/closing-badge";
import { formatDate } from "@/lib/format";
import type { ChecklistItem } from "@/lib/compliance-checklist";
import type { DraftStatus } from "@prisma/client";
import { CheckCircle2, CircleDollarSign, XCircle } from "lucide-react";

// Active work the review dashboard surfaces up front, ranked worst-first;
// SUBMITTED and NOT_SUBMITTING are done and shown separately, collapsed.
const ACTIVE_ORDER: DraftStatus[] = ["APPROVED", "UNDER_REVIEW", "DRAFT"];

export default function ReviewDashboardPage() {
  const { drafts, isLoading } = useDrafts();
  const { reminders } = useReminders();

  const active = (drafts ?? [])
    .filter((d) => ACTIVE_ORDER.includes(d.status))
    .sort((a, b) => {
      const rank = (s: DraftStatus) => ACTIVE_ORDER.indexOf(s);
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
      const da = a.tender.closingDate ? new Date(a.tender.closingDate).getTime() : Infinity;
      const db = b.tender.closingDate ? new Date(b.tender.closingDate).getTime() : Infinity;
      return da - db;
    });

  const done = (drafts ?? []).filter((d) => !ACTIVE_ORDER.includes(d.status));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Review &amp; submission</h1>
        <p className="text-sm text-muted-foreground">
          Every draft still needing a decision, worst-deadline first. Nothing here submits anything —
          Tenderiza never sends a bid anywhere on its own; every step below is a click you make yourself.
        </p>
      </div>

      {reminders && reminders.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="text-base">Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <RemindersList reminders={reminders} />
          </CardContent>
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && active.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nothing needs review right now — generate a draft from a tender&apos;s Match page to get started.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {active.map((draft) => {
          const checklist = draft.complianceChecklist as unknown as ChecklistItem[];
          const unresolved = checklist.filter((c) => c.status !== "ok");
          return (
            <Link key={draft.id} href={`/dashboard/drafts/${draft.id}`}>
              <Card className="transition-colors hover:bg-accent/40">
                <CardContent className="grid gap-2 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{draft.tender.title || "Untitled tender"}</p>
                    <div className="flex items-center gap-2">
                      <ClosingBadge closingDate={draft.tender.closingDate} />
                      <DraftStatusBadge status={draft.status} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>Closes {formatDate(draft.tender.closingDate)}</span>
                    <span className="flex items-center gap-1">
                      {unresolved.length === 0 ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Checklist clear
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-destructive" /> {unresolved.length} item(s) need
                          attention
                        </>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <CircleDollarSign className="h-3.5 w-3.5" />
                      {draft.pricingConfirmed ? "Pricing checked" : "Pricing not yet confirmed"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {done.length > 0 && (
        <div className="grid gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Submitted / not pursuing</h2>
          {done.map((draft) => (
            <Link key={draft.id} href={`/dashboard/drafts/${draft.id}`}>
              <Card className="opacity-70 transition-opacity hover:opacity-100">
                <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <p className="text-sm font-medium">{draft.tender.title || "Untitled tender"}</p>
                  <DraftStatusBadge status={draft.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
