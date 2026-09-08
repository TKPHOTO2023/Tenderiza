import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { generateComplianceDocuments } from "@/lib/draft-documents";
import { generateTechnicalProposal, renderTechnicalProposalPdf } from "@/lib/technical-proposal";
import { buildComplianceChecklist } from "@/lib/compliance-checklist";
import type { HardCheck } from "@/lib/match-eligibility";
import type { ExtractedRequirements } from "@/lib/tender-extraction";

export interface DraftDocumentRef {
  label: string;
  url: string;
  kind: "official_form_filled" | "generated_equivalent" | "technical_proposal";
}

/**
 * Generates (or regenerates) the full draft package for one company+tender:
 * compliance documents (form-fill or equivalent), a technical proposal
 * draft, and a compliance checklist — then uploads the documents and
 * upserts the Draft row. Safe to call again later ("Regenerate") if the
 * tender's requirements or the company profile have changed.
 */
export async function generateDraft(tenderId: string) {
  const [company, tender] = await Promise.all([
    prisma.company.findFirst({
      orderBy: { createdAt: "asc" },
      include: { documents: { include: { documentType: true } }, references: true },
    }),
    prisma.tender.findUnique({ where: { id: tenderId } }),
  ]);

  if (!company) throw new Error("Company profile not found");
  if (!tender) throw new Error("Tender not found");

  const match = await prisma.match.findUnique({
    where: { companyId_tenderId: { companyId: company.id, tenderId } },
  });

  const extracted = tender.extractedRequirements as ExtractedRequirements | null;
  const scopeSummary = extracted?.scopeSummary || tender.description || tender.title || "No scope description available.";
  const hardChecks = (match?.hardChecks as unknown as HardCheck[]) ?? [];

  const complianceDocs = await generateComplianceDocuments(company, tender);

  const proposal = await generateTechnicalProposal(company, tender, scopeSummary);
  const proposalBuffer = await renderTechnicalProposalPdf(tender, proposal);

  const uploaded: DraftDocumentRef[] = [];
  for (const doc of complianceDocs) {
    const { url } = await storage.put(company.id, doc.filename, doc.buffer);
    uploaded.push({ label: doc.label, url, kind: doc.kind });
  }
  const proposalUpload = await storage.put(company.id, "technical-proposal-draft.pdf", proposalBuffer);
  uploaded.push({ label: "Technical proposal (draft)", url: proposalUpload.url, kind: "technical_proposal" });

  const checklist = buildComplianceChecklist(company, tender, hardChecks);

  const draft = await prisma.draft.upsert({
    where: { companyId_tenderId: { companyId: company.id, tenderId } },
    create: {
      companyId: company.id,
      tenderId,
      documentUrls: uploaded as object,
      complianceChecklist: checklist as object,
      status: "GENERATED",
    },
    update: {
      documentUrls: uploaded as object,
      complianceChecklist: checklist as object,
      status: "GENERATED",
      generatedAt: new Date(),
    },
  });

  return draft;
}
