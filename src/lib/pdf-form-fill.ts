import { PDFDocument, PDFFont, PDFTextField, StandardFonts, rgb, degrees } from "pdf-lib";
import type { Company } from "@prisma/client";
import { BBBEE_LEVELS } from "@/lib/constants";

// Only ever fills fields we can map to objective, factual company data we
// already hold and trust. Never touches checkboxes/radio/dropdown fields —
// those are exactly where yes/no compliance attestations and declarations
// live, and this app never guesses at those.
interface FieldMatcher {
  keywords: string[];
  value: (company: Company) => string | null;
}

function bbbeeLabel(company: Company): string | null {
  if (!company.bbbeeLevel) return null;
  return BBBEE_LEVELS.find((l) => l.value === company.bbbeeLevel)?.label ?? company.bbbeeLevel;
}

const FIELD_MATCHERS: FieldMatcher[] = [
  { keywords: ["company name", "name of bidder", "bidder name", "supplier name", "trading name"], value: (c) => c.tradingName || c.companyName },
  { keywords: ["registration number", "company registration", "cipc"], value: (c) => c.registrationNumber },
  { keywords: ["vat number", "vat reg"], value: (c) => c.vatNumber },
  { keywords: ["postal address", "physical address", "business address"], value: (c) => [c.addressLine1, c.addressLine2, c.city, c.postalCode].filter(Boolean).join(", ") || null },
  { keywords: ["telephone", "contact number", "tel no", "cell number"], value: (c) => c.contactPhone },
  { keywords: ["email"], value: (c) => c.contactEmail },
  { keywords: ["contact person", "contact name"], value: (c) => c.contactPersonName },
  { keywords: ["b-bbee", "bbbee", "b bbee"], value: bbbeeLabel },
  { keywords: ["cidb"], value: (c) => (c.cidbGrade ? `Grade ${c.cidbGrade}${c.cidbClassOfWork ? ` (${c.cidbClassOfWork})` : ""}` : null) },
  { keywords: ["tax compliance", "tax clearance", "tcs pin"], value: (c) => c.taxComplianceStatusPin },
  { keywords: ["csd", "central supplier database"], value: (c) => c.csdRegistrationNumber },
];

const DECLARATION_KEYWORDS = ["declar", "signature", "certif", "sworn", "attest", "undertak", "acknowledg"];

function matchField(fieldName: string): FieldMatcher | null {
  const lower = fieldName.toLowerCase();
  return FIELD_MATCHERS.find((m) => m.keywords.some((kw) => lower.includes(kw))) ?? null;
}

function isDeclarationField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return DECLARATION_KEYWORDS.some((kw) => lower.includes(kw));
}

function drawDraftWatermark(pdfDoc: PDFDocument, font: PDFFont) {
  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    page.drawText("DRAFT — REQUIRES HUMAN REVIEW — NOT FOR SUBMISSION", {
      x: width / 2 - 260,
      y: height / 2,
      size: 22,
      font,
      color: rgb(0.85, 0.15, 0.15),
      rotate: degrees(35),
      opacity: 0.35,
    });
    page.drawText("DRAFT — Tenderiza generated", {
      x: 20,
      y: height - 20,
      size: 8,
      font,
      color: rgb(0.6, 0.1, 0.1),
    });
  }
}

export interface FormFillResult {
  buffer: Buffer;
  fieldsFilled: number;
  declarationFieldsFlagged: number;
}

/**
 * Attempts to fill a tender-supplied PDF's AcroForm fields with objective
 * company data. Returns null if the PDF has no usable text-field form at
 * all (flat/scanned form, or a form with only checkbox/radio/dropdown
 * fields) — callers should fall back to generating an equivalent document
 * in that case, per Phase 4's spec.
 */
export async function fillTenderPdfForm(pdfBytes: Buffer, company: Company): Promise<FormFillResult | null> {
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  } catch {
    return null;
  }

  const form = pdfDoc.getForm();
  const fields = form.getFields();
  if (fields.length === 0) return null;

  let fieldsFilled = 0;
  let declarationFieldsFlagged = 0;

  for (const field of fields) {
    if (!(field instanceof PDFTextField)) continue; // never touch checkboxes/radio/dropdowns

    const name = field.getName();
    if (isDeclarationField(name)) {
      try {
        field.setText("[TO BE COMPLETED BY BIDDER — REQUIRES SIGN-OFF]");
        declarationFieldsFlagged += 1;
      } catch {
        // some fields reject text (e.g. comb/length-limited) — leave blank
      }
      continue;
    }

    const matcher = matchField(name);
    if (!matcher) continue;
    const value = matcher.value(company);
    if (!value) continue;

    try {
      field.setText(value);
      fieldsFilled += 1;
    } catch {
      // ignore fields that reject the value (e.g. too long for a comb field)
    }
  }

  if (fieldsFilled === 0 && declarationFieldsFlagged === 0) return null;

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  drawDraftWatermark(pdfDoc, font);

  const buffer = Buffer.from(await pdfDoc.save());
  return { buffer, fieldsFilled, declarationFieldsFlagged };
}
