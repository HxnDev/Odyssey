import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { forwardRef } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import { useTheme } from "@/hooks/useTheme";
import { STATUS_ORDER, statusColors, statusLabels } from "@/lib/theme";
import type { Country } from "@/features/countries/data";
import { useSetCountryStatus, useUpdateVisitDetails, useVisitByIso } from "@/features/countries/queries";

interface CountrySheetProps {
  country: Country | null;
  onDismiss: () => void;
}

export const CountrySheet = forwardRef<BottomSheetModal, CountrySheetProps>(
  function CountrySheet({ country, onDismiss }, ref) {
    const router = useRouter();
    const { colors, scheme } = useTheme();
    const { visit } = useVisitByIso(country?.iso ?? "");
    const setStatus = useSetCountryStatus();
    const updateDetails = useUpdateVisitDetails();

    if (!country) return null;

    return (
      <BottomSheetModal
        ref={ref}
        onDismiss={onDismiss}
        enableDynamicSizing
        backgroundStyle={{ backgroundColor: colors.paperRaised, borderRadius: 28 }}
        handleIndicatorStyle={{ backgroundColor: colors.line }}
      >
        <BottomSheetView className="gap-5 px-6 pb-10 pt-2">
          <View className="flex-row items-center gap-3">
            <AppText className="text-4xl">{country.flag}</AppText>
            <View className="flex-1">
              <AppText variant="title">{country.name}</AppText>
              <AppText variant="caption">
                {country.continent}
                {country.capital ? `  ·  ${country.capital}` : ""}
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="Toggle favorite"
              disabled={!visit}
              onPress={() =>
                visit && updateDetails.mutate({ iso: country.iso, favorite: !visit.favorite })
              }
              className="p-2"
            >
              <Ionicons
                name={visit?.favorite ? "star" : "star-outline"}
                size={26}
                color={visit ? colors.gold : colors.inkFaint}
              />
            </Pressable>
          </View>

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

          <Pressable
            onPress={() => {
              onDismiss();
              router.push(`/country/${country.iso}`);
            }}
            className="flex-row items-center justify-between rounded-2xl bg-paper-sunken px-4 py-3.5 dark:bg-paper-dark-sunken"
          >
            <AppText variant="heading" className="text-base">
              Country details
            </AppText>
            <Ionicons name="chevron-forward" size={20} color={colors.inkSoft} />
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
