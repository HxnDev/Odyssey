import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { useCityVisits } from "@/features/cities/queries";
import { countryByIso } from "@/features/countries/data";
import { useCountryVisits } from "@/features/countries/queries";
import { MiniWorldMap } from "@/features/passport/MiniWorldMap";
import { PassportHero } from "@/features/passport/PassportHero";
import { Stamp } from "@/features/stamps/Stamp";
import { computeStats } from "@/features/stats/compute";
import { useTrips } from "@/features/trips/queries";
import { useTheme } from "@/hooks/useTheme";
import { todayIso } from "@/lib/dates";
import type { CountryStatus } from "@/lib/theme";

export default function PassportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: countryVisits = [] } = useCountryVisits();
  const { data: cityVisits = [] } = useCityVisits();
  const { data: trips = [] } = useTrips();

  const stats = useMemo(
    () => computeStats(countryVisits, cityVisits, trips, todayIso()),
    [countryVisits, cityVisits, trips],
  );

  const myCountries = useMemo(
    () =>
      countryVisits
        .filter((v) => v.status === "visited" || v.status === "lived")
        .map((v) => countryByIso.get(v.country_iso))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [countryVisits],
  );

  const stampPreview = useMemo(
    () =>
      countryVisits
        .filter((v) => v.status === "visited" || v.status === "lived")
        .slice(0, 3)
        .map((v) => ({ visit: v, country: countryByIso.get(v.country_iso) })),
    [countryVisits],
  );

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8 pt-2">
        <AppText variant="display" className="text-3xl">
          Passport
        </AppText>

        {/* Hero card — tap for the full stats breakdown */}
        <Pressable onPress={() => router.push("/stats")}>
          <PassportHero stats={stats} />
          <View className="mt-2 flex-row items-center justify-center gap-1">
            <AppText variant="caption">Tap for detailed stats & yearly breakdown</AppText>
            <Ionicons name="chevron-forward" size={12} color={colors.inkFaint} />
          </View>
        </Pressable>

        {/* World map postcard */}
        <Card className="gap-3">
          <Pressable
            onPress={() => router.push("/(tabs)")}
            className="flex-row items-center justify-between"
          >
            <AppText variant="heading">My world</AppText>
            <View className="flex-row items-center gap-1">
              <AppText variant="caption">Open map</AppText>
              <Ionicons name="chevron-forward" size={14} color={colors.inkFaint} />
            </View>
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)")}>
            <MiniWorldMap visits={countryVisits} />
          </Pressable>
        </Card>

        {/* My countries */}
        <Card className="gap-1">
          <Pressable
            onPress={() => router.push("/countries")}
            className="flex-row items-center justify-between pb-2"
          >
            <View>
              <AppText variant="heading">My countries</AppText>
              <AppText variant="caption">Everywhere you&apos;ve been</AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
          </Pressable>
          {myCountries.length > 0 ? (
            <>
              {myCountries.slice(0, 4).map((country) => (
                <Pressable
                  key={country.iso}
                  onPress={() => router.push(`/country/${country.iso}`)}
                  className="flex-row items-center gap-3 border-t border-line py-2.5 dark:border-line-dark"
                >
                  <AppText className="text-xl">{country.flag}</AppText>
                  <AppText variant="body" className="flex-1 font-sans-medium">
                    {country.name}
                  </AppText>
                  <Ionicons name="chevron-forward" size={14} color={colors.inkFaint} />
                </Pressable>
              ))}
              {myCountries.length > 4 ? (
                <Pressable onPress={() => router.push("/countries")} className="border-t border-line pt-2.5 dark:border-line-dark">
                  <AppText variant="label" className="text-primary dark:text-primary-dark">
                    + {myCountries.length - 4} more
                  </AppText>
                </Pressable>
              ) : null}
            </>
          ) : (
            <AppText variant="caption">Tap countries on the map to build your list.</AppText>
          )}
        </Card>

        {/* Stamps preview */}
        <Card>
          <Pressable
            onPress={() => router.push("/stamps")}
            className="flex-row items-center justify-between"
          >
            <AppText variant="heading">Stamp collection</AppText>
            <View className="flex-row items-center gap-1">
              <AppText variant="caption">View all</AppText>
              <Ionicons name="chevron-forward" size={14} color={colors.inkFaint} />
            </View>
          </Pressable>
          {stampPreview.length > 0 ? (
            <View className="mt-3 flex-row justify-around">
              {stampPreview.map(({ visit, country }) =>
                country ? (
                  <Stamp
                    key={visit.country_iso}
                    country={country}
                    status={visit.status as CountryStatus}
                    date={visit.first_visit_date}
                    size={100}
                  />
                ) : null,
              )}
            </View>
          ) : (
            <AppText variant="caption" className="mt-2">
              Mark countries as Visited to start collecting stamps.
            </AppText>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
