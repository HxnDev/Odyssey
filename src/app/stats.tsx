import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Screen } from "@/components/ui/Screen";
import { useCityVisits } from "@/features/cities/queries";
import { countryByIso } from "@/features/countries/data";
import { useCountryVisits } from "@/features/countries/queries";
import { PassportHero } from "@/features/passport/PassportHero";
import { computeStats } from "@/features/stats/compute";
import { useTrips } from "@/features/trips/queries";
import { useTheme } from "@/hooks/useTheme";
import { todayIso } from "@/lib/dates";
import { transportEmoji, transportLabel } from "@/lib/transport";

const CONTINENT_COLORS = ["#FF6B00", "#E8175D", "#F5A623", "#1F9E8B", "#2B7FDB", "#7B4DD6"];

export default function StatsScreen() {
  const router = useRouter();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/passport");
  };
  const { colors } = useTheme();
  const { data: countryVisits = [] } = useCountryVisits();
  const { data: cityVisits = [] } = useCityVisits();
  const { data: trips = [] } = useTrips();
  const [year, setYear] = useState<number | null>(null);

  // Year chips always show the full travel history, regardless of filter.
  const allYears = useMemo(() => {
    const years = new Set<number>();
    for (const d of [
      ...countryVisits.flatMap((v) => [v.first_visit_date, v.last_visit_date]),
      ...trips.flatMap((t) => [t.start_date, t.end_date]),
    ]) {
      if (d) years.add(parseInt(d.slice(0, 4), 10));
    }
    return [...years].sort((a, b) => b - a);
  }, [countryVisits, trips]);

  const stats = useMemo(
    () => computeStats(countryVisits, cityVisits, trips, todayIso(), year),
    [countryVisits, cityVisits, trips, year],
  );

  return (
    <Screen>
      <View className="flex-row items-center gap-3 px-4 pb-2 pt-2">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-paper-sunken dark:bg-paper-dark-sunken"
        >
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <AppText variant="display" className="text-3xl">
          Travel stats
        </AppText>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 pb-10 pt-2">
        {/* Year filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <Chip label="All-time" selected={year === null} onPress={() => setYear(null)} />
          {allYears.map((y) => (
            <Chip key={y} label={String(y)} selected={year === y} onPress={() => setYear(y)} />
          ))}
        </ScrollView>

        <PassportHero stats={stats} />

        {/* Trips per year */}
        {stats.tripsPerYear.length > 0 ? (
          <Card>
            <AppText variant="heading" className="mb-3">
              Trips per year
            </AppText>
            <BarChart data={stats.tripsPerYear} />
          </Card>
        ) : null}

        {/* Continent progress */}
        <Card>
          <AppText variant="heading" className="mb-3">
            Continents
          </AppText>
          <DonutChart
            size={140}
            centerTitle={`${stats.countriesVisited}`}
            centerSubtitle="countries"
            data={stats.countriesPerContinent
              .filter((c) => c.visited > 0)
              .map((c, i) => ({
                label: c.continent,
                value: c.visited,
                color: CONTINENT_COLORS[i % CONTINENT_COLORS.length],
              }))}
          />
          <View className="mt-4 gap-2.5">
            {stats.countriesPerContinent.map((c) => (
              <View key={c.continent} className="gap-1">
                <View className="flex-row justify-between">
                  <AppText variant="label">{c.continent}</AppText>
                  <AppText variant="caption">
                    {c.visited}/{c.total}
                  </AppText>
                </View>
                <View className="h-2 overflow-hidden rounded-chip bg-paper-sunken dark:bg-paper-dark-sunken">
                  <View
                    className="h-full rounded-chip bg-primary dark:bg-primary-dark"
                    style={{ width: `${Math.max((c.visited / c.total) * 100, c.visited > 0 ? 4 : 0)}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Records */}
        <Card className="gap-3">
          <AppText variant="heading">Records</AppText>
          <StatRow
            label="Longest trip"
            value={
              stats.longestTrip
                ? `${stats.longestTrip.trip.name} · ${stats.longestTrip.days} days`
                : "—"
            }
          />
          <StatRow
            label="Shortest trip"
            value={
              stats.shortestTrip
                ? `${stats.shortestTrip.trip.name} · ${stats.shortestTrip.days} days`
                : "—"
            }
          />
          <StatRow
            label="Average trip"
            value={stats.averageTripDays ? `${stats.averageTripDays} days` : "—"}
          />
          <StatRow
            label="Most visited country"
            value={
              stats.mostVisitedCountry
                ? `${countryByIso.get(stats.mostVisitedCountry.iso)?.flag ?? ""} ${
                    countryByIso.get(stats.mostVisitedCountry.iso)?.name ?? stats.mostVisitedCountry.iso
                  } · ${stats.mostVisitedCountry.visits}×`
                : "—"
            }
          />
          <StatRow
            label="Travel years"
            value={stats.travelYears.length > 0 ? `${stats.travelYears.length}` : "—"}
          />
        </Card>

        {/* Top countries by days */}
        {stats.topCountries.length > 0 ? (
          <Card className="gap-2.5">
            <AppText variant="heading">Top countries by days</AppText>
            {stats.topCountries.map((entry, index) => {
              const country = countryByIso.get(entry.iso);
              return (
                <Pressable
                  key={entry.iso}
                  onPress={() => router.push(`/country/${entry.iso}`)}
                  className="flex-row items-center gap-3"
                >
                  <AppText variant="caption" className="w-4 font-sans-bold">
                    {index + 1}
                  </AppText>
                  <AppText className="text-xl">{country?.flag}</AppText>
                  <AppText variant="body" className="flex-1">
                    {country?.name ?? entry.iso}
                  </AppText>
                  <AppText variant="label" className="font-sans-semibold">
                    {entry.days} days
                  </AppText>
                </Pressable>
              );
            })}
          </Card>
        ) : null}

        {/* Top cities */}
        {stats.topCities.length > 0 ? (
          <Card className="gap-2.5">
            <AppText variant="heading">Top cities</AppText>
            {stats.topCities.map((entry, index) => {
              const country = countryByIso.get(entry.city.country_iso);
              return (
                <Pressable
                  key={entry.city.id}
                  onPress={() => router.push(`/city/${entry.city.id}`)}
                  className="flex-row items-center gap-3"
                >
                  <AppText variant="caption" className="w-4 font-sans-bold">
                    {index + 1}
                  </AppText>
                  <AppText className="text-xl">{country?.flag ?? "🏙️"}</AppText>
                  <AppText variant="body" className="flex-1">
                    {entry.city.name}
                  </AppText>
                  <AppText variant="label" className="font-sans-semibold">
                    {entry.visits}×
                  </AppText>
                </Pressable>
              );
            })}
          </Card>
        ) : null}

        {/* Transport usage */}
        {stats.transportUsage.length > 0 ? (
          <Card className="gap-2.5">
            <AppText variant="heading">Transport</AppText>
            {stats.transportUsage.map((t) => (
              <View key={t.id} className="flex-row items-center gap-3">
                <AppText className="text-xl">{transportEmoji(t.id)}</AppText>
                <AppText variant="body" className="flex-1">
                  {transportLabel(t.id)}
                </AppText>
                <AppText variant="label" className="font-sans-semibold">
                  {t.count} trip{t.count === 1 ? "" : "s"}
                </AppText>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <AppText variant="label">{label}</AppText>
      <AppText variant="body" className="flex-shrink text-right font-sans-semibold" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}
