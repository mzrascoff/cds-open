import { notFound } from "next/navigation";
import Link from "next/link";
import {
  buildChartSeries,
  listAvailableSchools,
  SCHOOLS_BY_SLUG,
} from "@/lib/data/load";
import { PEER_GROUPS, PEER_GROUPS_BY_ID, defaultPeerGroupFor } from "@/lib/data/schools";
import { HERO_METRICS, METRICS_BY_KEY } from "@/lib/data/metrics";
import SchoolPicker from "@/components/SchoolPicker";
import PeerGroupToggle from "@/components/PeerGroupToggle";
import MetricCard from "@/components/MetricCard";

interface Props {
  params: Promise<{ school: string }>;
  searchParams: Promise<{ peers?: string }>;
}

export async function generateStaticParams() {
  return listAvailableSchools().map((s) => ({ school: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ school: string }> }) {
  const { school } = await params;
  const meta = SCHOOLS_BY_SLUG[school];
  if (!meta) return {};
  return {
    title: `${meta.display} vs peers`,
    description: `Compare ${meta.display}'s admit rate, yield, tuition, financial aid, and graduation rate to peer schools, year by year.`,
  };
}

export default async function ComparePage({ params, searchParams }: Props) {
  const { school } = await params;
  const meta = SCHOOLS_BY_SLUG[school];
  if (!meta) notFound();

  const sp = await searchParams;
  const peerId = sp.peers && PEER_GROUPS_BY_ID[sp.peers] ? sp.peers : defaultPeerGroupFor(school);
  const peerGroup = PEER_GROUPS_BY_ID[peerId];

  const cards = HERO_METRICS.map((key) => {
    const metric = METRICS_BY_KEY[key];
    const series = buildChartSeries(school, key, peerId);
    return { metric, series };
  });

  const schools = listAvailableSchools();

  return (
    <div className="container-page py-6 sm:py-8">
      <nav className="mb-3 text-xs text-ink-500">
        <Link href="/" className="hover:text-ink-700">Home</Link>
        <span className="mx-1.5">/</span>
        <span>Compare</span>
      </nav>

      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            {meta.display} <span className="font-normal text-ink-500">vs {peerGroup.label}</span>
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            School line in red · peer-group mean dashed · shaded band shows mid 50% of peers
          </p>
        </div>
        <SchoolPicker schools={schools} current={school} className="w-full sm:w-auto" />
      </header>

      <div className="mb-5">
        <PeerGroupToggle groups={PEER_GROUPS} current={peerId} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ metric, series }) => (
          <MetricCard
            key={metric.key}
            metric={metric}
            points={series.points}
            schoolDisplay={meta.display}
            peerLabel={peerGroup.label}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link
          href={`/school/${school}`}
          className="rounded-lg border border-ink-300 bg-white px-4 py-2 font-medium text-ink-800 hover:border-ink-400"
        >
          See {meta.display} on its own →
        </Link>
        <Link
          href={`/explore?schools=${school}`}
          className="rounded-lg border border-ink-300 bg-white px-4 py-2 font-medium text-ink-800 hover:border-ink-400"
        >
          Add more schools to compare
        </Link>
      </div>
    </div>
  );
}
