import type { Company, CompanyDocument, DocumentType, Draft, Tender } from "@prisma/client";
import type { ExtractedRequirements } from "@/lib/tender-extraction";
import type { HardCheck } from "@/lib/match-eligibility";

export interface BidStep {
  key: string;
  title: string;
  detail: string;
  state: "done" | "action" | "blocked" | "waiting";
  /** What the human should do next, when there's something to do. */
  action?: { label: string; href?: string };
}

function hasDocument(
  company: Company & { documents: (CompanyDocument & { documentType: DocumentType })[] },
  code: string
) {
  return company.documents.some((d) => d.documentType.code === code);
}

/**
 * Turns "here is a tender" into "here is exactly what you still have to do",
 * in the order a bid actually happens. Every step reports real state — no
 * step is marked done on the strength of an assumption.
 */
export function buildBidSteps(
  company: Company & { documents: (CompanyDocument & { documentType: DocumentType })[] },
  tender: Tender,
  draft: Draft | null,
  hardChecks: HardCheck[]
): BidStep[] {
  const extracted = tender.extractedRequirements as ExtractedRequirements | null;
  const steps: BidStep[] = [];

  // 1 — Do you qualify?
  const failed = hardChecks.filter((c) => c.status === "fail");
  const unclear = hardChecks.filter((c) => c.status === "needs_review");
  steps.push({
    key: "eligibility",
    title: "Check you qualify",
    detail: !extracted
      ? "Requirements haven't been read from this tender's documents yet."
      : failed.length > 0
        ? `You don't currently meet: ${failed.map((c) => c.requirement).join(", ")}.`
        : unclear.length > 0
          ? `Needs your check: ${unclear.map((c) => c.requirement).join(", ")}.`
          : "You meet every requirement stated in the documents.",
    state: !extracted ? "waiting" : failed.length > 0 ? "blocked" : unclear.length > 0 ? "action" : "done",
    action: !extracted ? { label: "Re-check this tender" } : undefined,
  });

  // 2 — Compulsory briefing, which disqualifies you outright if missed
  if (extracted?.briefingCompulsory) {
    steps.push({
      key: "briefing",
      title: "Attend the compulsory briefing",
      detail: draft?.briefingAttended
        ? "Marked as attended."
        : `Attendance is compulsory${extracted.briefingDate ? ` — ${extracted.briefingDate}` : ""}${
            extracted.briefingVenue ? ` at ${extracted.briefingVenue}` : ""
          }. Miss it and your bid is disqualified.`,
      state: draft?.briefingAttended ? "done" : "action",
    });
  }

  // 3 — Documents the tender itself asks for
  const CORE = [
    { code: "cipc_registration", label: "CIPC registration" },
    { code: "tax_clearance", label: "Tax clearance / TCS PIN" },
    { code: "bbbee_certificate", label: "B-BBEE certificate or affidavit" },
    { code: "csd_registration", label: "CSD registration" },
  ];
  const missing = CORE.filter((doc) => !hasDocument(company, doc.code));
  steps.push({
    key: "documents",
    title: "Gather the required documents",
    detail:
      missing.length === 0
        ? "Your core compliance documents are all on file."
        : `Still missing: ${missing.map((m) => m.label).join(", ")}.`,
    state: missing.length === 0 ? "done" : "action",
    action: missing.length > 0 ? { label: "Upload documents", href: "/dashboard/documents" } : undefined,
  });

  // 4 — Draft
  steps.push({
    key: "draft",
    title: "Generate your bid documents",
    detail: draft
      ? `Generated ${new Date(draft.generatedAt).toLocaleDateString("en-ZA")}${
          tender.procurementType === "RFQ" ? " — including your quotation with the pricing schedule." : "."
        }`
      : "Tenderiza will draft your quotation or proposal, pre-filled with your company details.",
    state: draft ? "done" : "action",
    action: draft ? undefined : { label: "Generate draft" },
  });

  // 5 — Price it. Always the human's call.
  steps.push({
    key: "pricing",
    title: "Fill in your pricing",
    detail: draft?.pricingConfirmed
      ? "You've confirmed your pricing was checked."
      : "Open the quotation, enter your own unit prices, then confirm. Tenderiza never prices a bid for you.",
    state: draft?.pricingConfirmed ? "done" : draft ? "action" : "waiting",
  });

  // 6 — Approve
  steps.push({
    key: "approve",
    title: "Review and approve",
    detail:
      draft && ["APPROVED", "SUBMITTED"].includes(draft.status)
        ? "Approved."
        : "Confirm the checklist and pricing to approve the bid for sending.",
    state:
      draft && ["APPROVED", "SUBMITTED"].includes(draft.status)
        ? "done"
        : draft?.pricingConfirmed
          ? "action"
          : "waiting",
  });

  // 7 — Send
  steps.push({
    key: "submit",
    title: "Send it",
    detail:
      draft?.status === "SUBMITTED"
        ? `Marked submitted${draft.submittedAt ? ` on ${new Date(draft.submittedAt).toLocaleDateString("en-ZA")}` : ""}.`
        : extracted?.submissionEmail
          ? `Download the bid email and send it to ${extracted.submissionEmail} from your own mailbox.`
          : "Download the bid pack and submit it the way this tender requires.",
    state: draft?.status === "SUBMITTED" ? "done" : draft?.status === "APPROVED" ? "action" : "waiting",
  });

  return steps;
}
