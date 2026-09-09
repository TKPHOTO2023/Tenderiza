"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  ClipboardCheck,
  FileStack,
  FileText,
  LayoutDashboard,
  Sparkles,
  Target,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/profile", label: "Profile", icon: Building2 },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/tenders", label: "Tenders", icon: FileStack },
  { href: "/dashboard/matches", label: "Matches", icon: Target },
  { href: "/dashboard/drafts", label: "Drafts", icon: Sparkles },
  { href: "/dashboard/review", label: "Review & submission", icon: ClipboardCheck },
];

export function Sidebar() {
  const pathname = usePathname();

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
    </aside>
  );
}
