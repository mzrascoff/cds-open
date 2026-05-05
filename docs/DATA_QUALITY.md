# Data quality notes

The `cds-extractor` skill extracts cleanly from the vast majority of CDS
PDFs in this dataset. This document records the per-school quality issues.

## Schools where some 2024-25 fields didn't extract

These schools have CSVs but the `admissions_summary` is missing — usually
because the school uses a non-standard C1 layout (e.g. multi-section CDS,
rotated tables, or font encoding issues):

- **Boston University** — CDS uses an unusual narrow layout
- **Carnegie Mellon** — empty admissions section
- **UNC** — admissions table format differs from standard

The raw CDS text is preserved in `schools/<school>/raw_text/` and the per-field block JSON in `schools/<school>/data/json/<year>/blocks.json`. To extract the missing fields, tighten the regex in `skill/scripts/extract_metrics.py` and re-run.

## Schools that publish CDS in formats not yet supported

These AAUDE-affiliated schools were excluded because they don't publish
PDFs that the skill can ingest:

- **Wisconsin, UC Irvine, Colorado, Washington** — HTML-only, embedded in dashboards
- **Maryland** — Excel (XLSX) only
- **UC Berkeley** — Excel-first; older PDFs scattered
- **UC Santa Barbara** — no public per-year PDFs found
- **Tulane** — index page exists but URLs require interactive scraping
- **Vanderbilt** — index page found but no direct PDF URLs in search results
- **UT Austin** — interactive dashboard, no per-year PDFs in search results
- **Amherst** — splits each year's CDS into 10 per-section PDFs (would need section-merging support)

Adding any of these requires either: (a) extending the skill's `fetch_html.py`
ingester for HTML-published CDSes, (b) adding XLSX support, or (c) manually
downloading PDFs and dropping them in the school's `raw_pdfs/` folder.

## Schools where downloads failed (HTTP 403 / 404)

The skill could not retrieve PDFs from these schools' index pages
(403/404 from anti-scraping or expired URL hashes):

- **Johns Hopkins** — 403 Forbidden
- **Williams** — 403 Forbidden
- **Notre Dame** — 404 (some URLs)
- **Indiana, Iowa, Rice, Swarthmore, Emory** — some years 404'd; latest year usually downloaded

Re-download with a different User-Agent or via wayback would likely succeed.

## Public flagship tuition values

The "tuition" field for public flagships in `master/tuition_master.csv`
typically captures the IN-STATE rate (the first row in the G1 table).
For out-of-state tuition, see `tuition_and_fees.csv` per school where
`expense=tuition_out_of_state`.

## How to re-run

Each school's data can be regenerated from its `raw_pdfs/` with:

```bash
cd schools/<school>
python3 ../../scripts/parse_blocks.py
python3 ../../scripts/extract_metrics.py
```

To rebuild master CSVs after per-school changes:
```bash
python3 scripts/build_master.py
```
