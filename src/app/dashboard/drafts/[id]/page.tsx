"use client";

import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DraftWarningBanner } from "@/components/drafts/draft-warning-banner";
import { ChecklistItemRow } from "@/components/drafts/checklist-item-row";
import { formatDate } from "@/lib/format";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Draft, Tender, DraftStatus } from "@prisma/client";
import type { ChecklistItem } from "@/lib/compliance-checklist";
import type { DraftDocumentRef } from "@/lib/draft-runner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const KIND_LABEL: Record<DraftDocumentRef["kind"], string> = {
  official_form_filled: "Official form (pre-filled)",
  generated_equivalent: "Tenderiza-generated equivalent",
  technical_proposal: "Technical proposal draft",
};

export default function DraftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: draft, isLoading, mutate } = useSWR<Draft & { tender: Tender }>(`/api/drafts/${id}`, fetcher);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      mutate(body, { revalidate: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  }

  async function updateStatus(status: DraftStatus) {
    if (!draft) return;
    const res = await fetch(`/api/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await res.json();
    if (res.ok) mutate(body, { revalidate: false });
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

  return (
    <div className="grid gap-6">
      <Link href="/dashboard/drafts">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" /> Back to drafts
        </Button>
      </Link>

      <DraftWarningBanner />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{draft.tender.title || "Untitled tender"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Closes {formatDate(draft.tender.closingDate)} · Generated{" "}
            {new Date(draft.generatedAt).toLocaleString("en-ZA")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={draft.status} onValueChange={(v) => updateStatus(v as DraftStatus)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GENERATED">Generated</SelectItem>
              <SelectItem value="EDITED">Edited</SelectItem>
              <SelectItem value="FINALIZED">Marked ready</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={regenerate} disabled={regenerating} variant="outline" size="sm">
            <RefreshCw className={cn("h-4 w-4", regenerating && "animate-spin")} />
            {regenerating ? "Regenerating…" : "Regenerate"}
          </Button>
        </div>
      </div>

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance checklist</CardTitle>
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

      <Link href={`/dashboard/matches/${draft.tenderId}`}>
        <Button variant="outline" size="sm">
          View match details
        </Button>
      </Link>
    </div>
  );
}
