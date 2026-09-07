import { Badge } from "@/components/ui/badge";
import { expiryStatus } from "@/lib/completeness";

export function ExpiryBadge({ expiryDate }: { expiryDate: Date | string | null | undefined }) {
  const status = expiryStatus(expiryDate);
  if (status === "none") return null;

  const date = new Date(expiryDate as string).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  if (status === "expired") return <Badge variant="destructive">Expired {date}</Badge>;
  if (status === "expiring30") return <Badge variant="destructive">Expires {date}</Badge>;
  if (status === "expiring60") return <Badge variant="warning">Expires {date}</Badge>;
  return <Badge variant="outline">Valid until {date}</Badge>;
}
