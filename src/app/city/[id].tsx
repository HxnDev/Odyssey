import { Alert } from "@/lib/alert";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { CalendarField } from "@/components/ui/CalendarField";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { useCityVisit, useDeleteCityVisit, useUpdateCityVisit } from "@/features/cities/queries";
import { countryByIso } from "@/features/countries/data";
import { useTheme } from "@/hooks/useTheme";
import { fonts } from "@/lib/theme";

export default function CityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };
  const { colors } = useTheme();
  const { city } = useCityVisit(id ?? "");
  const updateCity = useUpdateCityVisit();
  const deleteCity = useDeleteCityVisit();

  const [notes, setNotes] = useState(city?.notes ?? "");
  const [prevId, setPrevId] = useState(city?.id);
  if (city && city.id !== prevId) {
    setPrevId(city.id);
    setNotes(city.notes ?? "");
  }

  if (!city) {
    return (
      <Screen>
        <EmptyState emoji="🏙️" title="City not found" actionTitle="Go back" onAction={goBack} />
      </Screen>
    );
  }

  const country = countryByIso.get(city.country_iso);

  const onDelete = () => {
    Alert.alert("Remove city", `Remove ${city.name} from your visited cities?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await deleteCity.mutateAsync(city.id);
          goBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-2">
        <Pressable onPress={goBack} className="p-2" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <AppText variant="title" className="flex-1" numberOfLines={1}>
          {country?.flag ?? "🏙️"}  {city.name}
        </AppText>
        <Pressable
          accessibilityLabel="Toggle favorite"
          onPress={() => updateCity.mutate({ id: city.id, favorite: !city.favorite })}
          className="p-2"
        >
          <Ionicons
            name={city.favorite ? "star" : "star-outline"}
            size={24}
            color={colors.gold}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 pb-10">
        <Card className="flex-row flex-wrap gap-x-6 gap-y-2">
          <View>
            <AppText variant="caption">Country</AppText>
            <AppText variant="heading" className="text-base">
              {country?.name ?? city.country_iso}
            </AppText>
          </View>
          <View>
            <AppText variant="caption">Visits</AppText>
            <AppText variant="heading" className="text-base">
              {city.visit_count}
            </AppText>
          </View>
          {city.total_days ? (
            <View>
              <AppText variant="caption">Days</AppText>
              <AppText variant="heading" className="text-base">
                {city.total_days}
              </AppText>
            </View>
          ) : null}
        </Card>

        <Card className="gap-4">
          <AppText variant="heading">Visit dates</AppText>
          <View className="flex-row gap-3">
            <CalendarField
              label="First visit"
              value={city.first_visit_date}
              onChange={(value) => updateCity.mutate({ id: city.id, first_visit_date: value })}
              className="flex-1"
            />
            <CalendarField
              label="Last visit"
              value={city.last_visit_date}
              onChange={(value) => updateCity.mutate({ id: city.id, last_visit_date: value })}
              className="flex-1"
            />
          </View>
          <View className="flex-row gap-3">
            <Input
              label="Total days"
              keyboardType="number-pad"
              defaultValue={city.total_days?.toString() ?? ""}
              onEndEditing={(e) => {
                const parsed = parseInt(e.nativeEvent.text, 10);
                updateCity.mutate({ id: city.id, total_days: Number.isFinite(parsed) ? parsed : null });
              }}
              className="flex-1"
            />
            <Input
              label="Number of visits"
              keyboardType="number-pad"
              defaultValue={city.visit_count.toString()}
              onEndEditing={(e) => {
                const parsed = parseInt(e.nativeEvent.text, 10);
                if (Number.isFinite(parsed) && parsed > 0) {
                  updateCity.mutate({ id: city.id, visit_count: parsed });
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
            onEndEditing={() => updateCity.mutate({ id: city.id, notes: notes.trim() || null })}
            placeholder="Favorite spots, food, memories..."
            placeholderTextColor={colors.inkFaint}
            style={{ fontFamily: fonts.sans, color: colors.ink, minHeight: 100 }}
            className="rounded-2xl border border-line bg-paper-sunken p-3 text-base dark:border-line-dark dark:bg-paper-dark-sunken"
            textAlignVertical="top"
          />
        </Card>

        <Button title="Remove from visited cities" variant="secondary" onPress={onDelete} />
      </ScrollView>
    </Screen>
  );
}
