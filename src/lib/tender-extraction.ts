import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "@/lib/anthropic";
import { fetchTenderDocuments } from "@/lib/tender-documents";
import type { Tender } from "@prisma/client";

export const ExtractedRequirementsSchema = z.object({
  requiredBbbeeLevel: z
    .string()
    .nullable()
    .describe('Minimum required B-BBEE level exactly as stated (e.g. "Level 4", "EME/QSE accepted"), or null if not stated'),
  requiredCidbGrade: z
    .string()
    .nullable()
    .describe('Minimum required CIDB grade exactly as stated (e.g. "6"), or null if not stated / not applicable'),
  requiredCidbClassOfWork: z
    .string()
    .nullable()
    .describe('Required CIDB class of work if stated (e.g. "GB", "CE"), or null'),
  briefingCompulsory: z.boolean().describe("Whether attending a briefing/site meeting is a compulsory condition of bidding"),
  briefingDate: z.string().nullable().describe("Briefing/site meeting date and time exactly as stated, or null if none"),
  briefingVenue: z.string().nullable().describe("Briefing/site meeting venue exactly as stated, or null if none"),
  functionalityThreshold: z
    .string()
    .nullable()
    .describe('Minimum functionality/technical score required to proceed to price evaluation, exactly as stated (e.g. "70%"), or null'),
  scopeSummary: z.string().describe("One or two sentence plain-language summary of the scope of work"),
  extractionConfidence: z
    .enum(["low", "medium", "high"])
    .describe("How confident this extraction is, given how much of the tender document was readable"),
  procurementType: z
    .enum(["RFQ", "RFP", "RFI", "UNKNOWN"])
    .describe(
      "Classify from the document's own wording and structure: RFQ (request for quotation, usually simple " +
        "and below a Rand-value threshold), RFP (formal competitive bid — standard SBD forms, technical " +
        "and price evaluation), RFI (request for information — no priced bid expected). UNKNOWN if the " +
        "document doesn't make this clear. Never infer this from the estimated value alone."
    ),
  procurementTypeRationale: z
    .string()
    .nullable()
    .describe("One sentence citing what in the document indicated this procurement type, or null if UNKNOWN"),
  pricingScheduleItems: z
    .array(
      z.object({
        lineNumber: z.string().nullable().describe("Item/line number exactly as stated, or null"),
        description: z.string().describe("The item or service description exactly as stated"),
        quantity: z.number().nullable().describe("Quantity exactly as stated, or null if not given"),
        unitOfMeasure: z.string().nullable().describe('Unit exactly as stated (e.g. "each", "hours", "m2"), or null'),
      })
    )
    .describe(
      "The tender's own itemized pricing/quantity schedule, line by line, if one is included in the documents. " +
        "Empty array if no such schedule is present. NEVER include a price or invented total — pricing is always " +
        "the bidder's own commercial decision, not something to extract, estimate, or guess."
    ),
});

export type ExtractedRequirements = z.infer<typeof ExtractedRequirementsSchema>;

export interface ExtractionResult {
  requirements: ExtractedRequirements;
  documentsAnalyzed: number;
}

/**
 * Reads a tender's linked PDF documents and extracts the specific,
 * eligibility-relevant requirements that OCDS metadata never carries —
 * required B-BBEE level, CIDB grade, compulsory briefings, functionality
 * thresholds. Told explicitly to use null rather than guess.
 */
export async function extractTenderRequirements(tender: Tender): Promise<ExtractionResult> {
  const client = getAnthropicClient();
  const documents = await fetchTenderDocuments(tender.documentUrls);

  if (documents.length === 0) {
    throw new Error("No readable tender documents to extract requirements from.");
  }

  const documentBlocks = documents.map((doc) => ({
    type: "document" as const,
    source: { type: "base64" as const, media_type: doc.mediaType, data: doc.data },
  }));

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 2048,
    system:
      "You extract specific eligibility requirements from South African government tender documents for an " +
      "automated eligibility check. Be precise and literal — quote the document's own wording for grades/levels. " +
      "Use null for anything not explicitly stated in the document. Never infer or guess a requirement that isn't " +
      "written down, even if it seems typical for this kind of tender. You also classify the procurement type " +
      "(RFQ/RFP/RFI) from the document's own wording and structure, and transcribe any itemized pricing/quantity " +
      "schedule it contains. NEVER invent, estimate, or fill in a price anywhere — pricing schedule items carry " +
      "only description/quantity/unit, exactly as stated; leave a field null rather than guess.",
    messages: [
      {
        role: "user",
        content: [
          ...documentBlocks,
          {
            type: "text",
            text: `Title: ${tender.title || "(no title)"}\nExtract the eligibility requirements from the attached tender document(s).`,
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(ExtractedRequirementsSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude did not return parseable requirements for this tender.");
  }

  return { requirements: response.parsed_output, documentsAnalyzed: documentBlocks.length };
}
