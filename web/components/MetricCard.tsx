import type { MetricMeta } from "@/lib/data/types";
import { formatValue } from "@/lib/data/metrics";
import MetricChart from "./MetricChart";
import type { ChartPoint } from "@/lib/data/load";

interface Props {
  metric: MetricMeta;
  points: ChartPoint[];
  schoolDisplay: string;
  peerLabel: string;
  color?: string;
}

export default function MetricCard({ metric, points, schoolDisplay, peerLabel, color }: Props) {
  const latestSchool = [...points].reverse().find((p) => p.school !== null);
  const latestPeer = [...points].reverse().find((p) => p.peerMean !== null);

  let delta: { text: string; tone: "good" | "bad" | "neutral" } | null = null;
  if (latestSchool && latestPeer && metric.betterWhen && metric.betterWhen !== "neutral") {
    const diff = (latestSchool.school as number) - (latestPeer.peerMean as number);
    if (Number.isFinite(diff)) {
      const goodDirection = metric.betterWhen === "higher" ? diff > 0 : diff < 0;
      const sign = diff > 0 ? "+" : "";
      const text = `${sign}${formatValue(metric.unit, diff)} vs peer mean`;
      delta = { text, tone: goodDirection ? "good" : "bad" };
    }
  } else if (latestSchool && latestPeer) {
    const diff = (latestSchool.school as number) - (latestPeer.peerMean as number);
    if (Number.isFinite(diff)) {
      const sign = diff > 0 ? "+" : "";
      delta = { text: `${sign}${formatValue(metric.unit, diff)} vs peer mean`, tone: "neutral" };
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-ink-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-ink-500">
            {metric.label}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-ink-800">
            {latestSchool ? formatValue(metric.unit, latestSchool.school) : "—"}
          </div>
        </div>
        {delta && (
          <div
            className={
              "rounded px-1.5 py-0.5 text-xs tabular-nums " +
              (delta.tone === "good"
                ? "bg-emerald-50 text-emerald-700"
                : delta.tone === "bad"
                  ? "bg-rose-50 text-rose-700"
                  : "bg-ink-100 text-ink-600")
            }
          >
            {delta.text}
          </div>
        )}
      </div>
      {metric.hint && (
        <div className="mt-1 text-[11px] text-ink-400">{metric.hint}</div>
      )}
      <div className="mt-3 flex-1">
        <MetricChart
          points={points}
          metric={metric}
          schoolDisplay={schoolDisplay}
          peerLabel={peerLabel}
          color={color}
        />
      </div>
    </div>
  );
}
