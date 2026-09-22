import nodemailer from "nodemailer";

/**
 * The platform's own mailbox — password resets and other transactional mail
 * that comes from Tenderiza itself.
 *
 * Deliberately separate from the per-company mailbox in mail-sender.ts: that
 * one sends bids as the customer, from credentials they connected and that
 * live encrypted in the database. This one is ours, configured only from
 * environment variables, so a customer's stored credentials can never be
 * used to send mail that appears to come from the platform.
 *
 * Any SMTP host works; it's configured against a hostdigi mailbox.
 */
export interface SystemMailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export function systemMailConfig(): SystemMailConfig | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return null;

  const port = Number(SMTP_PORT) || 587;
  return {
    host: SMTP_HOST,
    port,
    // Port 465 is implicit TLS; 587 upgrades with STARTTLS. Override only if
    // the host is unusual.
    secure: SMTP_SECURE ? SMTP_SECURE === "true" : port === 465,
    user: SMTP_USER,
    password: SMTP_PASSWORD,
    from: SMTP_FROM || SMTP_USER,
  };
}

function transport(config: SystemMailConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  });
}

/** Proves the SMTP credentials work, without sending anything. */
export async function verifySystemMail(): Promise<void> {
  const config = systemMailConfig();
  if (!config) throw new Error("SMTP is not configured — set SMTP_HOST, SMTP_USER and SMTP_PASSWORD.");
  await transport(config).verify();
}

export async function sendSystemMail(message: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ messageId: string }> {
  const config = systemMailConfig();
  if (!config) throw new Error("SMTP is not configured — set SMTP_HOST, SMTP_USER and SMTP_PASSWORD.");

  const info = await transport(config).sendMail({
    from: `"Tenderiza" <${config.from}>`,
    to: message.to,
    subject: message.subject,
    text: message.text,
  });
  return { messageId: info.messageId };
}
