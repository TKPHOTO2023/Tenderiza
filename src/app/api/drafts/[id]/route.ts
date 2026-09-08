import { NextRequest, NextResponse } from "next/server";
import { DraftStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draft = await prisma.draft.findUnique({ where: { id }, include: { tender: true } });
  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  return NextResponse.json(draft);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const status = body.status as string | undefined;
  if (!status || !Object.values(DraftStatus).includes(status as DraftStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const draft = await prisma.draft.update({
    where: { id },
    data: { status: status as DraftStatus },
    include: { tender: true },
  });
  return NextResponse.json(draft);
}
