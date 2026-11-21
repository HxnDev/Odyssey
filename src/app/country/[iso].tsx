import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { CalendarField } from "@/components/ui/CalendarField";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { CityPicker } from "@/features/cities/CityPicker";
import { useAddCityVisit, useCityVisits } from "@/features/cities/queries";
import { useAllTripStops, useTrips } from "@/features/trips/queries";
import { formatIso } from "@/lib/dates";
import { transportEmoji } from "@/lib/transport";
import { useTheme } from "@/hooks/useTheme";
import { fonts, STATUS_ORDER, statusColors, statusLabels } from "@/lib/theme";
import { countryByIso } from "@/features/countries/data";
import {
  useSetCountryStatus,
  useUpdateVisitDetails,
  useVisitByIso,
} from "@/features/countries/queries";

export default function CountryDetailScreen() {
  const { iso } = useLocalSearchParams<{ iso: string }>();
  const router = useRouter();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };
  const { colors, scheme } = useTheme();
  const country = countryByIso.get(iso?.toUpperCase() ?? "");
  const { visit } = useVisitByIso(country?.iso ?? "");
  const setStatus = useSetCountryStatus();
  const updateDetails = useUpdateVisitDetails();
  const { data: allCityVisits = [] } = useCityVisits();
  const addCityVisit = useAddCityVisit();
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const citiesHere = allCityVisits.filter((c) => c.country_iso === country?.iso);

  // Trips are linked to countries through their stops.
  const { data: trips = [] } = useTrips();
  const { data: allStops = [] } = useAllTripStops();
  const tripIdsHere = new Set(
    allStops.filter((s) => s.country_iso === country?.iso).map((s) => s.trip_id),
  );
  const tripsHere = trips.filter((t) => tripIdsHere.has(t.id));

  const [notes, setNotes] = useState(visit?.notes ?? "");
  const [prevNotes, setPrevNotes] = useState(visit?.notes ?? "");
  if ((visit?.notes ?? "") !== prevNotes) {
    setPrevNotes(visit?.notes ?? "");
    setNotes(visit?.notes ?? "");
  }

  if (!country) {
    return (
      <Screen>
        <EmptyState
          emoji="🗺️"
          title="Country not found"
          actionTitle="Go back"
          onAction={goBack}
        />
      </Screen>
    );
  }

  const accent = visit ? statusColors[visit.status][scheme] : colors.inkFaint;

  return (
    <Screen>
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-2">
        <Pressable onPress={goBack} className="p-2" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <AppText variant="title" className="flex-1" numberOfLines={1}>
          {country.flag}  {country.name}
        </AppText>
        <Pressable
          accessibilityLabel="Toggle favorite"
          disabled={!visit}
          onPress={() => visit && updateDetails.mutate({ iso: country.iso, favorite: !visit.favorite })}
          className="p-2"
        >
          <Ionicons
            name={visit?.favorite ? "star" : "star-outline"}
            size={24}
            color={visit ? colors.gold : colors.inkFaint}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 pb-10">
        <Card className="flex-row flex-wrap gap-x-6 gap-y-2">
          <View>
            <AppText variant="caption">Continent</AppText>
            <AppText variant="heading" className="text-base">
              {country.continent}
            </AppText>
          </View>
          {country.capital ? (
            <View>
              <AppText variant="caption">Capital</AppText>
              <AppText variant="heading" className="text-base">
                {country.capital}
              </AppText>
            </View>
          ) : null}
          <View>
            <AppText variant="caption">Status</AppText>
            <AppText variant="heading" className="text-base" style={{ color: accent }}>
              {visit ? statusLabels[visit.status] : "Not marked"}
            </AppText>
          </View>
        </Card>

        <Card>
          <AppText variant="heading" className="mb-3">
            Status
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {STATUS_ORDER.map((status) => (
              <Chip
                key={status}
                label={statusLabels[status]}
                selected={visit?.status === status}
                selectedColor={statusColors[status][scheme]}
                onPress={() =>
                  setStatus.mutate({
                    iso: country.iso,
                    status: visit?.status === status ? null : status,
                  })
                }
              />
            ))}
          </View>
        </Card>

        {visit ? (
          <>
            <Card className="gap-4">
              <AppText variant="heading">Visit dates</AppText>
              <View className="flex-row gap-3">
                <CalendarField
                  label="First visit"
                  value={visit.first_visit_date}
                  onChange={(value) =>
                    updateDetails.mutate({ iso: country.iso, first_visit_date: value })
                  }
                  className="flex-1"
                />
                <CalendarField
                  label="Last visit"
                  value={visit.last_visit_date}
                  onChange={(value) =>
                    updateDetails.mutate({ iso: country.iso, last_visit_date: value })
                  }
                  className="flex-1"
                />
              </View>
              <View className="flex-row gap-3">
                <Input
                  label="Total days"
                  keyboardType="number-pad"
                  defaultValue={visit.total_days?.toString() ?? ""}
                  onEndEditing={(e) => {
                    const parsed = parseInt(e.nativeEvent.text, 10);
                    updateDetails.mutate({
                      iso: country.iso,
                      total_days: Number.isFinite(parsed) ? parsed : null,
                    });
                  }}
                  className="flex-1"
                />
                <Input
                  label="Number of visits"
                  keyboardType="number-pad"
                  defaultValue={visit.visit_count.toString()}
                  onEndEditing={(e) => {
                    const parsed = parseInt(e.nativeEvent.text, 10);
                    if (Number.isFinite(parsed) && parsed > 0) {
                      updateDetails.mutate({ iso: country.iso, visit_count: parsed });
                    }
                  }}
                  className="flex-1"
                />
              </View>
            </Card>

            <Card className="gap-2">
              <AppText variant="heading">Notes</AppText>
              <TextInput
                multiline
                value={notes}
                onChangeText={setNotes}
                onEndEditing={() =>
                  updateDetails.mutate({ iso: country.iso, notes: notes.trim() || null })
                }
                placeholder="Memories, tips, places you loved..."
                placeholderTextColor={colors.inkFaint}
                style={{ fontFamily: fonts.sans, color: colors.ink, minHeight: 100 }}
                className="rounded-2xl border border-line bg-paper-sunken p-3 text-base dark:border-line-dark dark:bg-paper-dark-sunken"
                textAlignVertical="top"
              />
            </Card>

            <Card className="gap-3">
              <View className="flex-row items-center justify-between">
                <AppText variant="heading">Cities</AppText>
                <Pressable
                  onPress={() => setCityPickerOpen(true)}
                  className="flex-row items-center gap-1 rounded-chip bg-primary px-3 py-1.5 dark:bg-primary-dark"
                >
                  <Ionicons name="add" size={16} color={colors.paperRaised} />
                  <AppText className="font-sans-semibold text-sm text-white dark:text-paper-dark">
                    Add city
                  </AppText>
                </Pressable>
              </View>

              {citiesHere.length === 0 ? (
                <AppText variant="caption">
                  No cities logged yet for {country.name}.
                </AppText>
              ) : (
                citiesHere.map((cityVisit) => (
                  <Pressable
                    key={cityVisit.id}
                    onPress={() => router.push(`/city/${cityVisit.id}`)}
                    className="flex-row items-center gap-3 border-b border-line py-2.5 last:border-b-0 dark:border-line-dark"
                  >
                    <Ionicons name="location" size={16} color={colors.primary} />
                    <View className="flex-1">
                      <AppText variant="heading" className="text-base">
                        {cityVisit.name}
                      </AppText>
                      <AppText variant="caption">
                        {cityVisit.visit_count} visit{cityVisit.visit_count === 1 ? "" : "s"}
                        {cityVisit.total_days ? `  ·  ${cityVisit.total_days} days` : ""}
                      </AppText>
                    </View>
                    {cityVisit.favorite ? (
                      <Ionicons name="star" size={14} color={colors.gold} />
                    ) : null}
                    <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
                  </Pressable>
                ))
              )}
            </Card>

            <Card className="gap-3">
              <View className="flex-row items-center justify-between">
                <AppText variant="heading">Trips</AppText>
                <Pressable
                  onPress={() => router.push("/trip/new")}
                  className="flex-row items-center gap-1 rounded-chip bg-primary px-3 py-1.5 dark:bg-primary-dark"
                >
                  <Ionicons name="add" size={16} color={colors.paperRaised} />
                  <AppText className="font-sans-semibold text-sm text-white dark:text-paper-dark">
                    Log a trip
                  </AppText>
                </Pressable>
              </View>

              {tripsHere.length === 0 ? (
                <AppText variant="caption">
                  No trips include {country.name} yet. Create a trip and add a stop here to link
                  them.
                </AppText>
              ) : (
                tripsHere.map((trip) => (
                  <Pressable
                    key={trip.id}
                    onPress={() => router.push(`/trip/${trip.id}`)}
                    className="flex-row items-center gap-3 border-b border-line py-2.5 last:border-b-0 dark:border-line-dark"
                  >
                    <AppText className="text-xl">
                      {trip.cover_emoji || transportEmoji(trip.transport)}
                    </AppText>
                    <View className="flex-1">
                      <AppText variant="heading" className="text-base" numberOfLines={1}>
                        {trip.name}
                      </AppText>
                      <AppText variant="caption">
                        {trip.start_date ? formatIso(trip.start_date) : "No dates"}
                        {trip.end_date ? ` – ${formatIso(trip.end_date)}` : ""}
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
                  </Pressable>
                ))
              )}
            </Card>
          </>
        ) : (
          <Card className="items-center gap-1 py-6">
            <AppText className="text-2xl">✈️</AppText>
            <AppText variant="label" className="text-center">
              Mark a status above to add dates, days and notes.
            </AppText>
          </Card>
        )}
      </ScrollView>

      <CityPicker
        visible={cityPickerOpen}
        onClose={() => setCityPickerOpen(false)}
        countryIso={country.iso}
        onPick={(city) =>
          addCityVisit.mutate({
            city_id: city.cityId,
            name: city.name,
            country_iso: city.iso,
            lat: city.lat,
            lng: city.lng,
          })
        }
      />
    </Screen>
  );
}
