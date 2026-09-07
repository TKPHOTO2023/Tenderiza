import { Badge } from "@/components/ui/badge";
import { daysUntil } from "@/lib/format";

export function ClosingBadge({ closingDate }: { closingDate: Date | string | null }) {
  const days = daysUntil(closingDate);
  if (days === null) return <Badge variant="outline">No closing date</Badge>;
  if (days < 0) return <Badge variant="secondary">Closed</Badge>;
  if (days <= 7) return <Badge variant="destructive">Closes in {days}d</Badge>;
  if (days <= 14) return <Badge variant="warning">Closes in {days}d</Badge>;
  return <Badge variant="outline">Closes in {days}d</Badge>;
}
