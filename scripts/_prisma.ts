/**
 * Loads the Prisma client, regenerating it first if it's out of date.
 *
 * Pulling code that adds a model doesn't regenerate the client — that only
 * happens on install — so `prisma.user` comes back undefined and the script
 * dies with "Cannot read properties of undefined (reading 'findUnique')",
 * which says nothing about the actual cause. Generating first avoids it.
 *
 * The client has to be imported after generating, hence the dynamic import.
 */
import { execFileSync } from "child_process";

export async function loadPrisma() {
  try {
    execFileSync("npx", ["prisma", "generate"], { stdio: "pipe" });
  } catch {
    // Not fatal on its own — if the existing client is usable the check
    // below passes, and if it isn't, that error is the more useful one.
  }

  const { prisma } = await import("../src/lib/prisma");

  if (!prisma.user) {
    throw new Error(
      "The generated Prisma client has no User model. Run `npx prisma generate` (or `npm install`) and try again."
    );
  }
  return prisma;
}
