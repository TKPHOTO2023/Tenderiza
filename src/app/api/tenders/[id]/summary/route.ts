import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTenderRequirementsSummary } from "@/lib/tender-summary";

export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const tender = await prisma.tender.findUnique({ where: { id } });
  if (!tender) return NextResponse.json({ error: "Tender not found" }, { status: 404 });

  try {
    const { requirements, documentsAnalyzed } = await generateTenderRequirementsSummary(tender);

    const updated = await prisma.tender.update({
      where: { id },
      data: {
        requirementsSummary: { ...requirements, documentsAnalyzed },
        requirementsSummaryGeneratedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate summary" },
      { status: 502 }
    );
  }
}
