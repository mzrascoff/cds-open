"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import type { MetricMeta, Row } from "@/lib/data/types";
import { formatValue, formatYear } from "@/lib/data/metrics";
import { SCHOOLS_BY_SLUG } from "@/lib/data/schools";

const COLORS = [
  "#c8102e", // accent
  "#0f766e",
  "#1d4ed8",
  "#a16207",
  "#7c3aed",
  "#be185d",
  "#0369a1",
  "#65a30d",
];

interface Props {
  rows: Row[];
  metric: MetricMeta;
  schoolSlugs: string[];
  height?: number;
}

export default function MultiLineChart({ rows, metric, schoolSlugs, height = 280 }: Props) {
  // Pivot: { year, [slug]: value, ... }
  const yearSet = new Set<number>();
  const grid = new Map<number, Record<string, number | null>>();
  for (const r of rows) {
    const v = (r as unknown as Record<string, number | null>)[metric.key];
    if (v === null || v === undefined) continue;
    if (!grid.has(r.year)) grid.set(r.year, {});
    grid.get(r.year)![r.school] = v;
    yearSet.add(r.year);
  }
  const data = Array.from(yearSet)
    .sort((a, b) => a - b)
    .map((y) => ({ year: y, ...(grid.get(y) ?? {}) }));

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-ink-200 text-sm text-ink-400">
        No data
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            tickFormatter={(v) => `'${String(v % 100).padStart(2, "0")}`}
            tick={{ fontSize: 11, fill: "#666970" }}
            stroke="#cbd5e1"
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#666970" }}
            stroke="#cbd5e1"
            tickFormatter={(v) => {
              if (metric.unit === "percent") return `${Math.round(v)}%`;
              if (metric.unit === "dollars") {
                if (Math.abs(v) >= 1000) return `$${Math.round(v / 1000)}k`;
                return `$${Math.round(v)}`;
              }
              if (metric.unit === "count") {
                if (Math.abs(v) >= 1000) return `${Math.round(v / 1000)}k`;
                return Math.round(v).toString();
              }
              return Math.round(v).toString();
            }}
            width={48}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const sorted = [...payload].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
              return (
                <div className="rounded-md border border-ink-200 bg-white px-3 py-2 text-xs shadow-md">
                  <div className="font-medium text-ink-700">{formatYear(Number(label))}</div>
                  <div className="mt-1 space-y-0.5">
                    {sorted.map((entry) => (
                      <div key={entry.dataKey as string} className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
                        <span className="text-ink-600">{SCHOOLS_BY_SLUG[entry.dataKey as string]?.display ?? entry.dataKey}</span>
                        <span className="ml-auto font-medium tabular-nums">
                          {formatValue(metric.unit, entry.value as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(v) => SCHOOLS_BY_SLUG[v as string]?.display ?? v}
            iconType="line"
          />
          {schoolSlugs.map((slug, i) => (
            <Line
              key={slug}
              type="monotone"
              dataKey={slug}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2.25}
              dot={{ r: 3 }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
