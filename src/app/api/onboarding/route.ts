import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentCompany } from "@/lib/current-company";

export async function PATCH(req: NextRequest) {
  const company = await getOrCreateCurrentCompany();
  const body = await req.json();
  const updated = await prisma.company.update({
    where: { id: company.id },
    data: {
      currentStep: body.currentStep ?? undefined,
      onboardingComplete: body.onboardingComplete ?? undefined,
    },
  });
  return NextResponse.json(updated);
}
