// Shared by the document preview proxy and any AI feature that reads a
// tender's PDFs (requirements summary, cost estimate). Government
// procurement documents only — keeps every consumer from becoming an SSRF
// relay to arbitrary URLs.
const ALLOWED_HOST_SUFFIXES = [".etenders.gov.za", ".treasury.gov.za", "etenders.gov.za", "treasury.gov.za"];

export function isAllowedDocumentHost(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && ALLOWED_HOST_SUFFIXES.some((s) => hostname === s.replace(/^\./, "") || hostname.endsWith(s));
  } catch {
    return false;
  }
}

const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // keep well under the API's 32MB request cap across multiple docs

export interface FetchedDocument {
  data: string; // base64
  mediaType: "application/pdf";
}

async function fetchDocumentAsBase64(url: string): Promise<FetchedDocument | null> {
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

/** Fetches up to `max` readable PDFs from a tender's document URLs, in order. */
export async function fetchTenderDocuments(documentUrls: string[], max = 3): Promise<FetchedDocument[]> {
  const results: FetchedDocument[] = [];
  for (const url of documentUrls.slice(0, max)) {
    const doc = await fetchDocumentAsBase64(url);
    if (doc) results.push(doc);
  }
  return results;
}
