import type { Company, CompanyDocument, CompanyCategory, DocumentType } from "@prisma/client";

export type CompanyWithRelations = Company & {
  categories?: CompanyCategory[];
  documents?: (CompanyDocument & { documentType?: DocumentType })[];
};

export interface ChecklistItem {
  label: string;
  done: boolean;
  section: "basics" | "compliance" | "capability" | "documents";
}

export function buildChecklist(company: CompanyWithRelations): ChecklistItem[] {
  const documentCount = (company.documents ?? []).length;

  return [
    { label: "Company name", done: !!company.companyName, section: "basics" },
    { label: "CIPC registration number", done: !!company.registrationNumber, section: "basics" },
    { label: "Contact person & email", done: !!company.contactPersonName && !!company.contactEmail, section: "basics" },
    { label: "Physical address", done: !!company.addressLine1, section: "basics" },
    { label: "Province(s) of operation", done: (company.operatingProvinces ?? []).length > 0, section: "basics" },
    { label: "CSD registration status", done: !!company.csdStatus, section: "compliance" },
    { label: "Tax compliance status", done: !!company.taxComplianceStatusPin, section: "compliance" },
    { label: "B-BBEE level", done: !!company.bbbeeLevel, section: "compliance" },
    { label: "Sector/industry categories", done: (company.categories ?? []).length > 0, section: "capability" },
    { label: "Team size", done: !!company.teamSize, section: "capability" },
    { label: "Core compliance documents uploaded", done: documentCount >= 1, section: "documents" },
  ];
}

export function completenessPercent(company: CompanyWithRelations): number {
  const checklist = buildChecklist(company);
  const done = checklist.filter((c) => c.done).length;
  return Math.round((done / checklist.length) * 100);
}

export function expiryStatus(expiryDate: Date | string | null | undefined): "expired" | "expiring60" | "expiring30" | "ok" | "none" {
  if (!expiryDate) return "none";
  const expiry = new Date(expiryDate);
  const now = new Date();
  const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "expired";
  if (days <= 30) return "expiring30";
  if (days <= 60) return "expiring60";
  return "ok";
}
