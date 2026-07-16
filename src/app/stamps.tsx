import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import { Screen } from "@/components/ui/Screen";
import { countries } from "@/features/countries/data";
import { useCountryVisits } from "@/features/countries/queries";
import { Stamp } from "@/features/stamps/Stamp";
import { useTheme } from "@/hooks/useTheme";
import type { CountryStatus } from "@/lib/theme";

type Filter = "earned" | "all";

export default function StampsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>("earned");
  const { data: visits = [] } = useCountryVisits();

  const visitByIso = useMemo(() => new Map(visits.map((v) => [v.country_iso, v])), [visits]);
  const earnedCount = visits.filter((v) => v.status === "visited" || v.status === "lived").length;

  const list = useMemo(() => {
    if (filter === "all") return countries;
    return countries.filter((c) => {
      const status = visitByIso.get(c.iso)?.status;
      return status === "visited" || status === "lived";
    });
  }, [filter, visitByIso]);

  return (
    <Screen>
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-2">
        <Pressable onPress={() => router.back()} className="p-2" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <View className="flex-1">
          <AppText variant="title">Stamps</AppText>
          <AppText variant="caption">
            {earnedCount} of {countries.length} collected
          </AppText>
        </View>
        <View className="flex-row gap-2">
          <Chip label="Earned" selected={filter === "earned"} onPress={() => setFilter("earned")} />
          <Chip label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
        </View>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.iso}
        numColumns={3}
        contentContainerClassName="flex-grow px-3 pb-10 pt-2"
        columnWrapperClassName="justify-between"
        renderItem={({ item, index }) => {
          const visit = visitByIso.get(item.iso);
          const status: CountryStatus | null =
            visit?.status === "visited" || visit?.status === "lived" ? visit.status : null;
          return (
            <Animated.View
              entering={FadeInDown.delay(Math.min(index * 25, 400)).duration(350).springify()}
              className="mb-4 items-center"
              style={{ width: "33%" }}
            >
              <Pressable onPress={() => router.push(`/country/${item.iso}`)}>
                <Stamp country={item} status={status} date={visit?.first_visit_date} />
              </Pressable>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center gap-2 px-10 py-20">
            <AppText className="text-4xl">🛂</AppText>
            <AppText variant="title" className="text-center">
              No stamps yet
            </AppText>
            <AppText variant="label" className="text-center">
              Mark countries as Visited or Lived on the map to collect their stamps.
            </AppText>
          </View>
        }
      />
    </Screen>
  );
}
