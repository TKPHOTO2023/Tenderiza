import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FlagRule } from "@/components/marketing/flag";
import { TenderBrowser } from "@/components/marketing/tender-browser";

export const dynamic = "force-dynamic";

export default async function TendersPage() {
  const now = new Date();

  const [tenders, provinceRows, openCount, closedCount, rfqCount] = await Promise.all([
    prisma.tender.findMany({
      where: { status: "OPEN", closingDate: { gt: now } },
      orderBy: { closingDate: "asc" },
      take: 200,
    }),
    prisma.tender.findMany({
      where: { province: { not: null } },
      select: { province: true },
      distinct: ["province"],
      orderBy: { province: "asc" },
    }),
    prisma.tender.count({ where: { status: "OPEN", closingDate: { gt: now } } }),
    prisma.tender.count({ where: { OR: [{ status: "CLOSED" }, { closingDate: { lte: now } }] } }),
    prisma.tender.count({ where: { procurementType: "RFQ", status: "OPEN", closingDate: { gt: now } } }),
  ]);

  const provinces = provinceRows.map((p) => p.province).filter((p): p is string => Boolean(p));

  return (
    <>
      <section className="bg-[var(--field)]">
        <div className="mx-auto max-w-[1240px] px-5 py-14">
          <nav className="mono flex items-center gap-2 text-[12px] tracking-wider text-white/45">
            <Link href="/" className="hover:text-white">
              HOME
            </Link>
            <span>/</span>
            <span className="text-white/80">TENDERS</span>
          </nav>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[640px]">
              <h1 className="display text-[clamp(2.4rem,5.2vw,3.6rem)] uppercase text-white">
                The open register
              </h1>
              <p className="mt-4 text-[17px] leading-relaxed text-white/65">
                Every open government tender we track, straight from National Treasury&apos;s eTenders portal.
                Filter by province and procurement type, sorted by whatever closes next.
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-px border border-[var(--rule-dark)] bg-[var(--rule-dark)]">
              {[
                { label: "Open", value: openCount },
                { label: "RFQs open", value: rfqCount },
                { label: "Closed", value: closedCount },
              ].map((stat) => (
                <div key={stat.label} className="bg-[var(--field)] px-6 py-4">
                  <dt className="field-label text-white/40">{stat.label}</dt>
                  <dd className="display mt-1 text-[26px] text-white">{stat.value.toLocaleString("en-ZA")}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <FlagRule />
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-10">
        <TenderBrowser initialTenders={tenders} provinces={provinces} />
      </section>
    </>
  );
}
