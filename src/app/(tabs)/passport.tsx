import { ScrollView, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { CONTINENTS, countries, TOTAL_COUNTRIES } from "@/features/countries/data";
import { useCountryVisits } from "@/features/countries/queries";

export default function PassportScreen() {
  const { data: visits = [] } = useCountryVisits();

  const visitedIsos = new Set(
    visits.filter((v) => v.status === "visited" || v.status === "lived").map((v) => v.country_iso),
  );
  const visitedCountries = countries.filter((c) => visitedIsos.has(c.iso));
  const continentsVisited = new Set(visitedCountries.map((c) => c.continent));
  const worldPercent =
    TOTAL_COUNTRIES > 0 ? Math.round((visitedIsos.size / TOTAL_COUNTRIES) * 100) : 0;

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8 pt-2">
        <AppText variant="display" className="text-3xl">
          Passport
        </AppText>

        <View className="flex-row gap-3">
          <Card className="flex-1 items-center py-6">
            <AppText variant="display" className="text-4xl">
              {visitedIsos.size}
            </AppText>
            <AppText variant="label">Countries</AppText>
          </Card>
          <Card className="flex-1 items-center py-6">
            <AppText variant="display" className="text-4xl">
              {worldPercent}%
            </AppText>
            <AppText variant="label">of the world</AppText>
          </Card>
        </View>

        <Card>
          <AppText variant="heading" className="mb-3">
            Continents
          </AppText>
          <View className="gap-2.5">
            {CONTINENTS.map((continent) => {
              const total = countries.filter((c) => c.continent === continent).length;
              const visited = visitedCountries.filter((c) => c.continent === continent).length;
              const percent = total > 0 ? visited / total : 0;
              return (
                <View key={continent} className="gap-1">
                  <View className="flex-row justify-between">
                    <AppText variant="label">{continent}</AppText>
                    <AppText variant="caption">
                      {visited}/{total}
                    </AppText>
                  </View>
                  <View className="h-2 overflow-hidden rounded-chip bg-paper-sunken dark:bg-paper-dark-sunken">
                    <View
                      className="h-full rounded-chip bg-teal dark:bg-teal-dark"
                      style={{ width: `${Math.max(percent * 100, visited > 0 ? 4 : 0)}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        <Card className="items-center gap-1 py-6">
          <AppText className="text-3xl">🛂</AppText>
          <AppText variant="heading">Stamps coming soon</AppText>
          <AppText variant="caption" className="text-center">
            Your digital passport stamps and full travel statistics arrive in the next phase.
          </AppText>
        </Card>

        <AppText variant="caption" className="text-center">
          {continentsVisited.size} of {CONTINENTS.length} continents explored
        </AppText>
      </ScrollView>
    </Screen>
  );
}
