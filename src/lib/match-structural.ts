import type { Province } from "@prisma/client";

// Extra keywords per seeded sector category (see prisma/seed.ts) to catch
// overlap against raw OCDS category/title/description text, which uses its
// own vocabulary (often just "works"/"services"/"goods", or a UNSPSC-style
// classification description) with no shared taxonomy to our own — mapping
// that properly is exactly what this file exists to approximate.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "72000000": ["construction", "building", "renovation", "refurbishment", "facilities", "maintenance", "works", "civil", "repair"],
  "81110000": ["software", "information technology", "ict", "systems", "applications", "development", "network"],
  "80100000": ["consulting", "legal", "accounting", "audit", "advisory", "professional services"],
  "92120000": ["security", "guarding", "surveillance", "access control"],
  "90900000": ["cleaning", "hygiene", "janitorial", "sanitation"],
  "90190000": ["catering", "hospitality", "food services", "canteen"],
  "78100000": ["transport", "logistics", "freight", "haulage", "delivery", "fleet"],
  "50000000": ["supply", "consumables", "goods", "stationery", "provision of"],
  "39000000": ["furniture", "fixtures", "fittings", "office furniture"],
  "43000000": ["electronics", "it equipment", "computer", "hardware", "laptops"],
  "83100000": ["engineering", "structural", "mechanical", "electrical", "technical services"],
  "85100000": ["healthcare", "medical", "clinical", "hospital", "nursing"],
  "86100000": ["education", "training", "learning", "capacity building", "development programme"],
  "77100000": ["agriculture", "farming", "agricultural"],
  "76100000": ["mining", "extraction", "mineral"],
  "82100000": ["printing", "publishing", "signage", "graphic design"],
  "93140000": ["waste management", "environmental", "recycling", "disposal"],
  "84110000": ["financial", "insurance", "banking", "actuarial"],
  "60100000": ["fleet", "vehicle maintenance", "vehicle repair", "tyres"],
  "95000000": ["event", "conference", "exhibition", "function"],
};

// Normalizes raw OCDS province strings (varies a lot by publisher — full
// names, abbreviations, different casing) onto our Province enum.
const PROVINCE_ALIASES: Record<string, Province> = {
  "eastern cape": "EASTERN_CAPE",
  ec: "EASTERN_CAPE",
  "free state": "FREE_STATE",
  fs: "FREE_STATE",
  gauteng: "GAUTENG",
  gp: "GAUTENG",
  "kwazulu-natal": "KWAZULU_NATAL",
  "kwazulu natal": "KWAZULU_NATAL",
  kzn: "KWAZULU_NATAL",
  limpopo: "LIMPOPO",
  lp: "LIMPOPO",
  mpumalanga: "MPUMALANGA",
  mp: "MPUMALANGA",
  "northern cape": "NORTHERN_CAPE",
  nc: "NORTHERN_CAPE",
  "north west": "NORTH_WEST",
  nw: "NORTH_WEST",
  "western cape": "WESTERN_CAPE",
  wc: "WESTERN_CAPE",
};

export function normalizeProvince(raw: string | null): Province | null {
  if (!raw) return null;
  return PROVINCE_ALIASES[raw.trim().toLowerCase()] ?? null;
}

export interface StructuralMatchResult {
  categoryMatch: boolean;
  provinceMatch: boolean;
  tier: "strong" | "weak" | "none";
  reasons: string[];
}

export function computeStructuralMatch(
  companyCategoryCodes: string[],
  companyProvinces: Province[],
  tender: { category: string | null; title: string | null; description: string | null; province: string | null }
): StructuralMatchResult {
  const haystack = [tender.category, tender.title, tender.description].filter(Boolean).join(" ").toLowerCase();

  let categoryMatch = false;
  let matchedCategoryLabel: string | null = null;
  for (const code of companyCategoryCodes) {
    const keywords = CATEGORY_KEYWORDS[code] ?? [];
    if (keywords.some((kw) => haystack.includes(kw))) {
      categoryMatch = true;
      matchedCategoryLabel = keywords.find((kw) => haystack.includes(kw)) ?? null;
      break;
    }
  }

  const tenderProvince = normalizeProvince(tender.province);
  const provinceMatch = tenderProvince != null && companyProvinces.includes(tenderProvince);

  const reasons: string[] = [];
  if (categoryMatch) reasons.push(`Category overlap detected ("${matchedCategoryLabel}")`);
  else reasons.push("No overlap with your selected sector categories");

  if (provinceMatch) reasons.push(`Operates in ${tenderProvince}, which you cover`);
  else if (tenderProvince) reasons.push(`Tender is in ${tenderProvince}, which you haven't selected`);
  else reasons.push("Tender's province couldn't be determined");

  const tier = categoryMatch && provinceMatch ? "strong" : categoryMatch || provinceMatch ? "weak" : "none";

  return { categoryMatch, provinceMatch, tier, reasons };
}
