"use client";

import { useEffect, useState } from "react";

function parts(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
  };
}

/**
 * Tenders close at an exact time and late is disqualified — so the deadline
 * is the one number on this page that earns live motion. Ticks once a second
 * inside 24 hours, once a minute otherwise.
 */
export function Countdown({ closingDate, variant = "inline" }: { closingDate: Date | string | null; variant?: "inline" | "block" }) {
  const target = closingDate ? new Date(closingDate) : null;
  const [remaining, setRemaining] = useState(() => (target ? parts(target) : null));

  useEffect(() => {
    if (!target) return;
    const tick = () => setRemaining(parts(target));
    tick();
    const urgent = target.getTime() - Date.now() < 86_400_000;
    const id = setInterval(tick, urgent ? 1000 : 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closingDate]);

  if (!target) return <span className="mono text-xs text-[var(--ink-2)]">No closing date</span>;
  if (!remaining) return <span className="mono text-xs font-semibold text-[var(--ink-2)]">Closed</span>;

  const urgent = remaining.days <= 7;
  const label =
    remaining.days > 0
      ? `${remaining.days}d ${String(remaining.hours).padStart(2, "0")}h`
      : `${String(remaining.hours).padStart(2, "0")}h ${String(remaining.minutes).padStart(2, "0")}m ${String(remaining.seconds).padStart(2, "0")}s`;

  if (variant === "block") {
    return (
      <div>
        <p className="field-label text-[var(--ink-2)]">Closes in</p>
        <p className={`mono mt-1 text-2xl font-semibold ${urgent ? "text-[var(--red)]" : "text-[var(--ink)]"}`}>{label}</p>
      </div>
    );
  }

  return (
    <span
      className={`mono inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold ${
        urgent ? "bg-[var(--red)]/10 text-[var(--red)]" : "bg-[var(--paper-2)] text-[var(--ink-2)]"
      }`}
    >
      {urgent && <span className="h-1.5 w-1.5 rounded-full bg-[var(--red)]" />}
      {label}
    </span>
  );
}
