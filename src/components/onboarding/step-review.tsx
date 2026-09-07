"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { buildChecklist, completenessPercent } from "@/lib/completeness";
import type { CompanyFull } from "@/lib/api-types";

export function StepReview({ company }: { company: CompanyFull }) {
  const percent = completenessPercent(company);
  const checklist = buildChecklist(company);
  const outstanding = checklist.filter((c) => !c.done);

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-border p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Profile completeness</p>
          <span className="text-2xl font-semibold">{percent}%</span>
        </div>
        <Progress value={percent} />
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Checklist</p>
        <div className="grid gap-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={item.done ? "" : "text-muted-foreground"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {outstanding.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-4">
          <p className="text-sm font-medium">
            {outstanding.length} item{outstanding.length > 1 ? "s" : ""} still outstanding
          </p>
          <p className="text-sm text-muted-foreground">
            You can still go to your dashboard now and finish these later — nothing here is final.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{company.companyName || "Unnamed company"}</Badge>
        {company.bbbeeLevel && <Badge variant="outline">{company.bbbeeLevel.replace(/_/g, " ")}</Badge>}
        {company.categories.length > 0 && (
          <Badge variant="outline">{company.categories.length} categories selected</Badge>
        )}
        {company.documents.length > 0 && (
          <Badge variant="outline">{company.documents.length} documents uploaded</Badge>
        )}
      </div>
    </div>
  );
}
