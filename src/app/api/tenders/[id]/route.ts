import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tender = await prisma.tender.findUnique({ where: { id } });
  if (!tender) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tender);
}
