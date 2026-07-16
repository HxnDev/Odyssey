import type { CityVisitRow, CountryVisitRow, TripRow } from "@/lib/database.types";
import { daysBetween } from "@/lib/dates";
import { countries, countryByIso, TOTAL_COUNTRIES } from "@/features/countries/data";

export interface TravelStats {
  countriesVisited: number;
  citiesVisited: number;
  continentsVisited: number;
  worldPercent: number;
  totalTravelDays: number;
  /** Sum of the durations of completed trips (Been-style "Duration"). */
  tripDaysTotal: number;
  travelYears: number[];
  completedTrips: number;
  upcomingTrips: number;
  longestTrip: { trip: TripRow; days: number } | null;
  shortestTrip: { trip: TripRow; days: number } | null;
  averageTripDays: number | null;
  topCountries: { iso: string; days: number }[];
  topCities: { city: CityVisitRow; visits: number }[];
  mostVisitedCountry: { iso: string; visits: number } | null;
  tripsPerYear: { label: string; value: number }[];
  countriesPerContinent: { continent: string; visited: number; total: number }[];
  transportUsage: { id: string; count: number }[];
}

function inYear(year: number, ...dates: (string | null)[]): boolean {
  return dates.some((d) => d?.startsWith(String(year)));
}

export function computeStats(
  allCountryVisits: CountryVisitRow[],
  allCityVisits: CityVisitRow[],
  allTrips: TripRow[],
  today: string,
  year?: number | null,
): TravelStats {
  // Optional year filter (passport hero card): scope everything to entries
  // whose dates touch that year. Undated entries only count as all-time.
  const countryVisits = year
    ? allCountryVisits.filter((v) => inYear(year, v.first_visit_date, v.last_visit_date))
    : allCountryVisits;
  const cityVisits = year
    ? allCityVisits.filter((v) => inYear(year, v.first_visit_date, v.last_visit_date))
    : allCityVisits;
  const trips = year
    ? allTrips.filter((t) => inYear(year, t.start_date, t.end_date))
    : allTrips;

  const visitedCountries = countryVisits.filter(
    (v) => v.status === "visited" || v.status === "lived",
  );
  const visitedIsos = new Set(visitedCountries.map((v) => v.country_iso));

  const continentsVisited = new Set(
    [...visitedIsos].map((iso) => countryByIso.get(iso)?.continent).filter(Boolean),
  );

  const activeTrips = trips.filter((t) => !t.cancelled);
  const completedTrips = activeTrips.filter((t) => t.end_date && t.end_date < today);
  const upcomingTrips = activeTrips.filter((t) => !t.end_date || t.end_date >= today);

  const tripsWithDays = completedTrips
    .map((trip) => ({ trip, days: daysBetween(trip.start_date, trip.end_date) }))
    .filter((t): t is { trip: TripRow; days: number } => t.days !== null);

  const longestTrip = tripsWithDays.reduce<{ trip: TripRow; days: number } | null>(
    (best, t) => (best === null || t.days > best.days ? t : best),
    null,
  );
  const shortestTrip = tripsWithDays.reduce<{ trip: TripRow; days: number } | null>(
    (best, t) => (best === null || t.days < best.days ? t : best),
    null,
  );
  const averageTripDays =
    tripsWithDays.length > 0
      ? Math.round(tripsWithDays.reduce((sum, t) => sum + t.days, 0) / tripsWithDays.length)
      : null;

  const totalTravelDays = countryVisits.reduce((sum, v) => sum + (v.total_days ?? 0), 0);
  const tripDaysTotal = tripsWithDays.reduce((sum, t) => sum + t.days, 0);

  const travelYears = [
    ...new Set(
      [
        ...countryVisits.flatMap((v) => [v.first_visit_date, v.last_visit_date]),
        ...trips.flatMap((t) => [t.start_date, t.end_date]),
      ]
        .filter((d): d is string => !!d)
        .map((d) => parseInt(d.slice(0, 4), 10)),
    ),
  ].sort();

  const topCountries = countryVisits
    .filter((v) => (v.total_days ?? 0) > 0)
    .map((v) => ({ iso: v.country_iso, days: v.total_days ?? 0 }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 5);

  const topCities = cityVisits
    .map((city) => ({ city, visits: city.visit_count }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  const mostVisitedCountry = countryVisits.reduce<{ iso: string; visits: number } | null>(
    (best, v) =>
      best === null || v.visit_count > best.visits
        ? { iso: v.country_iso, visits: v.visit_count }
        : best,
    null,
  );

  // Trips per year over the last 6 years that have any activity.
  const tripYearCounts = new Map<number, number>();
  for (const trip of activeTrips) {
    const year = trip.start_date ? parseInt(trip.start_date.slice(0, 4), 10) : null;
    if (year) tripYearCounts.set(year, (tripYearCounts.get(year) ?? 0) + 1);
  }
  const tripsPerYear = [...tripYearCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(-6)
    .map(([year, count]) => ({ label: String(year), value: count }));

  const continentTotals = new Map<string, number>();
  for (const c of countries) {
    continentTotals.set(c.continent, (continentTotals.get(c.continent) ?? 0) + 1);
  }
  const countriesPerContinent = [...continentTotals.entries()].map(([continent, total]) => ({
    continent,
    total,
    visited: [...visitedIsos].filter((iso) => countryByIso.get(iso)?.continent === continent)
      .length,
  }));

  const transportCounts = new Map<string, number>();
  for (const trip of activeTrips) {
    transportCounts.set(trip.transport, (transportCounts.get(trip.transport) ?? 0) + 1);
  }
  const transportUsage = [...transportCounts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);

  return {
    countriesVisited: visitedIsos.size,
    citiesVisited: cityVisits.length,
    continentsVisited: continentsVisited.size,
    worldPercent: TOTAL_COUNTRIES > 0 ? Math.round((visitedIsos.size / TOTAL_COUNTRIES) * 100) : 0,
    totalTravelDays,
    tripDaysTotal,
    travelYears,
    completedTrips: completedTrips.length,
    upcomingTrips: upcomingTrips.length,
    longestTrip,
    shortestTrip,
    averageTripDays,
    topCountries,
    topCities,
    mostVisitedCountry,
    tripsPerYear,
    countriesPerContinent,
    transportUsage,
  };
}
