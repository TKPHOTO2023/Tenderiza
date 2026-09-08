import { AlertTriangle } from "lucide-react";

export function DraftWarningBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border-2 border-destructive bg-destructive/10 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div>
        <p className="font-semibold text-destructive">DRAFT — Requires human review before use</p>
        <p className="text-sm text-destructive/90">
          These documents are a starting point, not a finished submission. Objective company data was
          auto-filled; every declaration, attestation, and signature is left blank on purpose and must
          be completed by you. Nothing here has been reviewed, approved, or submitted anywhere.
        </p>
      </div>
    </div>
  );
}
