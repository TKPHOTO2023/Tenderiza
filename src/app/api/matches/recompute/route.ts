import { NextResponse } from "next/server";
import { recomputeAllMatches } from "@/lib/match-runner";
import { getCurrentCompany } from "@/lib/current-company";

export const maxDuration = 60;

/** Rescores this account's own matches only — never anyone else's. */
export async function POST() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const result = await recomputeAllMatches({ maxExtractions: 5, companyId: company.id });
  return NextResponse.json(result);
}
