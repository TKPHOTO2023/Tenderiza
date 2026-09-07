import { NextRequest, NextResponse } from "next/server";
import { isAllowedDocumentHost } from "@/lib/tender-documents";

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  if (!isAllowedDocumentHost(target)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  const parsed = new URL(target);

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), { headers: { Accept: "application/pdf,*/*" } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: `Upstream returned ${upstream.status}` }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=300",
    },
  });
}
