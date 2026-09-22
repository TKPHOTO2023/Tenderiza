/**
 * Checks the platform SMTP settings (SMTP_HOST / SMTP_USER / SMTP_PASSWORD…)
 * without going near the app. Use it after adding the variables in Vercel,
 * so a broken mailbox shows up here rather than in a customer's failed
 * password reset.
 *
 *   npx tsx scripts/test-smtp.ts                  # verify the connection only
 *   npx tsx scripts/test-smtp.ts you@example.com  # also send a test email
 */
import { systemMailConfig, verifySystemMail, sendSystemMail } from "../src/lib/system-mail";

async function main() {
  const config = systemMailConfig();
  if (!config) {
    console.error("SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASSWORD (SMTP_PORT and SMTP_FROM optional).");
    process.exit(1);
  }

  console.log(`Host:   ${config.host}:${config.port} (${config.secure ? "implicit TLS" : "STARTTLS"})`);
  console.log(`User:   ${config.user}`);
  console.log(`From:   ${config.from}`);

  await verifySystemMail();
  console.log("\nConnection and login: OK");

  const to = process.argv[2];
  if (!to) {
    console.log("Pass an address to also send a test email.");
    return;
  }

  const { messageId } = await sendSystemMail({
    to,
    subject: "Tenderiza SMTP test",
    text: "If you're reading this, Tenderiza can send password reset emails from this mailbox.",
  });
  console.log(`Test email sent to ${to} (${messageId})`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\nFailed:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
