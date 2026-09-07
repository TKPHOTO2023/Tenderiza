import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentCompany } from "@/lib/current-company";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tenderId: string }> }) {
  const { tenderId } = await params;
  const company = await getOrCreateCurrentCompany();

  const match = await prisma.match.findUnique({
    where: { companyId_tenderId: { companyId: company.id, tenderId } },
    include: { tender: true },
  });

  if (!match) return NextResponse.json({ error: "No match computed for this tender yet" }, { status: 404 });
  return NextResponse.json(match);
}
