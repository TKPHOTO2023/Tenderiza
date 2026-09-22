import { NextRequest, NextResponse } from "next/server";
import { completePasswordReset } from "@/lib/password-reset";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token) return NextResponse.json({ error: "That reset link is incomplete." }, { status: 400 });

  const result = await completePasswordReset(token, password);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });

  return NextResponse.json({ ok: true });
}
