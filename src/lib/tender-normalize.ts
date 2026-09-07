import { TenderStatus, Prisma } from "@prisma/client";
import type { OcdsRelease } from "@/lib/ocds-client";

// OCDS tenderStatus codelist: planning, planned, active, cancelled,
// unsuccessful, withdrawn, complete. Mapped down to our small clean enum —
// sector/category mapping onto our own taxonomy is deliberately left to
// Phase 3, so `category` below stores the raw OCDS value untouched.
const STATUS_MAP: Record<string, TenderStatus> = {
  planning: TenderStatus.PLANNED,
  planned: TenderStatus.PLANNED,
  active: TenderStatus.OPEN,
  cancelled: TenderStatus.CANCELLED,
  unsuccessful: TenderStatus.CLOSED,
  withdrawn: TenderStatus.CLOSED,
  complete: TenderStatus.CLOSED,
};

function firstNonEmptyString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function toDecimal(value: unknown): Prisma.Decimal | null {
  if (typeof value !== "number" || !isFinite(value)) return null;
  return new Prisma.Decimal(value);
}

// Narrow, defensive accessors — OCDS releases vary a lot in completeness
// between publishers, so every field here is best-effort.
export interface NormalizedTender {
  ocid: string;
  title: string | null;
  description: string | null;
  buyerName: string | null;
  province: string | null;
  category: string | null;
  status: TenderStatus;
  publishedDate: Date | null;
  closingDate: Date | null;
  estimatedValue: Prisma.Decimal | null;
  currency: string | null;
  documentUrls: string[];
  sourceUrl: string | null;
  rawData: OcdsRelease;
}

export function normalizeRelease(release: OcdsRelease): NormalizedTender | null {
  const ocid = typeof release.ocid === "string" ? release.ocid : null;
  if (!ocid) return null; // can't dedupe/store without a contracting process ID

  const tender = (release.tender ?? {}) as Record<string, unknown>;
  const buyer = (release.buyer ?? {}) as Record<string, unknown>;
  const parties = Array.isArray(release.parties) ? (release.parties as Record<string, unknown>[]) : [];

  const buyerParty =
    parties.find((p) => Array.isArray(p.roles) && (p.roles as string[]).includes("buyer")) ??
    parties.find((p) => Array.isArray(p.roles) && (p.roles as string[]).includes("procuringEntity"));

  const items = Array.isArray(tender.items) ? (tender.items as Record<string, unknown>[]) : [];
  const firstItem = items[0] ?? {};
  const classification = (firstItem.classification ?? {}) as Record<string, unknown>;
  const deliveryLocation = (firstItem.deliveryLocation ?? {}) as Record<string, unknown>;
  const deliveryAddress = (deliveryLocation.address ?? {}) as Record<string, unknown>;

  const buyerAddress = ((buyerParty?.address ?? buyer.address ?? {}) as Record<string, unknown>) ?? {};

  const tenderPeriod = (tender.tenderPeriod ?? {}) as Record<string, unknown>;
  const value = (tender.value ?? {}) as Record<string, unknown>;

  const rawStatus = typeof tender.status === "string" ? tender.status.toLowerCase() : null;

  const documents = Array.isArray(tender.documents) ? (tender.documents as Record<string, unknown>[]) : [];
  const documentUrls = documents
    .map((d) => (typeof d.url === "string" ? d.url : null))
    .filter((url): url is string => !!url);

  return {
    ocid,
    title: firstNonEmptyString(tender.title),
    description: firstNonEmptyString(tender.description),
    buyerName: firstNonEmptyString(buyer.name, buyerParty?.name),
    province: firstNonEmptyString(
      deliveryAddress.region,
      deliveryLocation.description,
      buyerAddress.region
    ),
    category: firstNonEmptyString(classification.description, tender.mainProcurementCategory),
    status: rawStatus && STATUS_MAP[rawStatus] ? STATUS_MAP[rawStatus] : TenderStatus.UNKNOWN,
    publishedDate: toDate(release.date) ?? toDate(tenderPeriod.startDate),
    closingDate: toDate(tenderPeriod.endDate),
    estimatedValue: toDecimal(value.amount),
    currency: firstNonEmptyString(value.currency),
    documentUrls,
    sourceUrl: firstNonEmptyString(documentUrls[0]),
    rawData: release,
  };
}
