import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlagRule } from "@/components/marketing/flag";

const TOOLS = [
  {
    ref: "T-01",
    title: "Eligibility matching",
    body: "Every open tender scored against your B-BBEE level, CIDB grade, categories and operating provinces — automatically, daily.",
    status: "live" as const,
    accent: "var(--green)",
  },
  {
    ref: "T-02",
    title: "Requirement extraction",
    body: "Reads the tender's own PDFs for required B-BBEE level, CIDB grade, compulsory briefing dates and functionality thresholds. Returns nothing rather than guessing.",
    status: "live" as const,
    accent: "var(--green)",
  },
  {
    ref: "T-03",
    title: "Quote guidance",
    body: "A generic market-rate range for what a scope of work typically costs, reasoned independently of the official estimate. Guidance only — never your quote.",
    status: "live" as const,
    accent: "var(--green)",
  },
  {
    ref: "T-04",
    title: "Document drafting",
    body: "Compliance summaries, technical proposals, and for RFQs a quotation with the tender's own pricing schedule laid out — every price cell left for you.",
    status: "live" as const,
    accent: "var(--gold)",
  },
  {
    ref: "T-05",
    title: "B-BBEE points calculator",
    body: "The preference points your level scores on a tender's 80/20 or 90/20 system, using the documented PPPFA formula — before you sink a day into the bid.",
    status: "soon" as const,
    accent: "var(--blue)",
  },
  {
    ref: "T-06",
    title: "Clarification questions",
    body: "A draft list of questions worth asking the procuring entity, drawn from gaps in the tender's own scope. You edit and send them yourself.",
    status: "soon" as const,
    accent: "var(--blue)",
  },
];

export default function ToolsPage() {
  return (
    <>
      <section className="bg-[var(--field)]">
        <div className="mx-auto max-w-[1240px] px-5 py-14">
          <p className="field-label text-[var(--gold)]">Tools</p>
          <h1 className="display mt-4 max-w-[20ch] text-[clamp(2.4rem,5.2vw,3.6rem)] uppercase text-white">
            Built for SA procurement rules
          </h1>
          <p className="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-white/65">
            Each tool reads the tender&apos;s own documents and your own profile. Nothing is invented, and
            pricing decisions never leave your hands.
          </p>
        </div>
        <FlagRule />
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-16">
        <div className="grid gap-px border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <article key={tool.ref} className="flex flex-col bg-white p-7">
              <div className="flex items-center justify-between">
                <span className="mono text-[12px] font-semibold tracking-wider text-[var(--ink-2)]">{tool.ref}</span>
                <span
                  className={`mono px-2 py-1 text-[11px] font-bold tracking-wider ${
                    tool.status === "live"
                      ? "bg-[var(--green)]/10 text-[var(--green)]"
                      : "bg-[var(--paper-2)] text-[var(--ink-2)]"
                  }`}
                >
                  {tool.status === "live" ? "AVAILABLE" : "IN BUILD"}
                </span>
              </div>
              <div className="mt-5 h-1 w-10" style={{ background: tool.accent }} />
              <h2 className="mt-4 text-[18px] font-bold leading-snug text-[var(--ink)]">{tool.title}</h2>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[var(--ink-2)]">{tool.body}</p>
            </article>
          ))}
        </div>

        <Link
          href="/onboarding"
          className="group mt-12 inline-flex items-center gap-2 bg-[var(--field)] px-7 py-4 text-[15px] font-bold text-white transition-transform hover:scale-[1.02]"
        >
          Try the tools free
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>
    </>
  );
}
