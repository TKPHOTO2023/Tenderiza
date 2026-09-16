import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCompany } from "@/lib/current-company";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const draft = await prisma.draft.findUnique({ where: { id } });
  if (!draft || draft.companyId !== company.id) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const logs = await prisma.draftStatusLog.findMany({
    where: { draftId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(logs);
}
