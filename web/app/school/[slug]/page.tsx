import { notFound } from "next/navigation";
import Link from "next/link";
import {
  buildChartSeries,
  getRowsForSchool,
  listAvailableSchools,
  SCHOOLS_BY_SLUG,
} from "@/lib/data/load";
import { METRICS, METRICS_BY_KEY, formatValue, formatYear } from "@/lib/data/metrics";
import { defaultPeerGroupFor, PEER_GROUPS_BY_ID } from "@/lib/data/schools";
import { colorForSchool } from "@/lib/data/colors";
import MetricChart from "@/components/MetricChart";

export function generateStaticParams() {
  return listAvailableSchools().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = SCHOOLS_BY_SLUG[slug];
  if (!meta) return {};
  return {
    title: `${meta.display} — full data`,
    description: `Every Common Data Set metric we have for ${meta.display}, year by year.`,
  };
}

interface Props { params: Promise<{ slug: string }> }

export default async function SchoolPage({ params }: Props) {
  const { slug } = await params;
  const meta = SCHOOLS_BY_SLUG[slug];
  if (!meta) notFound();

  const rows = getRowsForSchool(slug);
  if (rows.length === 0) notFound();

  const peerId = defaultPeerGroupFor(slug);
  const peerGroup = PEER_GROUPS_BY_ID[peerId];

  const charts = METRICS.filter((m) =>
    rows.some((r) => (r as unknown as Record<string, number | null>)[m.key] !== null),
  )
    .slice(0, 9)
    .map((metric) => ({
      metric,
      points: buildChartSeries(slug, metric.key, peerId).points,
    }));

  const tableMetrics: typeof METRICS = METRICS.filter((m) =>
    rows.some((r) => (r as unknown as Record<string, number | null>)[m.key] !== null),
  );

  return (
    <div className="container-page py-6 sm:py-8">
      <nav className="mb-3 text-xs text-ink-500">
        <Link href="/" className="hover:text-ink-700">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/compare/${slug}`} className="hover:text-ink-700">Compare</Link>
        <span className="mx-1.5">/</span>
        <span>{meta.display}</span>
      </nav>

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">{meta.display}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {rows.length} year{rows.length === 1 ? "" : "s"} of data ·{" "}
            <span className="capitalize">{meta.type}</span> · {peerGroup.label}
          </p>
        </div>
        <Link
          href={`/compare/${slug}`}
          className="rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-ink-800"
        >
          Compare to peers →
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {charts.map(({ metric, points }) => (
          <div key={metric.key} className="rounded-xl border border-ink-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-ink-500">{metric.label}</div>
            <div className="mt-3">
              <MetricChart
                points={points}
                metric={metric}
                schoolDisplay={meta.display}
                peerLabel={peerGroup.label}
                height={200}
                color={colorForSchool(slug)}
              />
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-3 text-xl font-semibold text-ink-800">Full table</h2>
      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-3 py-2">Year</th>
              {tableMetrics.map((m) => (
                <th key={m.key} className="px-3 py-2 text-right">{m.short}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((r) => (
              <tr key={r.year}>
                <td className="px-3 py-2 font-medium text-ink-700">{formatYear(r.year)}</td>
                {tableMetrics.map((m) => (
                  <td key={m.key} className="px-3 py-2 text-right tabular-nums text-ink-700">
                    {formatValue(METRICS_BY_KEY[m.key].unit, (r as unknown as Record<string, number | null>)[m.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
