# Tenderiza — SA Tender Automation Platform

**Phase 1: Company Profile & Document Setup.** A guided onboarding wizard and
editable dashboard for South African businesses to capture the profile data
and compliance documents that later phases (tender ingestion, eligibility
scoring, document drafting, human review) will build on.

## Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + hand-rolled shadcn/ui-style components (Radix primitives)
- **Backend:** Next.js Route Handlers (`src/app/api/**`)
- **Database:** PostgreSQL via Prisma ORM
- **File storage:** local filesystem (`./uploads`) in dev, [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) in any environment with `BLOB_READ_WRITE_TOKEN` set — both live behind `src/lib/storage.ts` so callers don't care which is active
- **Forms/validation:** react-hook-form + zod (wired for future use), controlled components for the wizard

## Data model

See `prisma/schema.prisma`. Core tables:

- `companies` — steps 1–3 profile fields (basics, compliance/registration status, capability), plus onboarding progress tracking
- `categories` / `company_categories` — UNSPSC-style sector categories, many-to-many with company
- `company_accreditations` — custom sector accreditations (NHBRC, ISO, etc.)
- `company_references` — past project references
- `document_types` — extensible catalog of document types (seeded, plus user-added custom types)
- `company_documents` — uploaded files, tagged by type, with optional expiry tracking

The schema is intentionally single-tenant for Phase 1 (no auth yet) —
`src/lib/current-company.ts` resolves "the" company profile and is the one
place to change when multi-tenant auth is added later.

## Running locally

### 1. Start Postgres

```bash
docker compose up -d
```

This starts Postgres 16 on `localhost:5432` with a `tenderiza` database,
user, and password (see `docker-compose.yml`).

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

The defaults in `.env.example` already match `docker-compose.yml`, so no
edits are needed for local dev.

### 4. Run migrations & seed data

```bash
npm run db:migrate
npm run db:seed
```

