/**
 * Flight number intelligence, Flighty-style:
 * - Best source: AeroDataBox (RapidAPI key in EXPO_PUBLIC_AERODATABOX_KEY)
 *   gives the scheduled route AND local departure/arrival times for a
 *   specific date.
 * - Fallback: the free, keyless adsbdb.com API (route only, no times).
 * - Airline name can always be resolved offline from the IATA prefix.
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
  /** Structured route parts, for storing on trip_flights rows. */
  originIata: string | null;
  originCity: string | null;
  destIata: string | null;
  destCity: string | null;
  /** Local scheduled times ("HH:MM"); only available via AeroDataBox. */
  depTime: string | null;
  arrTime: string | null;
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

const AERODATABOX_KEY = process.env.EXPO_PUBLIC_AERODATABOX_KEY;

/** "2026-09-09 10:45+02:00" → "10:45" */
function localHHMM(local: string | undefined): string | null {
  const match = local?.match(/\d{4}-\d{2}-\d{2}[T ](\d{2}:\d{2})/);
  return match ? match[1] : null;
}

interface AdbAirport {
  iata?: string;
  municipalityName?: string;
  name?: string;
}

interface AdbLeg {
  departure?: { airport?: AdbAirport; scheduledTime?: { local?: string } };
  arrival?: { airport?: AdbAirport; scheduledTime?: { local?: string } };
  airline?: { name?: string };
}

/** AeroDataBox only serves flights up to 365 days in the past. */
export function withinLookupWindow(dateIso: string): boolean {
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() < 364 * 86_400_000;
}

/**
 * AeroDataBox: scheduled route + local times for a flight number on a given
 * date. Returns null when the key is missing, the flight is unknown, or the
 * date is beyond the API's one-year history window (older flights need their
 * times entered manually).
 */
async function lookupAeroDataBox(flightNumber: string, dateIso: string): Promise<FlightInfo | null> {
  if (!AERODATABOX_KEY || !withinLookupWindow(dateIso)) return null;
  try {
    const res = await fetch(
      `https://aerodatabox.p.rapidapi.com/flights/number/${flightNumber}/${dateIso}?dateLocalRole=Departure`,
      {
        headers: {
          "X-RapidAPI-Key": AERODATABOX_KEY,
          "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com",
        },
      },
    );
    if (!res.ok) return null;
    const legs = (await res.json()) as AdbLeg[];
    const leg = Array.isArray(legs) ? legs[0] : null;
    if (!leg?.departure?.airport?.iata || !leg.arrival?.airport?.iata) return null;
    const originCity = leg.departure.airport.municipalityName ?? leg.departure.airport.name ?? null;
    const destCity = leg.arrival.airport.municipalityName ?? leg.arrival.airport.name ?? null;
    return {
      flightNumber,
      airline: leg.airline?.name ?? airlineFromFlightNumber(flightNumber),
      origin: originCity ? `${originCity} (${leg.departure.airport.iata})` : leg.departure.airport.iata,
      destination: destCity ? `${destCity} (${leg.arrival.airport.iata})` : leg.arrival.airport.iata,
      originIata: leg.departure.airport.iata,
      originCity,
      destIata: leg.arrival.airport.iata,
      destCity,
      depTime: localHHMM(leg.departure.scheduledTime?.local),
      arrTime: localHHMM(leg.arrival.scheduledTime?.local),
    };
  } catch {
    return null;
  }
}

/**
 * Looks up airline + route (+ times when a date and AeroDataBox key are
 * available). Never throws; returns offline data on failure.
 */
export async function lookupFlight(raw: string, dateIso?: string | null): Promise<FlightInfo | null> {
  const flightNumber = normalizeFlightNumber(raw);
  if (!flightNumber) return null;

  if (dateIso) {
    const scheduled = await lookupAeroDataBox(flightNumber, dateIso);
    if (scheduled) return scheduled;
  }

  const offline: FlightInfo = {
    flightNumber,
    airline: airlineFromFlightNumber(flightNumber),
    origin: null,
    destination: null,
    originIata: null,
    originCity: null,
    destIata: null,
    destCity: null,
    depTime: null,
    arrTime: null,
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
      originIata: route.origin?.iata_code ?? null,
      originCity: route.origin?.municipality ?? route.origin?.name ?? null,
      destIata: route.destination?.iata_code ?? null,
      destCity: route.destination?.municipality ?? route.destination?.name ?? null,
      depTime: null,
      arrTime: null,
    };
  } catch {
    return offline;
  }
}
