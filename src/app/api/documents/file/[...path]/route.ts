import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { storage } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await params;
  const storageKey = pathSegments.join("/");

  try {
    const filePath = storage.resolvePath(storageKey);
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `inline; filename="${pathSegments[pathSegments.length - 1]}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
