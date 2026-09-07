import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "@/lib/anthropic";
import { fetchTenderDocuments } from "@/lib/tender-documents";
import type { Tender } from "@prisma/client";

export const TenderCostEstimateSchema = z.object({
  lowEstimate: z.number().describe("Low end of a realistic ZAR quote range for this scope of work"),
  highEstimate: z.number().describe("High end of a realistic ZAR quote range for this scope of work"),
  basisOfEstimate: z
    .string()
    .describe(
      "How this range was derived — the reasoning about scope size, typical South African public-sector rates for this category, labor/materials/duration drivers, etc."
    ),
  costDrivers: z
    .array(z.string())
    .describe("The specific factors that most affect where in (or outside) this range the true cost would land"),
  comparisonToOfficialValue: z
    .string()
    .nullable()
    .describe(
      "If an official OCDS estimated value was provided, a short note on whether this estimate agrees with it or why it might differ. Null if no official value was given."
    ),
  confidence: z
    .enum(["low", "medium", "high"])
    .describe("How confident this estimate is, given how much scope detail was available"),
});

export type TenderCostEstimate = z.infer<typeof TenderCostEstimateSchema>;

export interface GenerateCostEstimateResult {
  estimate: TenderCostEstimate;
  documentsAnalyzed: number;
}

/**
 * Produces a rough, generic market-rate cost range for a tender — reasoned
 * independently from the scope of work every time, never simply parroting
 * back any official OCDS estimated value (that's surfaced separately for
 * the user to compare against). This is guidance for what a company might
 * quote, not a substitute for a real costing exercise.
 */
export async function generateTenderCostEstimate(tender: Tender): Promise<GenerateCostEstimateResult> {
  const client = getAnthropicClient();
  const documents = await fetchTenderDocuments(tender.documentUrls);

  const documentBlocks = documents.map((doc) => ({
    type: "document" as const,
    source: { type: "base64" as const, media_type: doc.mediaType, data: doc.data },
  }));

  const officialValueLine =
    tender.estimatedValue != null
      ? `An official OCDS estimated value of ${tender.estimatedValue} ${tender.currency ?? "ZAR"} was published for this tender — reason about cost independently first, then note in comparisonToOfficialValue whether your estimate agrees with it or why it might not.`
      : "No official estimated value was published for this tender — comparisonToOfficialValue should be null.";

  const contextText = [
    `Title: ${tender.title || "(no title provided)"}`,
    `Buyer: ${tender.buyerName || "(unknown)"}`,
    `Category: ${tender.category || "(unknown)"}`,
    `Province: ${tender.province || "(unknown)"}`,
    `OCDS description: ${tender.description || "(none provided)"}`,
    officialValueLine,
    documentBlocks.length === 0
      ? "\nNo tender documents could be read — base your estimate only on the fields above, and set confidence to \"low\" since scope detail is limited."
      : `\n${documentBlocks.length} tender document(s) are attached below — use them to size the scope of work.`,
  ].join("\n");

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 2048,
    system:
      "You help South African businesses gauge roughly what to quote on government tenders. " +
      "Reason like an experienced estimator: what does this scope of work typically cost in the South African " +
      "public-sector market (materials, labor, duration, standard margins), independent of any official estimate. " +
      "Give a realistic range, not a false-precision single number. Be explicit that this is rough guidance, not a " +
      "formal costing — never claim more certainty than the available scope detail supports.",
    messages: [
      {
        role: "user",
        content: [...documentBlocks, { type: "text", text: contextText }],
      },
    ],
    output_config: {
      format: zodOutputFormat(TenderCostEstimateSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude did not return a parseable cost estimate for this tender.");
  }

  return { estimate: response.parsed_output, documentsAnalyzed: documentBlocks.length };
}
