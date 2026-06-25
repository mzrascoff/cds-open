import Link from "next/link";
import type { InsightSpec } from "@/lib/data/insights";
import { METRICS_BY_KEY } from "@/lib/data/metrics";

export default function InsightCard({ insight }: { insight: InsightSpec }) {
  const metric = METRICS_BY_KEY[insight.primary.metric];
  return (
    <Link
      href={`/insights/${insight.slug}`}
      className="group flex h-full flex-col rounded-xl border border-ink-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-sm"
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">
        {metric?.label ?? "Insight"}
      </div>
      <h3 className="mt-1.5 text-lg font-semibold leading-snug text-ink-800 group-hover:text-accent-dark">
        {insight.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">{insight.hook}</p>
      <div className="mt-auto pt-4 text-sm font-medium text-accent">
        Read the data →
      </div>
    </Link>
  );
}
