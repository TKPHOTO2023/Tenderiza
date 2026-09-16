import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentCompany } from "@/lib/current-company";
import { getEntitlements } from "@/lib/entitlements";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  const company = await getCurrentCompany();
  const entitlements = company ? await getEntitlements(company.id) : null;

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    company: company ? { id: company.id, companyName: company.companyName, onboardingComplete: company.onboardingComplete } : null,
    entitlements,
  });
}
