import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentCompany } from "@/lib/current-company";

export async function POST(req: NextRequest) {
  const company = await getOrCreateCurrentCompany();
  const body = await req.json();
  const accreditation = await prisma.companyAccreditation.create({
    data: {
      companyId: company.id,
      name: body.name,
      referenceNo: body.referenceNo || null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    },
  });
  return NextResponse.json(accreditation, { status: 201 });
}
