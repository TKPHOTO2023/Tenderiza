/**
 * Sets a real email and password on a company that predates accounts.
 *
 * Adding logins backfilled an owner user for every existing company, with a
 * placeholder password nobody can sign in with. This claims one of those,
 * so the existing profile, documents, drafts and matches stay attached to
 * the account instead of being stranded.
 *
 *   npx tsx scripts/claim-account.ts you@company.co.za "your-password"
 */
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/claim-account.ts <email> "<password>"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const unclaimed = await prisma.user.findMany({
    where: { passwordHash: "locked$needs-claim" },
    include: { company: { select: { id: true, companyName: true } } },
  });

  if (unclaimed.length === 0) {
    console.log("No unclaimed accounts — every company already has a real owner.");
    return;
  }
  if (unclaimed.length > 1) {
    console.error(`Found ${unclaimed.length} unclaimed accounts; this script only handles one. Claim them in the database directly.`);
    process.exit(1);
  }

  const owner = unclaimed[0];
  const clash = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (clash && clash.id !== owner.id) {
    console.error(`${email} is already used by another account. Pick a different address.`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: owner.id },
    data: { email: email.toLowerCase(), passwordHash: await hashPassword(password) },
  });

  console.log(`Claimed "${owner.company?.companyName ?? "your company"}" — sign in at /login as ${email}.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
