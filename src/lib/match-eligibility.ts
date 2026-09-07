import type { BbbeeLevel } from "@prisma/client";
import type { ExtractedRequirements } from "@/lib/tender-extraction";

export interface HardCheck {
  requirement: string;
  status: "pass" | "fail" | "needs_review" | "info";
  detail: string;
}

// Lower rank = better standing. EME is treated as satisfying virtually any
// stated level requirement (per the B-BBEE codes' general treatment of
// exempt micro-enterprises); QSE is a middling assumption absent more detail.
const BBBEE_RANK: Record<BbbeeLevel, number> = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
  LEVEL_6: 6,
  LEVEL_7: 7,
  LEVEL_8: 8,
  EXEMPT_MICRO_ENTERPRISE: 1,
  QUALIFYING_SMALL_ENTERPRISE: 4,
  NON_COMPLIANT: 9,
};

function parseCidbGradeNumber(text: string | null): number | null {
  if (!text) return null;
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function parseRequiredBbbeeRank(text: string | null): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (lower.includes("eme") || lower.includes("exempt micro")) return 1;
  if (lower.includes("qse") || lower.includes("qualifying small")) return 4;
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Compares AI-extracted tender requirements against the company's profile.
 * Returns per-requirement checks (pass/fail/needs_review/info) — briefing
 * and functionality-threshold are surfaced as "info" since they aren't
 * something we can auto-verify, just useful to see.
 */
export function computeHardChecks(
  extracted: ExtractedRequirements,
  company: { cidbGrade: string | null; bbbeeLevel: BbbeeLevel | null }
): HardCheck[] {
  const checks: HardCheck[] = [];

  if (extracted.requiredCidbGrade) {
    const requiredNum = parseCidbGradeNumber(extracted.requiredCidbGrade);
    if (requiredNum == null) {
      checks.push({
        requirement: "CIDB Grade",
        status: "needs_review",
        detail: `Tender states a CIDB grade requirement ("${extracted.requiredCidbGrade}") that couldn't be parsed automatically — check manually.`,
      });
    } else if (!company.cidbGrade) {
      checks.push({
        requirement: "CIDB Grade",
        status: "needs_review",
        detail: `Requires CIDB Grade ${requiredNum} — you haven't set a CIDB grade in your profile.`,
      });
    } else {
      const companyNum = parseInt(company.cidbGrade, 10);
      const pass = !isNaN(companyNum) && companyNum >= requiredNum;
      checks.push({
        requirement: "CIDB Grade",
        status: pass ? "pass" : "fail",
        detail: pass
          ? `Requires Grade ${requiredNum} — your profile has Grade ${company.cidbGrade} ✓`
          : `Requires Grade ${requiredNum} — your profile has Grade ${company.cidbGrade} ✗`,
      });
    }
  }

  if (extracted.requiredBbbeeLevel) {
    const requiredRank = parseRequiredBbbeeRank(extracted.requiredBbbeeLevel);
    if (requiredRank == null) {
      checks.push({
        requirement: "B-BBEE Level",
        status: "needs_review",
        detail: `Tender states a B-BBEE requirement ("${extracted.requiredBbbeeLevel}") that couldn't be parsed automatically — check manually.`,
      });
    } else if (!company.bbbeeLevel) {
      checks.push({
        requirement: "B-BBEE Level",
        status: "needs_review",
        detail: `Requires ${extracted.requiredBbbeeLevel} — you haven't set a B-BBEE level in your profile.`,
      });
    } else {
      const companyRank = BBBEE_RANK[company.bbbeeLevel];
      const pass = companyRank <= requiredRank;
      checks.push({
        requirement: "B-BBEE Level",
        status: pass ? "pass" : "fail",
        detail: pass
          ? `Requires ${extracted.requiredBbbeeLevel} — your profile meets this ✓`
          : `Requires ${extracted.requiredBbbeeLevel} — your profile level doesn't meet this ✗`,
      });
    }
  }

  if (extracted.briefingCompulsory) {
    checks.push({
      requirement: "Compulsory briefing",
      status: "info",
      detail: `Attendance required${extracted.briefingDate ? ` — ${extracted.briefingDate}` : ""}${
        extracted.briefingVenue ? ` at ${extracted.briefingVenue}` : ""
      }.`,
    });
  }

  if (extracted.functionalityThreshold) {
    checks.push({
      requirement: "Functionality threshold",
      status: "info",
      detail: `Minimum functionality score to proceed: ${extracted.functionalityThreshold}.`,
    });
  }

  return checks;
}
