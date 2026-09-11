"use client";

import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DraftWarningBanner } from "@/components/drafts/draft-warning-banner";
import { ChecklistItemRow } from "@/components/drafts/checklist-item-row";
import { DraftStatusBadge } from "@/components/drafts/status-badge";
import { AuditTrail } from "@/components/drafts/audit-trail";
import { RemindersList } from "@/components/drafts/reminders-list";
import { useAuditLog } from "@/lib/use-audit-log";
import { useReminders } from "@/lib/use-reminders";
import { formatDate } from "@/lib/format";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Draft, Tender } from "@prisma/client";
import type { ChecklistItem } from "@/lib/compliance-checklist";
import type { DraftDocumentRef } from "@/lib/draft-runner";
import type { ExtractedRequirements } from "@/lib/tender-extraction";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const KIND_LABEL: Record<DraftDocumentRef["kind"], string> = {
  official_form_filled: "Official form (pre-filled)",
  generated_equivalent: "Tenderiza-generated equivalent",
  technical_proposal: "Technical proposal draft",
  rfq_quotation: "RFQ quotation draft",
  rfi_response: "RFI response draft",
};

type DraftWithTender = Draft & { tender: Tender };

export default function DraftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: draft, isLoading, mutate } = useSWR<DraftWithTender>(`/api/drafts/${id}`, fetcher);
  const { logs, isLoading: logsLoading } = useAuditLog(id);
  const { reminders } = useReminders();
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function callWorkflow(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/drafts/${id}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Action failed");
      await mutate(body, { revalidate: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    if (!draft) return;
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId: draft.tenderId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to regenerate");
      await mutate(body, { revalidate: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!draft) return <p className="text-sm text-muted-foreground">Draft not found.</p>;

  const documents = draft.documentUrls as unknown as DraftDocumentRef[];
  const checklist = draft.complianceChecklist as unknown as ChecklistItem[];
  const grouped = {
    document: checklist.filter((c) => c.category === "document"),
    requirement: checklist.filter((c) => c.category === "requirement"),
    declaration: checklist.filter((c) => c.category === "declaration"),
  };
  const unresolvedCount = checklist.filter((c) => c.status !== "ok").length;
  const extracted = draft.tender.extractedRequirements as ExtractedRequirements | null;
  const draftReminders = (reminders ?? []).filter((r) => r.tenderId === draft.tenderId);

  return (
    <div className="grid gap-6">
      <Link href="/dashboard/review">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" /> Back to review
        </Button>
      </Link>

      <DraftWarningBanner />

      {draftReminders.length > 0 && (
        <Card className="border-warning/50">
          <CardHeader>
            <CardTitle className="text-base">Reminders for this tender</CardTitle>
          </CardHeader>
          <CardContent>
            <RemindersList reminders={draftReminders} />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{draft.tender.title || "Untitled tender"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Closes {formatDate(draft.tender.closingDate)} · Generated{" "}
            {new Date(draft.generatedAt).toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DraftStatusBadge status={draft.status} />
          <Button onClick={regenerate} disabled={regenerating} variant="outline" size="sm">
            <RefreshCw className={cn("h-4 w-4", regenerating && "animate-spin")} />
            {regenerating ? "Regenerating…" : "Regenerate"}
          </Button>
        </div>
      </div>

      {draft.status !== "DRAFT" && (
        <p className="-mt-4 text-xs text-muted-foreground">
          Regenerating rebuilds the documents from your current profile and resets this draft back to
          &quot;Draft&quot; — any review or approval here won&apos;t carry over to the new documents.
        </p>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {documents.map((doc, i) => (
            <a
              key={i}
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-accent/40"
            >
              <span>
                <span className="font-medium">{doc.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">({KIND_LABEL[doc.kind]})</span>
              </span>
              <Download className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
          <p className="text-xs text-muted-foreground">
            Open and edit these directly wherever you&apos;d normally work on a bid — Tenderiza doesn&apos;t
            edit them for you.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Compliance checklist {unresolvedCount > 0 && <span className="text-destructive">({unresolvedCount} unresolved)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">Documents</p>
            {grouped.document.map((item, i) => (
              <ChecklistItemRow key={i} item={item} />
            ))}
          </div>
          {grouped.requirement.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">Tender requirements</p>
              {grouped.requirement.map((item, i) => (
                <ChecklistItemRow key={i} item={item} />
              ))}
            </div>
          )}
          <div>
            <p className="mb-1 text-sm font-medium text-muted-foreground">Declarations (require your signature)</p>
            {grouped.declaration.map((item, i) => (
              <ChecklistItemRow key={i} item={item} />
            ))}
          </div>
        </CardContent>
      </Card>

      {extracted?.briefingCompulsory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compulsory briefing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p className="text-muted-foreground">
              {extracted.briefingDate || "Date not stated"}
              {extracted.briefingVenue ? ` at ${extracted.briefingVenue}` : ""}
            </p>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={draft.briefingAttended}
                disabled={busy}
                onCheckedChange={(checked) => callWorkflow("set_briefing_attended", { attended: checked === true })}
              />
              I&apos;ve attended this briefing
            </label>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Final pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p className="text-muted-foreground">
            Tenderiza never calculates or suggests pricing — confirm here once you&apos;ve checked it yourself.
          </p>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={draft.pricingConfirmed}
              disabled={busy}
              onCheckedChange={(checked) => callWorkflow("confirm_pricing", { confirmed: checked === true })}
            />
            I&apos;ve checked the final pricing for this bid
          </label>
          {draft.pricingConfirmedAt && (
            <p className="text-xs text-muted-foreground">
              Confirmed {new Date(draft.pricingConfirmedAt).toLocaleString("en-ZA")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status &amp; actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <WorkflowActions draft={draft} busy={busy} onAction={callWorkflow} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit trail</CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : <AuditTrail logs={logs ?? []} />}
        </CardContent>
      </Card>

      <Link href={`/dashboard/matches/${draft.tenderId}`}>
        <Button variant="outline" size="sm">
          View match details
        </Button>
      </Link>
    </div>
  );
}

function WorkflowActions({
  draft,
  busy,
  onAction,
}: {
  draft: DraftWithTender;
  busy: boolean;
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>;
}) {
  const [notPursuingOpen, setNotPursuingOpen] = useState(false);
  const [reason, setReason] = useState("");

  const [approveOpen, setApproveOpen] = useState(false);
  const [checklistConfirmed, setChecklistConfirmed] = useState(false);
  const [pricingConfirmedInDialog, setPricingConfirmedInDialog] = useState(draft.pricingConfirmed);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitNotes, setSubmitNotes] = useState("");

  const notPursuingDialog = (
    <Dialog open={notPursuingOpen} onOpenChange={setNotPursuingOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={busy}>
          Not pursuing this
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as not pursuing?</DialogTitle>
          <DialogDescription>You can reopen this for review later if you change your mind.</DialogDescription>
        </DialogHeader>
        <Textarea placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              await onAction("not_submitting", { reason: reason || undefined });
              setNotPursuingOpen(false);
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (draft.status === "DRAFT") {
    return (
      <>
        <Button disabled={busy} onClick={() => onAction("start_review")}>
          Start review
        </Button>
        {notPursuingDialog}
      </>
    );
  }

  if (draft.status === "UNDER_REVIEW") {
    return (
      <>
        <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
          <DialogTrigger asChild>
            <Button disabled={busy}>Approve</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm approval</DialogTitle>
              <DialogDescription>
                Approving means you&apos;ve reviewed this draft yourself — it still doesn&apos;t submit anything
                anywhere.
              </DialogDescription>
            </DialogHeader>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={checklistConfirmed} onCheckedChange={(c) => setChecklistConfirmed(c === true)} />
              I&apos;ve reviewed the compliance checklist and documents
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={pricingConfirmedInDialog}
                onCheckedChange={(c) => setPricingConfirmedInDialog(c === true)}
              />
              I&apos;ve checked the final pricing
            </label>
            <DialogFooter>
              <Button
                disabled={busy || !checklistConfirmed || !pricingConfirmedInDialog}
                onClick={async () => {
                  await onAction("approve", {
                    checklistConfirmed,
                    pricingConfirmed: pricingConfirmedInDialog,
                  });
                  setApproveOpen(false);
                }}
              >
                Approve draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {notPursuingDialog}
      </>
    );
  }

  if (draft.status === "APPROVED") {
    return (
      <>
        <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
          <DialogTrigger asChild>
            <Button disabled={busy}>Mark as submitted</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark this bid as submitted</DialogTitle>
              <DialogDescription>
                Only confirm this once you&apos;ve actually submitted it yourself — through the procuring
                entity&apos;s portal, physical bid box, or however this tender requires. Tenderiza never submits
                anything on your behalf.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Notes (optional) — e.g. reference number, how it was submitted"
              value={submitNotes}
              onChange={(e) => setSubmitNotes(e.target.value)}
            />
            <DialogFooter>
              <Button
                disabled={busy}
                onClick={async () => {
                  await onAction("submit", { method: "MANUAL", notes: submitNotes || undefined });
                  setSubmitOpen(false);
                }}
              >
                Confirm — I&apos;ve submitted this
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" disabled={busy} onClick={() => onAction("revert_to_review")}>
          Send back to review
        </Button>
        {notPursuingDialog}
      </>
    );
  }

  if (draft.status === "NOT_SUBMITTING") {
    return (
      <Button variant="outline" disabled={busy} onClick={() => onAction("reopen_for_review")}>
        Reopen for review
      </Button>
    );
  }

  // SUBMITTED — terminal, informational only
  return (
    <div className="text-sm text-muted-foreground">
      Submitted {draft.submittedAt && new Date(draft.submittedAt).toLocaleString("en-ZA")}
      {draft.submissionNotes ? ` — ${draft.submissionNotes}` : ""}
    </div>
  );
}
