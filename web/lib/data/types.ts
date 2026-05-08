export type SchoolType = "private" | "public";

export type PeerGroupId =
  | "ivy_plus"
  | "top_private"
  | "public_flagship"
  | "northeast"
  | "uc_system"
  | "all";

export interface SchoolMeta {
  slug: string;
  display: string;
  type: SchoolType;
  groups: PeerGroupId[];
}

export interface PeerGroup {
  id: PeerGroupId;
  label: string;
  schools: string[];
}

export interface Row {
  school: string;
  year: number;
  applied: number | null;
  admitted: number | null;
  enrolled: number | null;
  admit_rate_pct: number | null;
  yield_pct: number | null;
  tuition: number | null;
  required_fees: number | null;
  room_and_board: number | null;
  sat_total_p50: number | null;
  sat_math_p50: number | null;
  act_composite_p50: number | null;
  avg_need_based_grant_award: number | null;
  avg_need_based_loan: number | null;
  avg_financial_aid_package: number | null;
  freshman_retention_rate_pct: number | null;
  rate_6yr_pct: number | null;
  student_faculty_ratio_num: number | null;
  total_instructional_faculty: number | null;
}

export type MetricKey =
  | "admit_rate_pct"
  | "yield_pct"
  | "applied"
  | "enrolled"
  | "tuition"
  | "room_and_board"
  | "sat_total_p50"
  | "act_composite_p50"
  | "avg_need_based_grant_award"
  | "avg_financial_aid_package"
  | "freshman_retention_rate_pct"
  | "rate_6yr_pct"
  | "student_faculty_ratio_num";

export interface MetricMeta {
  key: MetricKey;
  label: string;
  short: string;
  unit: "percent" | "dollars" | "score" | "ratio" | "count";
  hint?: string;
  betterWhen?: "higher" | "lower" | "neutral";
}

export interface Dataset {
  rows: Row[];
  schools: SchoolMeta[];
  generatedAt: string;
}
