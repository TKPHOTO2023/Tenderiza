import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "@/lib/anthropic";
import { buildDraftPdf, type DraftPdfSection } from "@/lib/draft-pdf";
import type { Company, CompanyReference, Tender } from "@prisma/client";

export const TechnicalProposalSchema = z.object({
  approach: z
    .string()
    .describe("A first-draft approach/methodology section addressing the tender's stated scope of work — several paragraphs, written for a bidder to edit, not a finished submission"),
  relevantReferences: z
    .array(z.object({ reference: z.string(), whyRelevant: z.string() }))
    .describe("Past references that genuinely support this pitch, each with a short note on why it's relevant. Empty array if none genuinely relate."),
  referenceGapNote: z
    .string()
    .nullable()
    .describe("If the company's past references don't clearly relate to this tender's scope, an honest note saying so — null if there's genuinely good relevant experience"),
  reviewerNotes: z
    .array(z.string())
    .describe("Things a human reviewer should double-check or strengthen before this proposal is submitted"),
});

export type TechnicalProposal = z.infer<typeof TechnicalProposalSchema>;

/**
 * Drafts a first-pass technical/methodology proposal via Claude, using the
 * tender's extracted scope and the company's actual capacity/past
 * references. Explicitly told not to fabricate relevance between past
 * references and this tender — an honest "these don't obviously relate"
 * is required output, not a failure.
 */
export async function generateTechnicalProposal(
  company: Company & { references: CompanyReference[] },
  tender: Tender,
  scopeSummary: string
): Promise<TechnicalProposal> {
  const client = getAnthropicClient();

  const referencesText =
    company.references.length > 0
      ? company.references
          .map((r) => `- ${r.clientName} (${r.year ?? "year unknown"}): ${r.projectDescription}${r.value ? ` — value R${r.value}` : ""}`)
          .join("\n")
      : "(none on file)";

  const contextText = [
    `Tender title: ${tender.title || "(untitled)"}`,
    `Tender category: ${tender.category || "(unknown)"}`,
    `Scope of work: ${scopeSummary}`,
    `\nCompany description: ${company.description || "(none provided)"}`,
    `Team size: ${company.teamSize ?? "(not stated)"}`,
    `Capacity notes: ${company.capacityNotes || "(none provided)"}`,
    `\nPast project references:\n${referencesText}`,
  ].join("\n");

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    system:
      "You draft first-pass technical/methodology proposals for South African government tender bids. " +
      "Write a genuine starting point the bidder will edit, not filler text — engage with the actual " +
      "scope of work. Only cite past references that plausibly relate to this tender's scope — if the " +
      "company's references don't obviously connect, say so honestly in referenceGapNote rather than " +
      "forcing a connection. Never fabricate experience or relevance that isn't supported by the " +
      "references given.",
    messages: [{ role: "user", content: contextText }],
    output_config: {
      format: zodOutputFormat(TechnicalProposalSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude did not return a parseable technical proposal.");
  }

  return response.parsed_output;
}

export async function renderTechnicalProposalPdf(tender: Tender, proposal: TechnicalProposal): Promise<Buffer> {
  const sections: DraftPdfSection[] = [
    { heading: "Approach & Methodology", body: proposal.approach },
    {
      heading: "Relevant Experience",
      body:
        proposal.relevantReferences.length > 0
          ? proposal.relevantReferences.map((r) => `${r.reference}\n${r.whyRelevant}`).join("\n\n")
          : proposal.referenceGapNote || "No closely relevant past references were identified.",
    },
    {
      heading: "Notes for Reviewer",
      body:
        proposal.reviewerNotes.length > 0
          ? proposal.reviewerNotes.map((n) => `• ${n}`).join("\n")
          : "None flagged — review the approach section against the actual tender documents regardless.",
    },
  ];

  return buildDraftPdf(`Technical Proposal (Draft) — ${tender.title || tender.ocid}`, sections);
}
