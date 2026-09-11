import { Check } from "lucide-react";
import { PallRoutes } from "./flag";

/**
 * The page's thesis, drawn: the flag's pall read as two roads. Tenders come
 * down one, the company's profile down the other, and what leaves the fork is
 * the shortlist. Positions are percentages of the 900×600 pall geometry, so
 * the chips sit on the lanes at any size.
 */
export function Convergence() {
  return (
    <div className="relative aspect-[3/2] w-full">
      <PallRoutes className="absolute inset-0 h-full w-full" />

      {/* Upper road — the raw feed */}
      <Chip className="left-[1%] top-[4%]" tone="feed" ref_="RFQ" text="2 192 open" />
      <Chip className="left-[11%] top-[22%]" tone="feed" ref_="RFP" text="Eskom · MP" />
      <Chip className="left-[21%] top-[40%]" tone="feed" ref_="RFI" text="City of CPT" />

      {/* Lower road — your own profile */}
      <Chip className="left-[3%] bottom-[6%]" tone="profile" ref_="CIDB 4" text="B-BBEE L4 · GP" />

      {/* The fork — label sits below the node so it clears both lanes */}
      <div className="absolute left-[37.8%] top-[50%] -translate-x-1/2 translate-y-4">
        <span className="mono block bg-[var(--gold)] px-2 py-1 text-[10px] font-bold tracking-wider text-[var(--ink)]">
          MATCHED
        </span>
      </div>

      {/* The stem — what survives */}
      <div className="absolute right-0 top-1/2 w-[44%] -translate-y-1/2 border-l-4 border-[var(--gold)] bg-white p-4 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-2">
          <span className="mono bg-[var(--ink)] px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-white">
            1SA0YE
          </span>
          <span className="mono bg-[var(--gold)]/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#8a5a00]">
            RFQ
          </span>
          <span className="mono ml-auto text-[10px] font-semibold text-[var(--red)]">1d 23h</span>
        </div>
        <p className="mt-2 text-[13px] font-bold leading-snug text-[var(--ink)]">
          Supply of office furniture to regional offices
        </p>
        <div className="mt-2.5 grid gap-1 border-t border-[var(--rule)] pt-2.5">
          {["CIDB grade met", "B-BBEE level met", "Draft ready to review"].map((line) => (
            <p key={line} className="flex items-center gap-1.5 text-[11px] text-[var(--ink-2)]">
              <Check className="h-3 w-3 shrink-0 text-[var(--green)]" />
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({
  className,
  ref_,
  text,
  tone,
}: {
  className: string;
  ref_: string;
  text: string;
  tone: "feed" | "profile";
}) {
  return (
    <div
      className={`absolute flex items-center gap-1.5 border px-2 py-1.5 backdrop-blur-sm ${className} ${
        tone === "feed"
          ? "border-white/15 bg-white/10 text-white/70"
          : "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
      }`}
    >
      <span className="mono text-[10px] font-bold tracking-wider">{ref_}</span>
      <span className="mono hidden text-[10px] sm:inline">{text}</span>
    </div>
  );
}
