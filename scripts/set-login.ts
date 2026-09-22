/**
 * Sets a working sign-in on this database, whatever state it's in.
 *
 * claim-account.ts only touches the backfill placeholder and
 * reset-password.ts only touches an account that already exists, which
 * means knowing which case you're in before you can get in. This covers
 * all three:
 *
 *   - the email already has an account  -> its password is replaced
 *   - an unclaimed backfilled owner exists -> it's renamed to this email,
 *     keeping the company, documents and drafts already attached to it
 *   - neither                           -> a fresh account and company
 *
 * Needs database credentials, so only whoever runs the deployment can use
 * it. For customers, /forgot-password is the way in.
 *
 *   npx tsx scripts/set-login.ts you@yourdomain.co.za "your-password"
 */
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

const PLACEHOLDER = "locked$needs-claim";

async function main() {
  const [rawEmail, password] = process.argv.slice(2);

  if (!rawEmail || !password) {
    console.error('Usage: npx tsx scripts/set-login.ts <email> "<password>"');
    process.exit(1);
  }
  const email = rawEmail.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`"${rawEmail}" doesn't look like an email address.`);
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { company: { select: { companyName: true } } },
  });

  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
    const company = existing.company?.companyName;
    console.log(`Password set on the existing account${company ? ` for ${company}` : ""}.`);
  } else {
    const unclaimed = await prisma.user.findMany({
      where: { passwordHash: PLACEHOLDER },
      include: { company: { select: { companyName: true } } },
    });

    if (unclaimed.length === 1) {
      // Renaming keeps the company, documents and drafts already attached.
      await prisma.user.update({ where: { id: unclaimed[0].id }, data: { email, passwordHash } });
      console.log(`Claimed the existing company "${unclaimed[0].company?.companyName ?? "unnamed"}" for ${email}.`);
    } else {
      if (unclaimed.length > 1) {
        console.log(`${unclaimed.length} unclaimed companies exist, so none was assumed — creating a new account instead.`);
      }
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          company: { create: { contactEmail: email, subscription: { create: {} } } },
        },
      });
      console.log(`Created a new account and empty company for ${email}.`);
    }
  }

  console.log(`\nSign in at /login as ${email}.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
