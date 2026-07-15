import type { CountryVisitRow } from "@/lib/database.types";
import { palette, statusColors, type ColorScheme, type CountryStatus } from "@/lib/theme";

/**
 * Builds the data-driven fill-color expression: countries are colored by
 * their status; everything else gets the neutral "unvisited land" tone.
 * Recoloring is instant because only the expression changes, not the geometry.
 */
export function buildFillColorExpression(visits: CountryVisitRow[], scheme: ColorScheme) {
  const colors = palette[scheme];
  const byStatus: Record<CountryStatus, string[]> = {
    visited: [],
    lived: [],
    wishlist: [],
    transit: [],
  };
  for (const visit of visits) {
    byStatus[visit.status]?.push(visit.country_iso);
  }

  const expression: unknown[] = ["match", ["get", "iso"]];
  for (const status of Object.keys(byStatus) as CountryStatus[]) {
    const isos = byStatus[status];
    if (isos.length > 0) {
      expression.push(isos, statusColors[status][scheme]);
    }
  }
  expression.push(colors.landUnvisited);

  // "match" needs at least one branch; fall back to a literal color.
  if (expression.length === 3) return colors.landUnvisited;
  return expression;
}
