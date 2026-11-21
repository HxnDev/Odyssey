import { View } from "react-native";
import { BrowserMap } from "@/features/map/BrowserMap";
import type { CountryVisitRow } from "@/lib/database.types";

export function MiniWorldMap({ visits, height = 190 }: { visits: CountryVisitRow[]; height?: number }) {
  return (
    <View style={{ height }} pointerEvents="none" className="overflow-hidden rounded-2xl">
      <BrowserMap interactive={false} visits={visits} selectedIso={null} onCountryPress={() => {}} />
    </View>
  );
}
