import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCompany } from "@/lib/current-company";
import { storage } from "@/lib/storage";

// pdf-lib can only embed PNG and JPEG, and the logo's whole job is to go on a
// generated PDF — so the upload is restricted to what will actually render.
const ALLOWED = ["image/png", "image/jpeg"];
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a logo file to upload." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Logo must be a PNG or JPEG." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Logo must be under 2MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { key } = await storage.put(company.id, file.name, buffer);

  if (company.logoUrl) await storage.remove(company.logoUrl);

  const updated = await prisma.company.update({
    where: { id: company.id },
    data: { logoUrl: key },
  });

  return NextResponse.json({ logoUrl: updated.logoUrl });
}

export async function DELETE() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (company.logoUrl) await storage.remove(company.logoUrl);
  await prisma.company.update({ where: { id: company.id }, data: { logoUrl: null } });
  return NextResponse.json({ logoUrl: null });
}
