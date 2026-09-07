import { NextRequest, NextResponse } from "next/server";
import { Prisma, TenderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const search = params.get("search")?.trim();
  const province = params.get("province");
  const category = params.get("category");
  const showClosed = params.get("showClosed") === "true";

  const where: Prisma.TenderWhereInput = {};

  if (!showClosed) {
    where.status = TenderStatus.OPEN;
    where.closingDate = { gt: new Date() };
  }

  if (province) where.province = province;
  if (category) where.category = category;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { buyerName: { contains: search, mode: "insensitive" } },
    ];
  }

  const tenders = await prisma.tender.findMany({
    where,
    orderBy: { closingDate: "asc" },
    take: 200,
  });

  const [provinces, categories] = await Promise.all([
    prisma.tender.findMany({
      where: { province: { not: null } },
      select: { province: true },
      distinct: ["province"],
    }),
    prisma.tender.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  return NextResponse.json({
    tenders,
    filters: {
      provinces: provinces.map((p) => p.province).filter(Boolean),
      categories: categories.map((c) => c.category).filter(Boolean),
    },
  });
}
