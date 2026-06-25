import { notFound } from "next/navigation";
import Link from "next/link";
import { INSIGHTS, INSIGHTS_BY_SLUG } from "@/lib/data/insights";
import { METRICS_BY_KEY, formatValue, formatYear } from "@/lib/data/metrics";
import { getRowsForSchools, SCHOOLS_BY_SLUG } from "@/lib/data/load";
import MultiLineChart from "@/components/MultiLineChart";
import type { Row } from "@/lib/data/types";

export function generateStaticParams() {
  return INSIGHTS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ins = INSIGHTS_BY_SLUG[slug];
  if (!ins) return {};
  return { title: ins.title, description: ins.hook };
}

interface Props { params: Promise<{ slug: string }> }

export default async function InsightPage({ params }: Props) {
  const { slug } = await params;
  const insight = INSIGHTS_BY_SLUG[slug];
  if (!insight) notFound();

  const primaryMetric = METRICS_BY_KEY[insight.primary.metric];
  const primaryRows = getRowsForSchools(insight.primary.schools);
  const primaryLatest = latestPerSchool(primaryRows, insight.primary.metric, insight.primary.schools);

  const compMetric = insight.comparison ? METRICS_BY_KEY[insight.comparison.metric] : null;
  const compRows = insight.comparison ? getRowsForSchools(insight.comparison.schools) : [];

  return (
    <article className="container-page max-w-3xl py-8 sm:py-12">
      <nav className="text-xs text-ink-500">
        <Link href="/" className="hover:text-ink-700">Home</Link>
        <span className="mx-1.5">/</span>
        <span>Insights</span>
      </nav>

      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        {primaryMetric.label}
      </div>
      <h1 className="mt-2 text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">
        {insight.title}
      </h1>
      <p className="mt-3 text-lg text-ink-600">{insight.hook}</p>

      <div className="mt-7 rounded-xl border border-ink-200 bg-white p-4 sm:p-5">
        <div className="mb-2 text-sm font-medium text-ink-800">
          {primaryMetric.label} — {insight.primary.schools.map((s) => SCHOOLS_BY_SLUG[s]?.display ?? s).join(", ")}
        </div>
        <MultiLineChart
          rows={primaryRows}
          metric={primaryMetric}
          schoolSlugs={insight.primary.schools}
          height={300}
        />
      </div>

      <div className="prose-cds mt-6 space-y-4 text-base leading-relaxed text-ink-700">
        {insight.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {compMetric && (
        <div className="mt-8 rounded-xl border border-ink-200 bg-white p-4 sm:p-5">
          <div className="mb-2 text-sm font-medium text-ink-800">
            {compMetric.label} — same schools
          </div>
          <MultiLineChart
            rows={compRows}
            metric={compMetric}
            schoolSlugs={insight.comparison!.schools}
            height={260}
          />
        </div>
      )}

      <div className="mt-10 rounded-xl bg-accent-soft p-5 text-base leading-relaxed text-accent-dark">
        <strong className="font-semibold">Takeaway: </strong>
        {insight.takeaway}
      </div>

      {primaryLatest.length > 0 && (
        <div className="mt-8">
          <div className="mb-2 text-sm font-medium text-ink-700">Latest year, all schools shown</div>
          <table className="w-full overflow-hidden rounded-lg border border-ink-200 bg-white text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-3 py-2">School</th>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2 text-right">{primaryMetric.short}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {primaryLatest.map((r) => (
                <tr key={r.school}>
                  <td className="px-3 py-2 font-medium text-ink-800">
                    <Link href={`/compare/${r.school}`} className="hover:text-accent">
                      {SCHOOLS_BY_SLUG[r.school]?.display ?? r.school}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-ink-500">{formatYear(r.year)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatValue(primaryMetric.unit, (r as unknown as Record<string, number | null>)[insight.primary.metric])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 border-t border-ink-100 pt-6 text-sm text-ink-500">
        <Link href="/" className="hover:text-ink-800">← Back to all insights</Link>
      </div>
    </article>
  );
}

function latestPerSchool(rows: Row[], metric: string, slugs: string[]): Row[] {
  const out: Row[] = [];
  for (const slug of slugs) {
    const candidates = rows
      .filter((r) => r.school === slug && (r as unknown as Record<string, number | null>)[metric] !== null)
      .sort((a, b) => b.year - a.year);
    if (candidates[0]) out.push(candidates[0]);
  }
  return out.sort((a, b) => {
    const av = (a as unknown as Record<string, number | null>)[metric] ?? 0;
    const bv = (b as unknown as Record<string, number | null>)[metric] ?? 0;
    return (bv ?? 0) - (av ?? 0);
  });
}
