import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentCompany } from "@/lib/current-company";
import { assembleBidEmail } from "@/lib/bid-pack";
import { sendBidEmail } from "@/lib/mail-sender";

export const maxDuration = 60;

/**
 * Sends the bid from the company's own connected mailbox.
 *
 * This only ever runs from one explicit click on one specific bid. There is
 * no scheduled sender, no bulk send, and no automatic retry — a resend is
 * another deliberate click. The draft must already be APPROVED, so a human
 * has confirmed the checklist and the pricing before anything leaves.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getOrCreateCurrentCompany();

  const [company, draft, account] = await Promise.all([
    prisma.company.findUnique({
      where: { id: current.id },
      include: { documents: { include: { documentType: true } } },
    }),
    prisma.draft.findUnique({ where: { id }, include: { tender: true } }),
    prisma.mailAccount.findUnique({ where: { companyId: current.id } }),
  ]);

  if (!company || !draft || draft.companyId !== current.id) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
  if (!account) {
    return NextResponse.json(
      { error: "No mailbox connected. Connect one under Brand → Sending mailbox first." },
      { status: 400 }
    );
  }
  if (draft.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Approve this bid first — that's where you confirm the checklist and your pricing." },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = await assembleBidEmail(company, draft.tender, draft);
  if (typeof body.to === "string" && body.to.trim()) email.to = body.to.trim();
  if (typeof body.subject === "string" && body.subject.trim()) email.subject = body.subject;
  if (typeof body.body === "string" && body.body.trim()) email.body = body.body;

  if (!email.to) {
    return NextResponse.json({ error: "Enter the address this bid must go to." }, { status: 400 });
  }

  try {
    const { messageId } = await sendBidEmail(account, email);

    const note = `Emailed to ${email.to} from ${account.fromAddress} (${email.attachments.length} attachment${
      email.attachments.length === 1 ? "" : "s"
    })`;

    const [, updated] = await prisma.$transaction([
      prisma.draftStatusLog.create({
        data: { draftId: draft.id, fromStatus: draft.status, toStatus: "SUBMITTED", note },
      }),
      prisma.draft.update({
        where: { id: draft.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          submissionMethod: "ELECTRONIC",
          submissionNotes: `${note}. Message ID ${messageId}`,
        },
      }),
    ]);

    return NextResponse.json({ sent: true, messageId, draft: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sending failed";
    await prisma.mailAccount.update({ where: { id: account.id }, data: { lastError: message } });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
