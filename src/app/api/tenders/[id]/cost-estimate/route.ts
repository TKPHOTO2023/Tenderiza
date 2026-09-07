import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTenderCostEstimate } from "@/lib/tender-cost-estimate";

export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const tender = await prisma.tender.findUnique({ where: { id } });
  if (!tender) return NextResponse.json({ error: "Tender not found" }, { status: 404 });

  try {
    const { estimate, documentsAnalyzed } = await generateTenderCostEstimate(tender);

    const updated = await prisma.tender.update({
      where: { id },
      data: {
        costEstimate: { ...estimate, documentsAnalyzed },
        costEstimateGeneratedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate cost estimate" },
      { status: 502 }
    );
  }
}
