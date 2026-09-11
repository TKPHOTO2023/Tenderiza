"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Catches any client-render error under /dashboard (a bad fetch response, a
 * stale JS chunk right after a redeploy, an unexpected data shape) and shows
 * a retry UI instead of leaving the browser to show its own generic
 * network-failure page. `reset()` re-renders the segment without a full
 * page reload; a hard reload is offered too, since a stale-chunk error only
 * clears with one.
 */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard segment error:", error);
  }, [error]);

  return (
    <div className="mx-auto grid max-w-lg gap-4 py-16 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
      <h1 className="text-lg font-semibold">Something went wrong loading this page</h1>
      <Alert variant="destructive" className="text-left">
        <AlertDescription>
          {error.message || "Unexpected error"}
          {error.digest && <span className="mt-1 block text-xs opacity-70">Reference: {error.digest}</span>}
        </AlertDescription>
      </Alert>
      <p className="text-sm text-muted-foreground">
        This is often a one-off — especially right after a new deploy. Try again below.
      </p>
      <div className="flex justify-center gap-2">
        <Button onClick={() => reset()}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    </div>
  );
}
