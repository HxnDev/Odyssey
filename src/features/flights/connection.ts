import type { TripFlightRow } from "@/lib/database.types";
import { utcOffsetForIata } from "./airports";

/**
 * Connection info between two consecutive legs sharing an airport.
 * A stop under 24h is a layover; anything longer is a stay (Flighty-style).
 * Durations are computed as UTC instants using each airport's UTC offset,
 * so a 23:10 AUH departure vs a 19:00 GVA arrival works out correctly.
 */
export interface ConnectionInfo {
  kind: "layover" | "stay";
  airport: string;
  /** e.g. "4h 10m" or "3d 16h"; null when times are unknown. */
  duration: string | null;
}

export function parseTimeHHMM(raw: string): string | null {
  const match = raw.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** UTC instant (ms) of a local date+time at the given airport; null if unknown. */
function instantAt(dateIso: string | null, time: string | null, iata: string | null): number | null {
  if (!dateIso || !time || !iata) return null;
  const offset = utcOffsetForIata(iata);
  if (offset == null) return null;
  const [y, mo, d] = dateIso.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  if (!y || !mo || !d || Number.isNaN(h) || Number.isNaN(mi)) return null;
  return Date.UTC(y, mo - 1, d, h, mi) - offset * 3_600_000;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

export function connectionBetween(prev: TripFlightRow, next: TripFlightRow): ConnectionInfo | null {
  if (!prev.dest_iata || prev.dest_iata !== next.origin_iata) return null;
  const airport = prev.dest_iata;

  let arrival = instantAt(prev.flight_date, prev.arr_time, prev.dest_iata);
  const prevDeparture = instantAt(prev.flight_date, prev.dep_time, prev.origin_iata);
  // Red-eye legs land the day after their flight_date (e.g. dep 23:10,
  // arr 03:25 +1). If arrival sorts before departure, roll it forward a day.
  if (arrival != null && prevDeparture != null && arrival < prevDeparture) {
    arrival += 86_400_000;
  }
  const departure = instantAt(next.flight_date, next.dep_time, next.origin_iata);

  if (arrival != null && departure != null && departure > arrival) {
    const ms = departure - arrival;
    return {
      kind: ms >= 86_400_000 ? "stay" : "layover",
      airport,
      duration: formatDuration(ms),
    };
  }

  // No usable times: fall back to calendar dates to at least tell a same-day
  // layover apart from a multi-day stay.
  if (prev.flight_date && next.flight_date && next.flight_date > prev.flight_date) {
    const days = Math.round(
      (Date.parse(next.flight_date) - Date.parse(prev.flight_date)) / 86_400_000,
    );
    return { kind: "stay", airport, duration: `${days}d` };
  }
  return { kind: "layover", airport, duration: null };
}
