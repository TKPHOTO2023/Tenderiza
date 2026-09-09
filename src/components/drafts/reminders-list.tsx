import Link from "next/link";
import { AlertTriangle, Bell, Info } from "lucide-react";
import type { Reminder } from "@/lib/reminders";
import { cn } from "@/lib/utils";

const ICON = {
  urgent: <AlertTriangle className="h-4 w-4 text-destructive" />,
  warning: <Bell className="h-4 w-4 text-warning" />,
  info: <Info className="h-4 w-4 text-muted-foreground" />,
};

export function RemindersList({ reminders }: { reminders: Reminder[] }) {
  if (reminders.length === 0) {
    return <p className="text-sm text-muted-foreground">No reminders right now.</p>;
  }

  return (
    <ul className="grid gap-2">
      {reminders.map((reminder) => (
        <li
          key={reminder.id}
          className={cn(
            "flex items-start gap-2 rounded-md border p-2.5 text-sm",
            reminder.severity === "urgent" && "border-destructive/40 bg-destructive/5",
            reminder.severity === "warning" && "border-warning/40 bg-warning/5",
            reminder.severity === "info" && "border-border"
          )}
        >
          {ICON[reminder.severity]}
          <div className="min-w-0">
            <p className="truncate font-medium">{reminder.tenderTitle}</p>
            <p className="text-muted-foreground">{reminder.message}</p>
            {reminder.draftId && (
              <Link href={`/dashboard/drafts/${reminder.draftId}`} className="text-xs font-medium text-primary underline">
                Open draft
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
