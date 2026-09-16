import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentCompany } from "@/lib/current-company";
import { assembleBidEmail, renderEml } from "@/lib/bid-pack";

export const maxDuration = 60;

async function load(id: string) {
  const company = await getOrCreateCurrentCompany();
  const [full, draft] = await Promise.all([
    prisma.company.findUnique({
      where: { id: company.id },
      include: { documents: { include: { documentType: true } } },
    }),
    prisma.draft.findUnique({ where: { id }, include: { tender: true } }),
  ]);
  if (!full || !draft || draft.companyId !== company.id) return null;
  return { company: full, draft, tender: draft.tender };
}

/** Preview: everything the bid email will contain, without the file bytes. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await load(id);
  if (!loaded) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const email = await assembleBidEmail(loaded.company, loaded.tender, loaded.draft);

  return NextResponse.json({
    to: email.to,
    subject: email.subject,
    body: email.body,
    submissionMethod: email.submissionMethod,
    submissionInstructions: email.submissionInstructions,
    missingAttachments: email.missingAttachments,
    attachments: email.attachments.map((a) => ({
      filename: a.filename,
      label: a.label,
      source: a.source,
      sizeBytes: a.buffer.byteLength,
    })),
  });
}

/**
 * Downloads the bid as an .eml draft. The user opens it in their own mail
 * client and presses send, so the bid goes out from their real address —
 * Tenderiza never sends anything itself.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await load(id);
  if (!loaded) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const email = await assembleBidEmail(loaded.company, loaded.tender, loaded.draft);

  // The human may have edited the recipient, subject or body in the composer.
  if (typeof body.to === "string") email.to = body.to.trim() || null;
  if (typeof body.subject === "string" && body.subject.trim()) email.subject = body.subject;
  if (typeof body.body === "string" && body.body.trim()) email.body = body.body;

  const eml = renderEml(
    email,
    loaded.company.companyName ?? "Bidder",
    loaded.company.contactEmail ?? null
  );

  const reference = loaded.tender.ocid.split("-").slice(-1)[0] ?? "bid";
  return new NextResponse(new Uint8Array(eml), {
    headers: {
      "Content-Type": "message/rfc822",
      "Content-Disposition": `attachment; filename="bid-${reference}.eml"`,
    },
  });
}
