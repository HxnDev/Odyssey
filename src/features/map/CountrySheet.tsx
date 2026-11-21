import { CountrySheetFrame, type CountrySheetHandle } from "./CountrySheetFrame";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { forwardRef, useMemo } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import { useTheme } from "@/hooks/useTheme";
import { statusColors, statusLabels } from "@/lib/theme";
import type { Country } from "@/features/countries/data";
import { useSetCountryStatus, useUpdateVisitDetails, useVisitByIso } from "@/features/countries/queries";
import { cities as allCities } from "@/features/cities/data";
import { useAddCityVisit, useCityVisits, useDeleteCityVisit, useUpdateCityVisit } from "@/features/cities/queries";

interface CountrySheetProps {
  country: Country | null;
  onDismiss: () => void;
}

export const CountrySheet = forwardRef<CountrySheetHandle, CountrySheetProps>(
  function CountrySheet({ country, onDismiss }, ref) {
    const router = useRouter();
    const { colors, scheme } = useTheme();
    const { visit } = useVisitByIso(country?.iso ?? "");
    const setStatus = useSetCountryStatus();
    const updateDetails = useUpdateVisitDetails();

    const { data: cityVisits = [] } = useCityVisits();
    const addCity = useAddCityVisit();
    const deleteCity = useDeleteCityVisit();
    const updateCity = useUpdateCityVisit();

    // Top cities of this country (by population), with the user's own logged
    // cities merged in — visited ones first, like Been's city list.
    const cityRows = useMemo(() => {
      if (!country) return [];
      const visitsHere = cityVisits.filter((c) => c.country_iso === country.iso);
      const visitByName = new Map(visitsHere.map((c) => [c.name.toLowerCase(), c]));
      const top = allCities.filter((c) => c.iso === country.iso).slice(0, 14);
      const rows = top.map((c) => ({
        key: `b-${c.id}`,
        name: c.name,
        cityId: c.id as number | null,
        lat: c.lat as number | null,
        lng: c.lng as number | null,
        visit: visitByName.get(c.name.toLowerCase()) ?? null,
      }));
      // Custom/logged cities that aren't in the bundled top list.
      const bundledNames = new Set(top.map((c) => c.name.toLowerCase()));
      for (const v of visitsHere) {
        if (!bundledNames.has(v.name.toLowerCase())) {
          rows.push({ key: `v-${v.id}`, name: v.name, cityId: v.city_id, lat: v.lat, lng: v.lng, visit: v });
        }
      }
      return rows.sort((a, b) => Number(!!b.visit) - Number(!!a.visit));
    }, [country, cityVisits]);

    const status = visit?.status ?? null;
    const visitedSelected = status === "visited";
    const wishlistSelected = status === "wishlist";

    const toggleStatus = (target: "visited" | "wishlist") =>
      country && setStatus.mutate({ iso: country.iso, status: status === target ? null : target });

    return (
      <CountrySheetFrame ref={ref} onDismiss={onDismiss}>
        {country && <>
          {/* Header */}
          <View className="flex-row items-center gap-3 pb-4 pt-1">
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
            <Pressable
              accessibilityLabel="Country details"
              onPress={() => {
                onDismiss();
                router.push(`/country/${country.iso}`);
              }}
              className="h-10 w-10 items-center justify-center rounded-full bg-paper-sunken dark:bg-paper-dark-sunken"
            >
              <Ionicons name="chevron-forward" size={20} color={colors.inkSoft} />
            </Pressable>
          </View>

          {/* Big Been-style toggles */}
          <View className="flex-row gap-3 pb-3">
            <Pressable
              onPress={() => toggleStatus("visited")}
              className={`h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl ${
                visitedSelected
                  ? "bg-primary dark:bg-primary-dark"
                  : "bg-paper-sunken dark:bg-paper-dark-sunken"
              }`}
            >
              <Ionicons
                name="flag"
                size={18}
                color={visitedSelected ? "#FFFFFF" : colors.inkSoft}
              />
              <AppText
                variant="heading"
                className={`text-base ${visitedSelected ? "text-white" : ""}`}
              >
                Visited
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => toggleStatus("wishlist")}
              className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-2xl"
              style={{
                backgroundColor: wishlistSelected
                  ? statusColors.wishlist[scheme]
                  : colors.paperSunken,
              }}
            >
              <Ionicons
                name={wishlistSelected ? "heart" : "heart-outline"}
                size={18}
                color={wishlistSelected ? "#FFFFFF" : colors.inkSoft}
              />
              <AppText
                variant="heading"
                className={`text-base ${wishlistSelected ? "text-white" : ""}`}
              >
                Want
              </AppText>
            </Pressable>
          </View>

          {/* Secondary statuses */}
          <View className="flex-row gap-2 pb-4">
            {(["lived", "transit"] as const).map((s) => (
              <Chip
                key={s}
                label={statusLabels[s]}
                selected={status === s}
                selectedColor={statusColors[s][scheme]}
                onPress={() => setStatus.mutate({ iso: country.iso, status: status === s ? null : s })}
              />
            ))}
          </View>

          {/* Cities */}
          <AppText variant="heading" className="pb-1">
            Cities
          </AppText>
          {cityRows.length === 0 ? (
            <AppText variant="caption" className="py-2">
              No city data for {country.name} — add one from the country page.
            </AppText>
          ) : (
            cityRows.map((row) => (
              <View
                key={row.key}
                className="flex-row items-center gap-3 border-b border-line py-3 dark:border-line-dark"
              >
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={row.visit ? colors.primary : colors.inkFaint}
                />
                <Pressable
                  className="flex-1"
                  disabled={!row.visit}
                  onPress={() => {
                    if (!row.visit) return;
                    onDismiss();
                    router.push(`/city/${row.visit.id}`);
                  }}
                >
                  <AppText variant="body" className="font-sans-medium" numberOfLines={1}>
                    {row.name}
                  </AppText>
                  {row.visit?.visit_count ? (
                    <AppText variant="caption">
                      {row.visit.visit_count} visit{row.visit.visit_count === 1 ? "" : "s"}
                    </AppText>
                  ) : null}
                </Pressable>
                <Pressable
                  accessibilityLabel={row.visit ? `Unmark ${row.name}` : `Mark ${row.name} visited`}
                  onPress={() => {
                    if (row.visit) deleteCity.mutate(row.visit.id);
                    else
                      addCity.mutate({
                        city_id: row.cityId,
                        name: row.name,
                        country_iso: country.iso,
                        lat: row.lat,
                        lng: row.lng,
                      });
                  }}
                  className={`h-9 w-9 items-center justify-center rounded-full ${
                    row.visit
                      ? "bg-primary dark:bg-primary-dark"
                      : "bg-paper-sunken dark:bg-paper-dark-sunken"
                  }`}
                >
                  <Ionicons
                    name="flag"
                    size={15}
                    color={row.visit ? "#FFFFFF" : colors.inkFaint}
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Favorite ${row.name}`}
                  disabled={!row.visit}
                  onPress={() =>
                    row.visit && updateCity.mutate({ id: row.visit.id, favorite: !row.visit.favorite })
                  }
                  className="h-9 w-9 items-center justify-center rounded-full bg-paper-sunken dark:bg-paper-dark-sunken"
                >
                  <Ionicons
                    name={row.visit?.favorite ? "star" : "star-outline"}
                    size={15}
                    color={row.visit?.favorite ? colors.gold : colors.inkFaint}
                  />
                </Pressable>
              </View>
            ))
          )}
        </>}
      </CountrySheetFrame>
    );
  },
);
