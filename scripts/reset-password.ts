/**
 * Sets a new password on an existing account.
 *
 * Passwords are scrypt hashes, so a forgotten one can't be recovered —
 * only replaced. This is the operator-side reset: it needs database
 * access, so it can't be used by anyone who isn't already running the
 * deployment. It does not touch sessions, documents or drafts.
 *
 *   npx tsx scripts/reset-password.ts you@company.co.za "new-password"
 *
 * Run with no arguments to list the accounts that exist.
 */
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email) {
    const users = await prisma.user.findMany({
      select: { email: true, createdAt: true, passwordHash: true, company: { select: { companyName: true } } },
      orderBy: { createdAt: "asc" },
    });
    if (users.length === 0) {
      console.log("No accounts exist yet. Sign up at /signup, or run scripts/claim-account.ts.");
      return;
    }
    console.log("Accounts on this database:\n");
    for (const user of users) {
      const unclaimed = user.passwordHash === "locked$needs-claim" ? "  [never claimed — use claim-account.ts]" : "";
      console.log(`  ${user.email}${user.company ? ` — ${user.company.companyName ?? "unnamed company"}` : ""}${unclaimed}`);
    }
    console.log('\nTo reset one: npx tsx scripts/reset-password.ts <email> "<new-password>"');
    return;
  }

  if (!password) {
    console.error('Usage: npx tsx scripts/reset-password.ts <email> "<new-password>"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    console.error(`No account for ${email}. Run with no arguments to list the accounts that exist.`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password) },
  });

  // Existing sessions stay valid: a reset you ran yourself shouldn't sign you
  // out of the browser you're already using.
  console.log(`Password reset for ${user.email}. Sign in at /login.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
