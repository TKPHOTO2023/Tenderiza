import { ComingSoon } from "@/components/dashboard/coming-soon";
import { FileStack } from "lucide-react";

export default function TendersPage() {
  return (
    <ComingSoon
      icon={FileStack}
      title="Tenders"
      description="Live tenders pulled from the National Treasury eTenders OCDS API will be listed here."
    />
  );
}
