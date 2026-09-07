"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { buildChecklist, completenessPercent, expiryStatus } from "@/lib/completeness";
import type { CompanyFull } from "@/lib/api-types";

export function CompletenessWidget({ company }: { company: CompanyFull }) {
  const percent = completenessPercent(company);
  const checklist = buildChecklist(company);
  const outstanding = checklist.filter((c) => !c.done);

  const expiringDocs = company.documents.filter((d) => {
    const status = expiryStatus(d.expiryDate);
    return status === "expired" || status === "expiring30" || status === "expiring60";
  });

  return (
    <div className="grid gap-4">
      {expiringDocs.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>
            {expiringDocs.length} document{expiringDocs.length > 1 ? "s" : ""} need{expiringDocs.length === 1 ? "s" : ""} attention
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-1 grid gap-1">
              {expiringDocs.map((d) => {
                const status = expiryStatus(d.expiryDate);
                return (
                  <li key={d.id} className="flex items-center justify-between gap-2">
                    <span>{d.documentType.label}</span>
                    <span className="text-xs font-medium">
                      {status === "expired" ? "Expired" : "Expiring soon"} —{" "}
                      {new Date(d.expiryDate as unknown as string).toLocaleDateString("en-ZA")}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Link href="/dashboard/documents" className="mt-2 inline-block text-sm font-medium underline">
              Renew documents
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile completeness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center justify-between">
            <Progress value={percent} className="mr-4" />
            <span className="text-xl font-semibold">{percent}%</span>
          </div>
          {outstanding.length > 0 ? (
            <div className="grid gap-1.5">
              {outstanding.slice(0, 5).map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Circle className="h-3.5 w-3.5" />
                  {item.label}
                </div>
              ))}
              <Link href="/dashboard/profile" className="mt-1 text-sm font-medium text-primary underline">
                Complete your profile
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Your profile is fully complete.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
