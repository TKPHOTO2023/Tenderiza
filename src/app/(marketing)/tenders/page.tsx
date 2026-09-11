import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const PREVIEW_LIMIT = 8;

const TYPE_STYLE: Record<string, string> = {
  RFQ: "bg-[#FFB612]/15 text-[#8a5a00]",
  RFP: "bg-[#002395]/10 text-[#002395]",
  RFI: "bg-[#DE3831]/10 text-[#DE3831]",
};

export default async function PublicTendersPage() {
  const tenders = await prisma.tender.findMany({
    where: { status: "OPEN", closingDate: { gte: new Date() } },
    orderBy: { closingDate: "asc" },
    take: PREVIEW_LIMIT,
  });
  const totalOpen = await prisma.tender.count({ where: { status: "OPEN", closingDate: { gte: new Date() } } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#007A4D]">Live tenders</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
          South African government tenders, updated daily
        </h1>
        <p className="mt-4 text-slate-500">
          Pulled straight from National Treasury&apos;s eTenders OCDS API. Create a free account to get these
          matched against your company profile automatically, with eligibility checks and AI-drafted
          documents.
        </p>
      </div>

      <div className="mt-10 grid gap-3">
        {tenders.length === 0 && (
          <div className="rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
            No open tenders synced yet — check back shortly.
          </div>
        )}
        {tenders.map((tender) => (
          <div key={tender.id} className="rounded-xl border border-slate-200 p-4 transition-shadow hover:shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium text-slate-900">{tender.title || "Untitled tender"}</p>
              {tender.procurementType !== "UNKNOWN" && (
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${TYPE_STYLE[tender.procurementType]}`}>
                  {tender.procurementType}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              {tender.buyerName && <span>{tender.buyerName}</span>}
              {tender.province && <span>{tender.province}</span>}
              <span>Closes {formatDate(tender.closingDate)}</span>
            </div>
          </div>
        ))}
      </div>

      {totalOpen > PREVIEW_LIMIT && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <Lock className="h-5 w-5 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-600">
            {(totalOpen - PREVIEW_LIMIT).toLocaleString("en-ZA")} more open tenders are waiting — sign up free to
            see the full list, matched against your own company profile.
          </p>
        </div>
      )}

      <Link
        href="/onboarding"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#002395] px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
      >
        Get matched for free <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
