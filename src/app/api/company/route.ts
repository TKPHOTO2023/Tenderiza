import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentCompany } from "@/lib/current-company";

export async function GET() {
  const company = await getOrCreateCurrentCompany();
  const full = await prisma.company.findUnique({
    where: { id: company.id },
    include: {
      categories: { include: { category: true } },
      accreditations: true,
      references: true,
      documents: { include: { documentType: true } },
    },
  });
  return NextResponse.json(full);
}

export async function PATCH(req: NextRequest) {
  const company = await getOrCreateCurrentCompany();
  const body = await req.json();

  const {
    categoryIds,
    ...companyFields
  } = body as { categoryIds?: string[] } & Record<string, unknown>;

  // Coerce known date fields.
  for (const dateField of ["taxComplianceExpiry", "bbbeeCertificateExpiry"]) {
    if (companyFields[dateField] === "") companyFields[dateField] = null;
    else if (typeof companyFields[dateField] === "string") {
      companyFields[dateField] = new Date(companyFields[dateField] as string);
    }
  }

  // Coerce known numeric fields (form inputs always send strings).
  if (companyFields.teamSize === "" || companyFields.teamSize == null) {
    companyFields.teamSize = null;
  } else if (typeof companyFields.teamSize === "string") {
    companyFields.teamSize = parseInt(companyFields.teamSize, 10);
  }

  let updated;
  try {
    updated = await prisma.company.update({
      where: { id: company.id },
      data: companyFields,
    });
  } catch (error) {
    console.error("Failed to update company", error);
    return NextResponse.json({ error: "Failed to update company profile" }, { status: 400 });
  }

  if (categoryIds) {
    await prisma.companyCategory.deleteMany({ where: { companyId: company.id } });
    if (categoryIds.length > 0) {
      await prisma.companyCategory.createMany({
        data: categoryIds.map((categoryId) => ({ companyId: company.id, categoryId })),
        skipDuplicates: true,
      });
    }
  }

  const full = await prisma.company.findUnique({
    where: { id: updated.id },
    include: {
      categories: { include: { category: true } },
      accreditations: true,
      references: true,
      documents: { include: { documentType: true } },
    },
  });

  return NextResponse.json(full);
}
