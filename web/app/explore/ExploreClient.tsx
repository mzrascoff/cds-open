"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { MetricMeta, Row, SchoolMeta } from "@/lib/data/types";
import MultiLineChart from "@/components/MultiLineChart";
import clsx from "clsx";

const MAX_SCHOOLS = 6;

interface Props {
  allSchools: SchoolMeta[];
  allRows: Row[];
  metrics: MetricMeta[];
  initialSchools: string[];
  initialMetric: string;
}

export default function ExploreClient({
  allSchools,
  allRows,
  metrics,
  initialSchools,
  initialMetric,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [picked, setPicked] = useState<string[]>(initialSchools.slice(0, MAX_SCHOOLS));
  const [metricKey, setMetricKey] = useState<string>(initialMetric);
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (picked.length) params.set("schools", picked.join(","));
    if (metricKey) params.set("metric", metricKey);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [picked, metricKey, pathname, router]);

  const metric = metrics.find((m) => m.key === metricKey) ?? metrics[0];

  const filteredSchools = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allSchools.filter((s) =>
      needle ? s.display.toLowerCase().includes(needle) : true,
    );
  }, [q, allSchools]);

  function toggle(slug: string) {
    setPicked((cur) => {
      if (cur.includes(slug)) return cur.filter((s) => s !== slug);
      if (cur.length >= MAX_SCHOOLS) return cur;
      return [...cur, slug];
    });
  }

  const rows = allRows.filter((r) => picked.includes(r.school));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-ink-500">Metric</label>
          <select
            value={metricKey}
            onChange={(e) => setMetricKey(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {metrics.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          {metric.hint && <p className="mt-1.5 text-xs text-ink-400">{metric.hint}</p>}
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label className="text-xs font-medium uppercase tracking-wider text-ink-500">
              Schools <span className="text-ink-400">({picked.length}/{MAX_SCHOOLS})</span>
            </label>
            {picked.length > 0 && (
              <button
                type="button"
                onClick={() => setPicked([])}
                className="text-xs text-ink-500 hover:text-ink-800"
              >
                Clear
              </button>
            )}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="mt-1.5 w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <ul className="mt-2 max-h-[420px] overflow-y-auto rounded-lg border border-ink-200 bg-white">
            {filteredSchools.map((s) => {
              const isPicked = picked.includes(s.slug);
              const disabled = !isPicked && picked.length >= MAX_SCHOOLS;
              return (
                <li key={s.slug}>
                  <button
                    type="button"
                    onClick={() => toggle(s.slug)}
                    disabled={disabled}
                    className={clsx(
                      "flex w-full items-center justify-between border-b border-ink-50 px-3 py-2 text-left text-sm last:border-b-0",
                      isPicked
                        ? "bg-accent-soft text-accent-dark"
                        : disabled
                          ? "cursor-not-allowed text-ink-300"
                          : "hover:bg-ink-50",
                    )}
                  >
                    <span>{s.display}</span>
                    {isPicked && (
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <section>
        <div className="rounded-xl border border-ink-200 bg-white p-4 sm:p-5">
          <div className="mb-2 text-sm font-medium text-ink-800">{metric.label}</div>
          <MultiLineChart rows={rows} metric={metric} schoolSlugs={picked} height={400} />
        </div>
        {picked.length === 0 && (
          <p className="mt-4 text-sm text-ink-500">Pick at least one school from the left to see the chart.</p>
        )}
      </section>
    </div>
  );
}
