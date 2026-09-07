import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Icon className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Coming soon</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            This section is part of a later phase of Tenderiza and isn&apos;t built yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
