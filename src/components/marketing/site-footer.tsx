import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/tenders", label: "Tenders" },
      { href: "/awarded-tenders", label: "Awarded Tenders" },
      { href: "/tools", label: "Tools" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact Us" },
      { href: "/onboarding", label: "Start Free Trial" },
      { href: "/dashboard", label: "Login" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#007A4D] via-[#FFB612] to-[#DE3831] text-sm font-black text-white">
              T
            </span>
            <span className="text-lg font-extrabold tracking-tight text-white">Tenderiza</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-slate-400">
            South African tender readiness, built for South African businesses — live eTenders data,
            AI-assisted matching and drafting, and a review workflow that keeps a human in charge of every
            submission.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-white">{col.title}</p>
            <ul className="mt-3 grid gap-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="h-1.5 w-full bg-gradient-to-r from-[#007A4D] via-[#FFB612] via-30% via-[#DE3831] via-60% to-[#002395]" />
      <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
        &copy; {new Date().getFullYear()} Tenderiza. Data sourced from National Treasury&apos;s eTenders OCDS
        API. Not affiliated with National Treasury or any government department.
      </div>
    </footer>
  );
}
