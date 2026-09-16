import { Building2, MapPin, CalendarClock, Mail, Send, Truck } from "lucide-react";
import type { Tender } from "@prisma/client";
import type { ExtractedRequirements } from "@/lib/tender-extraction";
import { formatDate } from "@/lib/format";

const METHOD_LABEL: Record<string, string> = {
  EMAIL: "By email",
  PORTAL: "Through a portal",
  PHYSICAL: "Bid box / hand delivery",
  UNKNOWN: "Not stated",
};

/**
 * The six things a bidder checks first, pulled from OCDS metadata and the
 * tender's own documents. Anything not stated says so rather than guessing.
 */
export function AtAGlance({ tender }: { tender: Tender }) {
  const extracted = tender.extractedRequirements as ExtractedRequirements | null;

  const facts = [
    { icon: Building2, label: "Issuing organisation", value: tender.buyerName },
    { icon: MapPin, label: "Province", value: tender.province },
    { icon: CalendarClock, label: "Closing date", value: formatDate(tender.closingDate) },
    {
      icon: Send,
      label: "How to submit",
      value: extracted ? METHOD_LABEL[extracted.submissionMethod] ?? "Not stated" : null,
    },
    { icon: Mail, label: "Submit to", value: extracted?.submissionEmail ?? null, mono: true },
    { icon: Truck, label: "Delivery location", value: extracted?.deliveryLocation ?? null },
  ];

  return (
    <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label} className="flex gap-3 bg-card p-4">
          <fact.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{fact.label}</p>
            <p className={`mt-1 break-words text-sm ${fact.value ? "font-medium" : "text-muted-foreground"} ${fact.mono ? "font-mono text-xs" : ""}`}>
              {fact.value || "Not stated in the documents"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
