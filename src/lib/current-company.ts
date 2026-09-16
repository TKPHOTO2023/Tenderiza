import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * Resolves the signed-in user's company, creating the empty profile on first
 * use. Returns null when nobody is signed in — every caller must handle that
 * and answer 401 rather than falling back to "the" company. (Before accounts
 * existed this returned a single shared Company; that is deliberately gone.)
 */
export async function getCurrentCompany() {
  const user = await getCurrentUser();
  if (!user) return null;

  const existing = await prisma.company.findUnique({ where: { ownerId: user.id } });
  if (existing) return existing;

  return prisma.company.create({
    data: {
      ownerId: user.id,
      contactEmail: user.email,
      contactPersonName: user.name,
      subscription: { create: {} },
    },
  });
}
