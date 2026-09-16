import Link from "next/link";
import { Check, ArrowRight, AlertTriangle, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BidStep } from "@/lib/bid-readiness";

const MARK = {
  done: { icon: Check, className: "bg-success text-success-foreground" },
  action: { icon: ArrowRight, className: "bg-primary text-primary-foreground" },
  blocked: { icon: AlertTriangle, className: "bg-destructive text-destructive-foreground" },
  waiting: { icon: Circle, className: "bg-muted text-muted-foreground" },
} as const;

/** The whole bid, as a sequence, with the next thing to do made obvious. */
export function BidSteps({ steps, onAction }: { steps: BidStep[]; onAction?: (key: string) => void }) {
  const next = steps.find((s) => s.state === "action" || s.state === "blocked");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">How to bid on this</CardTitle>
        <CardDescription>
          {next ? `Next: ${next.title.toLowerCase()}.` : "Everything's done — this bid is ready to go."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid">
          {steps.map((step, i) => {
            const mark = MARK[step.state];
            const Icon = mark.icon;
            const isNext = step === next;
            return (
              <li key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${mark.className}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {i < steps.length - 1 && <span className="my-1 w-px flex-1 bg-border" />}
                </div>
                <div className={`min-w-0 flex-1 pb-5 ${isNext ? "" : "opacity-80"}`}>
                  <p className={`text-sm ${isNext ? "font-semibold" : "font-medium"}`}>{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.detail}</p>
                  {step.action && (
                    <div className="mt-2">
                      {step.action.href ? (
                        <Button asChild size="sm" variant={isNext ? "default" : "outline"}>
                          <Link href={step.action.href}>{step.action.label}</Link>
                        </Button>
                      ) : onAction ? (
                        <Button size="sm" variant={isNext ? "default" : "outline"} onClick={() => onAction(step.key)}>
                          {step.action.label}
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
