import generated from "./cds.generated.json";
import type { Dataset, Row, MetricKey } from "./types";
import { SCHOOLS, SCHOOLS_BY_SLUG, PEER_GROUPS_BY_ID } from "./schools";
import { summarizePeers, type PeerSummary } from "../stats";

const dataset = generated as unknown as Dataset;

export function getDataset(): Dataset {
  return dataset;
}

export function getRowsForSchool(slug: string): Row[] {
  return dataset.rows.filter((r) => r.school === slug).sort((a, b) => a.year - b.year);
}

export function getRowsForSchools(slugs: string[]): Row[] {
  const set = new Set(slugs);
  return dataset.rows.filter((r) => set.has(r.school));
}

export function listAvailableSchools() {
  // Schools that actually have data (already filtered by build script).
  return dataset.schools;
}

export interface ChartPoint {
  year: number;
  school: number | null;
  peerMean: number | null;
  peerP25: number | null;
  peerP75: number | null;
  peerN: number;
}

export function buildChartSeries(
  schoolSlug: string,
  metric: MetricKey,
  peerGroupId: string,
): { points: ChartPoint[]; schoolYears: number; peerYears: number } {
  const peerGroup = PEER_GROUPS_BY_ID[peerGroupId];
  const peerSlugs = peerGroup
    ? peerGroup.schools.filter((s) => s !== schoolSlug)
    : [];

  const schoolRows = getRowsForSchool(schoolSlug);
  const schoolByYear = new Map<number, number | null>();
  for (const r of schoolRows) {
    schoolByYear.set(r.year, (r as unknown as Record<string, number | null>)[metric] ?? null);
  }

  const peerVals: { year: number; value: number }[] = [];
  for (const r of getRowsForSchools(peerSlugs)) {
    const v = (r as unknown as Record<string, number | null>)[metric];
    if (typeof v === "number" && Number.isFinite(v)) {
      peerVals.push({ year: r.year, value: v });
    }
  }
  const peerSummary: Map<number, PeerSummary> = new Map();
  for (const s of summarizePeers(peerVals)) peerSummary.set(s.year, s);

  const allYears = new Set<number>([
    ...schoolByYear.keys(),
    ...peerSummary.keys(),
  ]);
  const points: ChartPoint[] = Array.from(allYears)
    .sort((a, b) => a - b)
    .map((year) => {
      const ps = peerSummary.get(year);
      return {
        year,
        school: schoolByYear.has(year) ? schoolByYear.get(year)! : null,
        peerMean: ps?.mean ?? null,
        peerP25: ps?.p25 ?? null,
        peerP75: ps?.p75 ?? null,
        peerN: ps?.n ?? 0,
      };
    });

  const schoolYears = points.filter((p) => p.school !== null).length;
  const peerYears = points.filter((p) => p.peerMean !== null).length;
  return { points, schoolYears, peerYears };
}

export { SCHOOLS, SCHOOLS_BY_SLUG };
