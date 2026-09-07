/**
 * Client for National Treasury's eTenders OCDS API.
 *
 * Endpoint contract confirmed via the Open Contracting Partnership's own
 * `kingfisher-collect` scraper (github.com/open-contracting/kingfisher-collect,
 * spiders/south_africa_national_treasury_api.py) since the live Swagger UI
 * wasn't reachable from this build environment:
 *
 *   GET https://ocds-api.etenders.gov.za/api/OCDSReleases
 *       ?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&PageNumber=N
 *
 * Each page returns an OCDS release package: `{ releases: [...], ... }`,
 * with some form of "next page" link. Since the exact pagination field
 * wasn't independently confirmed, this client tries the common OCDS
 * `links.next` shapes first and falls back to simply incrementing
 * PageNumber until a page comes back with zero releases — which works
 * regardless of whether a next-link is present at all.
 */

const BASE_URL = "https://ocds-api.etenders.gov.za/api/OCDSReleases";
const MAX_PAGES_SAFETY_CAP = 500;

export interface OcdsRelease {
  ocid?: string;
  date?: string;
  tag?: string[];
  [key: string]: unknown;
}

interface OcdsReleasePackage {
  releases?: OcdsRelease[];
  links?: { next?: string | { href?: string } } | Array<{ rel?: string; href?: string }>;
  [key: string]: unknown;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function extractNextLink(pkg: OcdsReleasePackage): string | null {
  const links = pkg.links;
  if (!links) return null;
  if (Array.isArray(links)) {
    const next = links.find((l) => l.rel === "next");
    return next?.href ?? null;
  }
  if (typeof links.next === "string") return links.next;
  if (links.next && typeof links.next === "object") return links.next.href ?? null;
  return null;
}

/**
 * Fetches all releases published between dateFrom and dateTo (inclusive),
 * following pagination. Yields releases as pages arrive so callers can
 * process/upsert incrementally rather than buffering everything in memory.
 */
export async function* fetchReleases(
  dateFrom: Date,
  dateTo: Date
): AsyncGenerator<OcdsRelease, void, unknown> {
  let pageNumber = 1;
  let url: string | null =
    `${BASE_URL}?dateFrom=${formatDate(dateFrom)}&dateTo=${formatDate(dateTo)}&PageNumber=${pageNumber}`;

  while (url && pageNumber <= MAX_PAGES_SAFETY_CAP) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`OCDS API request failed: ${res.status} ${res.statusText} (${url})`);
    }

    const pkg = (await res.json()) as OcdsReleasePackage;
    const releases = pkg.releases ?? [];

    for (const release of releases) {
      yield release;
    }

    const nextLink = extractNextLink(pkg);
    if (nextLink) {
      url = nextLink;
      pageNumber += 1;
    } else if (releases.length > 0) {
      // No explicit next link, but this page was non-empty — keep
      // incrementing PageNumber until we get an empty page.
      pageNumber += 1;
      url = `${BASE_URL}?dateFrom=${formatDate(dateFrom)}&dateTo=${formatDate(dateTo)}&PageNumber=${pageNumber}`;
    } else {
      url = null;
    }
  }
}
