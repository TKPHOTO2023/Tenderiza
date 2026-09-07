import { ComingSoon } from "@/components/dashboard/coming-soon";
import { Target } from "lucide-react";

export default function MatchesPage() {
  return (
    <ComingSoon
      icon={Target}
      title="Matches"
      description="Tenders scored against your company profile's eligibility criteria will appear here."
    />
  );
}
