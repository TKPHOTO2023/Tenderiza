import { NextResponse } from "next/server";
import { recomputeAllMatches } from "@/lib/match-runner";

export const maxDuration = 60;

export async function POST() {
  const result = await recomputeAllMatches({ maxExtractions: 5 });
  return NextResponse.json(result);
}
