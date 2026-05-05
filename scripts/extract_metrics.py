"""
Stage-2 parser: extract clean numeric values from the high-value standardized
tables and write long-format CSVs.

Inputs:  data/json/<year>/blocks.json   (from parse_blocks.py)
         raw_text/cds-<year>.txt   (raw layout text, used as fallback)
Outputs: data/csv/*.csv
"""
import csv, json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
JSON_DIR = f"{ROOT}/data/json"
TXT_DIR = f"{ROOT}/raw_text"
CSV_DIR = f"{ROOT}/data/csv"
os.makedirs(CSV_DIR, exist_ok=True)

NUM_RE = re.compile(r"\(?\$?-?\d[\d,]*(?:\.\d+)?%?\)?")

def clean_num(s):
    if s is None: return None
    s = str(s).strip().rstrip(":").rstrip(".")
    if not s or s == "-": return None
    if s.startswith("(") and s.endswith(")"):
        s = s[1:-1]
    s = s.replace(",", "").replace("$", "").replace("%", "")
    try:
        if "." in s:
            return float(s)
        return int(s)
    except ValueError:
        return None

def first_num_after(s):
    m = NUM_RE.search(s)
    return clean_num(m.group(0)) if m else None

def get_block(blocks, section, field):
    return blocks.get(section, {}).get(field, {}).get("raw_text", "")

def get_section_text(year, section):
    """Return the raw text of an entire section by reading the layout txt file."""
    path = f"{TXT_DIR}/cds-{year}.txt"
    if not os.path.exists(path): return ""
    text = open(path).read()
    section_starts = [
        ("A", r"^[ \t]*A\.?\s+General\s+Information\b"),
        ("B", r"^[ \t]*B\.?\s+ENROLLMENT\s+AND\s+PERSISTENCE\b"),
        ("C", r"^[ \t]*C\.?\s+FIRST[- ]?TIME"),
        ("D", r"^[ \t]*D\.?\s+TRANSFER"),
        ("E", r"^[ \t]*E\.?\s+ACADEMIC"),
        ("F", r"^[ \t]*F\.?\s+STUDENT\s+LIFE"),
        ("G", r"^[ \t]*G\.?\s+ANNUAL"),
        ("H", r"^[ \t]*H\.?\s+FINANCIAL\s+AID"),
        ("I", r"^[ \t]*I\.?\s+INSTRUCTIONAL"),
        ("J", r"^[ \t]*J\.?\s+(?:DEGREES|DISCIPLINARY)"),
    ]
    sec_idx = next((i for i, (s, _) in enumerate(section_starts) if s == section), None)
    if sec_idx is None: return ""
    start_re = re.compile(section_starts[sec_idx][1], re.I | re.M)
    end_re = re.compile(section_starts[sec_idx + 1][1], re.I | re.M) if sec_idx + 1 < len(section_starts) else None

    # Find the BODY occurrence of the section header (skip the table of contents).
    # Heuristic: a body section header is followed within ~60 lines by a real
    # field code line like "A0", "A1", "B1", "G1", etc. The TOC entries are
    # followed only by other section headers.
    matches = list(start_re.finditer(text))
    if not matches: return ""
    field_letter = section_starts[sec_idx][0]
    field_re = re.compile(rf"^[ \t]*{field_letter}\d{{1,2}}[A-Z]?\b", re.M)

    real_starts = []
    for m in matches:
        # Look at the 60 lines following this match for a field code
        chunk = text[m.start(): m.start() + 6000]
        if not field_re.search(chunk):
            continue
        # Reject TOC entries: a TOC line is short, has dots OR a trailing page number,
        # or is followed within ~5 lines by another section letter header.
        line_text = text[m.start():text.find("\n", m.start()) if text.find("\n", m.start())>0 else m.start()+200]
        if re.search(r"\.{4,}\s*\d+\s*$", line_text):  # dotted leader page numbers
            continue
        if re.search(r"\s{2,}\d{1,3}\s*$", line_text) and len(line_text.strip()) < 80:
            # short line ending with a page number
            continue
        # If another section letter appears within the next 5 non-blank lines, it's TOC
        next_50_lines = text[m.start():m.start()+1500].split("\n")[:8]
        body_letters = ["A","B","C","D","E","F","G","H","I","J"]
        # Count distinct section-letter starts in the next 8 lines (excluding the match line itself)
        sec_count = 0
        for ln in next_50_lines[1:]:
            if re.match(r"^[ \t]*[A-J]\.?\s+(?:[A-Z][A-Za-z]+|GENERAL|ENROLLMENT|FIRST|TRANSFER|ACADEMIC|STUDENT|ANNUAL|FINANCIAL|INSTRUCTIONAL|DEGREES|DISCIPLINARY)", ln):
                sec_count += 1
        if sec_count >= 2:  # multiple section entries close together = TOC
            continue
        real_starts.append(m)
    if not real_starts:
        real_starts = [m for m in matches if "..." not in text[m.start():m.start()+200]]
    if not real_starts: return ""
    # Prefer the LAST qualifying match (the body usually comes after any partial TOC)
    s = real_starts[-1].start()

    if end_re:
        next_letter = section_starts[sec_idx + 1][0]
        next_field_re = re.compile(rf"^[ \t]*{next_letter}\d{{1,2}}[A-Z]?\b", re.M)
        end_matches = []
        for m in end_re.finditer(text):
            if m.start() <= s: continue
            chunk = text[m.start(): m.start() + 6000]
            if next_field_re.search(chunk):
                end_matches.append(m)
        e = end_matches[0].start() if end_matches else len(text)
    else:
        e = len(text)
    return text[s:e]

