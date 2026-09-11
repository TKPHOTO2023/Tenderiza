import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { FlagRule } from "@/components/marketing/flag";
import { Convergence } from "@/components/marketing/convergence";
import { TenderCard } from "@/components/marketing/tender-card";
import { Reveal } from "@/components/marketing/reveal";

export const dynamic = "force-dynamic";

/** The real procurement lifecycle — the order carries meaning, so it's numbered. */
const STAGES = [
  {
    stage: "01",
    title: "Register your profile",
    body: "CIPC registration, tax compliance, B-BBEE level, CIDB grading, past references — captured once, checked for expiry from then on.",
  },
  {
    stage: "02",
    title: "Tenders advertise daily",
    body: "Every RFQ, RFP and RFI published to eTenders lands here within a day, across all nine provinces.",
  },
  {
    stage: "03",
    title: "Eligibility is checked",
    body: "Each tender's own documents are read for required B-BBEE level, CIDB grade and compulsory briefings, then checked against your profile.",
  },
  {
    stage: "04",
    title: "Documents are drafted",
    body: "A first-pass bid pack — compliance summary, technical proposal, or a priced RFQ quotation schedule left blank for your numbers.",
  },
  {
    stage: "05",
    title: "You approve and submit",
    body: "You confirm the checklist and your pricing, then submit it yourself. Tenderiza never signs or submits anything.",
  },
];

const GUARANTEES = [
  "Never invents or estimates your prices",
  "Never signs or pre-ticks a declaration",
  "Never submits a bid on your behalf",
];

