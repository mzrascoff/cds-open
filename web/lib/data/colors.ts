// Primary brand color per school, keyed by slug. Values are the school's
// recognizable primary (or its more legible secondary where the primary is a
// pale/near-white shade), tuned to read clearly as a line on a white chart.
export const SCHOOL_COLORS: Record<string, string> = {
  arizona: "#AB0520", // Arizona cardinal
  boston_college: "#98002E", // BC maroon
  boston_university: "#CC0000", // BU scarlet
  brandeis: "#003478", // Brandeis blue
  brown: "#4E3629", // seal brown
  caltech: "#FF6C0C", // Caltech orange
  cmu: "#C41230", // Carnegie red
  columbia: "#1D4F91", // Columbia blue (deepened for legibility)
  cornell: "#B31B1B", // carnelian
  dartmouth: "#00693E", // Dartmouth green
  duke: "#00539B", // Duke blue
  emory: "#012169", // Emory blue
  florida: "#0021A5", // Florida blue
  georgia_tech: "#003057", // GT navy
  harvard: "#A51C30", // Harvard crimson
  iowa: "#111111", // Iowa black (paired with gold)
  lehigh: "#623412", // Lehigh brown
  michigan: "#00274C", // Michigan blue
  minnesota: "#7A0019", // Minnesota maroon
  mit: "#A31F34", // MIT cardinal
  northeastern: "#D41B2C", // Northeastern red
  northwestern: "#4E2A84", // Northwestern purple
  nyu: "#57068C", // NYU violet
  ohio_state: "#BB0000", // Ohio State scarlet
  penn: "#011F5B", // Penn blue
  penn_state: "#041E42", // Nittany navy
  pittsburgh: "#003594", // Pitt blue
  princeton: "#E77500", // Princeton orange
  rice: "#00205B", // Rice blue
  rutgers: "#CC0033", // Rutgers scarlet
  stanford: "#8C1515", // Stanford cardinal
  swarthmore: "#862633", // Swarthmore garnet
  tufts: "#418FDE", // Tufts blue
  uc_davis: "#022851", // UC Davis Aggie blue
  uc_riverside: "#003DA5", // UCR blue
  uc_san_diego: "#182B49", // UCSD navy
  uchicago: "#800000", // UChicago maroon
  ucla: "#2774AE", // UCLA blue
  unc: "#4B9CD3", // Carolina blue
  usc: "#990000", // USC cardinal
  uva: "#232D4B", // UVA navy
  wake_forest: "#9E7E38", // Wake Forest old gold
  washu: "#A51417", // WashU red
  yale: "#00356B", // Yale blue
};

// Fallback for any slug without a defined brand color.
export const DEFAULT_COLOR = "#c8102e";

export function colorForSchool(slug: string): string {
  return SCHOOL_COLORS[slug] ?? DEFAULT_COLOR;
}
