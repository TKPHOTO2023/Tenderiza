"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Lock, X } from "lucide-react";
import type { ProcurementType, Tender } from "@prisma/client";
import { TenderCard } from "./tender-card";

// UNKNOWN is deliberately not a filter — an unclassified tender shouldn't get
// its own tab, it just shows up under ALL.
const TYPES = ["ALL", "RFQ", "RFP", "RFI"] as const;
type TypeFilter = (typeof TYPES)[number];
const SORTS = [
  { value: "closing", label: "Closing soonest" },
  { value: "newest", label: "Recently published" },
  { value: "value", label: "Highest value" },
] as const;

const FREE_LIMIT = 12;

interface Props {
  initialTenders: Tender[];
  provinces: string[];
}

/**
 * The live register. Filtering runs client-side over the current result set
 * so type/sort feel instant; search and province round-trip to the API,
 * debounced, because they need the whole table.
 */
export function TenderBrowser({ initialTenders, provinces }: Props) {
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("");
  const [type, setType] = useState<TypeFilter>("ALL");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("closing");
  const [tenders, setTenders] = useState(initialTenders);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (province) params.set("province", province);
      try {
        const res = await fetch(`/api/tenders?${params}`);
        const data = await res.json();
        setTenders(data.tenders ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, province]);

  const results = useMemo(() => {
    const filtered = type === "ALL" ? tenders : tenders.filter((t) => t.procurementType === type);
    const sorted = [...filtered];
    if (sort === "closing") {
      sorted.sort((a, b) => new Date(a.closingDate ?? 0).getTime() - new Date(b.closingDate ?? 0).getTime());
    } else if (sort === "newest") {
      sorted.sort((a, b) => new Date(b.publishedDate ?? 0).getTime() - new Date(a.publishedDate ?? 0).getTime());
    } else {
      sorted.sort((a, b) => Number(b.estimatedValue ?? 0) - Number(a.estimatedValue ?? 0));
    }
    return sorted;
  }, [tenders, type, sort]);

  const counts = useMemo<Record<TypeFilter, number>>(() => {
    const by = (t: ProcurementType) => tenders.filter((x) => x.procurementType === t).length;
    return { ALL: tenders.length, RFQ: by("RFQ"), RFP: by("RFP"), RFI: by("RFI") };
  }, [tenders]);

  const visible = results.slice(0, FREE_LIMIT);
  const hidden = Math.max(0, results.length - FREE_LIMIT);
  const filtersActive = Boolean(search || province || type !== "ALL");

  return (
    <div>
      {/* Control strip */}
      <div className="sticky top-[100px] z-30 border border-[var(--rule)] bg-white">
        <div className="grid gap-3 p-4 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-2)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, buyer or keyword"
              aria-label="Search tenders"
              className="h-11 w-full border border-[var(--rule)] bg-white pl-10 pr-3 text-[15px] outline-none transition-colors placeholder:text-[var(--ink-2)] focus:border-[var(--field)] focus:ring-2 focus:ring-[var(--field)]/15"
            />
          </div>

          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            aria-label="Filter by province"
            className="h-11 border border-[var(--rule)] bg-white px-3 text-[15px] outline-none focus:border-[var(--field)] focus:ring-2 focus:ring-[var(--field)]/15"
          >
            <option value="">All provinces</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort tenders"
            className="h-11 border border-[var(--rule)] bg-white px-3 text-[15px] outline-none focus:border-[var(--field)] focus:ring-2 focus:ring-[var(--field)]/15"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type tabs with live counts */}
        <div className="flex flex-wrap items-center gap-1 border-t border-[var(--rule)] px-4 py-2">
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-[var(--ink-2)]" />
          {TYPES.map((t) => {
            const active = type === t;
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`mono px-3 py-1.5 text-[12px] font-semibold tracking-wider transition-colors ${
                  active ? "bg-[var(--field)] text-white" : "text-[var(--ink-2)] hover:bg-[var(--paper-2)]"
                }`}
              >
                {t === "ALL" ? "ALL" : t} <span className={active ? "text-white/60" : "text-[var(--ink-2)]/60"}>{counts[t]}</span>
              </button>
            );
          })}
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setProvince("");
                setType("ALL");
              }}
              className="mono ml-auto inline-flex items-center gap-1 px-2 py-1.5 text-[12px] font-semibold tracking-wider text-[var(--red)] hover:underline"
            >
              <X className="h-3 w-3" /> CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div className="mt-6 flex items-baseline justify-between">
        <p className="mono text-[13px] tracking-wider text-[var(--ink-2)]">
          {loading ? "SEARCHING…" : `${results.length} OPEN ${results.length === 1 ? "TENDER" : "TENDERS"}`}
        </p>
        {hidden > 0 && <p className="mono text-[13px] tracking-wider text-[var(--ink-2)]">SHOWING {visible.length}</p>}
      </div>

      {/* Register */}
      <div className="mt-3 grid gap-3">
        {visible.map((tender, i) => (
          <div key={tender.id} className="site-reveal" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
            <TenderCard tender={tender} />
          </div>
        ))}
      </div>

      {!loading && results.length === 0 && (
        <div className="border border-dashed border-[var(--rule)] px-6 py-16 text-center">
          <p className="text-[17px] font-semibold text-[var(--ink)]">No tenders match those filters</p>
          <p className="mt-1.5 text-[15px] text-[var(--ink-2)]">
            Try a broader search term, or clear the province and type filters.
          </p>
        </div>
      )}

      {hidden > 0 && (
        <div className="mt-4 flex flex-col items-start gap-4 border border-[var(--field)] bg-[var(--field)] p-6 text-white sm:flex-row sm:items-center">
          <Lock className="h-5 w-5 shrink-0 text-[var(--gold)]" />
          <div className="flex-1">
            <p className="text-[17px] font-semibold">
              <span className="mono">{hidden}</span> more open {hidden === 1 ? "tender" : "tenders"} in this view
            </p>
            <p className="mt-1 text-[15px] text-white/65">
              Create a free account to see every result — scored against your own company profile, so you know
              which ones you actually qualify for.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="shrink-0 bg-[var(--gold)] px-5 py-3 text-[14px] font-bold text-[var(--ink)] transition-transform hover:scale-[1.03]"
          >
            Unlock all tenders
          </Link>
        </div>
      )}
    </div>
  );
}
