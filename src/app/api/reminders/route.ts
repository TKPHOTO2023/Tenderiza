import { NextResponse } from "next/server";
import { getCurrentCompany } from "@/lib/current-company";
import { getReminders } from "@/lib/reminders";

export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const reminders = await getReminders(company.id);
  return NextResponse.json(reminders);
}
