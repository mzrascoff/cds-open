# CDS Open Data — 44 universities, one shared skill

Machine-readable extraction of Common Data Set reports from **44 U.S.
universities**. Built by a single reusable Claude skill (`SKILL.md` at
the repo root) — no per-school code.

## Quick start

```bash
# Add a new school: edit scripts/manifest.py with PDF URLs (or scripts/manifest_html.py for HTML), then:
bash scripts/run_all.sh

# Output lands in schools/<your_school>/data/csv/
```

The full workflow Claude follows is in **[SKILL.md](./SKILL.md)** (174 lines).

## Repository structure

```
cds-open/
├── SKILL.md                        ← the reusable skill (top-level)
├── scripts/                        ← skill's parser scripts (top-level)
│   ├── manifest.py                 ← edit this with your school's CDS URLs
│   ├── manifest_html.py            ← for HTML-published CDSes (e.g. MIT 2018+)
│   ├── fetch.py                    ← downloads PDFs
│   ├── fetch_html.py               ← downloads + converts HTML pages
│   ├── parse_blocks.py             ← chunks PDFs into A0–J3 field blocks
│   ├── extract_metrics.py          ← emits the 9 standard CSVs
│   ├── validate.py                 ← spot-check pass-rate report
│   ├── build_master.py             ← aggregates per-school CSVs
│   └── run_all.sh                  ← one-command driver
├── references/
│   └── example-manifests/          ← Stanford, URL-template, local-path examples
├── schools/                        ← per-school data (44 schools)
│   ├── stanford/                   ← 18 years (full PDF coverage)
│   ├── mit/                        ← 14 years (PDF + HTML)
│   ├── penn/                       ← 16 years (user-uploaded PDFs)
│   ├── harvard/, yale/, princeton/, ... 41 more
│   └── <each>: raw_pdfs/, raw_text/, data/csv/, data/json/
├── master/                         ← cross-school aggregate CSVs
│   ├── admissions_master.csv
│   ├── tuition_master.csv
│   ├── test_scores_master.csv
│   ├── financial_aid_master.csv
│   ├── faculty_master.csv
│   └── graduation_rates_master.csv
├── INSIGHTS.md                     ← cross-school write-up
└── docs/DATA_QUALITY.md            ← per-school extraction notes
```

## Schools covered

**Deep coverage (10+ years):** Stanford (18), Penn (16), MIT (14)

**Multi-year:** Harvard, Yale, Princeton, Caltech, Cornell, Dartmouth,
Columbia, Duke, UChicago, Northwestern, NYU, USC, Tufts, WashU, Emory,
Carnegie Mellon, Georgia Tech, Rice, Notre Dame, UVA, UNC, Michigan,
UCLA, UC Davis, UC San Diego, UC Riverside, Florida, Penn State, Ohio
State, Pittsburgh, Minnesota, Iowa, Indiana, Rutgers, Arizona, Boston
College, Boston University, Northeastern, Brandeis, Wake Forest,
Lehigh, Swarthmore.

**Latest year only:** Brown.

(See `docs/DATA_QUALITY.md` for the schools that publish in formats not
yet supported — Wisconsin, UC Berkeley, Maryland, etc.)

## 2024-25 selectivity ranking

| # | School | Applied | Admit % | Yield % |
|---|---|---:|---:|---:|
| 1 | Caltech | 13,847 | **2.57%** | 61.2% |
| 2 | Stanford | 57,326 | 3.61% | 81.9% |
| 3 | Harvard | 53,985 | 3.65% | 83.6% |
| 4 | Columbia | 59,243 | 3.84% | 64.0% |
| 5 | Yale | 57,491 | 3.87% | 69.8% |
| 6 | UChicago | 42,831 | 4.56% | 88.3% |
| 7 | Princeton | 40,446 | 4.62% | 75.5% |
| 8 | MIT | 26,185 | 4.65% | 85.9% |
| 9 | Northeastern | 98,397 | 5.22% | 53.7% |
| 10 | Penn | 65,226 | 5.40% | 68.0% |
| 11 | Dartmouth | 30,965 | 5.45% | 69.1% |
| 12 | Duke | 51,795 | 5.71% | 58.8% |

(Top 12 of 33 schools that extracted cleanly for 2024-25. Full ranking
in INSIGHTS.md.)

## Reproducing this on a new school

1. **Add the school's CDS URLs** to `scripts/manifest.py`:
   ```python
   CDS_MANIFEST = [
       ("2024-2025", "https://example.edu/cds-2024-25.pdf"),
       ("2023-2024", "https://example.edu/cds-2023-24.pdf"),
   ]
   ```
2. **Run the pipeline:**
   ```bash
   bash scripts/run_all.sh
   ```
3. **Get clean CSVs** in `schools/<your_school>/data/csv/`. Validation
   typically lands at 90-100% spot-check pass.

## Standalone deep-dive companion repos

These three repos are slices of this dataset, each with their own
deeper analysis & dashboards:

- [stanfordcds](https://github.com/mzrascoff/stanfordcds) — Stanford alone, all 18 years, with notebook
- [MITcds](https://github.com/mzrascoff/MITcds) — MIT alone, 14 years (PDF + HTML), with v1/v2 history
- [ivypluscds](https://github.com/mzrascoff/ivypluscds) — 12 elite schools

Anything in those repos is also in this one (`schools/<school>/`), but
the standalone repos have school-specific READMEs and INSIGHTS.

## License & attribution

CDS data remains the intellectual property of each respective
institution; reproduced for non-commercial educational/research use.
The skill code (`SKILL.md`, `scripts/`) is MIT-licensed.
