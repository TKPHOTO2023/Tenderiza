import { Badge } from "@/components/ui/badge";
import type { ProcurementType } from "@prisma/client";

const LABEL: Record<ProcurementType, string> = {
  RFQ: "RFQ",
  RFP: "RFP",
  RFI: "RFI",
  UNKNOWN: "Type unknown",
};

// RFQ and RFI intentionally stand out from the plain RFP/unknown look —
// they change what Phase 4 generates, so it's worth a glance from a badge.
const VARIANT: Record<ProcurementType, "secondary" | "warning" | "outline"> = {
  RFQ: "secondary",
  RFP: "outline",
  RFI: "warning",
  UNKNOWN: "outline",
};

export function ProcurementTypeBadge({ type }: { type: ProcurementType }) {
  if (type === "UNKNOWN") return null;
  return <Badge variant={VARIANT[type]}>{LABEL[type]}</Badge>;
}
