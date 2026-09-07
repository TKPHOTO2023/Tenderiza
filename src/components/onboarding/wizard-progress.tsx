"use client";

import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS } from "@/lib/constants";
import { Check } from "lucide-react";

export function WizardProgress({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {ONBOARDING_STEPS.map((step, i) => (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                  i < currentIndex && "border-primary bg-primary text-primary-foreground",
                  i === currentIndex && "border-primary text-primary",
                  i > currentIndex && "border-border text-muted-foreground"
                )}
              >
                {i < currentIndex ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  i === currentIndex ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < ONBOARDING_STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full transition-colors",
                  i < currentIndex ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
