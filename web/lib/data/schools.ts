import type { PeerGroup, SchoolMeta } from "./types";

export const SCHOOLS: SchoolMeta[] = [
  { slug: "arizona", display: "Arizona", type: "public", groups: ["public_flagship"] },
  { slug: "boston_college", display: "Boston College", type: "private", groups: ["northeast"] },
  { slug: "boston_university", display: "Boston University", type: "private", groups: ["northeast"] },
  { slug: "brandeis", display: "Brandeis", type: "private", groups: ["northeast"] },
  { slug: "brown", display: "Brown", type: "private", groups: ["ivy_plus", "top_private", "northeast"] },
  { slug: "caltech", display: "Caltech", type: "private", groups: ["ivy_plus", "top_private"] },
  { slug: "cmu", display: "Carnegie Mellon", type: "private", groups: ["top_private"] },
  { slug: "columbia", display: "Columbia", type: "private", groups: ["ivy_plus", "top_private", "northeast"] },
  { slug: "cornell", display: "Cornell", type: "private", groups: ["ivy_plus", "top_private", "northeast"] },
  { slug: "dartmouth", display: "Dartmouth", type: "private", groups: ["ivy_plus", "top_private", "northeast"] },
  { slug: "duke", display: "Duke", type: "private", groups: ["ivy_plus", "top_private"] },
  { slug: "emory", display: "Emory", type: "private", groups: ["top_private"] },
  { slug: "florida", display: "Florida", type: "public", groups: ["public_flagship"] },
  { slug: "georgia_tech", display: "Georgia Tech", type: "public", groups: ["public_flagship"] },
  { slug: "harvard", display: "Harvard", type: "private", groups: ["ivy_plus", "top_private", "northeast"] },
  { slug: "iowa", display: "Iowa", type: "public", groups: ["public_flagship"] },
  { slug: "lehigh", display: "Lehigh", type: "private", groups: ["northeast"] },
  { slug: "michigan", display: "Michigan", type: "public", groups: ["public_flagship"] },
  { slug: "minnesota", display: "Minnesota", type: "public", groups: ["public_flagship"] },
  { slug: "mit", display: "MIT", type: "private", groups: ["ivy_plus", "top_private", "northeast"] },
  { slug: "northeastern", display: "Northeastern", type: "private", groups: ["northeast"] },
  { slug: "northwestern", display: "Northwestern", type: "private", groups: ["top_private"] },
  { slug: "nyu", display: "NYU", type: "private", groups: ["top_private", "northeast"] },
  { slug: "ohio_state", display: "Ohio State", type: "public", groups: ["public_flagship"] },
  { slug: "penn", display: "Penn", type: "private", groups: ["ivy_plus", "top_private", "northeast"] },
  { slug: "penn_state", display: "Penn State", type: "public", groups: ["public_flagship", "northeast"] },
  { slug: "pittsburgh", display: "Pittsburgh", type: "public", groups: ["public_flagship", "northeast"] },
  { slug: "princeton", display: "Princeton", type: "private", groups: ["ivy_plus", "top_private", "northeast"] },
  { slug: "rice", display: "Rice", type: "private", groups: ["top_private"] },
  { slug: "rutgers", display: "Rutgers", type: "public", groups: ["public_flagship", "northeast"] },
  { slug: "stanford", display: "Stanford", type: "private", groups: ["ivy_plus", "top_private"] },
  { slug: "swarthmore", display: "Swarthmore", type: "private", groups: ["northeast"] },
  { slug: "tufts", display: "Tufts", type: "private", groups: ["top_private", "northeast"] },
  { slug: "uc_davis", display: "UC Davis", type: "public", groups: ["public_flagship", "uc_system"] },
  { slug: "uc_riverside", display: "UC Riverside", type: "public", groups: ["public_flagship", "uc_system"] },
  { slug: "uc_san_diego", display: "UC San Diego", type: "public", groups: ["public_flagship", "uc_system"] },
  { slug: "uchicago", display: "UChicago", type: "private", groups: ["ivy_plus", "top_private"] },
  { slug: "ucla", display: "UCLA", type: "public", groups: ["public_flagship", "uc_system"] },
  { slug: "unc", display: "UNC", type: "public", groups: ["public_flagship"] },
  { slug: "usc", display: "USC", type: "private", groups: ["top_private"] },
  { slug: "uva", display: "UVA", type: "public", groups: ["public_flagship"] },
  { slug: "wake_forest", display: "Wake Forest", type: "private", groups: ["top_private"] },
  { slug: "washu", display: "WashU", type: "private", groups: ["top_private"] },
  { slug: "yale", display: "Yale", type: "private", groups: ["ivy_plus", "top_private", "northeast"] },
];

export const SCHOOLS_BY_SLUG: Record<string, SchoolMeta> = Object.fromEntries(
  SCHOOLS.map((s) => [s.slug, s]),
);

export const PEER_GROUPS: PeerGroup[] = [
  {
    id: "ivy_plus",
    label: "Ivy+",
    schools: ["harvard", "yale", "princeton", "columbia", "penn", "brown", "dartmouth", "cornell", "stanford", "mit", "uchicago", "duke", "caltech"],
  },
  {
    id: "top_private",
    label: "Top private",
    schools: SCHOOLS.filter((s) => s.groups.includes("top_private")).map((s) => s.slug),
  },
  {
    id: "public_flagship",
    label: "Public flagships",
    schools: SCHOOLS.filter((s) => s.groups.includes("public_flagship")).map((s) => s.slug),
  },
  {
    id: "northeast",
    label: "Northeast",
    schools: SCHOOLS.filter((s) => s.groups.includes("northeast")).map((s) => s.slug),
  },
  {
    id: "uc_system",
    label: "UC system",
    schools: SCHOOLS.filter((s) => s.groups.includes("uc_system")).map((s) => s.slug),
  },
  { id: "all", label: "All schools", schools: SCHOOLS.map((s) => s.slug) },
];

export const PEER_GROUPS_BY_ID: Record<string, PeerGroup> = Object.fromEntries(
  PEER_GROUPS.map((g) => [g.id, g]),
);

export function defaultPeerGroupFor(slug: string): string {
  const meta = SCHOOLS_BY_SLUG[slug];
  if (!meta) return "all";
  if (meta.groups.includes("ivy_plus")) return "ivy_plus";
  if (meta.groups.includes("top_private")) return "top_private";
  if (meta.groups.includes("public_flagship")) return "public_flagship";
  if (meta.groups.includes("northeast")) return "northeast";
  return "all";
}
