import { STATUS_LABEL } from "@/components/drafts/status-badge";
import type { DraftStatusLog, DraftStatus } from "@prisma/client";
import { History } from "lucide-react";

export function AuditTrail({ logs }: { logs: DraftStatusLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">No status changes yet.</p>;
  }

  return (
    <ul className="grid gap-2">
      {logs.map((log) => (
        <li key={log.id} className="flex items-start gap-2 text-sm">
          <History className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p>
              {log.fromStatus ? `${STATUS_LABEL[log.fromStatus as DraftStatus]} → ` : ""}
              <span className="font-medium">{STATUS_LABEL[log.toStatus as DraftStatus]}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(log.createdAt).toLocaleString("en-ZA")}
              {log.note ? ` — ${log.note}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
