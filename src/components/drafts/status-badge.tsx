import { Badge } from "@/components/ui/badge";
import type { DraftStatus } from "@prisma/client";

export const STATUS_LABEL: Record<DraftStatus, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved — not yet submitted",
  SUBMITTED: "Submitted",
  NOT_SUBMITTING: "Not pursuing",
};

const STATUS_VARIANT: Record<DraftStatus, "outline" | "success" | "destructive" | "secondary"> = {
  DRAFT: "outline",
  UNDER_REVIEW: "secondary",
  APPROVED: "destructive", // still unmissable — "approved" is not "submitted"
  SUBMITTED: "success",
  NOT_SUBMITTING: "outline",
};

export function DraftStatusBadge({ status }: { status: DraftStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