# ------------------- Extractors -------------------

def admissions_summary(year, blocks):
    """C1 applications summary: applied/admitted/enrolled by sex.

    Newer (2017+) CDSes have BOTH a top-line "Total ... who enrolled" row and
    sub-rows split by full-time/part-time. Older (pre-2017) CDSes ONLY have
    the full-time / part-time split. Strategy: prefer the top-line if present,
    otherwise sum FT + PT for that sex.
    """
    text = get_block(blocks, "C", "C1") or get_section_text(year, "C")
    rows = []
    if not text: return rows
    lines = text.split("\n")

    # Helper: find numeric value AFTER the action verb. If not on this line,
    # check the next 1-3 non-blank lines (HTML-derived text wraps values).
    # Stops the lookahead at any line that mentions a demographic (men/women/etc)
    # so we do not accidentally pull a value from an adjacent row.
    def get_value_at(idx, action_pat, *, lookahead=True):
        line = lines[idx]
        m = re.search(action_pat, line, re.I)
        if not m: return None
        after = line[m.end():]
        if ":" in after:
            after = after.split(":", 1)[-1]
        v = first_num_after(after)
        if v is not None:
            return v
        if not lookahead:
            return None
        # Fallback: look at the next 1-3 non-blank lines, but stop at any line
        # that names a different demographic / category (avoids row-bleed).
        DEMO_RE = re.compile(r"\b(?:men|women|male|female|another\s+gender|unknown\s+gender|unknown\s+sex|"
                             r"full[-\s]?time|part[-\s]?time|degree[-\s]?seeking|in[-\s]?state|"
                             r"out[-\s]?of[-\s]?state|international|residen)\b", re.I)
        seen = 0
        for j in range(idx + 1, min(idx + 6, len(lines))):
            nxt = lines[j].strip()
            if not nxt: continue
            if DEMO_RE.search(nxt):
                return None
            v = first_num_after(nxt)
            if v is not None:
                return v
            seen += 1
            if seen >= 3: break
        return None

    sex_pats = {
        "male":   [r"\bmen\b", r"\bmales?\b"],
        "female": [r"\bwomen\b", r"\bfemales?\b"],
        "unknown": [r"unknown sex"],
    }

    # applied + admitted: simple - look for line with action+sex
    for action, action_pat in [("applied", r"who applied"), ("admitted", r"who were admitted")]:
        for sex_label, pats in sex_pats.items():
            for i, line in enumerate(lines):
                if not re.search(action_pat, line, re.I): continue
                if not any(re.search(p, line, re.I) for p in pats): continue
                v = get_value_at(i, action_pat)
                if v is not None:
                    rows.append({"year": year, "metric": action, "sex": sex_label, "value": v})
                    break

    # enrolled: prefer the non-FT/PT total line; if not found, sum FT+PT
    for sex_label, pats in sex_pats.items():
        # Try top-line first (no full-time/part-time qualifier)
        toplevel = None
        for i, line in enumerate(lines):
            if not re.search(r"who enrolled", line, re.I): continue
            if not any(re.search(p, line, re.I) for p in pats): continue
            if re.search(r"\b(?:full|part)[-\s]?time\b", line, re.I): continue
            v = get_value_at(i, r"who enrolled")
            if v is not None:
                toplevel = v
                break
        if toplevel is not None:
            rows.append({"year": year, "metric": "enrolled", "sex": sex_label, "value": toplevel})
            continue
        # Fallback: sum FT + PT
        ft, pt = None, None
        for i, line in enumerate(lines):
            if not re.search(r"who enrolled", line, re.I): continue
            if not any(re.search(p, line, re.I) for p in pats): continue
            if re.search(r"\bfull[-\s]?time\b", line, re.I) and ft is None:
                ft = get_value_at(i, r"who enrolled", lookahead=False)
            elif re.search(r"\bpart[-\s]?time\b", line, re.I) and pt is None:
                pt = get_value_at(i, r"who enrolled", lookahead=False)
        if ft is not None or pt is not None:
            rows.append({"year": year, "metric": "enrolled", "sex": sex_label,
                         "value": (ft or 0) + (pt or 0)})

    # FALLBACK: 2023-2024 layout has "students who applied/admitted/enrolled"
    # with men + women + another-gender values in columns on the same line.
    if not rows:
        column_actions = [
            ("applied", r"Total first[-\s]+time,?\s+first[-\s]+year\s+students\s+who\s+applied"),
            ("admitted", r"Total first[-\s]+time,?\s+first[-\s]+year\s+students\s+(?:admitted|who were admitted)"),
            ("enrolled", r"^\s*Total first[-\s]+time,?\s+first[-\s]+year\s+students\s+(?:enrolled|who enrolled)"),
        ]
        for action, pat in column_actions:
            for line in lines:
                m = re.search(pat, line, re.I)
                if not m: continue
                if action == "enrolled" and re.search(r"\b(?:Full|Part)[-\s]?time", line, re.I):
                    continue
                rest = line[m.end():]
                # Strip the "in Fall YYYY" / "Fall YYYY" prefix that contains
                # a 4-digit year we must not capture as the male count.
                rest = re.sub(r"^\s*(?:in\s+)?Fall\s+\d{4}", "", rest, flags=re.I)
                nums = NUM_RE.findall(rest)
                if len(nums) >= 2:
                    rows.append({"year": year, "metric": action, "sex": "male",
                                 "value": clean_num(nums[0])})
                    rows.append({"year": year, "metric": action, "sex": "female",
                                 "value": clean_num(nums[1])})
                    if len(nums) >= 3:
                        rows.append({"year": year, "metric": action, "sex": "unknown",
                                     "value": clean_num(nums[2])})
                    break

    # Dedupe (year, metric, sex)
    seen = set(); out = []
    for r in rows:
        k = (r["year"], r["metric"], r["sex"])
        if k in seen: continue
        seen.add(k); out.append(r)
    return out

