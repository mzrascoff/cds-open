# CDS Open — web

Static Next.js data explorer for the CDS Open dataset. Lives in
`web/` so the data and the frontend ship from one repo.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS 3
- Recharts for charts
- Papaparse for CSV ingestion at build time

## Data flow

`scripts/build-data.ts` reads the six master CSVs in `../master/`,
normalizes them into one row per `(school, year)`, and writes
`lib/data/cds.generated.json` (~80 KB). That file is imported directly
into pages — no runtime fetches, no backend.

The build runs automatically before `dev` and `build` (npm `predev` /
`prebuild` hooks).

## Routes

| Path | Description |
|---|---|
| `/` | Landing page with hero CTA + 6 curated insight cards |
| `/compare/[school]` | School vs. peer-group small-multiples (hero view) |
| `/insights/[slug]` | Curated narrative pages with embedded charts |
| `/school/[slug]` | Single-school deep-dive (no peer overlay) |
| `/explore` | Multi-school flexible explorer with URL state |

## Local development

```bash
cd web
npm install
npm run dev          # runs build:data automatically, then next dev
```

Then open `http://localhost:3000`.

## Deploying to Vercel

In the Vercel project settings:

1. **Settings → General → Root Directory:** set to `web`
2. **Framework preset:** Next.js (auto-detected once root is set)
3. Leave Build Command, Install Command, Output Directory empty —
   Vercel's Next.js adapter handles them.

Every push then rebuilds. Each rebuild re-parses the master CSVs (via
the `prebuild` hook), so updating data just means updating CSVs and
merging — no separate data step.

## Adding insights

Edit `lib/data/insights.ts` — each entry is a self-contained spec
(title, hook, schools, metric, body paragraphs). Pages are generated
by `app/insights/[slug]/page.tsx` automatically.

## Adding/removing peer groups

Edit `lib/data/schools.ts`. The `groups` array on each `SchoolMeta`
entry controls which peer groups a school belongs to; `PEER_GROUPS`
defines the labels.
