"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSignature, Loader2, Check } from "lucide-react";

/**
 * The single entry point into bidding. Runs extraction, matching and drafting
 * in one call, then drops the user on the draft — so "I want this tender"
 * takes one click rather than three pages.
 */
export function BidButton({
  tenderId,
  size = "default",
  label = "Bid for this tender",
}: {
  tenderId: string;
  size?: "default" | "sm" | "lg";
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);

    // The request runs several steps server-side; this narrates roughly where
    // it has got to so a 30-second wait doesn't look like a hang.
    setStage("Reading the tender documents…");
    const narrate = setTimeout(() => setStage("Drafting your documents…"), 8000);

    try {
      const res = await fetch(`/api/tenders/${tenderId}/bid`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Couldn't prepare this bid");
      setStage("Ready");
      router.push(`/dashboard/drafts/${body.draftId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't prepare this bid");
      setBusy(false);
      setStage(null);
    } finally {
      clearTimeout(narrate);
    }
  }

  return (
    <div className="grid gap-2">
      <Button onClick={start} disabled={busy} size={size}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : stage === "Ready" ? (
          <Check className="h-4 w-4" />
        ) : (
          <FileSignature className="h-4 w-4" />
        )}
        {busy ? stage ?? "Working…" : label}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
