import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentCompany } from "@/lib/current-company";

export async function GET() {
  const company = await getOrCreateCurrentCompany();
  const references = await prisma.companyReference.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(references);
}

export async function POST(req: NextRequest) {
  const company = await getOrCreateCurrentCompany();
  const body = await req.json();
  const reference = await prisma.companyReference.create({
    data: {
      companyId: company.id,
      clientName: body.clientName,
      projectDescription: body.projectDescription,
      value: body.value ? Number(body.value) : null,
      year: body.year ? Number(body.year) : null,
    },
  });
  return NextResponse.json(reference, { status: 201 });
}
