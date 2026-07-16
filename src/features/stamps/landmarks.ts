/**
 * Landmark art for passport stamps, in the spirit of Been's illustrated
 * stamps (Eiffel Tower for Paris, Great Wall for Beijing, ...). Emoji keep
 * the stamps fully offline with zero assets.
 */
const LANDMARKS: Record<string, string> = {
  AT: "🎻", // Vienna philharmonic
  AU: "🦘",
  BE: "⚜️", // Grand Place
  BR: "🎭", // Rio carnival
  CA: "🍁",
  CH: "🏔️", // Matterhorn
  CL: "🗿", // Easter Island
  CN: "🐉", // Great Wall dragon
  CO: "☕",
  CU: "🚗",
  CZ: "🏰", // Prague castle
  DE: "🏰", // Neuschwanstein
  DK: "🧜‍♀️", // Little Mermaid
  EG: "🐫", // Pyramids
  ES: "💃", // Flamenco
  FI: "🎅", // Lapland
  FR: "🗼", // Eiffel Tower
  GB: "💂", // Buckingham guard
  GR: "🏛️", // Parthenon
  HR: "⛵",
  HU: "♨️", // Budapest baths
  ID: "🌋",
  IE: "🍀",
  IN: "🕌", // Taj Mahal
  IS: "🌋",
  IT: "🏛️", // Colosseum
  JO: "🏜️", // Petra
  JP: "⛩️", // Torii gate
  KE: "🦁",
  KH: "🛕", // Angkor Wat
  KR: "🏯",
  LI: "🏰", // Vaduz castle
  LK: "🐘",
  LU: "🏰",
  MA: "🕌", // Koutoubia
  MV: "🏝️",
  MX: "🛕", // Chichen Itza
  MY: "🏙️", // Petronas
  NL: "🌷",
  NO: "⛰️", // Fjords
  NP: "🏔️", // Everest
  NZ: "🥝",
  PE: "🦙", // Machu Picchu
  PH: "🏝️",
  PK: "🏔️", // K2
  PL: "🏰", // Wawel
  PT: "🚋", // Lisbon tram
  QA: "🐪",
  RU: "🪆",
  SA: "🕋", // Kaaba
  SE: "🛶",
  SG: "🦁", // Merlion
  SK: "🏰",
  TH: "🛕",
  TR: "🕌", // Hagia Sophia
  TZ: "🏔️", // Kilimanjaro
  UA: "🌻",
  AE: "🏙️", // Burj Khalifa
  US: "🗽",
  VN: "🛶", // Ha Long Bay
  ZA: "🦁",
};

const CONTINENT_FALLBACK: Record<string, string> = {
  Africa: "🦁",
  Asia: "🛕",
  Europe: "🏰",
  "North America": "🏞️",
  "South America": "⛰️",
  Oceania: "🏝️",
};

export function landmarkFor(iso: string, continent: string): string {
  return LANDMARKS[iso] ?? CONTINENT_FALLBACK[continent] ?? "🌍";
}
