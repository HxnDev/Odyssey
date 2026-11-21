import type { CameraRef } from "@maplibre/maplibre-react-native";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { CountrySheet } from "@/features/map/CountrySheet";
import type { CountrySheetHandle } from "@/features/map/CountrySheetFrame";
import { MapSearchBar } from "@/features/map/MapSearchBar";
import { WorldMap, type MapViewMode } from "@/features/map/WorldMap";
import { countryByIso, TOTAL_COUNTRIES, zoomForArea, type Country } from "@/features/countries/data";
import { useCountryVisits } from "@/features/countries/queries";
import { useCityVisits } from "@/features/cities/queries";
import { useTheme } from "@/hooks/useTheme";
import "./map-screen.web.css";

export default function MapScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const cameraRef = useRef<CameraRef>(null);
  const sheetRef = useRef<CountrySheetHandle>(null);
  const [selected, setSelected] = useState<Country | null>(null);
  const [mode, setMode] = useState<MapViewMode>("countries");
  const { data: visits = [] } = useCountryVisits();
  const { data: cityVisits = [] } = useCityVisits();

  const visitedCount = visits.filter(
    (visit) => visit.status === "visited" || visit.status === "lived",
  ).length;
  const worldPercent = Math.round((visitedCount / TOTAL_COUNTRIES) * 100);

  const openCountry = useCallback((country: Country, flyTo: boolean) => {
    setSelected(country);
    if (flyTo) {
      cameraRef.current?.flyTo({
        center: [country.lng, country.lat],
        zoom: zoomForArea(country.area),
        duration: 500,
      });
    }
    window.setTimeout(() => sheetRef.current?.present(), 0);
  }, []);

  const style = {
    "--map-panel": colors.paperRaised,
    "--map-line": colors.line,
    "--map-ink": colors.ink,
    "--map-muted": colors.inkSoft,
    "--map-accent": colors.primary,
    "--map-accent-soft": colors.primarySoft,
  } as CSSProperties;

  return (
    <main className="odyssey-map-screen" style={style}>
      <WorldMap
        ref={cameraRef}
        visits={visits}
        selectedIso={selected?.iso ?? null}
        mode={mode}
        cityVisits={cityVisits}
        onCityPress={(id) => router.push(`/city/${id}`)}
        onCountryPress={(iso) => {
          if (mode !== "countries") return;
          const country = countryByIso.get(iso);
          if (country) openCountry(country, false);
        }}
      />

      <section className="odyssey-map-toolbar" aria-label="Map controls">
        <MapSearchBar onSelect={(country) => openCountry(country, true)} />
        <div className="odyssey-map-mode" role="group" aria-label="Map view">
          {(["countries", "cities"] as MapViewMode[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              <span aria-hidden="true">{value === "countries" ? "◉" : "●"}</span>
              {value === "countries" ? "Countries" : "Cities"}
            </button>
          ))}
        </div>
      </section>

      <section className="odyssey-map-stats" aria-label="Travel totals">
        <div>
          <span>{mode === "cities" ? "Cities" : "Countries"}</span>
          <strong>{mode === "cities" ? cityVisits.length : visitedCount}</strong>
        </div>
        <div>
          <span>World</span>
          <strong>{worldPercent}%</strong>
        </div>
      </section>

      <CountrySheet ref={sheetRef} country={selected} onDismiss={() => setSelected(null)} />
    </main>
  );
}
