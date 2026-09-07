"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSyncStatus } from "@/lib/use-tenders";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function SyncButton({ onSynced }: { onSynced?: () => void }) {
  const { lastSync, mutate } = useSyncStatus();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/tenders/sync?daysBack=14", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Sync failed");
      await mutate();
      onSynced?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
        <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
        {syncing ? "Syncing…" : "Sync now"}
      </Button>
      <p className="text-xs text-muted-foreground">
        {lastSync
          ? `Last synced ${new Date(lastSync.startedAt).toLocaleString("en-ZA")}${
              lastSync.success === false ? " — failed" : ""
            }`
          : "Never synced"}
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
