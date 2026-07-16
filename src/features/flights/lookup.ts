/**
 * Flight number intelligence, Flighty-style but free:
 * - Airline is resolved offline from the IATA prefix (e.g. EK202 → Emirates).
 * - Route (origin/destination airports) comes from the free, keyless
 *   adsbdb.com API when the flight is known to it.
 *
 * Live departure/arrival timings need a commercial API (AeroDataBox,
 * FlightAware); the lookup result leaves room to add that later.
 */

const AIRLINES: Record<string, string> = {
  AA: "American Airlines",
  AC: "Air Canada",
  AF: "Air France",
  AI: "Air India",
  AY: "Finnair",
  AZ: "ITA Airways",
  BA: "British Airways",
  BR: "EVA Air",
  CA: "Air China",
  CX: "Cathay Pacific",
  CZ: "China Southern",
  DE: "Condor",
  DL: "Delta Air Lines",
  EK: "Emirates",
  ET: "Ethiopian Airlines",
  EY: "Etihad Airways",
  FI: "Icelandair",
  FR: "Ryanair",
  FZ: "flydubai",
  GA: "Garuda Indonesia",
  GF: "Gulf Air",
  IB: "Iberia",
  JL: "Japan Airlines",
  KE: "Korean Air",
  KL: "KLM",
  KU: "Kuwait Airways",
  LA: "LATAM",
  LH: "Lufthansa",
  LO: "LOT Polish Airlines",
  LX: "Swiss International Air Lines",
  ME: "Middle East Airlines",
  MH: "Malaysia Airlines",
  MS: "EgyptAir",
  NH: "All Nippon Airways",
  NZ: "Air New Zealand",
  OS: "Austrian Airlines",
  PC: "Pegasus Airlines",
  PK: "Pakistan International Airlines",
  QF: "Qantas",
  QR: "Qatar Airways",
  RJ: "Royal Jordanian",
  SK: "SAS",
  SN: "Brussels Airlines",
  SQ: "Singapore Airlines",
  SV: "Saudia",
  TG: "Thai Airways",
  TK: "Turkish Airlines",
  TP: "TAP Air Portugal",
  U2: "easyJet",
  UA: "United Airlines",
  UL: "SriLankan Airlines",
  UX: "Air Europa",
  VN: "Vietnam Airlines",
  VS: "Virgin Atlantic",
  VY: "Vueling",
  W6: "Wizz Air",
  WN: "Southwest Airlines",
  WY: "Oman Air",
  XY: "flynas",
};

export interface FlightInfo {
  flightNumber: string;
  airline: string | null;
  origin: string | null; // "Geneva (GVA)"
  destination: string | null;
}

export function normalizeFlightNumber(raw: string): string | null {
  const cleaned = raw.toUpperCase().replace(/\s+/g, "");
  return /^[A-Z0-9]{2}\d{1,4}[A-Z]?$/.test(cleaned) ? cleaned : null;
}

export function airlineFromFlightNumber(flightNumber: string): string | null {
  return AIRLINES[flightNumber.slice(0, 2)] ?? null;
}

interface AdsbdbAirport {
  iata_code?: string;
  municipality?: string;
  name?: string;
}

function formatAirport(a: AdsbdbAirport | undefined): string | null {
  if (!a) return null;
  const place = a.municipality || a.name;
  if (!place) return a.iata_code ?? null;
  return a.iata_code ? `${place} (${a.iata_code})` : place;
}

/** Looks up airline + route. Never throws; returns offline data on failure. */
export async function lookupFlight(raw: string): Promise<FlightInfo | null> {
  const flightNumber = normalizeFlightNumber(raw);
  if (!flightNumber) return null;

  const offline: FlightInfo = {
    flightNumber,
    airline: airlineFromFlightNumber(flightNumber),
    origin: null,
    destination: null,
  };

  try {
    const res = await fetch(`https://api.adsbdb.com/v0/callsign/${flightNumber}`);
    if (!res.ok) return offline;
    const json = (await res.json()) as {
      response?: {
        flightroute?: {
          airline?: { name?: string };
          origin?: AdsbdbAirport;
          destination?: AdsbdbAirport;
        };
      };
    };
    const route = json.response?.flightroute;
    if (!route) return offline;
    return {
      flightNumber,
      airline: route.airline?.name ?? offline.airline,
      origin: formatAirport(route.origin),
      destination: formatAirport(route.destination),
    };
  } catch {
    return offline;
  }
}
