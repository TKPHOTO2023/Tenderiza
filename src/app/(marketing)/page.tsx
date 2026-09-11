import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileEdit,
  Sparkles,
  Target,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/marketing/reveal";
import { LiveTendersCard } from "@/components/marketing/live-tenders-card";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: Building2,
    title: "One company profile, always ready",
    body: "Capture your registration, B-BBEE, CIDB, tax compliance and past references once — reuse it on every bid.",
  },
  {
    icon: Target,
    title: "Live tenders, matched to you",
    body: "Pulled daily from National Treasury's eTenders portal, then scored against your categories and provinces automatically.",
  },
  {
    icon: Sparkles,
    title: "AI that reads the fine print",
    body: "Extracts B-BBEE/CIDB requirements, compulsory briefings, and now RFQ pricing schedules and RFI/RFP type — straight from the tender's own documents.",
  },
  {
    icon: FileEdit,
    title: "First-draft documents, fast",
    body: "Compliance summaries, technical proposals, and RFQ quotations pre-filled with your objective company data — never your pricing, never a signature.",
  },
  {
    icon: ClipboardCheck,
    title: "A real review gate",
    body: "Nothing gets marked submitted without a human explicitly confirming the checklist and pricing first. Every status change is logged.",
  },
  {
    icon: ShieldCheck,
    title: "You're always in control",
    body: "Tenderiza never signs, never invents a price, and never submits anything on its own — full stop.",
  },
];

const STEPS = [
  { n: "01", title: "Build your profile", body: "Company details, compliance documents, B-BBEE and CIDB — captured once." },
  { n: "02", title: "Get matched daily", body: "Every open tender is scored against your profile automatically, every day." },
  { n: "03", title: "Generate a draft", body: "One click produces a first-pass bid document set for the tender you choose." },
  { n: "04", title: "Review & submit yourself", body: "You check pricing, approve, and submit — Tenderiza just keeps you organised." },
];

export default async function MarketingHomePage() {
  const [tenderCount, openTenderCount, previewTenders] = await Promise.all([
    prisma.tender.count(),
    prisma.tender.count({ where: { status: "OPEN", closingDate: { gte: new Date() } } }),
    prisma.tender.findMany({
      where: { status: "OPEN", closingDate: { gte: new Date() } },
      orderBy: { closingDate: "asc" },
      take: 3,
    }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#007A4D] opacity-30 blur-3xl marketing-blob" />
        <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-[#002395] opacity-30 blur-3xl marketing-blob" style={{ animationDelay: "4s" }} />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#DE3831] opacity-20 blur-3xl marketing-blob" style={{ animationDelay: "8s" }} />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFB612]" />
              Built for South African businesses, by South Africans
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Win more government
              <br />
              <span className="marketing-shimmer bg-clip-text text-transparent">tenders, with less admin</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              Tenderiza pulls live RFQs, RFPs and RFIs from National Treasury&apos;s eTenders portal, scores
              them against your company profile, and drafts your first-pass bid documents — so you spend
              your time on the parts only you can do.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/onboarding"
                className="group inline-flex items-center gap-2 rounded-full bg-[#FFB612] px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-[#FFB612]/20 transition-transform hover:scale-105"
              >
                Start your free trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">No credit card required to start. Cancel anytime.</p>
          </div>

          <Reveal>
            <LiveTendersCard tenders={previewTenders} />
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      {tenderCount > 0 && (
        <section className="border-b border-slate-100 bg-slate-50">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
            {[
              { label: "Tenders tracked", value: tenderCount.toLocaleString("en-ZA") },
              { label: "Open right now", value: openTenderCount.toLocaleString("en-ZA") },
              { label: "Provinces covered", value: "9" },
              { label: "Synced from eTenders", value: "Daily" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#007A4D]">Everything in one place</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            From profile to submission
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delayMs={i * 80}>
              <div className="group h-full rounded-2xl border border-slate-100 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#007A4D]/10 to-[#002395]/10 text-[#007A4D] transition-colors group-hover:from-[#007A4D] group-hover:to-[#002395] group-hover:text-white">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{feature.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#FFB612]">How it works</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Four steps, most of them automatic</h2>
          </Reveal>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delayMs={i * 100} className="relative">
                <p className="text-4xl font-black text-white/10">{step.n}</p>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{step.body}</p>
                {i < STEPS.length - 1 && (
                  <div className="absolute right-[-1rem] top-3 hidden h-px w-8 bg-gradient-to-r from-white/30 to-transparent lg:block" />
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#DE3831]">Simple pricing</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Start free. Upgrade when you&apos;re winning.
          </h2>
        </Reveal>
        <div className="mt-10 flex justify-center">
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
          >
            Compare plans
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#007A4D] via-[#002395] to-slate-950 py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
          <TrendingUp className="h-8 w-8 text-[#FFB612]" />
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Spend less time searching. More time winning.
          </h2>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-lg transition-transform hover:scale-105"
          >
            Start your free trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
