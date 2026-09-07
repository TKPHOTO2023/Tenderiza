import { ComingSoon } from "@/components/dashboard/coming-soon";
import { Sparkles } from "lucide-react";

export default function DraftsPage() {
  return (
    <ComingSoon
      icon={Sparkles}
      title="Drafts"
      description="Auto-populated SBD forms and drafted technical proposals will live here."
    />
  );
}
