import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { Tender } from "@prisma/client";

const TYPE_COLOR: Record<string, string> = {
  RFQ: "bg-[#FFB612]/15 text-[#8a5a00]",
  RFP: "bg-[#002395]/10 text-[#002395]",
  RFI: "bg-[#DE3831]/10 text-[#DE3831]",
};

export function LiveTendersCard({ tenders }: { tenders: Tender[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Live Tenders</p>
        <span className="rounded-full bg-[#007A4D]/10 px-2.5 py-1 text-xs font-semibold text-[#007A4D]">
          Synced from eTenders
        </span>
      </div>
      <div className="grid gap-3">
        {tenders.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">
            Live tender data will appear here as soon as sync runs.
          </p>
        )}
        {tenders.map((tender) => (
          <div key={tender.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <Building2 className="h-4 w-4 text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{tender.title || "Untitled tender"}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                {tender.procurementType !== "UNKNOWN" && (
                  <span className={`rounded px-1.5 py-0.5 font-semibold ${TYPE_COLOR[tender.procurementType]}`}>
                    {tender.procurementType}
                  </span>
                )}
                {tender.province && <span>{tender.province}</span>}
                <span>Closes {formatDate(tender.closingDate)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/tenders"
        className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        View all opportunities <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
