import Link from "next/link";
import { listAvailableSchools, getRowsForSchools } from "@/lib/data/load";
import { METRICS, METRICS_BY_KEY } from "@/lib/data/metrics";
import ExploreClient from "./ExploreClient";

interface Props {
  searchParams: Promise<{ schools?: string; metric?: string }>;
}

export const metadata = {
  title: "Explore",
  description: "Pick any schools and any metric. Compare them side by side.",
};

export default async function ExplorePage({ searchParams }: Props) {
  const sp = await searchParams;
  const allSchools = listAvailableSchools();
  const initialSchoolsRaw = (sp.schools ?? "stanford,mit,michigan").split(",").filter(Boolean);
  const initialSchools = initialSchoolsRaw.filter((s) => allSchools.some((sc) => sc.slug === s));
  const initialMetric =
    sp.metric && METRICS_BY_KEY[sp.metric] ? sp.metric : "admit_rate_pct";

  // Pre-load rows for initial schools (server-side); client re-fetches if user adds more.
  const allRows = getRowsForSchools(allSchools.map((s) => s.slug));

  return (
    <div className="container-page py-6 sm:py-8">
      <nav className="mb-3 text-xs text-ink-500">
        <Link href="/" className="hover:text-ink-700">Home</Link>
        <span className="mx-1.5">/</span>
        <span>Explore</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
          Build your own comparison
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Pick up to 6 schools and any metric. Share the URL — it remembers what you picked.
        </p>
      </header>

      <ExploreClient
        allSchools={allSchools}
        allRows={allRows}
        metrics={METRICS}
        initialSchools={initialSchools.length ? initialSchools : ["stanford", "mit", "michigan"]}
        initialMetric={initialMetric}
      />
    </div>
  );
}
