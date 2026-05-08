import Link from "next/link";
import { INSIGHTS } from "@/lib/data/insights";
import InsightCard from "@/components/InsightCard";
import { listAvailableSchools } from "@/lib/data/load";

export default function HomePage() {
  const schools = listAvailableSchools();
  const totalRows = schools.reduce((acc, _) => acc + 1, 0); // placeholder
  return (
    <div>
      <section className="container-page pt-12 pb-10 sm:pt-20 sm:pb-14">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Open data — {schools.length} U.S. universities
          </div>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-ink-900 sm:text-5xl sm:leading-[1.05]">
            How does <span className="text-accent">your school</span> actually compare to its peers?
          </h1>
          <p className="mt-4 text-base text-ink-600 sm:mt-5 sm:text-lg">
            Common Data Set reports — the ones colleges actually file — parsed for {schools.length} U.S. universities,
            up to 18 years deep. Pick a school. See how its admit rate, tuition, financial aid, and graduation rate
            stack up against any peer group, year by year.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/compare/stanford"
              className="rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-ink-800"
            >
              Start with Stanford →
            </Link>
            <Link
              href="/explore"
              className="rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-800 hover:border-ink-400"
            >
              Build a comparison
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-10 sm:py-14">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-ink-800 sm:text-2xl">
            What surprised us in the data
          </h2>
          <Link href="/explore" className="text-sm font-medium text-ink-500 hover:text-ink-800">
            Or jump to explore →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INSIGHTS.map((insight) => (
            <InsightCard key={insight.slug} insight={insight} />
          ))}
        </div>
      </section>

      <section className="container-page pb-16 pt-4">
        <div className="rounded-2xl border border-ink-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-ink-800">Why this exists</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            College admissions reporting is dominated by rankings and marketing.
            But every U.S. university files a Common Data Set — a standardized,
            machine-unfriendly PDF — that contains the actual numbers. Parsed
            and stitched together, those CDSes let you ask basic, useful questions:
            is my kid's school an outlier on grant aid? Is yield going up or down?
            Did the test-optional era inflate medians?
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            This is just the data — no rankings, no scoring. Pick a school, pick
            a peer group, see what's there.
          </p>
        </div>
      </section>
    </div>
  );
}
