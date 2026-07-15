import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { useTheme } from "@/hooks/useTheme";
import { fonts, STATUS_ORDER, statusColors, statusLabels } from "@/lib/theme";
import { countryByIso } from "@/features/countries/data";
import {
  useSetCountryStatus,
  useUpdateVisitDetails,
  useVisitByIso,
} from "@/features/countries/queries";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function DateField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string | null;
  onCommit: (value: string | null) => void;
}) {
  const [text, setText] = useState(value ?? "");
  const [error, setError] = useState<string | undefined>();

  // Sync local text when the server value changes (React-recommended render-time pattern).
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value ?? "");
  }

  return (
    <Input
      label={label}
      placeholder="YYYY-MM-DD"
      value={text}
      onChangeText={(t) => {
        setText(t);
        setError(undefined);
      }}
      onBlur={() => {
        const trimmed = text.trim();
        if (!trimmed) {
          onCommit(null);
          return;
        }
        if (!DATE_RE.test(trimmed) || Number.isNaN(Date.parse(trimmed))) {
          setError("Use format YYYY-MM-DD");
          return;
        }
        onCommit(trimmed);
      }}
      error={error}
      keyboardType="numbers-and-punctuation"
      className="flex-1"
    />
  );
}

export default function CountryDetailScreen() {
  const { iso } = useLocalSearchParams<{ iso: string }>();
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const country = countryByIso.get(iso?.toUpperCase() ?? "");
  const { visit } = useVisitByIso(country?.iso ?? "");
  const setStatus = useSetCountryStatus();
  const updateDetails = useUpdateVisitDetails();

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
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const accent = visit ? statusColors[visit.status][scheme] : colors.inkFaint;

  return (
    <Screen>
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-2">
        <Pressable onPress={() => router.back()} className="p-2" accessibilityLabel="Go back">
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
                <DateField
                  label="First visit"
                  value={visit.first_visit_date}
                  onCommit={(value) =>
                    updateDetails.mutate({ iso: country.iso, first_visit_date: value })
                  }
                />
                <DateField
                  label="Last visit"
                  value={visit.last_visit_date}
                  onCommit={(value) =>
                    updateDetails.mutate({ iso: country.iso, last_visit_date: value })
                  }
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
    </Screen>
  );
}
