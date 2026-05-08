import type { MetricKey } from "./types";

export interface InsightSpec {
  slug: string;
  title: string;
  hook: string;
  body: string[];
  primary: { schools: string[]; metric: MetricKey; peerGroup?: string };
  comparison?: { metric: MetricKey; schools: string[]; peerGroup?: string };
  takeaway: string;
}

export const INSIGHTS: InsightSpec[] = [
  {
    slug: "sub-5-club",
    title: "The sub-5% club is real, and it's eight schools",
    hook: "Caltech, Stanford, Harvard, Columbia, Yale, UChicago, Princeton, MIT all admit fewer than 1 in 20 applicants.",
    body: [
      "A decade ago the “sub-5%” admit rate was a Stanford and Harvard story. By 2024-25 it's a tight cluster of eight schools, and the gap to the next tier (Penn, Dartmouth, Duke at 5–7%) is now visible in the data.",
      "Northeastern is the surprise entrant — it dropped below 6% in 2024-25, joining Penn and Dartmouth in territory that used to be exclusively Ivy.",
    ],
    primary: {
      schools: ["caltech", "stanford", "harvard", "columbia", "yale", "uchicago", "princeton", "mit"],
      metric: "admit_rate_pct",
    },
    takeaway:
      "The “elite tier” is now narrower and lower than people think — and it's no longer just the Ivies.",
  },
  {
    slug: "volume-monsters",
    title: "Michigan got 196,620 applications. That's not a typo.",
    hook: "Application volume has separated from selectivity. Michigan and NYU are reading more applications than Caltech and Stanford combined.",
    body: [
      "Michigan, NYU, UC San Diego, and Northeastern each receive roughly 100,000+ applications a year. Michigan in particular nearly doubled NYU's volume in 2024-25 — while still admitting roughly 1 in 6.",
      "This volume is enabled by class size: Michigan enrolls ~7,000 freshmen. The result is a different kind of selectivity story than the Ivies — broad funnel, large class.",
    ],
    primary: {
      schools: ["michigan", "nyu", "uc_san_diego", "northeastern", "uc_davis"],
      metric: "applied",
    },
    takeaway:
      "“Selective” means different things at different scales. Volume rivals are competing for a different applicant pool.",
  },
  {
    slug: "flagship-value",
    title: "In-state public flagships still cost ~5× less than top private schools",
    hook: "Georgia Tech in-state tuition: $10,512. Boston College: $72,180.",
    body: [
      "Sticker tuition at top privates clusters around $65,000–$72,000. Public flagships, for in-state residents, sit at $10,000–$15,000. That's a ~5× spread that has held steady for years.",
      "Caveat: financial aid changes the math. Top privates often meet 100% of demonstrated need, so out-of-pocket cost for low- and middle-income students can be lower than the sticker suggests. Publics typically don't.",
    ],
    primary: {
      schools: ["georgia_tech", "florida", "uc_san_diego", "michigan", "stanford", "boston_college"],
      metric: "tuition",
    },
    takeaway:
      "For full-pay families the spread is real. For aid-eligible families, look at avg need-based grant — not sticker.",
  },
  {
    slug: "yield-outliers",
    title: "Why UC schools have the lowest yields in the dataset",
    hook: "UChicago: 88% of admitted students enroll. UC Riverside: 12%.",
    body: [
      "Yield — the share of admitted students who actually enroll — ranges from below 15% (UC Riverside, Pittsburgh) to above 85% (UChicago, MIT, Harvard, Stanford). That's a 7× spread.",
      "Low yield isn't a quality signal — it usually means a school is widely cross-shopped. UCs in particular are heavily applied to as safeties by California students who eventually choose Stanford or out-of-state privates.",
    ],
    primary: {
      schools: ["uchicago", "mit", "harvard", "stanford", "uc_riverside", "uc_davis"],
      metric: "yield_pct",
    },
    takeaway:
      "Low yield often signals “heavily cross-shopped,” not “low quality.” Read it alongside admit rate.",
  },
  {
    slug: "northeastern-rise",
    title: "Northeastern's transformation",
    hook: "Admit rate dropped from ~30% to 5.2% in roughly a decade.",
    body: [
      "Northeastern's selectivity arc is the most dramatic in the dataset. Application volume nearly tripled, admit rate cratered, and the school joined Penn and Dartmouth in the 5–6% admit tier.",
      "What's striking: yield (the share of admits who actually enroll) is still relatively low — ~54% — meaning most admits are still cross-applying with more selective peers.",
    ],
    primary: { schools: ["northeastern"], metric: "admit_rate_pct", peerGroup: "ivy_plus" },
    comparison: { metric: "applied", schools: ["northeastern"], peerGroup: "ivy_plus" },
    takeaway:
      "Selectivity rankings can shift fast when application volume spikes. Northeastern is the canonical example.",
  },
  {
    slug: "test-policy-flip",
    title: "Stanford and the test-optional rebound",
    hook: "Stanford's 2025-26 CDS reinstates a standardized test requirement.",
    body: [
      "Multiple top schools went test-optional during the pandemic. Several — MIT, Dartmouth, Yale, Stanford — have now reversed course and reinstated test requirements.",
      "The published median SAT scores at these schools tell a quiet story: test-optional years skew higher (only confident submitters reported), and the post-policy mix is changing again.",
    ],
    primary: { schools: ["stanford", "mit", "yale", "dartmouth"], metric: "sat_total_p50" },
    takeaway:
      "Reported test medians are partly a function of who chose to submit. Post-rebound years will be more comparable.",
  },
];

export const INSIGHTS_BY_SLUG: Record<string, InsightSpec> = Object.fromEntries(
  INSIGHTS.map((i) => [i.slug, i]),
);
