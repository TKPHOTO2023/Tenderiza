import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const user = await prisma.user.findUnique({ where: { email } });

    // Same message and roughly the same work either way, so this can't be used
    // to discover which email addresses have accounts.
    const ok = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !ok) {
      return NextResponse.json({ error: "That email and password don't match." }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err) {
    return apiError(err, "Login failed");
  }
}
