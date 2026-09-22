/**
 * Gets a deployment ready to sign in to, in one step.
 *
 * Applies any pending migrations, then sets up an account with a known
 * password and prints the credentials. Intended for your own demo or test
 * deployment — it needs database credentials, so nobody else can run it.
 *
 *   npx tsx scripts/demo-setup.ts you@yourdomain.co.za
 *   npx tsx scripts/demo-setup.ts you@yourdomain.co.za "a-password-you-pick"
 *
 * With no password one is generated and printed. The profile is left empty
 * so it can be filled in through onboarding.
 */
import { execFileSync } from "child_process";
import { randomBytes } from "crypto";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

const PLACEHOLDER = "locked$needs-claim";

/** Readable and still strong — this gets typed by hand at a demo. */
function generatePassword() {
  return `tz-${randomBytes(6).toString("hex")}`;
}

async function main() {
  const [rawEmail, given] = process.argv.slice(2);
  if (!rawEmail) {
    console.error("Usage: npx tsx scripts/demo-setup.ts <email> [password]");
    process.exit(1);
  }
  const email = rawEmail.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`"${rawEmail}" doesn't look like an email address.`);
    process.exit(1);
  }
  if (given && given.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  const password = given || generatePassword();

  console.log("Applying any pending migrations…");
  // Inherits DATABASE_URL, so this hits whichever database the caller pointed at.
  execFileSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit" });

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { company: { select: { companyName: true } } },
  });
  const passwordHash = await hashPassword(password);

  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
    console.log(`\nReset the password on the existing account${existing.company?.companyName ? ` (${existing.company.companyName})` : ""}.`);
  } else {
    const unclaimed = await prisma.user.findMany({
      where: { passwordHash: PLACEHOLDER },
      include: { company: { select: { companyName: true } } },
    });

    if (unclaimed.length === 1) {
      // Keeps the company, documents and drafts already attached to it.
      await prisma.user.update({ where: { id: unclaimed[0].id }, data: { email, passwordHash } });
      console.log(`\nClaimed the existing company "${unclaimed[0].company?.companyName ?? "unnamed"}".`);
    } else {
      if (unclaimed.length > 1) {
        console.log(`\n${unclaimed.length} unclaimed companies exist, so none was assumed.`);
      }
      await prisma.user.create({
        data: { email, passwordHash, company: { create: { contactEmail: email, subscription: { create: {} } } } },
      });
      console.log("\nCreated a new account with an empty profile.");
    }
  }

  console.log("\n  Email:    " + email);
  console.log("  Password: " + password);
  console.log("\nSign in at /login, then fill in your details under Profile and Brand.");
  if (!given) console.log("Change the password from the app once you're in.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\nFailed:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
