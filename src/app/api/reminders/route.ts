import { NextResponse } from "next/server";
import { getOrCreateCurrentCompany } from "@/lib/current-company";
import { getReminders } from "@/lib/reminders";

export async function GET() {
  const company = await getOrCreateCurrentCompany();
  const reminders = await getReminders(company.id);
  return NextResponse.json(reminders);
}
