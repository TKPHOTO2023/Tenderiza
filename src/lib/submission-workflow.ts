import { DraftStatus, SubmissionMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Phase 5: the only place a Draft's review/submission status is allowed to
 * change. Nothing here ever fires on its own — every transition is the
 * direct result of one explicit API call triggered by a human clicking
 * something, in the moment, for this one draft. There is deliberately no
 * "approve all" / "submit all" bulk path and no scheduled job that advances
 * a status.
 *
 * Every transition is written to `draft_status_logs` in the same
 * transaction as the status change, so the audit trail can never drift from
 * what actually happened.
 */

const ALLOWED_TRANSITIONS: Record<DraftStatus, DraftStatus[]> = {
  DRAFT: [DraftStatus.UNDER_REVIEW, DraftStatus.NOT_SUBMITTING],
  UNDER_REVIEW: [DraftStatus.APPROVED, DraftStatus.NOT_SUBMITTING, DraftStatus.DRAFT],
  APPROVED: [DraftStatus.SUBMITTED, DraftStatus.NOT_SUBMITTING, DraftStatus.UNDER_REVIEW],
  NOT_SUBMITTING: [DraftStatus.UNDER_REVIEW],
  SUBMITTED: [], // terminal — a real-world submission is never silently undone
};

export class WorkflowError extends Error {}

async function loadDraft(draftId: string) {
  const draft = await prisma.draft.findUnique({ where: { id: draftId } });
  if (!draft) throw new WorkflowError("Draft not found");
  return draft;
}

function assertTransition(from: DraftStatus, to: DraftStatus) {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new WorkflowError(`Can't move a draft from ${from} to ${to}`);
  }
}

/** Human clicks "Start review" — moves a fresh draft into active review. */
export async function startReview(draftId: string) {
  const draft = await loadDraft(draftId);
  assertTransition(draft.status, DraftStatus.UNDER_REVIEW);
  return applyTransition(draftId, draft.status, DraftStatus.UNDER_REVIEW, {
    reviewStartedAt: new Date(),
  });
}

/**
 * Human explicitly confirms they checked final pricing themselves — the app
 * never calculates or suggests a number. Recorded independently of approval
 * so it's visible on the review dashboard even before the human is ready to
 * approve.
 */
export async function confirmPricing(draftId: string, confirmed: boolean, notes?: string) {
  await loadDraft(draftId);
  return prisma.draft.update({
    where: { id: draftId },
    data: {
      pricingConfirmed: confirmed,
      pricingConfirmedAt: confirmed ? new Date() : null,
      pricingNotes: notes ?? undefined,
    },
  });
}

/** Human marks the tender's compulsory briefing as attended (or un-marks it). */
export async function setBriefingAttended(draftId: string, attended: boolean) {
  await loadDraft(draftId);
  return prisma.draft.update({ where: { id: draftId }, data: { briefingAttended: attended } });
}

interface ApproveInput {
  pricingConfirmed: boolean; // must be true, and re-confirmed at the moment of approval — not just inherited from an earlier click
  checklistConfirmed: boolean; // human explicitly states they reviewed the compliance checklist for this draft, right now
  note?: string;
}

/**
 * The one safety-critical gate in the whole app: a draft only becomes
 * APPROVED when a human explicitly confirms, in this same request, that
 * they reviewed both the compliance checklist and the final pricing.
 * Approved still means nothing has been submitted anywhere.
 */
export async function approveDraft(draftId: string, input: ApproveInput) {
  if (!input.pricingConfirmed || !input.checklistConfirmed) {
    throw new WorkflowError("Approval requires confirming both the checklist and pricing were reviewed.");
  }
  const draft = await loadDraft(draftId);
  assertTransition(draft.status, DraftStatus.APPROVED);
  const now = new Date();
  return applyTransition(draftId, draft.status, DraftStatus.APPROVED, {
    approvedAt: now,
    pricingConfirmed: true,
    pricingConfirmedAt: now,
  }, input.note);
}

interface SubmitInput {
  method: SubmissionMethod; // always MANUAL today — no portal integration has been confirmed/built
  notes?: string;
}

/**
 * Human confirms they actually submitted this bid, for real, outside the
 * app (a portal upload, a physical bid box, etc). This never happens on its
 * own — there is no automatic or scheduled submission path in Tenderiza.
 */
export async function submitDraft(draftId: string, input: SubmitInput) {
  const draft = await loadDraft(draftId);
  assertTransition(draft.status, DraftStatus.SUBMITTED);
  return applyTransition(
    draftId,
    draft.status,
    DraftStatus.SUBMITTED,
    { submittedAt: new Date(), submissionMethod: input.method, submissionNotes: input.notes ?? undefined },
    input.notes
  );
}

/** Human decides not to pursue this tender after all, at any stage before submission. */
export async function markNotSubmitting(draftId: string, reason?: string) {
  const draft = await loadDraft(draftId);
  assertTransition(draft.status, DraftStatus.NOT_SUBMITTING);
  return applyTransition(draftId, draft.status, DraftStatus.NOT_SUBMITTING, { notSubmittingReason: reason ?? undefined }, reason);
}

/** Reopens a not-submitting or approved draft back into active review. */
export async function reopenForReview(draftId: string) {
  const draft = await loadDraft(draftId);
  assertTransition(draft.status, DraftStatus.UNDER_REVIEW);
  return applyTransition(draftId, draft.status, DraftStatus.UNDER_REVIEW, { reviewStartedAt: new Date() });
}

/** Sends an approved-but-not-yet-reviewed draft back a step, e.g. after spotting an issue. */
export async function revertToReview(draftId: string) {
  const draft = await loadDraft(draftId);
  assertTransition(draft.status, DraftStatus.UNDER_REVIEW);
  return applyTransition(draftId, draft.status, DraftStatus.UNDER_REVIEW, { approvedAt: null });
}

async function applyTransition(
  draftId: string,
  fromStatus: DraftStatus,
  toStatus: DraftStatus,
  data: Record<string, unknown>,
  note?: string
) {
  const [, draft] = await prisma.$transaction([
    prisma.draftStatusLog.create({ data: { draftId, fromStatus, toStatus, note } }),
    prisma.draft.update({ where: { id: draftId }, data: { status: toStatus, ...data } }),
  ]);
  return draft;
}
