import { NextRequest, NextResponse } from "next/server";
import { MailProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentCompany } from "@/lib/current-company";
import { encryptSecret, hasEncryptionKey } from "@/lib/mail-crypto";
import { verifyMailAccount, PROVIDER_PRESETS } from "@/lib/mail-sender";

/** The password is never returned — only whether a mailbox is connected and working. */
export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const account = await prisma.mailAccount.findUnique({ where: { companyId: company.id } });

  return NextResponse.json({
    connected: Boolean(account),
    encryptionConfigured: hasEncryptionKey(),
    presets: PROVIDER_PRESETS,
    account: account
      ? {
          provider: account.provider,
          fromName: account.fromName,
          fromAddress: account.fromAddress,
          host: account.host,
          port: account.port,
          username: account.username,
          verifiedAt: account.verifiedAt,
          lastError: account.lastError,
        }
      : null,
  });
}

export async function POST(req: NextRequest) {
  if (!hasEncryptionKey()) {
    return NextResponse.json(
      { error: "MAIL_ENCRYPTION_KEY isn't set on the server, so mailbox passwords can't be stored securely." },
      { status: 503 }
    );
  }

  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await req.json();

  const provider = body.provider as MailProvider;
  if (!Object.values(MailProvider).includes(provider)) {
    return NextResponse.json({ error: "Choose a mail provider." }, { status: 400 });
  }

  const preset = PROVIDER_PRESETS[provider];
  const host = (typeof body.host === "string" && body.host.trim()) || preset.host;
  const fromAddress = typeof body.fromAddress === "string" ? body.fromAddress.trim() : "";
  const username = (typeof body.username === "string" && body.username.trim()) || fromAddress;
  const password = typeof body.password === "string" ? body.password : "";

  if (!host) return NextResponse.json({ error: "Enter your outgoing mail (SMTP) server." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) {
    return NextResponse.json({ error: "Enter the email address bids should come from." }, { status: 400 });
  }
  if (!password) return NextResponse.json({ error: "Enter your mailbox password or app password." }, { status: 400 });

  const port = Number(body.port) || preset.port;
  const data = {
    provider,
    fromName: typeof body.fromName === "string" && body.fromName.trim() ? body.fromName.trim() : company.companyName,
    fromAddress,
    host,
    port,
    secure: typeof body.secure === "boolean" ? body.secure : port === 465,
    username,
    encryptedPassword: encryptSecret(password),
  };

  const account = await prisma.mailAccount.upsert({
    where: { companyId: company.id },
    create: { companyId: company.id, ...data },
    update: data,
  });

  // Prove the credentials actually work before the user relies on them.
  try {
    await verifyMailAccount(account);
    await prisma.mailAccount.update({
      where: { id: account.id },
      data: { verifiedAt: new Date(), lastError: null },
    });
    return NextResponse.json({ connected: true, verified: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Couldn't connect to that mailbox";
    await prisma.mailAccount.update({ where: { id: account.id }, data: { verifiedAt: null, lastError: message } });
    return NextResponse.json({ connected: true, verified: false, error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  await prisma.mailAccount.deleteMany({ where: { companyId: company.id } });
  return NextResponse.json({ connected: false });
}
