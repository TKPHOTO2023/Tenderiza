"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  ClipboardCheck,
  FileStack,
  FileText,
  LayoutDashboard,
  Palette,
  CreditCard,
  LogOut,
  Sparkles,
  Target,
} from "lucide-react";
import { fetchJson } from "@/lib/api-client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/profile", label: "Profile", icon: Building2 },
  { href: "/dashboard/brand", label: "Brand", icon: Palette },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/tenders", label: "Tenders", icon: FileStack },
  { href: "/dashboard/matches", label: "Matches", icon: Target },
  { href: "/dashboard/drafts", label: "Drafts", icon: Sparkles },
  { href: "/dashboard/review", label: "Review & submission", icon: ClipboardCheck },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];


export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useSWR<{ user: { email: string } | null; entitlements: { plan: string; draftsUsed: number; draftsPerMonth: number } | null }>(
    "/api/auth/me",
    fetchJson
  );

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/50 px-3 py-6 md:block">
      <div className="mb-8 px-3">
        <p className="text-lg font-semibold tracking-tight">Tenderiza</p>
        <p className="text-xs text-muted-foreground">Tender readiness platform</p>
      </div>
      <nav className="grid gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {data?.user && (
        <div className="mt-6 border-t border-border pt-4">
          <Link
            href="/dashboard/billing"
            className="block rounded-md px-3 py-2 transition-colors hover:bg-accent"
          >
            <span className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Plan</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  data.entitlements?.plan === "PRO"
                    ? "bg-success text-success-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {data.entitlements?.plan ?? "FREE"}
              </span>
            </span>
            {data.entitlements?.plan === "FREE" && (
              <span className="mt-1 block text-[11px] text-muted-foreground">
                {data.entitlements.draftsUsed}/{data.entitlements.draftsPerMonth} drafts used — upgrade for
                unlimited
              </span>
            )}
          </Link>
          <p className="mt-2 truncate px-3 text-[11px] text-muted-foreground">{data.user.email}</p>
          <button
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
