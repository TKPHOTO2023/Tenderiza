import { prisma } from "@/lib/prisma";
import { fetchReleases } from "@/lib/ocds-client";
import { normalizeRelease } from "@/lib/tender-normalize";
import { recomputeAllMatches } from "@/lib/match-runner";

export interface SyncResult {
  releasesFetched: number;
  tendersCreated: number;
  tendersUpdated: number;
  skipped: number;
  matchesScored?: number;
  matchExtractionsRun?: number;
}

/**
 * Pulls releases from the OCDS API published in the last `daysBack` days,
 * normalizes and upserts each into `tenders` (deduped by ocid), and records
 * the run in `tender_sync_logs`. Safe to re-run — re-fetching the same date
 * window just updates existing rows rather than duplicating them.
 */
export async function runTenderSync({ daysBack = 30 }: { daysBack?: number } = {}): Promise<SyncResult> {
  const log = await prisma.tenderSyncLog.create({ data: {} });

  const result: SyncResult = { releasesFetched: 0, tendersCreated: 0, tendersUpdated: 0, skipped: 0 };

  try {
    const dateTo = new Date();
    const dateFrom = new Date(dateTo);
    dateFrom.setDate(dateFrom.getDate() - daysBack);

    for await (const release of fetchReleases(dateFrom, dateTo)) {
      result.releasesFetched += 1;

      const normalized = normalizeRelease(release);
      if (!normalized) {
        result.skipped += 1;
        continue;
      }

      const { ocid, rawData, ...fields } = normalized;

      const existing = await prisma.tender.findUnique({ where: { ocid }, select: { id: true } });

      await prisma.tender.upsert({
        where: { ocid },
        create: { ocid, rawData: rawData as object, ...fields },
        update: { rawData: rawData as object, ...fields },
      });

      if (existing) result.tendersUpdated += 1;
      else result.tendersCreated += 1;
    }

    await prisma.tenderSyncLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        releasesFetched: result.releasesFetched,
        tendersCreated: result.tendersCreated,
        tendersUpdated: result.tendersUpdated,
        success: true,
      },
    });

    // Layer 1 (structural) + capped Layer 2 (AI extraction) matching runs
    // right after every sync, per Phase 3. Never let a matching problem
    // (e.g. ANTHROPIC_API_KEY not configured yet) fail the sync itself —
    // ingestion succeeded regardless.
    try {
      const matchResult = await recomputeAllMatches({ maxExtractions: 3 });
      result.matchesScored = matchResult.scored;
      result.matchExtractionsRun = matchResult.extractionsRun;
    } catch {
      // Matching is best-effort here; failures surface next time someone
      // views the Matches page or clicks Recompute.
    }

    return result;
  } catch (error) {
    await prisma.tenderSyncLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        releasesFetched: result.releasesFetched,
        tendersCreated: result.tendersCreated,
        tendersUpdated: result.tendersUpdated,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
