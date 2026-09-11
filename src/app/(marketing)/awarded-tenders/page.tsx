import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";

export default function AwardedTendersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFB612]/15">
        <Trophy className="h-7 w-7 text-[#8a5a00]" />
      </div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#DE3831]">Coming soon</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">Awarded Tenders</h1>
      <p className="mt-4 text-slate-500">
        We&apos;re building a searchable archive of tender awards — who won, for how much, and how your
        company&apos;s past bids compare — sourced from the same National Treasury eTenders data that
        already powers the live Tenders page. It&apos;s not live yet, so we&apos;d rather tell you honestly
        than show you a fake preview.
      </p>
      <p className="mt-4 text-sm text-slate-400">
        Want to know when it launches? Start a free trial now and we&apos;ll notify existing users first.
      </p>
      <Link
        href="/onboarding"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
      >
        Start free trial <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
