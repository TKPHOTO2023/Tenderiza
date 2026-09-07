import type {
  Company,
  CompanyCategory,
  Category,
  CompanyAccreditation,
  CompanyReference,
  CompanyDocument,
  DocumentType,
} from "@prisma/client";

export type CompanyCategoryWithCategory = CompanyCategory & { category: Category };

export type CompanyDocumentWithType = CompanyDocument & { documentType: DocumentType };

export type CompanyFull = Company & {
  categories: CompanyCategoryWithCategory[];
  accreditations: CompanyAccreditation[];
  references: CompanyReference[];
  documents: CompanyDocumentWithType[];
};
