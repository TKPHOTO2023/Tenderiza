import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateCurrentCompany } from "@/lib/current-company";
import { storage } from "@/lib/storage";

export async function GET() {
  const company = await getOrCreateCurrentCompany();
  const documents = await prisma.companyDocument.findMany({
    where: { companyId: company.id },
    include: { documentType: true },
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const company = await getOrCreateCurrentCompany();
  const formData = await req.formData();

  const file = formData.get("file");
  const documentTypeId = formData.get("documentTypeId");
  const expiryDate = formData.get("expiryDate");

  if (!(file instanceof File) || typeof documentTypeId !== "string") {
    return NextResponse.json({ error: "file and documentTypeId are required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { key } = await storage.put(company.id, file.name, buffer);

  const document = await prisma.companyDocument.create({
    data: {
      companyId: company.id,
      documentTypeId,
      fileName: file.name,
      fileUrl: key,
      mimeType: file.type || null,
      fileSizeBytes: buffer.byteLength,
      expiryDate: typeof expiryDate === "string" && expiryDate ? new Date(expiryDate) : null,
    },
    include: { documentType: true },
  });

  return NextResponse.json(document, { status: 201 });
}
