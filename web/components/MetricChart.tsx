"use client";

import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { ChartPoint } from "@/lib/data/load";
import type { MetricMeta } from "@/lib/data/types";
import { formatValue, formatYear } from "@/lib/data/metrics";

interface Props {
  points: ChartPoint[];
  metric: MetricMeta;
  schoolDisplay: string;
  peerLabel: string;
  height?: number;
}

const ACCENT = "#c8102e";
const PEER_LINE = "#94a3b8";
const PEER_BAND = "#cbd5e1";

export default function MetricChart({
  points,
  metric,
  schoolDisplay,
  peerLabel,
  height = 220,
}: Props) {
  // Recharts needs both p25 and p75 for the band; convert to [low, high] tuple.
  const data = points.map((p) => ({
    year: p.year,
    school: p.school,
    peerMean: p.peerMean,
    band:
      p.peerP25 !== null && p.peerP75 !== null ? [p.peerP25, p.peerP75] : null,
    peerN: p.peerN,
  }));

  const hasSchoolData = data.some((d) => d.school !== null);
  const hasPeerData = data.some((d) => d.peerMean !== null);

  if (!hasSchoolData && !hasPeerData) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-ink-200 text-sm text-ink-400">
        No data
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
        >
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
            domain={["auto", "auto"]}
          />
          <Tooltip content={<CustomTooltip metric={metric} schoolDisplay={schoolDisplay} peerLabel={peerLabel} />} />
          <Area
            type="monotone"
            dataKey="band"
            stroke="none"
            fill={PEER_BAND}
            fillOpacity={0.55}
            isAnimationActive={false}
            name="band"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="peerMean"
            stroke={PEER_LINE}
            strokeWidth={1.75}
            strokeDasharray="4 3"
            dot={false}
            name="peerMean"
            isAnimationActive={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="school"
            stroke={ACCENT}
            strokeWidth={2.5}
            dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            name="school"
            isAnimationActive={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { year: number; school: number | null; peerMean: number | null; peerN: number; band: [number, number] | null } }>;
  metric: MetricMeta;
  schoolDisplay: string;
  peerLabel: string;
}

function CustomTooltip({ active, payload, metric, schoolDisplay, peerLabel }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-ink-200 bg-white px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-ink-700">{formatYear(p.year)}</div>
      <div className="mt-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="text-ink-600">{schoolDisplay}</span>
          <span className="ml-auto font-medium tabular-nums">{formatValue(metric.unit, p.school)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-peer" />
          <span className="text-ink-600">{peerLabel} mean</span>
          <span className="ml-auto font-medium tabular-nums">{formatValue(metric.unit, p.peerMean)}</span>
        </div>
        {p.band && (
          <div className="text-[11px] text-ink-400">
            {peerLabel} mid 50%: {formatValue(metric.unit, p.band[0])} – {formatValue(metric.unit, p.band[1])} (n={p.peerN})
          </div>
        )}
      </div>
    </div>
  );
}
