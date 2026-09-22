import { NextResponse } from "next/server";

/**
 * Turns an escaped exception into a JSON reply.
 *
 * Without this a crashing route answers with an empty body, and the browser
 * reports a JSON parse failure instead of the real fault. The message stays
 * generic — the detail goes to the server log — except for a missing table,
 * which is worth naming because it means migrations haven't been run.
 */
export function apiError(err: unknown, context: string): NextResponse {
  console.error(`${context}:`, err);

  const code = typeof err === "object" && err && "code" in err ? err.code : null;

  // P2021: table does not exist. P2022: column does not exist.
  if (code === "P2021" || code === "P2022") {
    return NextResponse.json(
      {
        error:
          "The database is missing tables this feature needs. Run the pending migrations (prisma migrate deploy) on this deployment.",
      },
      { status: 503 }
    );
  }
  if (code === "P1001" || code === "P1002") {
    return NextResponse.json({ error: "Can't reach the database right now. Try again shortly." }, { status: 503 });
  }

  return NextResponse.json({ error: "Something went wrong on our side. Try again shortly." }, { status: 500 });
}