def admissions_totals(year, blocks):
    """Computed totals by year - sum of male+female+unknown for applied/admitted/enrolled."""
    rows = admissions_summary(year, blocks)
    totals = {}
    for r in rows:
        totals.setdefault(r["metric"], 0)
        if r["value"] is not None:
            totals[r["metric"]] += r["value"]
    return [{"year": year, "metric": k, "value": v} for k, v in totals.items() if v]

def test_scores(year, blocks):
    """C9 SAT/ACT score percentiles + submission rates."""
    text = get_block(blocks, "C", "C9") or get_section_text(year, "C")
    rows = []
    if not text: return rows
    test_labels = [
        ("SAT Composite", "SAT_total"),
        ("SAT Evidence-Based Reading", "SAT_EBRW"),
        ("SAT Math", "SAT_math"),
        ("SAT Critical Reading", "SAT_CR"),
        ("SAT Writing", "SAT_writing"),
        ("ACT Composite", "ACT_composite"),
        ("ACT English", "ACT_english"),
        ("ACT Math", "ACT_math"),
        ("ACT Reading", "ACT_reading"),
        ("ACT Science", "ACT_science"),
        ("ACT Writing", "ACT_writing"),
    ]
    lines_t = text.split("\n")
    for label_pat, key in test_labels:
        for i, line in enumerate(lines_t):
            if not re.search(label_pat, line, re.I): continue
            # Skip description / policy lines
            if "test scores" in line.lower() and "policy" in line.lower(): continue
            # Collect numbers on the same line first
            rest = line[re.search(label_pat, line, re.I).end():]
            nums = [n for n in NUM_RE.findall(rest) if not n.endswith("%")]
            # If <3 numbers on the same line, look at the next 5 non-blank lines
            # (HTML-rendered CDSes put each percentile on its own line)
            if len(nums) < 3:
                seen = 0
                for j in range(i + 1, min(i + 7, len(lines_t))):
                    nxt = lines_t[j].strip()
                    if not nxt: continue
                    # Stop if we hit another test label - prevents bleeding into next row
                    if any(re.search(p, nxt, re.I) for p, _ in test_labels):
                        break
                    more = [n for n in NUM_RE.findall(nxt) if not n.endswith("%")]
                    nums.extend(more)
                    seen += 1
                    if len(nums) >= 3 or seen >= 5: break
            if len(nums) >= 3:
                rows.append({"year": year, "test": key,
                             "p25": clean_num(nums[0]),
                             "p50": clean_num(nums[1]),
                             "p75": clean_num(nums[2])})
                break
            elif len(nums) == 2:
                rows.append({"year": year, "test": key,
                             "p25": clean_num(nums[0]), "p50": None,
                             "p75": clean_num(nums[1])})
                break
    # Submission percentages
    for label_pat, key in [
        (r"submitting\s+SAT\s+scores", "pct_submitted_SAT"),
        (r"submitting\s+ACT\s+scores", "pct_submitted_ACT"),
    ]:
        for line in text.split("\n"):
            if re.search(label_pat, line, re.I):
                v = first_num_after(line[re.search(label_pat, line, re.I).end():])
                if v is not None:
                    rows.append({"year": year, "test": key,
                                 "p25": None, "p50": v, "p75": None})
                    break
    # Dedupe
    seen = set(); out = []
    for r in rows:
        if r["test"] in seen: continue
        seen.add(r["test"]); out.append(r)
    return out

