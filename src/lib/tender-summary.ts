import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient } from "@/lib/anthropic";
import type { Tender } from "@prisma/client";

// Same allowlist as the document preview proxy — we only ever fetch tender
// documents from the government's own domains.
const ALLOWED_HOST_SUFFIXES = [".etenders.gov.za", ".treasury.gov.za", "etenders.gov.za", "treasury.gov.za"];

function isAllowedDocumentHost(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && ALLOWED_HOST_SUFFIXES.some((s) => hostname === s.replace(/^\./, "") || hostname.endsWith(s));
  } catch {
    return false;
  }
}

const MAX_DOCUMENTS = 3;
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // keep well under the API's 32MB request cap across multiple docs

export const TenderRequirementsSchema = z.object({
  overview: z.string().describe("1-3 sentence plain-language summary of what this tender is for"),
  scopeOfWork: z.string().describe("What the winning bidder will actually have to do, in a short paragraph"),
  deliverables: z.array(z.string()).describe("Concrete deliverables/outputs the company must provide"),
  eligibilityRequirements: z
    .array(z.string())
    .describe("Compliance/eligibility requirements to bid at all (e.g. CIDB grading, B-BBEE level, registrations)"),
  submissionRequirements: z
    .array(z.string())
    .describe("What must be included in the bid submission itself (forms, documents, formats)"),
  keyDates: z
    .array(z.object({ label: z.string(), date: z.string() }))
    .describe("Any specific dates/deadlines mentioned (briefing sessions, site visits, closing time), beyond the main closing date"),
});

export type TenderRequirements = z.infer<typeof TenderRequirementsSchema>;

async function fetchDocumentAsBase64(url: string): Promise<{ data: string; mediaType: string } | null> {
  if (!isAllowedDocumentHost(url)) return null;
  try {
    const res = await fetch(url, { headers: { Accept: "application/pdf" } });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("pdf") && !url.toLowerCase().endsWith(".pdf")) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > MAX_DOCUMENT_BYTES) return null;

    return { data: buffer.toString("base64"), mediaType: "application/pdf" };
  } catch {
    return null;
  }
}

export interface GenerateSummaryResult {
  requirements: TenderRequirements;
  documentsAnalyzed: number;
}

/**
 * Reads a tender's linked PDF documents (falling back to just its OCDS
 * description if none are fetchable) and extracts what the company would
 * actually need to deliver, via Claude's structured output.
 */
export async function generateTenderRequirementsSummary(tender: Tender): Promise<GenerateSummaryResult> {
  const client = getAnthropicClient();

  const documentBlocks: Array<{ type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }> = [];
  for (const url of tender.documentUrls.slice(0, MAX_DOCUMENTS)) {
    const doc = await fetchDocumentAsBase64(url);
    if (doc) {
      documentBlocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: doc.data },
      });
    }
  }

  const contextText = [
    `Title: ${tender.title || "(no title provided)"}`,
    `Buyer: ${tender.buyerName || "(unknown)"}`,
    `Category: ${tender.category || "(unknown)"}`,
    `OCDS description: ${tender.description || "(none provided)"}`,
    documentBlocks.length === 0
      ? "\nNo tender documents could be read — base your answer only on the fields above, and keep deliverables/requirements general since detail is limited."
      : `\n${documentBlocks.length} tender document(s) are attached below — use them as the primary source.`,
  ].join("\n");

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    system:
      "You help South African businesses quickly understand government tender documents. " +
      "Extract exactly what a bidding company would need to deliver and comply with — be concrete and specific, " +
      "quoting requirement wording where it matters (e.g. exact CIDB grade, exact B-BBEE level). " +
      "If information genuinely isn't available in the provided material, use an empty array or a short note saying so — never invent requirements.",
    messages: [
      {
        role: "user",
        content: [...documentBlocks, { type: "text", text: contextText }],
      },
    ],
    output_config: {
      format: zodOutputFormat(TenderRequirementsSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude did not return a parseable summary for this tender.");
  }

  return { requirements: response.parsed_output, documentsAnalyzed: documentBlocks.length };
}
