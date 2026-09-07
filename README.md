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
