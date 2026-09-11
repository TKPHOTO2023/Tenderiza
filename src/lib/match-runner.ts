import { MatchStatus, TenderStatus, type Company, type Tender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeStructuralMatch } from "@/lib/match-structural";
import { extractTenderRequirements, type ExtractedRequirements } from "@/lib/tender-extraction";
import { computeHardChecks, type HardCheck } from "@/lib/match-eligibility";

type CompanyWithCategories = Company & { categories: { category: { code: string } }[] };

function deriveStatus(tier: "strong" | "weak" | "none", hardChecks: HardCheck[], extractionAttempted: boolean): MatchStatus {
  if (tier === "none") return MatchStatus.NOT_ELIGIBLE;
  if (hardChecks.some((c) => c.status === "fail")) return MatchStatus.NOT_ELIGIBLE;
  if (hardChecks.some((c) => c.status === "needs_review")) return MatchStatus.NEEDS_REVIEW;
  if (!extractionAttempted) return MatchStatus.NEEDS_REVIEW; // haven't confirmed hard requirements yet
  return tier === "strong" ? MatchStatus.ELIGIBLE : MatchStatus.PARTIAL;
}

/**
 * Computes (or recomputes) the match for one tender against one company.
 * Layer 1 (structural) always runs. Layer 2 (AI extraction) only runs when
 * structural tier isn't "none" (no point spending an API call on a tender
 * with zero category/province overlap), and only when `forceExtraction` is
 * set or no cached extraction already exists on the tender.
 */
export async function computeMatchForTender(
  company: CompanyWithCategories,
  tender: Tender,
  { forceExtraction = false }: { forceExtraction?: boolean } = {}
): Promise<{ status: MatchStatus; extractionError?: string }> {
  const structural = computeStructuralMatch(
    company.categories.map((c) => c.category.code),
    company.operatingProvinces,
    tender
  );

  let extracted = tender.extractedRequirements as ExtractedRequirements | null;
  let extractionError: string | undefined;

  if (structural.tier !== "none" && (forceExtraction || !extracted)) {
    try {
      const { requirements, documentsAnalyzed } = await extractTenderRequirements(tender);
      extracted = requirements;
      await prisma.tender.update({
        where: { id: tender.id },
        data: {
          extractedRequirements: { ...requirements, documentsAnalyzed },
          requirementsExtractedAt: new Date(),
          procurementType: requirements.procurementType,
          pricingSchedule: requirements.pricingScheduleItems as object,
        },
      });
    } catch (error) {
      extractionError = error instanceof Error ? error.message : "Extraction failed";
      extracted = null;
    }
  }

  const hardChecks = structural.tier !== "none" && extracted ? computeHardChecks(extracted, company) : [];
  const extractionAttempted = structural.tier === "none" || extracted != null;
  const status = deriveStatus(structural.tier, hardChecks, extractionAttempted);

  const reasons = [...structural.reasons];
  if (structural.tier !== "none" && !extracted && extractionError) {
    reasons.push(`Requirement extraction unavailable: ${extractionError}`);
  }

  await prisma.match.upsert({
    where: { companyId_tenderId: { companyId: company.id, tenderId: tender.id } },
    create: {
      companyId: company.id,
      tenderId: tender.id,
      categoryMatch: structural.categoryMatch,
      provinceMatch: structural.provinceMatch,
      hardChecks: hardChecks as object,
      status,
      reasons,
    },
    update: {
      categoryMatch: structural.categoryMatch,
      provinceMatch: structural.provinceMatch,
      hardChecks: hardChecks as object,
      status,
      reasons,
    },
  });

  return { status, extractionError };
}

export interface RecomputeAllResult {
  scored: number;
  extractionsRun: number;
  extractionErrors: number;
}

/**
 * Recomputes matches for every currently-open, not-yet-closed tender.
 * `maxExtractions` caps how many Layer 2 AI calls this run makes, to keep
 * a single sync/cron invocation within its time and cost budget — tenders
 * that miss the cap are picked up on the next run (their structural score
 * is still recorded immediately either way).
 */
export async function recomputeAllMatches({
  maxExtractions = 5,
}: { maxExtractions?: number } = {}): Promise<RecomputeAllResult> {
  const company = await prisma.company.findFirst({
    orderBy: { createdAt: "asc" },
    include: { categories: { include: { category: true } } },
  });
  if (!company) return { scored: 0, extractionsRun: 0, extractionErrors: 0 };

  const tenders = await prisma.tender.findMany({
    where: { status: TenderStatus.OPEN, closingDate: { gt: new Date() } },
  });

  let extractionsRun = 0;
  let extractionErrors = 0;

  for (const tender of tenders) {
    const structuralTier = computeStructuralMatch(
      company.categories.map((c) => c.category.code),
      company.operatingProvinces,
      tender
    ).tier;

    const wouldExtract = structuralTier !== "none" && !tender.extractedRequirements;

    // Skip re-scoring tenders that would extract but are past this run's
    // cap — they keep whatever match (or lack of one) they already have,
    // and get retried on the next sync/cron/manual recompute.
    if (wouldExtract && extractionsRun >= maxExtractions) continue;

    if (wouldExtract) extractionsRun += 1;
    const result = await computeMatchForTender(company, tender);
    if (result.extractionError) extractionErrors += 1;
  }

  return { scored: tenders.length, extractionsRun, extractionErrors };
}
