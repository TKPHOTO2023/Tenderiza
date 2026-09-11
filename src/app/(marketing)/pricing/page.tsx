import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

const PLANS = [
  {
    name: "Free Trial",
    price: "R0",
    period: "for 14 days",
    description: "Everything you need to see if Tenderiza fits how your business bids.",
    cta: "Start free trial",
    href: "/onboarding",
    highlight: false,
    features: [
      "Company profile & compliance documents",
      "Live eTenders ingestion (daily sync)",
      "AI eligibility matching",
      "1 AI-drafted document per month",
      "Manual review & submission tracking",
    ],
  },
  {
    name: "Pro",
    price: "R899",
    period: "/ month",
    description: "For businesses actively bidding every month and want the full pipeline unlocked.",
    cta: "Start free trial",
    href: "/onboarding",
    highlight: true,
    features: [
      "Everything in Free Trial",
      "Unlimited AI-drafted documents",
      "RFQ quotation & RFI response generation",
      "Compliance checklist + expiry reminders",
      "Full audit trail for every submission",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Let's talk",
    period: "",
    description: "Multiple entities, custom onboarding, or your own procurement workflow to plug in.",
    cta: "Contact us",
    href: "/contact",
    highlight: false,
    features: [
      "Everything in Pro",
      "Multiple company profiles",
      "Custom integrations",
      "Dedicated onboarding & support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#007A4D]">Pricing</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
          Simple, honest pricing for South African businesses
        </h1>
        <p className="mt-4 text-slate-500">
          Start free, no credit card required. Upgrade only once Tenderiza is actually saving you time.
        </p>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-2xl border p-8 ${
              plan.highlight
                ? "border-[#002395] bg-slate-950 text-white shadow-2xl shadow-[#002395]/20 lg:-translate-y-3"
                : "border-slate-200 bg-white"
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FFB612] px-3 py-1 text-xs font-bold text-slate-950">
                Most popular
              </span>
            )}
            <h3 className={`text-lg font-semibold ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
            <p className={`mt-4 text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-slate-900"}`}>
              {plan.price}
              <span className={`ml-1 text-sm font-medium ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>
                {plan.period}
              </span>
            </p>
            <p className={`mt-3 text-sm ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>{plan.description}</p>
            <ul className="mt-6 grid flex-1 gap-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlight ? "text-[#FFB612]" : "text-[#007A4D]"}`} />
                  <span className={plan.highlight ? "text-slate-200" : "text-slate-600"}>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform hover:scale-105 ${
                plan.highlight ? "bg-[#FFB612] text-slate-950" : "bg-slate-900 text-white"
              }`}
            >
              {plan.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-slate-400">
        Pricing shown for illustration — billing isn&apos;t wired up yet, so every plan currently leads to the
        same free trial. We&apos;ll update this the moment paid plans go live.
      </p>
    </div>
  );
}