def enrollment_summary(year, blocks):
    """B1: full-time/part-time enrollment by level + sex."""
    text = get_block(blocks, "B", "B1") or get_section_text(year, "B")
    rows = []
    if not text: return rows
    items = [
        ("undergrad_FT_total", r"Total Undergraduate Full[- ]?Time\s+Students"),
        ("undergrad_PT_total", r"Total Undergraduate Part[- ]?Time\s+Students"),
        ("undergrad_total", r"Total Undergraduate Students"),
        ("graduate_FT_total", r"Total Graduate Full[- ]?Time\s+Students"),
        ("graduate_PT_total", r"Total Graduate Part[- ]?Time\s+Students"),
        ("graduate_total", r"Total Graduate Students"),
        ("total_FT_students", r"^\s*Total Full[- ]?Time\s+Students"),
        ("total_PT_students", r"^\s*Total Part[- ]?Time\s+Students"),
        ("total_undergraduates", r"Total\s+all\s+undergraduates"),
        ("total_graduate", r"Total\s+all\s+graduate"),
        ("grand_total", r"GRAND TOTAL ALL STUDENTS"),
        ("FT_first_time_first_year", r"Degree[- ]?seeking,\s+first[- ]?time\s+first[- ]?year\s+students"),
    ]
    for key, pat in items:
        for line in text.split("\n"):
            m = re.search(pat, line, re.I)
            if m:
                nums = NUM_RE.findall(line[m.end():])
                if not nums: continue
                male = clean_num(nums[0]) if len(nums) >= 1 else None
                female = clean_num(nums[1]) if len(nums) >= 2 else None
                unk = clean_num(nums[2]) if len(nums) >= 3 else None
                rows.append({"year": year, "category": key,
                             "male": male, "female": female, "unknown": unk})
                break
    # Dedupe
    seen = set(); out = []
    for r in rows:
        if r["category"] in seen: continue
        seen.add(r["category"]); out.append(r)
    return out

