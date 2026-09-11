import Link from "next/link";
import { ArrowRight, Calculator, FileEdit, MessageCircleQuestion, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const TOOLS = [
  {
    icon: Target,
    title: "AI Eligibility Matching",
    body: "Every open tender scored against your B-BBEE level, CIDB grade, categories, and provinces — automatically, every day.",
    status: "Available",
  },
  {
    icon: Sparkles,
    title: "AI Cost Estimate Guidance",
    body: "A generic market-rate range for what a tender might cost, reasoned independently of the official estimate — never a substitute for your own quote.",
    status: "Available",
  },
  {
    icon: FileEdit,
    title: "AI Document Drafting",
    body: "First-pass compliance summaries, technical proposals, and — for RFQs — a quotation draft with the pricing schedule laid out for you to price yourself.",
    status: "Available",
  },
  {
    icon: Calculator,
    title: "B-BBEE Points Calculator",
    body: "See the actual preference points your B-BBEE level would score on a tender's 80/20 or 90/20 system before investing time in a full bid.",
    status: "Coming soon",
  },
  {
    icon: MessageCircleQuestion,
    title: "Clarification Question Generator",
    body: "A draft list of sensible questions to ask the procuring entity, based on gaps or ambiguities in the tender's own scope — you review, edit, and send.",
    status: "Coming soon",
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#007A4D]">Tools</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
          Built specifically for South African tender rules
        </h1>
        <p className="mt-4 text-slate-500">
          Every tool below reads from the tender&apos;s own documents and your own company profile — nothing
          is invented, and pricing decisions always stay yours.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <div key={tool.title} className="flex h-full flex-col rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#007A4D]/10 to-[#002395]/10 text-[#007A4D]">
                <tool.icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  tool.status === "Available" ? "bg-[#007A4D]/10 text-[#007A4D]" : "bg-slate-100 text-slate-500"
                )}
              >
                {tool.status}
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{tool.title}</h3>
            <p className="mt-2 flex-1 text-sm text-slate-500">{tool.body}</p>
          </div>
        ))}
      </div>

      <Link
        href="/onboarding"
        className="mt-12 inline-flex items-center gap-2 rounded-full bg-[#002395] px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
      >
        Try the tools free <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
