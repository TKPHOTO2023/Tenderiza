import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/password-reset";
import { systemMailConfig } from "@/lib/system-mail";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "";

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Enter the email address on your account." }, { status: 400 });
  }
  if (!systemMailConfig()) {
    // Better a clear error than a silent success that never arrives.
    return NextResponse.json(
      { error: "Password reset email isn't configured on this deployment yet. Contact support." },
      { status: 503 }
    );
  }

  try {
    await requestPasswordReset(email);
  } catch (err) {
    console.error("Password reset email failed:", err);
    return NextResponse.json({ error: "We couldn't send the email just now. Try again shortly." }, { status: 502 });
  }

  // Deliberately the same answer whether or not the address has an account.
  return NextResponse.json({ ok: true });
}
