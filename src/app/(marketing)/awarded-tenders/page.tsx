import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlagRule } from "@/components/marketing/flag";

const PLANNED = [
  { ref: "A-01", title: "Who won", body: "The awarded supplier, the contract value, and the award date for every concluded tender." },
  { ref: "A-02", title: "What it went for", body: "Award values against the original estimate, so you can price your next bid against reality." },
  { ref: "A-03", title: "Repeat buyers", body: "Which departments and municipalities award most often in your categories." },
];

export default function AwardedTendersPage() {
  return (
    <>
      <section className="bg-[var(--field)]">
        <div className="mx-auto max-w-[1240px] px-5 py-14">
          <nav className="mono flex items-center gap-2 text-[12px] tracking-wider text-white/45">
            <Link href="/" className="hover:text-white">
              HOME
            </Link>
            <span>/</span>
            <span className="text-white/80">AWARDED TENDERS</span>
          </nav>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <h1 className="display text-[clamp(2.4rem,5.2vw,3.6rem)] uppercase text-white">Awarded tenders</h1>
            <span className="mono bg-[var(--gold)] px-3 py-1.5 text-[12px] font-bold tracking-wider text-[var(--ink)]">
              IN BUILD
            </span>
          </div>
          <p className="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-white/65">
            Award history is the best pricing intelligence there is — what a department actually paid, and
            who they paid it to. We&apos;re building it from the same eTenders data behind the live register.
            It isn&apos;t ready, so rather than show you a mock-up, here&apos;s exactly what&apos;s coming.
          </p>
        </div>
        <FlagRule />
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-16">
        <div className="grid gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-3">
          {PLANNED.map((item) => (
            <article key={item.ref} className="bg-white p-7">
              <span className="mono text-[12px] font-semibold tracking-wider text-[var(--ink-2)]">{item.ref}</span>
              <h2 className="mt-4 text-[18px] font-bold text-[var(--ink)]">{item.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start gap-5 border border-[var(--rule)] bg-[var(--paper-2)] p-8 sm:flex-row sm:items-center">
          <p className="flex-1 text-[16px] leading-relaxed text-[var(--ink)]">
            Start a free trial now and you&apos;ll have award history the day it ships — existing users get it
            first.
          </p>
          <Link
            href="/onboarding"
            className="group inline-flex shrink-0 items-center gap-2 bg-[var(--field)] px-6 py-3.5 text-[15px] font-bold text-white transition-transform hover:scale-[1.02]"
          >
            Start free trial
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </>
  );
}
