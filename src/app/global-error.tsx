"use client";

/**
 * Last-resort boundary for an error thrown above the dashboard segment
 * (e.g. in the root layout itself) — must render its own <html>/<body>
 * since it replaces the entire root layout when it fires.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ color: "#666", margin: "0.5rem 0 1rem" }}>
          {error.message || "Unexpected error"}
          {error.digest && <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.7 }}>Reference: {error.digest}</span>}
        </p>
        <button
          onClick={() => reset()}
          style={{ padding: "0.5rem 1rem", borderRadius: 6, border: "1px solid #ccc", cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
