/**
 * Reads the 6 cross-school master CSVs from ../master/, normalizes them
 * into one row per (school, year), and writes public/data/cds.json.
 * Drops broken test-score rows. Pivots long-form metric files into wide.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import Papa from "papaparse";
import { SCHOOLS, SCHOOLS_BY_SLUG } from "../lib/data/schools";
import type { Dataset, Row } from "../lib/data/types";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const MASTER_DIR = path.join(REPO_ROOT, "master");
const OUT_PATH = path.resolve(__dirname, "..", "lib", "data", "cds.generated.json");

function readCsv<T>(file: string): T[] {
  const raw = fs.readFileSync(path.join(MASTER_DIR, file), "utf-8");
  const parsed = Papa.parse<T>(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (parsed.errors.length > 0) {
    console.warn(`[${file}] parse warnings:`, parsed.errors.slice(0, 3));
  }
  return parsed.data;
}

function toYear(yearStr: string | undefined): number | null {
  if (!yearStr) return null;
  const m = yearStr.trim().match(/^(\d{4})/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "" || s === "-") return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function ratioToNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/);
  if (m) {
    const a = parseFloat(m[1]);
    const b = parseFloat(m[2]);
    if (b > 0) return a / b;
  }
  const direct = parseFloat(s);
  return Number.isFinite(direct) ? direct : null;
}

const KNOWN = new Set(SCHOOLS.map((s) => s.slug));
function validSchool(slug: string | undefined): slug is string {
  return !!slug && KNOWN.has(slug);
}

function key(school: string, year: number) {
  return `${school}::${year}`;
}

function emptyRow(school: string, year: number): Row {
  return {
    school,
    year,
    applied: null,
    admitted: null,
    enrolled: null,
    admit_rate_pct: null,
    yield_pct: null,
    tuition: null,
    required_fees: null,
    room_and_board: null,
    sat_total_p50: null,
    sat_math_p50: null,
    act_composite_p50: null,
    avg_need_based_grant_award: null,
    avg_need_based_loan: null,
    avg_financial_aid_package: null,
    freshman_retention_rate_pct: null,
    rate_6yr_pct: null,
    student_faculty_ratio_num: null,
    total_instructional_faculty: null,
  };
}

function getRow(map: Map<string, Row>, school: string, year: number): Row {
  const k = key(school, year);
  let row = map.get(k);
  if (!row) {
    row = emptyRow(school, year);
    map.set(k, row);
  }
  return row;
}

function main() {
  const rows = new Map<string, Row>();

  // 1. admissions_master: school,year,applied,admitted,enrolled,admit_rate_pct,yield_pct
  for (const r of readCsv<Record<string, string>>("admissions_master.csv")) {
    if (!validSchool(r.school)) continue;
    const y = toYear(r.year);
    if (!y) continue;
    const row = getRow(rows, r.school, y);
    row.applied = num(r.applied);
    row.admitted = num(r.admitted);
    row.enrolled = num(r.enrolled);
    row.admit_rate_pct = num(r.admit_rate_pct);
    row.yield_pct = num(r.yield_pct);
  }

  // 2. tuition_master: school,year,tuition,required_fees,room_and_board
  for (const r of readCsv<Record<string, string>>("tuition_master.csv")) {
    if (!validSchool(r.school)) continue;
    const y = toYear(r.year);
    if (!y) continue;
    const row = getRow(rows, r.school, y);
    row.tuition = num(r.tuition);
    row.required_fees = num(r.required_fees);
    row.room_and_board = num(r.room_and_board);
  }

  // 3. test_scores_master: school,year,test,p25,p50,p75
  // SAT_total / SAT_math / ACT_composite are the ones we keep; drop rows with bad math.
  for (const r of readCsv<Record<string, string>>("test_scores_master.csv")) {
    if (!validSchool(r.school)) continue;
    const y = toYear(r.year);
    if (!y) continue;
    const test = (r.test ?? "").trim();
    const p25 = num(r.p25);
    const p50 = num(r.p50);
    const p75 = num(r.p75);
    // Reject rows with negative or out-of-order quantiles
    const valid =
      p50 !== null &&
      p50 > 0 &&
      (p25 === null || (p25 >= 0 && p25 <= p50)) &&
      (p75 === null || (p75 >= p50));
    if (!valid) continue;
    const row = getRow(rows, r.school, y);
    if (test === "SAT_total") row.sat_total_p50 = p50;
    else if (test === "SAT_math") row.sat_math_p50 = p50;
    else if (test === "ACT_composite") row.act_composite_p50 = p50;
  }

  // 4. financial_aid_master: school,year,metric,value (long format)
  for (const r of readCsv<Record<string, string>>("financial_aid_master.csv")) {
    if (!validSchool(r.school)) continue;
    const y = toYear(r.year);
    if (!y) continue;
    const v = num(r.value);
    if (v === null) continue;
    const row = getRow(rows, r.school, y);
    if (r.metric === "avg_need_based_grant_award") row.avg_need_based_grant_award = v;
    else if (r.metric === "avg_need_based_loan") row.avg_need_based_loan = v;
    else if (r.metric === "avg_financial_aid_package") row.avg_financial_aid_package = v;
  }

  // 5. graduation_rates_master: school,year,metric,value
  for (const r of readCsv<Record<string, string>>("graduation_rates_master.csv")) {
    if (!validSchool(r.school)) continue;
    const y = toYear(r.year);
    if (!y) continue;
    const v = num(r.value);
    if (v === null) continue;
    const row = getRow(rows, r.school, y);
    if (r.metric === "rate_6yr_pct") row.rate_6yr_pct = v;
    else if (r.metric === "freshman_retention_rate_pct") row.freshman_retention_rate_pct = v;
  }

  // 6. faculty_master: school,year,metric,value (student_faculty_ratio is "11:1" string)
  for (const r of readCsv<Record<string, string>>("faculty_master.csv")) {
    if (!validSchool(r.school)) continue;
    const y = toYear(r.year);
    if (!y) continue;
    const row = getRow(rows, r.school, y);
    if (r.metric === "student_faculty_ratio") {
      const ratio = ratioToNum(r.value);
      if (ratio !== null) row.student_faculty_ratio_num = ratio;
    } else if (r.metric === "total_instructional_faculty") {
      const v = num(r.value);
      if (v !== null) row.total_instructional_faculty = v;
    }
  }

  const sortedRows = Array.from(rows.values()).sort(
    (a, b) => a.school.localeCompare(b.school) || a.year - b.year,
  );

  // Filter SCHOOLS down to those with at least one row of useful data
  const populated = new Set(sortedRows.map((r) => r.school));
  const filteredSchools = SCHOOLS.filter((s) => populated.has(s.slug));
  const dropped = SCHOOLS.filter((s) => !populated.has(s.slug)).map((s) => s.slug);
  if (dropped.length > 0) {
    console.warn(`[build-data] schools with no rows (dropped from picker):`, dropped);
  }

  const dataset: Dataset = {
    rows: sortedRows,
    schools: filteredSchools,
    generatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(dataset));
  const sizeKb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
  console.log(
    `[build-data] wrote ${OUT_PATH} (${sizeKb} KB, ${sortedRows.length} rows, ${filteredSchools.length} schools)`,
  );

  // Coverage matrix for sanity
  const yearsBySchool = new Map<string, Set<number>>();
  for (const r of sortedRows) {
    if (!yearsBySchool.has(r.school)) yearsBySchool.set(r.school, new Set());
    yearsBySchool.get(r.school)!.add(r.year);
  }
  const covSummary = filteredSchools
    .map((s) => {
      const yrs = Array.from(yearsBySchool.get(s.slug) ?? []).sort();
      return `  ${s.slug.padEnd(20)} ${yrs.length}y  ${yrs[0] ?? "-"}–${yrs[yrs.length - 1] ?? "-"}`;
    })
    .join("\n");
  console.log("[build-data] coverage:\n" + covSummary);
}

main();
