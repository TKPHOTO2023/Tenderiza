import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runTenderSync } from "@/lib/tender-sync";

export const maxDuration = 60;

export async function GET() {
  const lastLog = await prisma.tenderSyncLog.findFirst({ orderBy: { startedAt: "desc" } });
  return NextResponse.json(lastLog);
}

export async function POST(req: NextRequest) {
  const daysBack = Number(req.nextUrl.searchParams.get("daysBack")) || 30;

  try {
    const result = await runTenderSync({ daysBack });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 502 }
    );
  }
}
