import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import { Screen } from "@/components/ui/Screen";
import { useTheme } from "@/hooks/useTheme";
import { fonts, STATUS_ORDER, statusColors, statusLabels, type CountryStatus } from "@/lib/theme";
import { countries, searchCountries } from "@/features/countries/data";
import { useCountryVisits } from "@/features/countries/queries";

type Filter = CountryStatus | "all" | "favorites";

export default function CountriesScreen() {
  const router = useRouter();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/passport");
  };
  const { colors, scheme } = useTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const { data: visits = [] } = useCountryVisits();

  const visitByIso = useMemo(() => new Map(visits.map((v) => [v.country_iso, v])), [visits]);

  const list = useMemo(() => {
    const base = query.trim() ? searchCountries(query) : countries;
    if (filter === "all") return base;
    if (filter === "favorites") return base.filter((c) => visitByIso.get(c.iso)?.favorite);
    return base.filter((c) => visitByIso.get(c.iso)?.status === filter);
  }, [query, filter, visitByIso]);

  return (
    <Screen>
      <View className="gap-4 px-4 pb-3 pt-2">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={goBack}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-paper-sunken dark:bg-paper-dark-sunken"
          >
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
          <AppText variant="display" className="text-3xl">
            Countries
          </AppText>
        </View>

        <View className="flex-row items-center gap-2 rounded-2xl border border-line bg-paper-raised px-4 dark:border-line-dark dark:bg-paper-dark-raised">
          <Ionicons name="search" size={18} color={colors.inkFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search countries"
            placeholderTextColor={colors.inkFaint}
            style={{ fontFamily: fonts.sans, color: colors.ink }}
            className="h-12 flex-1 text-base"
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["all", ...STATUS_ORDER, "favorites"] as Filter[]}
          keyExtractor={(item) => item}
          contentContainerClassName="gap-2"
          renderItem={({ item }) => (
            <Chip
              label={
                item === "all" ? "All" : item === "favorites" ? "Favorites" : statusLabels[item]
              }
              selected={filter === item}
              selectedColor={
                item !== "all" && item !== "favorites" ? statusColors[item][scheme] : undefined
              }
              onPress={() => setFilter(item)}
            />
          )}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.iso}
        contentContainerClassName="px-4 pb-8"
        renderItem={({ item }) => {
          const visit = visitByIso.get(item.iso);
          return (
            <Pressable
              onPress={() => router.push(`/country/${item.iso}`)}
              className="flex-row items-center gap-3 border-b border-line py-3 dark:border-line-dark"
            >
              <AppText className="text-2xl">{item.flag}</AppText>
              <View className="flex-1">
                <AppText variant="heading" className="text-base">
                  {item.name}
                </AppText>
                <AppText variant="caption">{item.continent}</AppText>
              </View>
              {visit?.favorite ? <Ionicons name="star" size={16} color={colors.gold} /> : null}
              {visit ? (
                <View
                  className="rounded-chip px-2.5 py-1"
                  style={{ backgroundColor: `${statusColors[visit.status][scheme]}22` }}
                >
                  <AppText
                    variant="caption"
                    style={{ color: statusColors[visit.status][scheme] }}
                    className="font-sans-semibold"
                  >
                    {statusLabels[visit.status]}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
