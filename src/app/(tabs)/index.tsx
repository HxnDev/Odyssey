import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { CameraRef } from "@maplibre/maplibre-react-native";
import { useCallback, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { countryByIso, TOTAL_COUNTRIES, zoomForArea, type Country } from "@/features/countries/data";
import { useCountryVisits } from "@/features/countries/queries";
import { CountrySheet } from "@/features/map/CountrySheet";
import { MapSearchBar } from "@/features/map/MapSearchBar";
import { WorldMap } from "@/features/map/WorldMap";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [selected, setSelected] = useState<Country | null>(null);
  const { data: visits = [] } = useCountryVisits();

  const visitedCount = visits.filter((v) => v.status === "visited" || v.status === "lived").length;
  const worldPercent = TOTAL_COUNTRIES > 0 ? Math.round((visitedCount / TOTAL_COUNTRIES) * 100) : 0;

  const openCountry = useCallback((country: Country, flyTo: boolean) => {
    setSelected(country);
    if (flyTo) {
      cameraRef.current?.flyTo({
        center: [country.lng, country.lat],
        zoom: zoomForArea(country.area),
        duration: 900,
      });
    }
    sheetRef.current?.present();
  }, []);

  return (
    <View className="flex-1 bg-paper dark:bg-paper-dark">
      <WorldMap
        ref={cameraRef}
        visits={visits}
        selectedIso={selected?.iso ?? null}
        onCountryPress={(iso) => {
          const country = countryByIso.get(iso);
          if (country) openCountry(country, false);
        }}
      />

      <View
        pointerEvents="box-none"
        style={{ paddingTop: insets.top + 8 }}
        className="absolute inset-x-0 top-0 px-4"
      >
        <MapSearchBar onSelect={(country) => openCountry(country, true)} />
      </View>

      <Animated.View
        entering={FadeInDown.delay(300).duration(500).springify()}
        pointerEvents="none"
        className="absolute bottom-5 left-4 flex-row gap-3"
      >
        <View className="rounded-2xl border border-line bg-paper-raised/95 px-4 py-2.5 dark:border-line-dark dark:bg-paper-dark-raised/95">
          <AppText variant="caption">Countries</AppText>
          <AppText variant="title" className="text-xl">
            {visitedCount}
          </AppText>
        </View>
        <View className="rounded-2xl border border-line bg-paper-raised/95 px-4 py-2.5 dark:border-line-dark dark:bg-paper-dark-raised/95">
          <AppText variant="caption">World</AppText>
          <AppText variant="title" className="text-xl">
            {worldPercent}%
          </AppText>
        </View>
      </Animated.View>

      <CountrySheet ref={sheetRef} country={selected} onDismiss={() => setSelected(null)} />
    </View>
  );
}