def tuition_and_fees(year, blocks):
    """G section: tuition, fees, room and board, food/housing.

    The G1 cost-of-attendance table looks roughly like:
        Tuition:               $67,731     $67,731
        Required Fees:           $843        $843
        Food and housing:     $22,944     $22,944
        ...
    The first dollar amount is "first-year" cost, second is "all undergrads".
    We capture the first ($-prefixed) value per row.
    """
    text = get_section_text(year, "G")
    if not text: return []
    rows = []
    # Match a label that starts the line (after whitespace), optionally with colon,
    # followed by at least one $-amount.
    items = [
        # Don't require a $ on the same line as the label - some institutions
        # (e.g. MIT) put the dollar amount on a line above the label.
        ("tuition_first_year",          r"^[ \t]*Tuition\s*:?(?:\s|$)"),
        ("tuition_in_state",            r"^[ \t]*(?:Tuition[: ]\s*)?[Ii]n[-\s]?(?:state|district)\s*:?"),
        ("tuition_out_of_state",        r"^[ \t]*(?:Tuition[: ]\s*)?[Oo]ut[-\s]?of[-\s]?state\s*:?"),
        ("tuition_nonresident",         r"^[ \t]*(?:Tuition[: ]\s*)?[Nn]onresident\s*:?"),
        ("required_fees",               r"^[ \t]*Required\s+[Ff][Ee][Ee][Ss]\s*:?"),
        ("room_only",                   r"^[ \t]*Room\s+[Oo]nly\b"),
        ("board_only",                  r"^[ \t]*Board\s+[Oo]nly\b"),
        ("room_and_board",              r"^[ \t]*Room\s+and\s+[Bb]oard\b"),
        ("food_and_housing",            r"^[ \t]*Food\s+and\s+housing\b"),
        ("housing_only",                r"^[ \t]*Housing\s+[Oo]nly\b"),
        ("food_only",                   r"^[ \t]*Food\s+[Oo]nly\b"),
        ("books_supplies",              r"^[ \t]*Books\s+and\s+supplies\s*:?"),
        ("transportation",              r"^[ \t]*Transportation\s*:?"),
        ("other_expenses",              r"^[ \t]*Other\s+expenses\s*:?"),
    ]
    for key, pat in items:
        all_lines = text.split("\n")
        for i, line in enumerate(all_lines):
            m = re.search(pat, line, re.I | re.M)
            if not m: continue
            # Find first dollar-prefixed number on the line
            md = re.search(r"\$\s*([\d,]+(?:\.\d+)?)", line)
            if md:
                v = clean_num(md.group(1))
                if v is not None and v >= 1:
                    rows.append({"year": year, "expense": key, "amount": v})
                    break
            # Fallback A: any large number on the line, after the label
            v = first_num_after(line[m.end():])
            if v is not None and v > 100:
                rows.append({"year": year, "expense": key, "amount": v})
                break
            # Fallback B: number on the next 1-3 non-blank lines AFTER the label
            # (HTML-derived layout puts value on a new line after the label)
            seen = 0
            captured = False
            for j in range(i + 1, min(i + 6, len(all_lines))):
                nxt = all_lines[j].strip()
                if not nxt: continue
                # Stop if we hit another label-like line (avoid bleeding into next row)
                if re.match(r"^[A-Z][A-Z\s]{4,}:", nxt) or re.match(r"^[A-Z][a-z]+\s+[Oo]nly", nxt):
                    break
                md2 = re.search(r"\$\s*([\d,]+(?:\.\d+)?)|^(\d{4,}(?:\.\d+)?)$", nxt)
                if md2:
                    raw_n = md2.group(1) or md2.group(2)
                    v = clean_num(raw_n)
                    if v is not None and v >= 100:
                        rows.append({"year": year, "expense": key, "amount": v})
                        captured = True
                        break
                seen += 1
                if seen >= 3: break
            if captured: break
            # Fallback C: number on a line BEFORE the label (legacy MIT PDFs)
            for j in range(max(0, i - 2), i):
                prev = all_lines[j]
                if not prev.strip() or re.match(r"^[ \t]*[A-Z][A-Z]+", prev): continue
                md2 = re.search(r"(?:^|\s)([\d,]+|\$\s*[\d,]+)\s*(?:\d|$)", prev)
                if md2:
                    v = clean_num(md2.group(1).replace("$", ""))
                    if v is not None and v >= 100:
                        rows.append({"year": year, "expense": key, "amount": v})
                        break
            else:
                continue
            break
    # Dedupe
    seen = set(); out = []
    for r in rows:
        if r["expense"] in seen: continue
        seen.add(r["expense"]); out.append(r)
    return out

