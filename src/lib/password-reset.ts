import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendSystemMail } from "@/lib/system-mail";

const TOKEN_MINUTES = 60;

/** Only the hash is stored, so a leaked row can't be replayed as a link. */
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function resetUrl(token: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/reset-password?token=${token}`;
}

/**
 * Emails a reset link if the address has an account.
 *
 * Says nothing about whether it did: the caller always reports the same
 * thing to the browser, so this can't be used to find out who has an
 * account here.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return;

  // Outstanding links for this user stop working, so a reset request always
  // leaves exactly one live link.
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_MINUTES * 60_000),
    },
  });

  await sendSystemMail({
    to: user.email,
    subject: "Reset your Tenderiza password",
    text: [
      `Someone asked to reset the password for ${user.email} on Tenderiza.`,
      "",
      "Open this link to choose a new one:",
      resetUrl(token),
      "",
      `The link works once and expires in ${TOKEN_MINUTES} minutes.`,
      "",
      "If this wasn't you, ignore this email — your password stays as it is.",
    ].join("\n"),
  });
}

export type ResetOutcome = { ok: true } | { ok: false; reason: string };

/** Consumes a reset link and sets the new password. */
export async function completePasswordReset(token: string, password: string): Promise<ResetOutcome> {
  if (password.length < 8) return { ok: false, reason: "Choose a password of at least 8 characters." };

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  const expired = "That reset link has expired or has already been used. Request a new one.";
  if (!record || record.usedAt || record.expiresAt < new Date()) return { ok: false, reason: expired };

  await prisma.$transaction([
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(password) } }),
    // Whoever reset the password may be locking someone else out on purpose,
    // so every existing session for this user is dropped.
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { ok: true };
}
