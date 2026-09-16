import nodemailer from "nodemailer";
import type { MailAccount, MailProvider } from "@prisma/client";
import { decryptSecret } from "@/lib/mail-crypto";
import type { BidEmail } from "@/lib/bid-pack";

/**
 * Known SMTP endpoints, so the user picks their provider rather than hunting
 * for host names. "Webmail" covers anything else — cPanel, Zoho, Afrihost,
 * a company mail server — where the host has to be entered by hand.
 */
export const PROVIDER_PRESETS: Record<MailProvider, { label: string; host: string; port: number; secure: boolean; help: string }> = {
  GMAIL: {
    label: "Gmail / Google Workspace",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    help: "Turn on 2-step verification, then create an App Password at myaccount.google.com/apppasswords and paste it here. Your normal Gmail password won't work.",
  },
  OUTLOOK: {
    label: "Outlook / Microsoft 365",
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    help: "Use your email address and password. If your organisation has disabled SMTP AUTH (Microsoft now does this by default on many tenants), ask your admin to enable it for your mailbox, or use the download option instead.",
  },
  SMTP: {
    label: "Other webmail / hosting provider",
    host: "",
    port: 587,
    secure: false,
    help: "Your host will list these as 'outgoing mail (SMTP)' settings — usually something like mail.yourdomain.co.za on port 587.",
  },
};

function transportFor(account: MailAccount) {
  return nodemailer.createTransport({
    host: account.host,
    port: account.port,
    secure: account.secure,
    auth: { user: account.username, pass: decryptSecret(account.encryptedPassword) },
  });
}

/** Proves the credentials work before the user relies on them for a real bid. */
export async function verifyMailAccount(account: MailAccount): Promise<void> {
  await transportFor(account).verify();
}

/**
 * Sends the assembled bid from the company's own connected mailbox. Only ever
 * called from an explicit, per-bid human click — there is no scheduled or
 * bulk sending path anywhere in this codebase.
 */
export async function sendBidEmail(account: MailAccount, email: BidEmail): Promise<{ messageId: string }> {
  if (!email.to) throw new Error("No recipient address — check the tender documents and enter it before sending.");

  const info = await transportFor(account).sendMail({
    from: account.fromName ? `"${account.fromName}" <${account.fromAddress}>` : account.fromAddress,
    to: email.to,
    subject: email.subject,
    text: email.body,
    attachments: email.attachments.map((a) => ({
      filename: a.filename,
      content: a.buffer,
      contentType: a.contentType,
    })),
  });

  return { messageId: info.messageId };
}
