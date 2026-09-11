import Link from "next/link";
import { FlagMark, FlagRule } from "./flag";

const COLUMNS = [
  {
    title: "Find work",
    links: [
      { href: "/tenders", label: "All tenders" },
      { href: "/awarded-tenders", label: "Awarded tenders" },
      { href: "/tools", label: "Tools" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/contact", label: "Contact us" },
      { href: "/onboarding", label: "Start free trial" },
      { href: "/dashboard", label: "Login" },
    ],
  },
];

const PROVINCES = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[var(--field)] text-white">
      <FlagRule />
      <div className="mx-auto max-w-[1240px] px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <FlagMark className="h-6 w-9" />
              <span className="display text-[22px] text-white">TENDERIZA</span>
            </div>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/60">
              Built in South Africa for South African businesses. Live eTenders data, eligibility matching
              against your own profile, and AI-drafted bid documents — with a human approving every
              submission.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="field-label text-[var(--gold)]">{col.title}</p>
              <ul className="mt-4 grid gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[15px] text-white/70 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-[var(--rule-dark)] pt-6">
          <p className="field-label text-white/40">Provinces covered</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {PROVINCES.map((p) => (
              <span key={p} className="text-[13px] text-white/50">
                {p}
              </span>
            ))}
          </div>
        </div>

        <p className="mono mt-10 text-[11px] leading-relaxed tracking-wide text-white/35">
          © {new Date().getFullYear()} TENDERIZA · DATA SOURCED FROM NATIONAL TREASURY&apos;S eTENDERS OCDS API ·
          NOT AFFILIATED WITH NATIONAL TREASURY OR ANY GOVERNMENT DEPARTMENT
        </p>
      </div>
    </footer>
  );
}
