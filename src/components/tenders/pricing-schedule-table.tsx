import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExtractedRequirements } from "@/lib/tender-extraction";

type PricingScheduleItem = ExtractedRequirements["pricingScheduleItems"][number];

/**
 * Read-only view of the tender's own itemized pricing/quantity schedule, as
 * transcribed from its documents — never a price, always the bidder's own
 * to fill in. Shown on the tender detail page whenever one was extracted.
 */
export function PricingScheduleTable({ items }: { items: PricingScheduleItem[] }) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pricing schedule (from tender documents)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 pr-3 font-medium">#</th>
                <th className="py-1.5 pr-3 font-medium">Description</th>
                <th className="py-1.5 pr-3 font-medium">Qty</th>
                <th className="py-1.5 pr-3 font-medium">Unit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1.5 pr-3 text-muted-foreground">{item.lineNumber ?? i + 1}</td>
                  <td className="py-1.5 pr-3">{item.description}</td>
                  <td className="py-1.5 pr-3">{item.quantity ?? "—"}</td>
                  <td className="py-1.5 pr-3">{item.unitOfMeasure ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Transcribed as-is from the tender&apos;s own documents — no prices are extracted or suggested here;
          pricing stays your own commercial decision.
        </p>
      </CardContent>
    </Card>
  );
}