This creates the schema and seeds ~20 sector categories and 9 standard
compliance document types (CIPC certificate, B-BBEE certificate, tax
clearance, CSD registration, CIDB certificate, bank confirmation letter,
directors' IDs, company profile/brochure, proof of address).

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected
into the onboarding wizard on first visit; once you finish (or click "Save &
finish later"), you land on `/dashboard`.

### Other useful commands

```bash
npm run db:studio   # Prisma Studio — browse/edit the database visually
npm run build        # production build
npm run lint          # eslint
```

## App structure

```
src/
  app/
    onboarding/         # 5-step setup wizard (save-and-resume)
    dashboard/
      page.tsx           # overview: completeness widget + section cards
      profile/            # editable Basics / Compliance / Capability tabs
      documents/           # editable document upload & expiry tracking
      tenders/  matches/  drafts/   # Phase 2–4 placeholders ("Coming soon")
    api/                  # route handlers: company, categories, references,
                           # accreditations, document-types, documents (+ file serving)
  components/
    onboarding/           # step form components, shared between wizard & profile edit
    documents/            # document upload/list manager, expiry badge
    dashboard/            # sidebar nav, completeness widget, coming-soon placeholder
    ui/                   # hand-rolled shadcn/ui-style primitives
  lib/
    prisma.ts, storage.ts, current-company.ts, completeness.ts, constants.ts
```

Uploaded files are stored under `./uploads/<companyId>/<uuid>.<ext>` locally
and served back through `/api/documents/file/[...path]`. When
`BLOB_READ_WRITE_TOKEN` is set, `src/lib/storage.ts` uploads to Vercel Blob
instead and `company_documents.fileUrl` stores the Blob's public URL directly.

## Deploying to Vercel

1. **Import the repo** in the Vercel dashboard (New Project → this GitHub
   repo). Framework preset (Next.js) is auto-detected — no build command
   changes needed.

2. **Add a Postgres database.** Vercel's Storage tab → Create Database →
   Postgres (Neon-backed) is the easiest path; Neon/Supabase/RDS work too.
   Either way, set the resulting connection string as the `DATABASE_URL`
   environment variable on the Vercel project (all environments).

3. **Add a Blob store** for document uploads: Storage tab → Create → Blob.
   Attaching it to the project auto-populates `BLOB_READ_WRITE_TOKEN` as an
   env var — nothing else to configure; `src/lib/storage.ts` picks it up
   automatically and switches off local-disk storage.

4. **Run migrations against the production database** (once, and again after
   any future schema change):

   ```bash
   DATABASE_URL="<your production connection string>" npm run db:migrate:deploy
   DATABASE_URL="<your production connection string>" npm run db:seed
   ```

   `prisma generate` itself runs automatically on Vercel via the `postinstall`
   script — you don't need to add anything to the build command for that.

5. **Deploy.** Push to the branch Vercel is watching (or trigger a deploy from
   the dashboard) — `npm install` → `postinstall` (Prisma Client generation)
   → `next build` all run automatically.

Note: this project has no auth yet (Phase 1 is intentionally single-tenant —
see `src/lib/current-company.ts`), so anyone with the deployed URL sees/edits
the same one company profile. Fine for an internal demo; add auth before
sharing the URL more broadly.

## Phase 2: Tender ingestion

Pulls live tender opportunities from National Treasury's eTenders OCDS API
(`https://ocds-api.etenders.gov.za/api/OCDSReleases`, no API key required)
into a `tenders` table, and shows them at **Dashboard → Tenders**.

- `src/lib/ocds-client.ts` — paginated fetch against the live API.
- `src/lib/tender-normalize.ts` — tolerant mapping from an OCDS release into
  our `Tender` shape (title, buyer, province, category, status, dates, value,
  document links). Every field is best-effort — OCDS publishers vary a lot in
  completeness — and the full original release is always kept in `rawData`
  so nothing normalization missed is ever lost.
- `src/lib/tender-sync.ts` — upserts by `ocid` (dedup key) and records every
  run in `tender_sync_logs` (fetched/created/updated counts, success/error).
- The **Tenders** page defaults to open tenders with a future closing date,
  soonest-closing first; a "show all" toggle reveals closed/cancelled ones
  too. Closing-date badges highlight anything due within 7 (red) or 14
  (amber) days.

**Manual sync:** click "Sync now" on the Tenders page (pulls the last 14
days of releases). **Automatic sync:** `vercel.json` schedules
`GET /api/cron/sync-tenders` daily via Vercel Cron (pulls the last 3 days —
enough for a daily catch-up). To protect that endpoint from being triggered
by anyone who finds the URL, set a `CRON_SECRET` env var on the Vercel
project — Vercel automatically sends it as a bearer token on cron-triggered
requests, and the route checks for it (skipped if you don't set one, since
Vercel Cron doesn't require it, but then the endpoint runs for anyone who
GETs it).

No sample/fixture tenders are seeded — this table only ever holds what the
real API returns. If a sync finishes with `releasesFetched: 0`, that's the
live API genuinely having nothing published in that date window, not a bug.

**Note on endpoint verification:** this sandbox's network policy blocks
outbound requests to `ocds-api.etenders.gov.za`, so the endpoint contract
above was confirmed via the Open Contracting Partnership's own
`kingfisher-collect` scraper source rather than a live test call from here.
The ingestion code is written defensively (tolerant of missing fields, safe
pagination fallback) precisely because of that — **you'll want to run the
first real "Sync now" after deploying and skim a tender's `rawData` in the
database to confirm the field mapping (especially `province`, which OCDS
doesn't standardize well) looks right, and tell me if anything needs
adjusting.**

### AI requirements summary

On a tender's detail page, "Generate summary" reads the tender's linked PDF
documents (falling back to just its OCDS description if none are readable)
and extracts, via Claude, what a bidding company would actually need to
deliver: scope of work, deliverables, eligibility requirements, submission
requirements, and any extra key dates.

- Requires an `ANTHROPIC_API_KEY` environment variable — get one at
  [console.anthropic.com](https://console.anthropic.com). Without it, the
  button returns a clear error instead of the summary; nothing else in the
  app depends on this key.
- Uses `claude-opus-5` with structured output (`src/lib/tender-summary.ts`)
  so the response always matches a fixed schema — no free-text parsing.
- Generation is manual and cached (`tenders.requirementsSummary` +
  `requirementsSummaryGeneratedAt`) — it costs a real API call per
  generation, so it never runs automatically on page load, only on click.
- Documents are only fetched from `*.etenders.gov.za` / `*.treasury.gov.za`
  (same allowlist as the document preview proxy) and capped at 3 PDFs per
  tender to keep request size and cost bounded.
- This is a lightweight, on-demand version of what Phase 3 (eligibility
  scoring) and Phase 4 (document drafting) will eventually do more
  systematically against a company's actual profile — this just summarizes
  the tender itself, with no matching against your company yet.

### AI cost estimate ("quote guidance")

Also on the tender detail page, "Estimate cost" (`src/lib/tender-cost-estimate.ts`)
gives a rough ZAR range for what a company might quote — reasoned from the
scope of work like an experienced estimator (typical SA public-sector rates,
labor/materials/duration drivers), **independently of any official OCDS
estimated value every time** — deliberately not just parroting back that
number. If OCDS did publish one, it's shown alongside for comparison, with a
short note on whether the AI estimate agrees with it or why it might not.

This is a **generic market-rate estimate, not personalized** to any one
company's actual cost structure or past project history — same output for
every company on the same tender. Shares the same document-fetch allowlist,
manual-trigger-and-cache pattern, and `ANTHROPIC_API_KEY` requirement as the
requirements summary above (`src/lib/tender-documents.ts` is the shared
piece both features fetch PDFs through). Always a range with a stated
confidence level, never a false-precision single number — and always
labeled as guidance, not a formal quote.

## Phase 3: Eligibility matching

Every open tender is scored against your company profile automatically —
right after every sync (manual "Sync now" or the daily cron) — and shown at
**Dashboard → Matches**, ranked best-first with a "Recompute all" button and
a per-tender "Re-check" action.

**Two layers**, per the original spec:

1. **Structural (Layer 1, no AI call, `src/lib/match-structural.ts`)** —
   compares the tender's OCDS category/title/description against your
   selected sector categories (via a hand-built keyword map per category,
   since OCDS carries no shared taxonomy with our own — see
   `CATEGORY_KEYWORDS`), and its province (normalized from whatever raw
   string/abbreviation the publisher used) against your operating
   provinces. Produces a `strong` / `weak` / `none` tier — `none` (no
   overlap on either axis) skips Layer 2 entirely to avoid spending an API
   call on an irrelevant tender.
2. **AI requirement extraction (Layer 2, `src/lib/tender-extraction.ts`)**
   — for tenders that pass Layer 1, reads the tender's actual PDF documents
   and extracts (via Claude structured output, same pattern as the Phase 2
   AI features) the things OCDS metadata never carries: required B-BBEE
   level, required CIDB grade/class, whether a briefing is compulsory (+
   date/venue), and any functionality threshold — explicitly told to
   return `null` rather than guess. Cached on the tender
   (`extractedRequirements`/`requirementsExtractedAt`) and only re-run via
   "Re-check", since tender documents essentially never change after
   publication.

`src/lib/match-eligibility.ts` then compares the extracted requirements
against your profile — CIDB grade as a numeric comparison, B-BBEE as a
rank comparison (EME/QSE treated as satisfying most level requirements,
per how the B-BBEE codes generally work) — producing a pass/fail/needs-review
per requirement, plus **info-only** entries for briefing/functionality
details you can't auto-verify but should know about.

**Overall status** (`matches.status`):
- **Not eligible** — no structural overlap at all, or a hard requirement
  (CIDB/B-BBEE) is explicitly failed.
- **Needs review** — a hard requirement is stated but your profile is
  missing that field, extraction couldn't parse a stated grade/level, or
  extraction hasn't successfully run yet (e.g. `ANTHROPIC_API_KEY` isn't
  set) — **never silently hidden or marked ineligible**, exactly as
  specified.
- **Eligible** — both category and province match, and every statable hard
  requirement passes.
- **Partial** — only one of category/province matches, with no hard
  failures.

**Cost/time control:** a single sync run caps Layer 2 extractions at 3 new
tenders (manual "Recompute all" allows 5) to stay within the serverless
function's time budget — tenders whose extraction misses the cap keep
their structural-only score and get picked up on the next sync or a manual
recompute, never left unscored.

**Single-tenant today, multi-tenant-ready:** `matches` is keyed by
`companyId` + `tenderId` (unique constraint) even though Phase 1 only ever
creates one `Company` row — so this doesn't need reshaping if/when
multi-company auth lands later.

Verified locally end-to-end against hand-inserted test tenders (structural
tiers and the not-eligible/needs-review paths all confirmed correct) — the
`eligible`/`partial` outcomes specifically depend on Layer 2 succeeding,
which needs `ANTHROPIC_API_KEY` configured; test those once the key is in
place.

## Phase 4: Document drafting

From a tender's **Matches** detail page, "Generate draft" (only ever
per-tender, never bulk — deliberately, for tenders you've actually decided
to pursue) produces a first-pass bid document set, shown at
**Dashboard → Drafts**.

**Critical constraint — this is drafting assistance, not legal sign-off:**

- Only objective, factual company data already held and trusted is ever
  auto-filled: company name, registration number, VAT number, address,
  banking details, B-BBEE level, CIDB grading, tax compliance status,
  contact details.
- Subjective declarations, yes/no compliance attestations, and anything
  requiring a signature are **never** auto-filled or pre-checked — they're
  left visibly blank with a `[TO BE COMPLETED BY BIDDER — REQUIRES
  SIGN-OFF]` marker instead.
- Every generated document is watermarked "DRAFT" **in the document
  itself** (diagonal stamp + header, via `src/lib/draft-pdf.ts` and
  `src/lib/pdf-form-fill.ts`), not just flagged in the app UI. The Drafts
  UI itself also makes this unmissable — a red-bordered warning banner and
  a "DRAFT" badge with an alert icon on every draft, not a small badge.

**Document generation pipeline** (`src/lib/draft-runner.ts`):

1. **Compliance documents** (`src/lib/draft-documents.ts`) — for each of
   the tender's own PDF documents, attempts to fill it directly via
   `src/lib/pdf-form-fill.ts` (pdf-lib AcroForm field-filling: text fields
   matched by keyword against known company data; declaration/signature
   fields detected by name and marked with the sign-off placeholder
   instead of guessed). **Only real fillable form fields (AcroForm) are
   ever filled — there is no OCR or scanned-form filling**, since a wrong
   auto-fill on a legal document is worse than a clearly-labeled blank
   one. If none of the tender's documents are machine-fillable, falls back
   to generating an equivalent compliance-summary PDF from scratch,
   clearly labeled as a Tenderiza-generated equivalent rather than the
   official form.
2. **Technical proposal draft** (`src/lib/technical-proposal.ts`) — Claude
   (structured output) drafts an approach narrative from the tender's
   scope summary and the company's categories/capacity/past references.
   Explicitly instructed not to fabricate relevance: if past references
   don't obviously relate to this tender's scope, the draft says so
   (`referenceGapNote`) rather than forcing a connection, and always
   includes reviewer notes on what the bidder should check.
3. **Compliance checklist** (`src/lib/compliance-checklist.ts`) — cross-checks
   Phase 1 document expiry against the tender's closing date, folds in
   Phase 3's hard-requirement checks, and always lists the standard
   signature declarations (SBD 4, 6.1, 8, 9) as needing manual attention.
   Never marks a declaration "done" — only ever `needs_review`.

All generated files are uploaded via the same `src/lib/storage.ts` used for
Phase 1 documents. A `drafts` row (keyed by `companyId` + `tenderId`, same
multi-tenant-ready pattern as `matches`) tracks status —
`GENERATED` / `EDITED` / `FINALIZED` (finalized just means "you've marked it
ready," not that anything has been submitted anywhere) — plus the document
references and checklist as JSON. "Regenerate" on a draft's detail page
re-runs the whole pipeline and overwrites it.

Requires `ANTHROPIC_API_KEY` for the technical proposal step (same as
Phase 2/3's AI features); the compliance-document step needs no API key and
was verified independently of it. Costs one real Claude API call per
generation — hence the per-tender, opt-in "Generate draft" action rather
than anything automatic.

**Not built, deliberately:** Phase 5 (human review & submission workflow).
Nothing in Phase 4 implies a draft is ready to submit — that's the entire
point of the DRAFT watermarking and the sign-off markers.

## Notes on scope

Phases 1–4 are built, per the product plan:

1. **Company profile onboarding** ✅
2. **Tender ingestion** (National Treasury eTenders OCDS API) ✅
3. **Eligibility scoring** ✅
4. **Document drafting** (SBD forms, proposals) ✅
5. Human review & submission — not built

The nav, data model, and API layer are structured so phase 5 can be added
without reshaping what's here: `matches` and `drafts` are already keyed by
`companyId` + `tenderId` even though there's only ever one `Company` row
today, ready for multi-tenant auth without a schema change.
