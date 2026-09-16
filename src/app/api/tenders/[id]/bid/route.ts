import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentCompany } from "@/lib/current-company";
import { computeMatchForTender } from "@/lib/match-runner";
import { generateDraft } from "@/lib/draft-runner";

export const maxDuration = 60;

/**
 * One action, the whole pipeline: read the tender's documents, work out what
 * kind of procurement it is and whether the company qualifies, then draft the
 * right document for it — a priced quotation for an RFQ, a proposal for an
 * RFP, a capability summary for an RFI.
 *
 * This is deliberately the only place that chains those steps. It still
 * produces a draft and nothing more: no pricing is invented, no declaration
 * signed, nothing sent anywhere.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [current, tender] = await Promise.all([
    getOrCreateCurrentCompany(),
    prisma.tender.findUnique({ where: { id } }),
  ]);
  if (!tender) return NextResponse.json({ error: "Tender not found" }, { status: 404 });

  const company = await prisma.company.findUnique({
    where: { id: current.id },
    include: { categories: { include: { category: true } } },
  });
  if (!company) return NextResponse.json({ error: "Company profile not found" }, { status: 404 });

  const steps: string[] = [];

  try {
    // Read the documents if we haven't already — this is what tells us the
    // procurement type, so the right document gets drafted.
    const needsExtraction = !tender.extractedRequirements;
    const result = await computeMatchForTender(company, tender, { forceExtraction: needsExtraction });
    steps.push(needsExtraction ? "Read the tender documents" : "Used the existing requirement extraction");

    if (result.extractionError) {
      steps.push(`Couldn't read the documents: ${result.extractionError}`);
    }

    const draft = await generateDraft(id);
    const refreshed = await prisma.tender.findUnique({ where: { id }, select: { procurementType: true } });
    steps.push(
      refreshed?.procurementType === "RFQ"
        ? "Drafted your quotation"
        : refreshed?.procurementType === "RFI"
          ? "Drafted your RFI response"
          : "Drafted your bid documents"
    );

    return NextResponse.json({ draftId: draft.id, procurementType: refreshed?.procurementType, steps });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't prepare this bid", steps },
      { status: 502 }
    );
  }
}
