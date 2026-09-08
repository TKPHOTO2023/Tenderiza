import type { Company, CompanyDocument, DocumentType, Tender } from "@prisma/client";
import type { HardCheck } from "@/lib/match-eligibility";

export interface ChecklistItem {
  category: "document" | "requirement" | "declaration";
  label: string;
  status: "ok" | "attention" | "missing" | "needs_review" | "info";
  detail: string;
}

const CORE_DOCUMENT_LABELS: Record<string, string> = {
  cipc_registration: "CIPC Company Registration Certificate",
  bbbee_certificate: "B-BBEE Certificate / Sworn Affidavit",
  tax_clearance: "Tax Clearance Certificate / TCS PIN Letter",
  csd_registration: "CSD Registration Confirmation",
};

// Standard SBD declarations that always require the bidder's own signature —
// never auto-filled, always surfaced so nothing gets missed at submission time.
const STANDARD_DECLARATIONS = [
  { label: "SBD 4 — Declaration of Interest", detail: "Requires the bidder's signature declaring any conflicts of interest." },
  { label: "SBD 6.1 — Preference Points Claim (B-BBEE)", detail: "Requires the bidder to sign and submit supporting B-BBEE documentation." },
  { label: "SBD 8 — Declaration of Bidder's Past Supply Chain Practices", detail: "Requires the bidder's signature attesting to past conduct." },
  { label: "SBD 9 — Certificate of Independent Bid Determination", detail: "Requires the bidder's signature confirming the bid was independently determined." },
];

/**
 * Builds a per-tender compliance checklist: Phase 1 document status against
 * this tender's closing date, Phase 3 hard-check results (if a match has
 * been computed), and the standard declarations that always need the
 * bidder's own sign-off. Never silently drops anything — an unclear item
 * stays "needs_review", it doesn't disappear.
 */
export function buildComplianceChecklist(
  company: Company & { documents: (CompanyDocument & { documentType: DocumentType })[] },
  tender: Tender,
  hardChecks: HardCheck[]
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  for (const code of Object.keys(CORE_DOCUMENT_LABELS)) {
    const doc = company.documents.find((d) => d.documentType.code === code);
    if (!doc) {
      items.push({
        category: "document",
        label: CORE_DOCUMENT_LABELS[code],
        status: "missing",
        detail: "No document of this type uploaded to your profile — add it before submitting.",
      });
      continue;
    }

    if (doc.expiryDate && tender.closingDate && doc.expiryDate < tender.closingDate) {
      const alreadyExpired = doc.expiryDate < new Date();
      items.push({
        category: "document",
        label: doc.documentType.label,
        status: "attention",
        detail: alreadyExpired
          ? `Already expired on ${doc.expiryDate.toLocaleDateString("en-ZA")} — renew before submitting.`
          : `Expires ${doc.expiryDate.toLocaleDateString("en-ZA")}, before this tender's closing date — renew before submitting.`,
      });
    } else {
      items.push({
        category: "document",
        label: doc.documentType.label,
        status: "ok",
        detail: doc.expiryDate ? `Valid until ${doc.expiryDate.toLocaleDateString("en-ZA")}.` : "On file.",
      });
    }
  }

  for (const check of hardChecks) {
    items.push({
      category: "requirement",
      label: check.requirement,
      status: check.status === "pass" ? "ok" : check.status === "fail" ? "attention" : check.status === "needs_review" ? "needs_review" : "info",
      detail: check.detail,
    });
  }

  for (const decl of STANDARD_DECLARATIONS) {
    items.push({ category: "declaration", label: decl.label, status: "needs_review", detail: decl.detail });
  }

  return items;
}
