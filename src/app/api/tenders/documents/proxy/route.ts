import { NextRequest, NextResponse } from "next/server";

// Government procurement document hosts we're willing to proxy. Keeps this
// route from being usable as an open SSRF relay to arbitrary URLs while
// still covering the domains eTenders documents actually come from.
const ALLOWED_HOST_SUFFIXES = [".etenders.gov.za", ".treasury.gov.za", "etenders.gov.za", "treasury.gov.za"];

function isAllowedHost(hostname: string) {
  return ALLOWED_HOST_SUFFIXES.some((suffix) => hostname === suffix.replace(/^\./, "") || hostname.endsWith(suffix));
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || !isAllowedHost(parsed.hostname)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

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
