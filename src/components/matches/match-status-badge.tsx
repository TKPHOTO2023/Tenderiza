import { Badge } from "@/components/ui/badge";
import type { MatchStatus } from "@prisma/client";

const CONFIG: Record<MatchStatus, { label: string; variant: "success" | "warning" | "destructive" | "outline" }> = {
  ELIGIBLE: { label: "Eligible", variant: "success" },
  PARTIAL: { label: "Partial match", variant: "warning" },
  NEEDS_REVIEW: { label: "Needs review", variant: "outline" },
  NOT_ELIGIBLE: { label: "Not eligible", variant: "destructive" },
};

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const { label, variant } = CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
