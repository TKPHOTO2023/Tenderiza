import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const types = await prisma.documentType.findMany({ orderBy: [{ isCustom: "asc" }, { label: "asc" }] });
  return NextResponse.json(types);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const code = String(body.label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const type = await prisma.documentType.create({
    data: {
      code: `custom_${code}_${Date.now()}`,
      label: body.label,
      description: body.description || null,
      requiresExpiry: !!body.requiresExpiry,
      isCustom: true,
    },
  });
  return NextResponse.json(type, { status: 201 });
}
