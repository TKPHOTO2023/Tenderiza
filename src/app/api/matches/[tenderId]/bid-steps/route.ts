import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCompany } from "@/lib/current-company";
import { buildBidSteps } from "@/lib/bid-readiness";
import type { HardCheck } from "@/lib/match-eligibility";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tenderId: string }> }) {
  const { tenderId } = await params;
  const current = await getCurrentCompany();
  if (!current) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const [company, tender, match, draft] = await Promise.all([
    prisma.company.findUnique({
      where: { id: current.id },
      include: { documents: { include: { documentType: true } } },
    }),
    prisma.tender.findUnique({ where: { id: tenderId } }),
    prisma.match.findUnique({ where: { companyId_tenderId: { companyId: current.id, tenderId } } }),
    prisma.draft.findUnique({ where: { companyId_tenderId: { companyId: current.id, tenderId } } }),
  ]);

  if (!company || !tender) return NextResponse.json({ error: "Tender not found" }, { status: 404 });

  const hardChecks = (match?.hardChecks as unknown as HardCheck[]) ?? [];
  return NextResponse.json({
    steps: buildBidSteps(company, tender, draft, hardChecks),
    draftId: draft?.id ?? null,
  });
}