def financial_aid_summary(year, blocks):
    """H section headline metrics. Stick to the metrics that have a label
    immediately followed by a single value on the same (or next) line.

    For the complex H1/H2 multi-column tables we keep the raw text in the
    blocks JSON. Curating those into clean columns is left to a downstream
    pass — see docs/EXTRACTION_NOTES.md.
    """
    text = get_section_text(year, "H")
    if not text: return []
    lines = text.split("\n")
    rows = []

    def find_value_after_label(pat, lookahead=4, want_pct=False):
        for i, line in enumerate(lines):
            m = re.search(pat, line, re.I)
            if not m: continue
            for j in range(i, min(i + 1 + lookahead, len(lines))):
                ln = lines[j] if j > i else lines[j][m.end():]
                if want_pct:
                    pm = re.search(r"(\d+(?:\.\d+)?)\s*%", ln)
                    if pm:
                        return float(pm.group(1))
                else:
                    v = first_num_after(ln)
                    if v is not None:
                        return v
            return None
        return None

    # Avg need-based grant award (typically column F or K of H2 row labeled "Average need-based scholarship/grant")
    v = find_value_after_label(r"Average\s+need-based\s+scholarship\s+(?:and|or|/)?\s*grant\s+award", 5)
    if v is not None: rows.append({"year": year, "metric": "avg_need_based_grant_award", "value": v})

    # Avg need-based loan
    v = find_value_after_label(r"Average\s+need-based\s+loan", 5)
    if v is not None: rows.append({"year": year, "metric": "avg_need_based_loan", "value": v})

    # Avg financial aid package
    v = find_value_after_label(r"[Aa]verage\s+(?:financial\s+)?aid\s+package", 5)
    if v is not None: rows.append({"year": year, "metric": "avg_financial_aid_package", "value": v})

    # H4 numbers reaching graduation
    v = find_value_after_label(r"received\s+a\s+bachelor's\s+degree\s+between", 4)
    if v is not None and v > 50:  # exclude tiny artifacts
        rows.append({"year": year, "metric": "num_grads_in_borrowing_cohort", "value": v})

    # Pct of class who borrowed (H4)
    v = find_value_after_label(r"Percent\s+of\s+(?:first[-\s]?year|the\s+class|students\s+in\s+H4).*?(?:who\s+)?borrowed", 4, want_pct=True)
    if v is not None: rows.append({"year": year, "metric": "pct_class_borrowed", "value": v})

    # Avg cumulative debt borrowed - need a stronger pattern that lands on a $ amount
    for i, line in enumerate(lines):
        if not re.search(r"per[-\s]?(?:undergraduate[-\s]?)?borrower\s+cumulative", line, re.I): continue
        for j in range(i, min(i + 6, len(lines))):
            md = re.search(r"\$\s*([\d,]+(?:\.\d+)?)", lines[j])
            if md:
                rows.append({"year": year, "metric": "avg_per_borrower_cumulative_debt",
                             "value": clean_num(md.group(1))})
                break
        break

    seen = set(); out = []
    for r in rows:
        if r["metric"] in seen: continue
        seen.add(r["metric"]); out.append(r)
    return out

