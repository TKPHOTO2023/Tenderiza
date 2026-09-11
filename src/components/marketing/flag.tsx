/**
 * The national flag's pall (the Y) is the brand's structural device — not
 * decoration. Its official meaning is convergence: "diverse elements taking
 * the road ahead in unity", which is literally what this product does to a
 * feed of thousands of tenders. Geometry follows the flag spec on a 900×600
 * field: green band 1/5 of the height, fimbriations 1/15.
 */

const RED = "#DE3831";
const BLUE = "#002395";
const GREEN = "#007A4D";
const GOLD = "#FFB612";

/** The full flag, used small (wordmark, footer) where the whole device reads. */
export function FlagMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 600" className={className} aria-hidden="true">
      <clipPath id="flag-clip">
        <rect width="900" height="600" />
      </clipPath>
      <g clipPath="url(#flag-clip)">
        <rect width="900" height="300" fill={RED} />
        <rect y="300" width="900" height="300" fill={BLUE} />
        <path d="M0,0 L340,300 L900,300 M0,600 L340,300" stroke="#fff" strokeWidth="200" fill="none" />
        <path d="M0,0 L340,300 L900,300 M0,600 L340,300" stroke={GREEN} strokeWidth="120" fill="none" />
        <path d="M0,80 L243,300 L0,520 Z" fill={GOLD} />
        <path d="M0,133 L185,300 L0,467 Z" fill="#000" />
      </g>
    </svg>
  );
}

/**
 * The pall alone, as a route diagram: two roads converging into one. Drawn on
 * the dark field so the arms read as lanes rather than flag bands.
 */
export function PallRoutes({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 600" className={className} fill="none" aria-hidden="true">
      {/* lane beds */}
      <path
        d="M0,0 L340,300 L900,300 M0,600 L340,300"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="116"
        strokeLinecap="butt"
      />
      {/* lane edges, in flag order: red arm above, blue arm below, green stem */}
      <path d="M0,0 L340,300" stroke={RED} strokeWidth="3" opacity="0.8" />
      <path d="M0,600 L340,300" stroke={BLUE} strokeWidth="3" opacity="0.8" />
      <path d="M340,300 L900,300" stroke={GOLD} strokeWidth="3" opacity="0.9" />
      {/* centre lane markings */}
      <path d="M0,0 L340,300" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeDasharray="14 22" />
      <path d="M0,600 L340,300" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeDasharray="14 22" />
      <path d="M340,300 L900,300" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeDasharray="14 22" />
      {/* the convergence point */}
      <circle cx="340" cy="300" r="13" fill={GOLD} />
      <circle cx="340" cy="300" r="13" fill="none" stroke={GOLD} strokeWidth="2" className="site-pulse" style={{ transformOrigin: "340px 300px" }} />
    </svg>
  );
}

/** Gold section rule, tabbed with the flag's bands at the left edge. */
export function FlagRule({ className = "" }: { className?: string }) {
  return <div className={`section-rule ${className}`} role="presentation" />;
}
