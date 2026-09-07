import { prisma } from "@/lib/prisma";

/**
 * Phase 1 is single-tenant (no auth yet). This resolves the one company
 * profile in the system, creating it on first touch. Once auth lands in a
 * later phase, swap this for a session-derived company lookup — every
 * caller already threads through this single function.
 */
export async function getOrCreateCurrentCompany() {
  const existing = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.company.create({ data: {} });
}