def faculty_summary(year, blocks):
    """I sections: faculty counts and student-to-faculty ratio."""
    text = get_section_text(year, "I")
    if not text: return []
    rows = []
    # Student-to-faculty ratio is usually written like "5 to 1" or "5:1"
    for line in text.split("\n"):
        m = re.search(r"(?:Student[-\s/]?(?:to[-\s/]?)?[Ff]aculty\s+ratio|fall\s+\d{4}\s+student/faculty\s+ratio)", line, re.I)
        if m:
            rest = line[m.end():]
            m2 = re.search(r"(\d+(?:\.\d+)?)\s*(?:to|:|/)\s*(\d+(?:\.\d+)?)", rest)
            if m2:
                rows.append({"year": year, "metric": "student_faculty_ratio",
                             "value": f"{m2.group(1)}:{m2.group(2)}"})
                break
            v = first_num_after(rest)
            if v is not None:
                rows.append({"year": year, "metric": "student_faculty_ratio", "value": v})
                break

    items = [
        ("total_instructional_faculty",
         r"Total\s+(?:number\s+of\s+)?instructional\s+faculty"),
        ("total_full_time_faculty",
         r"^\s*Total\s+full[-\s]?time\s+(?:instructional\s+)?faculty"),
        ("total_part_time_faculty",
         r"^\s*Total\s+part[-\s]?time\s+(?:instructional\s+)?faculty"),
    ]
    for key, pat in items:
        for line in text.split("\n"):
            m = re.search(pat, line, re.I | re.M)
            if not m: continue
            nums = NUM_RE.findall(line[m.end():])
            if nums:
                # I1 typically has Men/Women columns then Total at end
                v = clean_num(nums[-1])
                if v is not None:
                    rows.append({"year": year, "metric": key, "value": v})
                    break
    # Dedupe
    seen = set(); out = []
    for r in rows:
        if r["metric"] in seen: continue
        seen.add(r["metric"]); out.append(r)
    return out

def graduation_rates(year, blocks):
    """B-section: graduation rates and freshman retention.
    Handles multiple formats: 'X% in same line', 'X%' on next line,
    and decimals (0.9261) which we convert to percent."""
    text = get_section_text(year, "B")
    if not text: return []
    lines = text.split("\n")
    rows = []

    def extract_rate(lines, idx, lookahead=4):
        """Find a percent or decimal-rate value within the next `lookahead` lines."""
        for j in range(idx, min(idx + lookahead, len(lines))):
            ln = lines[j]
            # Percentage form
            m = re.search(r"(\d{1,3}(?:\.\d+)?)\s*%", ln)
            if m:
                return float(m.group(1))
            # Decimal form e.g. 0.9261 (treat as ratio, convert to pct)
            m = re.search(r"\b0\.(\d{2,})\b", ln)
            if m:
                return round(float("0." + m.group(1)) * 100, 2)
        return None

    grad_labels = [
        (r"(?:Four|4)[-\s]?year\s+(?:completion|graduation)\s+rate", "rate_4yr_pct"),
        (r"(?:Five|5)[-\s]?year\s+(?:completion|graduation)\s+rate", "rate_5yr_pct"),
        (r"(?:Six|6)[-\s]?year\s+(?:completion|graduation)\s+rate", "rate_6yr_pct"),
    ]
    for pat, key in grad_labels:
        for i, line in enumerate(lines):
            if re.search(pat, line, re.I):
                v = extract_rate(lines, i, 4)
                if v is not None:
                    rows.append({"year": year, "metric": key, "value": v})
                    break

    # Freshman retention rate (B22)
    for i, line in enumerate(lines):
        if re.search(r"B22\b.*[Rr]etention", line) or re.search(r"^[ \t]*B22\b", line):
            v = extract_rate(lines, i, 12)
            if v is not None:
                rows.append({"year": year, "metric": "freshman_retention_rate_pct", "value": v})
                break

    seen = set(); out = []
    for r in rows:
        if r["metric"] in seen: continue
        seen.add(r["metric"]); out.append(r)
    return out

