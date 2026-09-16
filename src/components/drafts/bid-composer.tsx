"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Download, Mail, Paperclip, Building2, FileText, Send } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface BidEmailPreview {
  to: string | null;
  subject: string;
  body: string;
  submissionMethod: "EMAIL" | "PORTAL" | "PHYSICAL" | "UNKNOWN";
  submissionInstructions: string | null;
  missingAttachments: string[];
  attachments: { filename: string; label: string; source: "generated" | "company_document"; sizeBytes: number }[];
}

const METHOD_NOTE: Record<BidEmailPreview["submissionMethod"], string> = {
  EMAIL: "This tender accepts email submission.",
  PORTAL: "This tender wants submission through a portal — use the pack below, then upload it there.",
  PHYSICAL: "This tender wants a physical delivery or bid box drop — print the pack below.",
  UNKNOWN: "The documents didn't state how to submit. Check the tender documents before sending.",
};

function formatSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function BidComposer({ draftId }: { draftId: string }) {
  const { data, isLoading } = useSWR<BidEmailPreview>(`/api/drafts/${draftId}/bid-email`, fetcher);
  const { data: mail } = useSWR<{ connected: boolean; account: { fromAddress: string } | null }>(
    "/api/mail-account",
    fetcher
  );
  const [overrides, setOverrides] = useState<{ to?: string; subject?: string; body?: string }>({});
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Assembling your bid pack…</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Couldn&apos;t assemble the bid pack.</p>;

  const to = overrides.to ?? data.to ?? "";
  const subject = overrides.subject ?? data.subject;
  const body = overrides.body ?? data.body;

  async function send() {
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/drafts/${draftId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Sending failed");
      setSent(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Sending failed");
    } finally {
      setSending(false);
    }
  }

  async function download() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/drafts/${draftId}/bid-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bid-${draftId.slice(-6)}.eml`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Send your bid</CardTitle>
        <CardDescription>
          {mail?.connected
            ? "Everything below is assembled and ready. Sending goes out from your own connected mailbox, only when you press send on this bid."
            : "Everything below is assembled and ready. Connect a mailbox under Brand to send from here, or download it and send from your own email programme."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Alert variant={data.submissionMethod === "EMAIL" ? "default" : "destructive"}>
          <AlertDescription>{METHOD_NOTE[data.submissionMethod]}</AlertDescription>
        </Alert>

        {data.submissionInstructions && (
          <div className="border-l-4 border-l-primary bg-accent/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">The tender&apos;s own submission instructions</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{data.submissionInstructions}</p>
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="bid-to">To</Label>
          <Input
            id="bid-to"
            value={to}
            placeholder="No submission address found in the tender documents — check them and enter it here"
            onChange={(e) => setOverrides((o) => ({ ...o, to: e.target.value }))}
          />
          {!data.to && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              No address was stated in the documents. Confirm it yourself before sending.
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="bid-subject">Subject</Label>
          <Input
            id="bid-subject"
            value={subject}
            onChange={(e) => setOverrides((o) => ({ ...o, subject: e.target.value }))}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="bid-body">Message</Label>
          <Textarea
            id="bid-body"
            rows={12}
            value={body}
            className="font-mono text-xs"
            onChange={(e) => setOverrides((o) => ({ ...o, body: e.target.value }))}
          />
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <Paperclip className="h-4 w-4" />
            {data.attachments.length} attachment{data.attachments.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-1.5">
            {data.attachments.map((a) => (
              <div key={a.filename} className="flex items-center gap-2 border border-border p-2 text-sm">
                {a.source === "generated" ? (
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 truncate">{a.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatSize(a.sizeBytes)}</span>
              </div>
            ))}
          </div>
          {data.missingAttachments.length > 0 && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>
                Couldn&apos;t read {data.missingAttachments.length} file
                {data.missingAttachments.length === 1 ? "" : "s"}: {data.missingAttachments.join(", ")}. Re-upload
                them before sending.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {sent && (
          <Alert>
            <AlertDescription className="flex items-center gap-2">
              <Send className="h-4 w-4 text-success" /> Sent to {to}. This bid is now marked submitted.
            </AlertDescription>
          </Alert>
        )}
        {sendError && (
          <Alert variant="destructive">
            <AlertDescription>{sendError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          {mail?.connected && !sent && (
            <Button onClick={send} disabled={sending || !to}>
              <Send className="h-4 w-4" />
              {sending ? "Sending…" : `Send from ${mail.account?.fromAddress}`}
            </Button>
          )}
          <Button onClick={download} disabled={downloading} variant={mail?.connected ? "outline" : "default"}>
            <Download className="h-4 w-4" />
            {downloading ? "Preparing…" : "Download bid email"}
          </Button>
          {to && (
            <Button variant="outline" asChild>
              <a href={`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
                <Mail className="h-4 w-4" /> Open in mail app (no attachments)
              </a>
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          The download is a standard .eml draft — double-click it and Outlook, Apple Mail or Thunderbird opens it
          with the recipient, message and all {data.attachments.length} attachments already in place.
        </p>
      </CardContent>
    </Card>
  );
}
