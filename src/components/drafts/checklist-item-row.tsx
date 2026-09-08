import { CheckCircle2, XCircle, HelpCircle, Info } from "lucide-react";
import type { ChecklistItem } from "@/lib/compliance-checklist";

const ICON = {
  ok: <CheckCircle2 className="h-4 w-4 text-success" />,
  attention: <XCircle className="h-4 w-4 text-destructive" />,
  missing: <XCircle className="h-4 w-4 text-destructive" />,
  needs_review: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
  info: <Info className="h-4 w-4 text-muted-foreground" />,
};

export function ChecklistItemRow({ item }: { item: ChecklistItem }) {
  return (
    <div className="flex items-start gap-2 py-1.5 text-sm">
      {ICON[item.status]}
      <div>
        <p className="font-medium">{item.label}</p>
        <p className="text-muted-foreground">{item.detail}</p>
      </div>
    </div>
  );
}
