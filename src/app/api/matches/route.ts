import { NextResponse } from "next/server";
import { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentCompany } from "@/lib/current-company";

const STATUS_RANK: Record<MatchStatus, number> = {
  ELIGIBLE: 0,
  PARTIAL: 1,
  NEEDS_REVIEW: 2,
  NOT_ELIGIBLE: 3,
};

export async function GET() {
  const company = await getOrCreateCurrentCompany();

  const matches = await prisma.match.findMany({
    where: { companyId: company.id },
    include: { tender: true },
  });

  matches.sort((a, b) => {
    const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;
    const aClose = a.tender.closingDate?.getTime() ?? Infinity;
    const bClose = b.tender.closingDate?.getTime() ?? Infinity;
    return aClose - bClose;
  });

  return NextResponse.json(matches);
}
