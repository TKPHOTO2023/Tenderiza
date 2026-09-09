import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentCompany } from "@/lib/current-company";
import {
  WorkflowError,
  approveDraft,
  confirmPricing,
  markNotSubmitting,
  reopenForReview,
  revertToReview,
  setBriefingAttended,
  startReview,
  submitDraft,
} from "@/lib/submission-workflow";
import { SubmissionMethod } from "@prisma/client";

/**
 * Every Phase 5 status/pricing/briefing change goes through this one route,
 * one explicit action per request, always for one specific draft the human
 * is looking at right now. There is no bulk or scheduled variant of any of
 * these actions.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getOrCreateCurrentCompany();

  const draft = await prisma.draft.findUnique({ where: { id } });
  if (!draft || draft.companyId !== company.id) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const body = await req.json();
  const action = body.action as string | undefined;

  try {
    switch (action) {
      case "start_review":
        return NextResponse.json(await startReview(id));

      case "confirm_pricing":
        return NextResponse.json(
          await confirmPricing(id, Boolean(body.confirmed), typeof body.notes === "string" ? body.notes : undefined)
        );

      case "set_briefing_attended":
        return NextResponse.json(await setBriefingAttended(id, Boolean(body.attended)));

      case "approve":
        return NextResponse.json(
          await approveDraft(id, {
            pricingConfirmed: Boolean(body.pricingConfirmed),
            checklistConfirmed: Boolean(body.checklistConfirmed),
            note: typeof body.note === "string" ? body.note : undefined,
          })
        );

      case "submit": {
        const method = body.method === "ELECTRONIC" ? SubmissionMethod.ELECTRONIC : SubmissionMethod.MANUAL;
        if (method === SubmissionMethod.ELECTRONIC) {
          return NextResponse.json(
            { error: "No electronic submission integration has been confirmed or built yet — use manual confirmation." },
            { status: 400 }
          );
        }
        return NextResponse.json(
          await submitDraft(id, { method, notes: typeof body.notes === "string" ? body.notes : undefined })
        );
      }

      case "not_submitting":
        return NextResponse.json(await markNotSubmitting(id, typeof body.reason === "string" ? body.reason : undefined));

      case "reopen_for_review":
        return NextResponse.json(await reopenForReview(id));

      case "revert_to_review":
        return NextResponse.json(await revertToReview(id));

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof WorkflowError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
