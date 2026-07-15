import countriesJson from "@/data/countries.json";

export interface Country {
  iso: string;
  iso3: string;
  name: string;
  officialName: string;
  continent: string;
  subregion: string | null;
  capital: string | null;
  flag: string;
  lat: number;
  lng: number;
  area: number;
  unMember: boolean;
}

export const countries: Country[] = countriesJson as Country[];

export const countryByIso = new Map(countries.map((c) => [c.iso, c]));

export const TOTAL_COUNTRIES = countries.filter((c) => c.unMember).length;

export const CONTINENTS = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
] as const;

export function searchCountries(query: string): Country[] {
  const q = query.trim().toLowerCase();
  if (!q) return countries;
  return countries.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.officialName.toLowerCase().includes(q) ||
      c.capital?.toLowerCase().includes(q) ||
      c.iso.toLowerCase() === q ||
      c.iso3.toLowerCase() === q,
  );
}

/** Rough zoom level for the fly-to camera based on country area (km²). */
export function zoomForArea(area: number): number {
  if (area > 7_000_000) return 2.2;
  if (area > 1_500_000) return 3;
  if (area > 300_000) return 4;
  if (area > 50_000) return 5;
  if (area > 5_000) return 6;
  return 7.5;
}
