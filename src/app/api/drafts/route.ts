import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCompany } from "@/lib/current-company";
import { generateDraft } from "@/lib/draft-runner";
import { getEntitlements, recordDraftUsage } from "@/lib/entitlements";

export const maxDuration = 60;

export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const drafts = await prisma.draft.findMany({
    where: { companyId: company.id },
    include: { tender: true },
    orderBy: { generatedAt: "desc" },
  });
  return NextResponse.json(drafts);
}

export async function POST(req: NextRequest) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json();
  const tenderId = body.tenderId as string | undefined;
  if (!tenderId) return NextResponse.json({ error: "tenderId is required" }, { status: 400 });

  const entitlements = await getEntitlements(company.id);
  if (!entitlements.canGenerateDraft) {
    return NextResponse.json(
      {
        error: `You've used all ${entitlements.draftsPerMonth} drafts on the free plan this month. Upgrade to Pro for unlimited drafts.`,
        upgradeRequired: true,
      },
      { status: 402 }
    );
  }

  try {
    const draft = await generateDraft(tenderId, company.id);
    await recordDraftUsage(company.id);
    return NextResponse.json(draft);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate draft" },
      { status: 502 }
    );
  }
}
