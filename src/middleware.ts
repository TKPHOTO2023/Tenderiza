import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "tenderiza_session";

// Public API surface: the marketing site's tender register, the contact form,
// auth itself, and the cron endpoint (which has its own CRON_SECRET check).
const PUBLIC_API = ["/api/auth", "/api/contact", "/api/cron", "/api/billing/webhook"];
const PUBLIC_API_GET = ["/api/tenders"];

/**
 * A cheap gate at the edge: is there a session cookie at all? It can't reach
 * the database, so it only redirects or 401s the obvious cases — every route
 * still resolves the real session server-side before trusting anything.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API.some((p) => pathname.startsWith(p))) return NextResponse.next();
    // The public tenders register is readable; anything that changes it isn't.
    if (req.method === "GET" && PUBLIC_API_GET.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.next();
    }
    if (!hasCookie) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!hasCookie) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/api/:path*"],
};