def all_fields_long(year, blocks):
    rows = []
    for sec, fields in blocks.items():
        if not isinstance(fields, dict): continue
        for fid, payload in fields.items():
            if fid.startswith("_"): continue
            if not isinstance(payload, dict): continue
            text = payload.get("raw_text", "").strip()
            label = payload.get("label", "")
            preview = re.sub(r"\s+", " ", text.replace("\n", " "))[:300]
            rows.append({"year": year, "section": sec, "field": fid,
                         "label": label[:200], "raw_preview": preview})
    return rows


def write_csv(path, rows, fieldnames):
    rows = [r for r in rows if r]
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fieldnames})
    return len(rows)


def main():
    """Auto-discover every data/json/<year>/blocks.json and extract metrics."""
    import glob
    all_admissions, all_admissions_totals = [], []
    all_tests, all_enroll = [], []
    all_tuition, all_aid, all_faculty, all_grad, all_long = [], [], [], [], []

    year_dirs = sorted(glob.glob(os.path.join(JSON_DIR, "*/")), reverse=True)
    for ydir in year_dirs:
        bp = os.path.join(ydir, "blocks.json")
        if not os.path.exists(bp): continue
        year = os.path.basename(os.path.normpath(ydir))
        blocks = json.load(open(bp))

        adm = admissions_summary(year, blocks)
        all_admissions += adm
        all_admissions_totals += admissions_totals(year, blocks)
        all_tests += test_scores(year, blocks)
        all_enroll += enrollment_summary(year, blocks)
        all_tuition += tuition_and_fees(year, blocks)
        all_aid += financial_aid_summary(year, blocks)
        all_faculty += faculty_summary(year, blocks)
        all_grad += graduation_rates(year, blocks)
        all_long += all_fields_long(year, blocks)

    n_adm = write_csv(f"{CSV_DIR}/admissions_by_sex.csv", all_admissions,
                      ["year", "metric", "sex", "value"])
    n_at = write_csv(f"{CSV_DIR}/admissions_summary.csv", all_admissions_totals,
                     ["year", "metric", "value"])
    n_ts = write_csv(f"{CSV_DIR}/test_scores.csv", all_tests,
                     ["year", "test", "p25", "p50", "p75"])
    n_en = write_csv(f"{CSV_DIR}/enrollment_summary.csv", all_enroll,
                     ["year", "category", "male", "female", "unknown"])
    n_tu = write_csv(f"{CSV_DIR}/tuition_and_fees.csv", all_tuition,
                     ["year", "expense", "amount"])
    n_fa = write_csv(f"{CSV_DIR}/financial_aid_summary.csv", all_aid,
                     ["year", "metric", "value"])
    n_fc = write_csv(f"{CSV_DIR}/faculty_summary.csv", all_faculty,
                     ["year", "metric", "value"])
    n_gr = write_csv(f"{CSV_DIR}/graduation_rates.csv", all_grad,
                     ["year", "metric", "value"])
    n_lo = write_csv(f"{CSV_DIR}/all_fields_long.csv", all_long,
                     ["year", "section", "field", "label", "raw_preview"])

    print(f"admissions_by_sex.csv:    {n_adm} rows")
    print(f"admissions_summary.csv:   {n_at} rows")
    print(f"test_scores.csv:          {n_ts} rows")
    print(f"enrollment_summary.csv:   {n_en} rows")
    print(f"tuition_and_fees.csv:     {n_tu} rows")
    print(f"financial_aid_summary.csv: {n_fa} rows")
    print(f"faculty_summary.csv:      {n_fc} rows")
    print(f"graduation_rates.csv:     {n_gr} rows")
    print(f"all_fields_long.csv:      {n_lo} rows")

if __name__ == "__main__":
    main()
