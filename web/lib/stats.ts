export const MIN_PEERS_FOR_MEAN = 3;

export function mean(values: number[]): number | null {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) return null;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

export function quantile(values: number[], q: number): number | null {
  const clean = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (clean.length === 0) return null;
  if (clean.length === 1) return clean[0];
  const pos = (clean.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return clean[lo];
  return clean[lo] + (clean[hi] - clean[lo]) * (pos - lo);
}

export interface PeerSummary {
  year: number;
  mean: number | null;
  p25: number | null;
  p75: number | null;
  n: number;
}

export function summarizePeers(
  peerValues: { year: number; value: number }[],
): PeerSummary[] {
  const byYear = new Map<number, number[]>();
  for (const { year, value } of peerValues) {
    if (!Number.isFinite(value)) continue;
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(value);
  }
  return Array.from(byYear.entries())
    .map(([year, vals]) => ({
      year,
      n: vals.length,
      mean: vals.length >= MIN_PEERS_FOR_MEAN ? mean(vals) : null,
      p25: vals.length >= MIN_PEERS_FOR_MEAN ? quantile(vals, 0.25) : null,
      p75: vals.length >= MIN_PEERS_FOR_MEAN ? quantile(vals, 0.75) : null,
    }))
    .sort((a, b) => a.year - b.year);
}
