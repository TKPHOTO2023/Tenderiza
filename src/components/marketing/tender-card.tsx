import { Building2, MapPin } from "lucide-react";
import type { Tender } from "@prisma/client";
import { Countdown } from "./countdown";
import { formatDate } from "@/lib/format";

const TYPE_STYLE: Record<string, { bar: string; chip: string; label: string }> = {
  RFQ: { bar: "bg-[var(--gold)]", chip: "bg-[var(--gold)]/15 text-[#8a5a00]", label: "Request for quotation" },
  RFP: { bar: "bg-[var(--field)]", chip: "bg-[var(--field)]/10 text-[var(--field)]", label: "Request for proposal" },
  RFI: { bar: "bg-[var(--blue)]", chip: "bg-[var(--blue)]/10 text-[var(--blue)]", label: "Request for information" },
  UNKNOWN: { bar: "bg-[var(--rule)]", chip: "bg-[var(--paper-2)] text-[var(--ink-2)]", label: "Type not yet classified" },
};

/** Short human reference from the OCID, which is all eTenders gives us. */
function reference(tender: Tender) {
  const tail = tender.ocid.split("-").slice(-1)[0] ?? tender.ocid;
  return tail.toUpperCase();
}

export function TenderCard({ tender }: { tender: Tender }) {
  const style = TYPE_STYLE[tender.procurementType] ?? TYPE_STYLE.UNKNOWN;

  return (
    <article className="group flex border border-[var(--rule)] bg-white transition-colors hover:border-[var(--field)]">
      <div className={`w-1 shrink-0 ${style.bar}`} />
      <div className="min-w-0 flex-1 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono bg-[var(--ink)] px-2 py-1 text-[11px] font-medium tracking-wider text-white">
            {reference(tender)}
          </span>
          {tender.procurementType !== "UNKNOWN" && (
            <span className={`mono px-2 py-1 text-[11px] font-semibold tracking-wider ${style.chip}`}>
              {tender.procurementType}
            </span>
          )}
          {tender.category && (
            <span className="px-2 py-1 text-[11px] font-medium text-[var(--ink-2)] ring-1 ring-inset ring-[var(--rule)]">
              {tender.category}
            </span>
          )}
          <span className="ml-auto">
            <Countdown closingDate={tender.closingDate} />
          </span>
        </div>

        <h3 className="mt-3 text-[17px] font-semibold leading-snug text-[var(--ink)]">
          {tender.title || "Untitled tender"}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-[var(--ink-2)]">
          {tender.buyerName && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> {tender.buyerName}
            </span>
          )}
          {tender.province && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {tender.province}
            </span>
          )}
          <span className="mono">CLOSES {formatDate(tender.closingDate).toUpperCase()}</span>
        </div>
      </div>
    </article>
  );
}
