"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { FlagMark } from "./flag";

const NAV = [
  { href: "/tenders", label: "Tenders" },
  { href: "/awarded-tenders", label: "Awarded Tenders" },
  { href: "/tools", label: "Tools" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact Us" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50">
      {/* Utility strip — states the data's provenance, the way an official site would. */}
      <div className="bg-[var(--field)] text-white/70">
        <div className="mx-auto flex h-8 max-w-[1240px] items-center justify-between px-5 text-[11px]">
          <p className="mono tracking-wider">SOURCE · NATIONAL TREASURY eTENDERS (OCDS)</p>
          <p className="mono hidden tracking-wider sm:block">SYNCED DAILY · ALL 9 PROVINCES</p>
        </div>
      </div>

      <div className="border-b border-[var(--rule)] bg-white">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <FlagMark className="h-6 w-9 shrink-0 shadow-sm" />
            <span className="display text-[22px] tracking-tight text-[var(--ink)]">TENDERIZA</span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative py-1 text-[15px] font-medium transition-colors ${
                    active ? "text-[var(--field)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  {item.label}
                  {active && <span className="absolute -bottom-[3px] left-0 h-[3px] w-full bg-[var(--gold)]" />}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Link href="/dashboard" className="text-[15px] font-medium text-[var(--ink-2)] hover:text-[var(--ink)]">
              Login
            </Link>
            <Link
              href="/onboarding"
              className="bg-[var(--field)] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--field-2)]"
            >
              Start free trial
            </Link>
          </div>

          <button
            className="p-2 text-[var(--ink)] lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-b border-[var(--rule)] bg-white px-5 py-3 lg:hidden">
          <nav className="grid">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-[var(--rule)] py-3 text-[15px] font-medium text-[var(--ink)]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 grid gap-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="border border-[var(--rule)] py-2.5 text-center text-[14px] font-semibold text-[var(--ink)]"
              >
                Login
              </Link>
              <Link
                href="/onboarding"
                onClick={() => setOpen(false)}
                className="bg-[var(--field)] py-2.5 text-center text-[14px] font-semibold text-white"
              >
                Start free trial
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
