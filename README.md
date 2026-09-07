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

## Notes on scope

This is Phase 1 only, per the product plan:

1. **Company profile onboarding** ✅ this build
2. Tender ingestion (National Treasury eTenders OCDS API) — not built
3. Eligibility scoring — not built
4. Document drafting (SBD forms, proposals) — not built
5. Human review & submission — not built

The nav, data model, and API layer are structured so phases 2–5 can be added
without reshaping what's here: `companies`/`company_documents` already carry
the typed fields (dates as dates, enums for statuses) an eligibility engine
would query directly, and the dashboard nav already has placeholder routes
for Tenders, Matches, and Drafts.
