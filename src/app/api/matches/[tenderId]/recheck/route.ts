import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeMatchForTender } from "@/lib/match-runner";

export const maxDuration = 30;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ tenderId: string }> }) {
  const { tenderId } = await params;

  const [company, tender] = await Promise.all([
    prisma.company.findFirst({ orderBy: { createdAt: "asc" }, include: { categories: { include: { category: true } } } }),
    prisma.tender.findUnique({ where: { id: tenderId } }),
  ]);

  if (!company) return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
  if (!tender) return NextResponse.json({ error: "Tender not found" }, { status: 404 });

  // computeMatchForTender never throws on extraction failure — it records
  // the failure in the match's reasons instead, so the UI always gets a
  // usable result rather than an error page.
  await computeMatchForTender(company, tender, { forceExtraction: true });

  const match = await prisma.match.findUnique({
    where: { companyId_tenderId: { companyId: company.id, tenderId } },
    include: { tender: true },
  });

  return NextResponse.json(match);
}
