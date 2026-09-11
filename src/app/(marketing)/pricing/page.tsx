import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { FlagRule } from "@/components/marketing/flag";

const PLANS = [
  {
    name: "Trial",
    price: "R0",
    period: "14 days",
    summary: "See whether it fits how your business actually bids.",
    cta: "Start free trial",
    href: "/onboarding",
    featured: false,
  },
  {
    name: "Pro",
    price: "R899",
    period: "per month",
    summary: "For businesses bidding every month who want the full pipeline.",
    cta: "Start free trial",
    href: "/onboarding",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Talk to us",
    period: "custom",
    summary: "Multiple entities, custom onboarding, your own workflow to plug into.",
    cta: "Contact us",
    href: "/contact",
    featured: false,
  },
];

const MATRIX: { feature: string; trial: string | boolean; pro: string | boolean; ent: string | boolean }[] = [
  { feature: "Company profile & compliance documents", trial: true, pro: true, ent: true },
  { feature: "Live eTenders sync, all nine provinces", trial: true, pro: true, ent: true },
  { feature: "Eligibility matching against your profile", trial: true, pro: true, ent: true },
  { feature: "AI-drafted bid documents", trial: "1 / month", pro: "Unlimited", ent: "Unlimited" },
  { feature: "RFQ quotation & RFI response drafting", trial: false, pro: true, ent: true },
  { feature: "Compliance checklist & expiry reminders", trial: false, pro: true, ent: true },
  { feature: "Submission audit trail", trial: false, pro: true, ent: true },
  { feature: "Multiple company profiles", trial: false, pro: false, ent: true },
  { feature: "Dedicated onboarding & support", trial: false, pro: false, ent: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-[var(--green)]" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-[var(--rule)]" />;
  return <span className="mono text-[13px] font-semibold text-[var(--ink)]">{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      <section className="bg-[var(--field)]">
        <div className="mx-auto max-w-[1240px] px-5 py-14">
          <p className="field-label text-[var(--gold)]">Pricing</p>
          <h1 className="display mt-4 max-w-[18ch] text-[clamp(2.4rem,5.2vw,3.6rem)] uppercase text-white">
            Priced for small business
          </h1>
          <p className="mt-4 max-w-[56ch] text-[17px] leading-relaxed text-white/65">
            Start free, no card. Upgrade only once Tenderiza is genuinely saving you time on bids.
          </p>
        </div>
        <FlagRule />
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-16">
        <div className="grid gap-px border border-[var(--rule)] bg-[var(--rule)] lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col p-8 ${plan.featured ? "bg-[var(--field)] text-white" : "bg-white"}`}
            >
              <div className="flex items-center justify-between">
                <p className={`field-label ${plan.featured ? "text-[var(--gold)]" : "text-[var(--green)]"}`}>
                  {plan.name}
                </p>
                {plan.featured && (
                  <span className="mono bg-[var(--gold)] px-2 py-1 text-[11px] font-bold tracking-wider text-[var(--ink)]">
                    MOST CHOSEN
                  </span>
                )}
              </div>
              <p className={`display mt-5 text-[42px] ${plan.featured ? "text-white" : "text-[var(--ink)]"}`}>
                {plan.price}
              </p>
              <p className={`mono mt-1 text-[13px] ${plan.featured ? "text-white/50" : "text-[var(--ink-2)]"}`}>
                {plan.period.toUpperCase()}
              </p>
              <p className={`mt-5 flex-1 text-[15px] leading-relaxed ${plan.featured ? "text-white/70" : "text-[var(--ink-2)]"}`}>
                {plan.summary}
              </p>
              <Link
                href={plan.href}
                className={`mt-8 inline-flex items-center justify-center px-6 py-3.5 text-[15px] font-bold transition-transform hover:scale-[1.02] ${
                  plan.featured ? "bg-[var(--gold)] text-[var(--ink)]" : "bg-[var(--field)] text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison matrix */}
        <div className="mt-14 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b-2 border-[var(--ink)]">
                <th className="field-label py-3 text-left text-[var(--ink-2)]">What&apos;s included</th>
                <th className="field-label px-4 py-3 text-center text-[var(--ink-2)]">Trial</th>
                <th className="field-label px-4 py-3 text-center text-[var(--field)]">Pro</th>
                <th className="field-label px-4 py-3 text-center text-[var(--ink-2)]">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row) => (
                <tr key={row.feature} className="border-b border-[var(--rule)]">
                  <td className="py-3.5 pr-4 text-[15px] text-[var(--ink)]">{row.feature}</td>
                  <td className="px-4 py-3.5 text-center">
                    <Cell value={row.trial} />
                  </td>
                  <td className="bg-[var(--paper-2)] px-4 py-3.5 text-center">
                    <Cell value={row.pro} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Cell value={row.ent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mono mt-8 max-w-[70ch] text-[12px] leading-relaxed tracking-wide text-[var(--ink-2)]">
          NOTE · BILLING ISN&apos;T WIRED UP YET, SO EVERY PLAN CURRENTLY STARTS THE SAME FREE TRIAL. THIS PAGE
          WILL BE UPDATED THE MOMENT PAID PLANS GO LIVE.
        </p>
      </section>
    </>
  );
}
