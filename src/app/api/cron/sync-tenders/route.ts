import { NextRequest, NextResponse } from "next/server";
import { runTenderSync } from "@/lib/tender-sync";

export const maxDuration = 60;

// Triggered daily by Vercel Cron (see vercel.json). Vercel automatically
// sends `Authorization: Bearer <CRON_SECRET>` on cron-triggered requests
// when CRON_SECRET is set as a project env var — this rejects any other
// caller so the sync can't be triggered by an arbitrary public GET.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runTenderSync({ daysBack: 3 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 502 }
    );
  }
}
