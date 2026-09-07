import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES: { code: string; name: string; description?: string }[] = [
  { code: "72000000", name: "Building & Facilities Construction & Maintenance" },
  { code: "81110000", name: "Information Technology & Software" },
  { code: "80100000", name: "Professional Services (Consulting, Legal, Accounting)" },
  { code: "92120000", name: "Security Services" },
  { code: "90900000", name: "Cleaning Services" },
  { code: "90190000", name: "Catering & Hospitality" },
  { code: "78100000", name: "Transport & Logistics" },
  { code: "50000000", name: "Supply of Goods (General Consumables)" },
  { code: "39000000", name: "Furniture, Fixtures & Fittings" },
  { code: "43000000", name: "Electronics & IT Equipment Supply" },
  { code: "83100000", name: "Engineering Services" },
  { code: "85100000", name: "Healthcare & Medical Services" },
  { code: "86100000", name: "Education & Training Services" },
  { code: "77100000", name: "Agriculture & Farming" },
  { code: "76100000", name: "Mining & Extraction Support Services" },
  { code: "82100000", name: "Printing, Publishing & Signage" },
  { code: "93140000", name: "Waste Management & Environmental Services" },
  { code: "84110000", name: "Financial & Insurance Services" },
  { code: "60100000", name: "Fleet & Vehicle Maintenance" },
  { code: "95000000", name: "Event Management" },
];

const DOCUMENT_TYPES: {
  code: string;
  label: string;
  description?: string;
  requiresExpiry: boolean;
}[] = [
  {
    code: "cipc_registration",
    label: "CIPC Company Registration Certificate",
    description: "Certificate of Incorporation / registration from the Companies and Intellectual Property Commission.",
    requiresExpiry: false,
  },
  {
    code: "bbbee_certificate",
    label: "B-BBEE Certificate / Sworn Affidavit",
    description: "B-BBEE verification certificate or, for EMEs, a sworn affidavit.",
    requiresExpiry: true,
  },
  {
    code: "tax_clearance",
    label: "Tax Clearance Certificate / TCS PIN Letter",
    description: "SARS Tax Compliance Status PIN letter.",
    requiresExpiry: true,
  },
  {
    code: "csd_registration",
    label: "CSD Registration Confirmation",
    description: "Central Supplier Database registration confirmation report.",
    requiresExpiry: false,
  },
  {
    code: "cidb_certificate",
    label: "CIDB Certificate",
    description: "Construction Industry Development Board registration certificate (if applicable).",
    requiresExpiry: true,
  },
  {
    code: "bank_confirmation",
    label: "Company Bank Confirmation Letter",
    description: "Bank-issued confirmation of account details, dated within the last 3 months.",
    requiresExpiry: false,
  },
  {
    code: "directors_id",
    label: "Directors' ID Documents",
    description: "Certified copies of ID documents for all directors/members.",
    requiresExpiry: false,
  },
  {
    code: "company_profile",
    label: "Company Profile / Brochure (PDF)",
    description: "A company profile document used in proposal submissions.",
    requiresExpiry: false,
  },
  {
    code: "proof_of_address",
    label: "Proof of Address",
    description: "Utility bill or lease agreement, not older than 3 months.",
    requiresExpiry: false,
  },
];

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { code: category.code },
      update: { name: category.name, description: category.description },
      create: category,
    });
  }

  for (const docType of DOCUMENT_TYPES) {
    await prisma.documentType.upsert({
      where: { code: docType.code },
      update: {
        label: docType.label,
        description: docType.description,
        requiresExpiry: docType.requiresExpiry,
      },
      create: { ...docType, isCustom: false },
    });
  }

  console.log(`Seeded ${CATEGORIES.length} categories and ${DOCUMENT_TYPES.length} document types.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
