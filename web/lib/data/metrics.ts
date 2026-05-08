import type { MetricMeta } from "./types";

export const METRICS: MetricMeta[] = [
  { key: "admit_rate_pct", label: "Admit rate", short: "Admit %", unit: "percent", betterWhen: "neutral", hint: "Selectivity: % of applicants offered admission." },
  { key: "yield_pct", label: "Yield rate", short: "Yield %", unit: "percent", betterWhen: "higher", hint: "% of admitted students who chose to enroll." },
  { key: "sat_total_p50", label: "SAT total (median)", short: "SAT", unit: "score", betterWhen: "higher" },
  { key: "act_composite_p50", label: "ACT composite (median)", short: "ACT", unit: "score", betterWhen: "higher" },
  { key: "tuition", label: "Tuition", short: "Tuition", unit: "dollars", betterWhen: "lower", hint: "In-state for public schools." },
  { key: "room_and_board", label: "Room & board", short: "R&B", unit: "dollars", betterWhen: "lower" },
  { key: "avg_need_based_grant_award", label: "Avg need-based grant", short: "Grant", unit: "dollars", betterWhen: "higher" },
  { key: "avg_financial_aid_package", label: "Avg total aid package", short: "Aid", unit: "dollars", betterWhen: "higher" },
  { key: "freshman_retention_rate_pct", label: "Freshman retention", short: "Retention", unit: "percent", betterWhen: "higher" },
  { key: "rate_6yr_pct", label: "6-year graduation rate", short: "Grad %", unit: "percent", betterWhen: "higher" },
  { key: "student_faculty_ratio_num", label: "Student:faculty ratio", short: "S:F", unit: "ratio", betterWhen: "lower" },
  { key: "applied", label: "Applications received", short: "Applied", unit: "count" },
  { key: "enrolled", label: "Enrolled freshmen", short: "Enrolled", unit: "count" },
];

export const METRICS_BY_KEY: Record<string, MetricMeta> = Object.fromEntries(
  METRICS.map((m) => [m.key, m]),
);

export const HERO_METRICS: MetricMeta["key"][] = [
  "admit_rate_pct",
  "yield_pct",
  "sat_total_p50",
  "tuition",
  "avg_need_based_grant_award",
  "rate_6yr_pct",
];

export function formatValue(unit: MetricMeta["unit"], v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  switch (unit) {
    case "percent":
      return `${v.toFixed(1)}%`;
    case "dollars":
      return `$${Math.round(v).toLocaleString()}`;
    case "score":
      return Math.round(v).toLocaleString();
    case "ratio":
      return `${v.toFixed(1)}:1`;
    case "count":
      return Math.round(v).toLocaleString();
  }
}

export function formatYear(yearStart: number): string {
  const next = (yearStart + 1) % 100;
  return `${yearStart}-${next.toString().padStart(2, "0")}`;
}
