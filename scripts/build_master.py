"""Aggregate per-school CSVs into master/*_master.csv.
Run from the repo root: `python3 scripts/build_master.py`"""
import csv, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHOOLS_DIR = f"{ROOT}/schools"
MASTER = f"{ROOT}/master"
os.makedirs(MASTER, exist_ok=True)
SCHOOLS = sorted([d for d in os.listdir(SCHOOLS_DIR) if os.path.isdir(f"{SCHOOLS_DIR}/{d}")])
def load(school, fname):
    p = f"{SCHOOLS_DIR}/{school}/data/csv/{fname}"
    return list(csv.DictReader(open(p))) if os.path.exists(p) else []
def to_int(s):
    try: return int(float(s)) if s else None
    except: return None
def write(name, rows, fields):
    with open(f"{MASTER}/{name}", 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader(); w.writerows(rows)

# admissions
adm_rows = []
for s in SCHOOLS:
    by_year = {}
    for r in load(s, "admissions_summary.csv"):
        by_year.setdefault(r['year'], {})[r['metric']] = to_int(r['value'])
    for y in sorted(by_year):
        d = by_year[y]
        a, m, e = d.get('applied'), d.get('admitted'), d.get('enrolled')
        adm_rows.append({'school': s, 'year': y,
                         'applied': a or '', 'admitted': m or '', 'enrolled': e or '',
                         'admit_rate_pct': round(m/a*100,2) if (a and m) else '',
                         'yield_pct': round(e/m*100,2) if (m and e) else ''})
write("admissions_master.csv", adm_rows,
      ['school','year','applied','admitted','enrolled','admit_rate_pct','yield_pct'])

# tuition
tu_rows = []
for s in SCHOOLS:
    by_year = {}
    for r in load(s, "tuition_and_fees.csv"):
        by_year.setdefault(r['year'], {})[r['expense']] = float(r['amount']) if r['amount'] else None
    for y in sorted(by_year):
        d = by_year[y]
        rb = d.get('room_and_board') or d.get('food_and_housing')
        t = d.get('tuition_first_year')
        if t and t < 10000: t = None  # filter encoding artifacts
        tu_rows.append({'school': s, 'year': y,
                        'tuition': int(t) if t else '',
                        'required_fees': int(d['required_fees']) if d.get('required_fees') else '',
                        'room_and_board': int(rb) if rb else ''})
write("tuition_master.csv", tu_rows, ['school','year','tuition','required_fees','room_and_board'])

# pass-through
for src, fields, dst in [
    ("test_scores.csv", ['school','year','test','p25','p50','p75'], "test_scores_master.csv"),
    ("financial_aid_summary.csv", ['school','year','metric','value'], "financial_aid_master.csv"),
    ("faculty_summary.csv", ['school','year','metric','value'], "faculty_master.csv"),
    ("graduation_rates.csv", ['school','year','metric','value'], "graduation_rates_master.csv"),
]:
    out = []
    for s in SCHOOLS:
        for r in load(s, src):
            row = {'school': s, **r}
            out.append({k: row.get(k, '') for k in fields})
    write(dst, out, fields)
print("Master CSVs rebuilt")
