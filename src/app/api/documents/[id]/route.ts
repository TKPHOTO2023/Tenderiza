import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const document = await prisma.companyDocument.update({
    where: { id },
    data: {
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : body.expiryDate === null ? null : undefined,
      documentTypeId: body.documentTypeId ?? undefined,
    },
    include: { documentType: true },
  });
  return NextResponse.json(document);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await prisma.companyDocument.findUnique({ where: { id } });
  if (document) {
    await storage.remove(document.fileUrl);
    await prisma.companyDocument.delete({ where: { id } });
  }
  return NextResponse.json({ ok: true });
}
