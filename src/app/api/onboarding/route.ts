import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCompany } from "@/lib/current-company";

export async function PATCH(req: NextRequest) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
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
