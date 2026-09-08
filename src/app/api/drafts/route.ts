import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentCompany } from "@/lib/current-company";
import { generateDraft } from "@/lib/draft-runner";

export const maxDuration = 60;

export async function GET() {
  const company = await getOrCreateCurrentCompany();
  const drafts = await prisma.draft.findMany({
    where: { companyId: company.id },
    include: { tender: true },
    orderBy: { generatedAt: "desc" },
  });
  return NextResponse.json(drafts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tenderId = body.tenderId as string | undefined;
  if (!tenderId) return NextResponse.json({ error: "tenderId is required" }, { status: 400 });

  try {
    const draft = await generateDraft(tenderId);
    return NextResponse.json(draft);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate draft" },
      { status: 502 }
    );
  }
}
