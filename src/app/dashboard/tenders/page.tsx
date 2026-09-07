"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SyncButton } from "@/components/tenders/sync-button";
import { ClosingBadge } from "@/components/tenders/closing-badge";
import { useTenders } from "@/lib/use-tenders";
import { formatCurrency, formatDate } from "@/lib/format";
import { Search } from "lucide-react";

const ALL = "__all__";

export default function TendersPage() {
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [showClosed, setShowClosed] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (province !== ALL) params.set("province", province);
    if (category !== ALL) params.set("category", category);
    if (showClosed) params.set("showClosed", "true");
    return params.toString();
  }, [search, province, category, showClosed]);

  const { data, isLoading, mutate } = useTenders(query);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tenders</h1>
          <p className="text-sm text-muted-foreground">
            Live opportunities from National Treasury&apos;s eTenders portal.
          </p>
        </div>
        <SyncButton onSynced={() => mutate()} />
      </div>

      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search title, description, buyer…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={province} onValueChange={setProvince}>
          <SelectTrigger>
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All provinces</SelectItem>
            {data?.filters.provinces.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {data?.filters.categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showClosed ? "secondary" : "outline"}
          onClick={() => setShowClosed((v) => !v)}
        >
          {showClosed ? "Showing all" : "Open only"}
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading tenders…</p>}

      {!isLoading && data?.tenders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="font-medium">No tenders to show</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {showClosed
                ? "No tenders match your filters."
                : "No open tenders ingested yet — click \"Sync now\" above to pull the latest from eTenders."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {data?.tenders.map((tender) => (
          <Link key={tender.id} href={`/dashboard/tenders/${tender.id}`}>
            <Card className="transition-colors hover:bg-accent/40">
              <CardContent className="grid gap-2 py-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium leading-snug">{tender.title || "Untitled tender"}</p>
                  <ClosingBadge closingDate={tender.closingDate} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {tender.buyerName && <span>{tender.buyerName}</span>}
                  {tender.province && <span>{tender.province}</span>}
                  {tender.category && <Badge variant="outline">{tender.category}</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">
                    Closes: <span className="text-foreground">{formatDate(tender.closingDate)}</span>
                  </span>
                  {tender.estimatedValue != null && (
                    <span className="text-muted-foreground">
                      Est. value:{" "}
                      <span className="text-foreground">
                        {formatCurrency(tender.estimatedValue, tender.currency)}
                      </span>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
