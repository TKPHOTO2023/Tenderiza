import { prisma } from "@/lib/prisma";
import { daysUntil } from "@/lib/format";
import type { ExtractedRequirements } from "@/lib/tender-extraction";

export interface Reminder {
  id: string;
  type: "submission_deadline" | "briefing" | "document_expiry";
  severity: "urgent" | "warning" | "info";
  message: string;
  tenderId: string;
  tenderTitle: string;
  draftId: string | null;
  daysRemaining: number | null;
}

const DEADLINE_HORIZON_DAYS = 14;
const BRIEFING_HORIZON_DAYS = 14;

function severityFor(days: number | null): "urgent" | "warning" | "info" {
  if (days === null) return "warning";
  if (days <= 3) return "urgent";
  if (days <= 7) return "warning";
  return "info";
}

/** Best-effort parse of a free-text briefing date pulled from a tender PDF — never throws. */
function parseLooseDate(text: string | null): Date | null {
  if (!text) return null;
  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Computes every in-app reminder for a company, purely by reading current
 * state — nothing here writes anything or triggers any action on its own.
 * Three kinds, per the Phase 5 spec: approved-but-unsubmitted drafts nearing
 * their tender's closing date, compulsory briefings coming up that haven't
 * been marked attended, and Phase 1 documents that will expire before a
 * tender the company has actually matched against closes.
 */
export async function getReminders(companyId: string): Promise<Reminder[]> {
  const reminders: Reminder[] = [];
  const now = new Date();

  const approvedDrafts = await prisma.draft.findMany({
    where: { companyId, status: "APPROVED" },
    include: { tender: true },
  });
  for (const draft of approvedDrafts) {
    const days = daysUntil(draft.tender.closingDate);
    if (days !== null && days <= DEADLINE_HORIZON_DAYS) {
      reminders.push({
        id: `deadline-${draft.id}`,
        type: "submission_deadline",
        severity: severityFor(days),
        message: `Approved but not yet marked submitted — ${
          days < 0 ? `closed ${Math.abs(days)} day(s) ago` : `closes in ${days} day(s)`
        }.`,
        tenderId: draft.tenderId,
        tenderTitle: draft.tender.title || "Untitled tender",
        draftId: draft.id,
        daysRemaining: days,
      });
    }
  }

  const activeDrafts = await prisma.draft.findMany({
    where: { companyId, status: { in: ["DRAFT", "UNDER_REVIEW", "APPROVED"] }, briefingAttended: false },
    include: { tender: true },
  });
  for (const draft of activeDrafts) {
    const extracted = draft.tender.extractedRequirements as ExtractedRequirements | null;
    if (!extracted?.briefingCompulsory) continue;

    const briefingDate = parseLooseDate(extracted.briefingDate);
    const days = briefingDate ? daysUntil(briefingDate) : null;
    if (days !== null && days > BRIEFING_HORIZON_DAYS) continue;

    reminders.push({
      id: `briefing-${draft.id}`,
      type: "briefing",
      severity: days !== null ? severityFor(days) : "warning",
      message:
        days !== null
          ? days < 0
            ? `Compulsory briefing was ${Math.abs(days)} day(s) ago (${extracted.briefingDate}) and isn't marked attended.`
            : `Compulsory briefing in ${days} day(s) (${extracted.briefingDate}${extracted.briefingVenue ? ` at ${extracted.briefingVenue}` : ""}) — not yet marked attended.`
          : `Compulsory briefing required (date: "${extracted.briefingDate ?? "not stated"}") — not yet marked attended.`,
      tenderId: draft.tenderId,
      tenderTitle: draft.tender.title || "Untitled tender",
      draftId: draft.id,
      daysRemaining: days,
    });
  }

  const [company, matches] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, include: { documents: { include: { documentType: true } } } }),
    prisma.match.findMany({
      where: { companyId, tender: { closingDate: { gte: now } } },
      include: { tender: true },
    }),
  ]);

  if (company) {
    for (const match of matches) {
      const closingDate = match.tender.closingDate;
      if (!closingDate) continue;
      for (const doc of company.documents) {
        if (!doc.expiryDate || doc.expiryDate >= closingDate) continue;
        const days = daysUntil(doc.expiryDate);
        reminders.push({
          id: `expiry-${doc.id}-${match.tenderId}`,
          type: "document_expiry",
          severity: severityFor(days),
          message: `${doc.documentType.label} ${
            days !== null && days < 0 ? `expired ${Math.abs(days)} day(s) ago` : `expires in ${days} day(s)`
          } — before "${match.tender.title || "this tender"}" closes on ${closingDate.toLocaleDateString("en-ZA")}.`,
          tenderId: match.tenderId,
          tenderTitle: match.tender.title || "Untitled tender",
          draftId: null,
          daysRemaining: days,
        });
      }
    }
  }

  const rank = { urgent: 0, warning: 1, info: 2 };
  return reminders.sort((a, b) => rank[a.severity] - rank[b.severity] || (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999));
}