export default async function HomePage() {
  const [openCount, totalCount, previewTenders, provinceRows] = await Promise.all([
    prisma.tender.count({ where: { status: "OPEN", closingDate: { gte: new Date() } } }),
    prisma.tender.count(),
    prisma.tender.findMany({
      where: { status: "OPEN", closingDate: { gte: new Date() } },
      orderBy: { closingDate: "asc" },
      take: 4,
    }),
    prisma.tender.groupBy({
      by: ["province"],
      where: { status: "OPEN", closingDate: { gte: new Date() }, province: { not: null } },
      _count: { province: true },
      orderBy: { _count: { province: "desc" } },
      take: 6,
    }),
  ]);

  return (
    <>
      {/* ── Hero: the pall as the product's own routing diagram ───────────── */}
      <section className="relative overflow-hidden bg-[var(--field)]">
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-16 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:py-20">
          <div>
            <p className="field-label text-[var(--gold)]">Government tenders · Republic of South Africa</p>
            <h1 className="display mt-5 text-[clamp(2.6rem,5.4vw,4.2rem)] uppercase text-white">
              Two roads.
              <br />
              One shortlist.
            </h1>
            <p className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-white/70">
              Thousands of tenders come down one road. Your company&apos;s profile comes down the other.
              Tenderiza is where they meet — so the only bids on your desk are the ones you actually qualify
              for, with the paperwork already started.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/onboarding"
                className="group inline-flex items-center gap-2 bg-[var(--gold)] px-7 py-4 text-[15px] font-bold text-[var(--ink)] transition-transform hover:scale-[1.03]"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/tenders"
                className="inline-flex items-center gap-2 border border-white/25 px-7 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Browse live tenders
              </Link>
            </div>

            <ul className="mt-8 grid gap-2">
              {GUARANTEES.map((g) => (
                <li key={g} className="flex items-center gap-2 text-[14px] text-white/60">
                  <Check className="h-4 w-4 shrink-0 text-[var(--gold)]" />
                  {g}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block">
            <Convergence />
          </div>
        </div>

        {/* Ledger strip, only when there's real data behind it */}
        {totalCount > 0 && (
          <div className="relative border-t border-[var(--rule-dark)]">
            <div className="mx-auto grid max-w-[1240px] grid-cols-2 divide-x divide-[var(--rule-dark)] px-5 lg:grid-cols-4">
              {[
                { label: "Open right now", value: openCount.toLocaleString("en-ZA") },
                { label: "Tenders tracked", value: totalCount.toLocaleString("en-ZA") },
                { label: "Provinces", value: "9" },
                { label: "Sync frequency", value: "Daily" },
              ].map((stat, i) => (
                <div key={stat.label} className={`py-6 ${i % 2 === 1 ? "pl-6" : ""} ${i > 1 ? "border-t border-[var(--rule-dark)] lg:border-t-0" : ""} lg:pl-6`}>
                  <p className="field-label text-white/40">{stat.label}</p>
                  <p className="display mt-1.5 text-[34px] text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <FlagRule />
      </section>

      {/* ── Live register preview ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="field-label text-[var(--green)]">Closing soonest</p>
            <h2 className="display mt-2 text-[clamp(1.9rem,3.6vw,2.6rem)] uppercase text-[var(--ink)]">
              On the board today
            </h2>
          </div>
          <Link
            href="/tenders"
            className="group inline-flex items-center gap-1.5 text-[15px] font-semibold text-[var(--field)] hover:underline"
          >
            See every open tender
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-3">
          {previewTenders.length === 0 ? (
            <div className="border border-dashed border-[var(--rule)] px-6 py-16 text-center">
              <p className="text-[17px] font-semibold text-[var(--ink)]">No open tenders synced yet</p>
              <p className="mt-1.5 text-[15px] text-[var(--ink-2)]">
                Live opportunities appear here as soon as the next eTenders sync runs.
              </p>
            </div>
          ) : (
            previewTenders.map((tender, i) => (
              <Reveal key={tender.id} delayMs={i * 60}>
                <TenderCard tender={tender} />
              </Reveal>
            ))
          )}
        </div>
      </section>

      {/* ── The lifecycle ─────────────────────────────────────────────────── */}
      <section className="bg-[var(--paper-2)]">
        <div className="mx-auto max-w-[1240px] px-5 py-20">
          <div className="max-w-[620px]">
            <p className="field-label text-[var(--green)]">How a bid moves</p>
            <h2 className="display mt-2 text-[clamp(1.9rem,3.6vw,2.6rem)] uppercase text-[var(--ink)]">
              From advert to award
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-2)]">
              Tenderiza follows the real procurement lifecycle rather than inventing its own. You stay in
              control at the two points that matter: pricing, and submission.
            </p>
          </div>

          <ol className="mt-12 grid gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-5">
            {STAGES.map((stage, i) => (
              <Reveal key={stage.stage} delayMs={i * 70} className="h-full">
                <li className="flex h-full flex-col bg-white p-6">
                  <span className="mono text-[13px] font-semibold text-[var(--gold)]">{stage.stage}</span>
                  <h3 className="mt-3 text-[16px] font-bold leading-snug text-[var(--ink)]">{stage.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--ink-2)]">{stage.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Provinces, from real counts ───────────────────────────────────── */}
      {provinceRows.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-5 py-20">
          <p className="field-label text-[var(--green)]">Where the work is</p>
          <h2 className="display mt-2 text-[clamp(1.9rem,3.6vw,2.6rem)] uppercase text-[var(--ink)]">
            Open tenders by province
          </h2>
          <div className="mt-8 grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-3">
            {provinceRows.map((row) => (
              <Link
                key={row.province}
                href={`/tenders?province=${encodeURIComponent(row.province ?? "")}`}
                className="group flex items-center justify-between bg-white p-6 transition-colors hover:bg-[var(--paper-2)]"
              >
                <span className="text-[16px] font-semibold text-[var(--ink)]">{row.province}</span>
                <span className="mono text-[20px] font-semibold text-[var(--field)]">
                  {row._count.province}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Closing statement ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[var(--field)]">
        <FlagRule />
        <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-20 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <h2 className="display text-[clamp(2rem,4.4vw,3.2rem)] uppercase text-white">
              Stop reading tenders
              <br />
              you were never going to win
            </h2>
            <p className="mt-5 max-w-[54ch] text-[17px] leading-relaxed text-white/65">
              Free to start, no card required. Your profile, your pricing, your signature — every time.
            </p>
          </div>
          <div className="flex lg:justify-end">
            <Link
              href="/onboarding"
              className="group inline-flex items-center gap-2 bg-[var(--gold)] px-8 py-5 text-[16px] font-bold text-[var(--ink)] transition-transform hover:scale-[1.03]"
            >
              Start free trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
