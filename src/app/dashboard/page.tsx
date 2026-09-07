"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CompletenessWidget } from "@/components/dashboard/completeness-widget";
import { useCompany } from "@/lib/use-company";
import { FileStack, Sparkles, Target } from "lucide-react";

export default function DashboardOverviewPage() {
  const { company, isLoading } = useCompany();

  if (isLoading || !company) {
    return <p className="text-sm text-muted-foreground">Loading dashboard…</p>;
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome back{company.companyName ? `, ${company.companyName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s where your tender readiness stands today.
        </p>
      </div>

      <CompletenessWidget company={company} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/tenders">
          <Card className="h-full transition-colors hover:bg-accent/50">
            <CardHeader>
              <FileStack className="mb-1 h-5 w-5 text-primary" />
              <CardTitle className="text-base">Tenders</CardTitle>
              <CardDescription>
                Live tenders from the National Treasury eTenders portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs font-medium text-primary">Browse tenders →</span>
            </CardContent>
          </Card>
        </Link>
        <ComingSoonCard
          icon={Target}
          title="Matches"
          description="Tenders scored against your profile's eligibility will show up here."
          href="/dashboard/matches"
        />
        <ComingSoonCard
          icon={Sparkles}
          title="Drafts"
          description="Auto-populated SBD forms and proposal drafts will live here."
          href="/dashboard/drafts"
        />
      </div>
    </div>
  );
}

function ComingSoonCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader>
          <Icon className="mb-1 h-5 w-5 text-primary" />
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <span className="text-xs font-medium text-muted-foreground">Coming soon</span>
        </CardContent>
      </Card>
    </Link>
  );
}
