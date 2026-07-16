import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, ScrollView, Share, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Screen } from "@/components/ui/Screen";
import { deleteAccount, signOut } from "@/features/auth/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { usePreferences, type ThemePreference } from "@/stores/preferences";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function SettingsScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const theme = usePreferences((s) => s.theme);
  const setTheme = usePreferences((s) => s.setTheme);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    setExporting(true);
    try {
      const [countryVisits, cityVisits, trips, tripStops] = await Promise.all([
        supabase.from("country_visits").select("*"),
        supabase.from("city_visits").select("*"),
        supabase.from("trips").select("*"),
        supabase.from("trip_stops").select("*"),
      ]);
      const firstError =
        countryVisits.error ?? cityVisits.error ?? trips.error ?? tripStops.error;
      if (firstError) throw firstError;

      const payload = {
        exportedAt: new Date().toISOString(),
        app: "Odyssey",
        countryVisits: countryVisits.data,
        cityVisits: cityVisits.data,
        trips: trips.data,
        tripStops: tripStops.data,
      };
      await Share.share({
        title: "Odyssey travel data",
        message: JSON.stringify(payload, null, 2),
      });
    } catch (error) {
      Alert.alert("Export failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setExporting(false);
    }
  };

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      Alert.alert("Sign out failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSigningOut(false);
    }
  };

  const onDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This permanently deletes your account and all travel data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete forever",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
            } catch (error) {
              Alert.alert(
                "Could not delete account",
                error instanceof Error ? error.message : "Try again.",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-4 px-4 pb-8 pt-2">
        <AppText variant="display" className="text-3xl">
          Settings
        </AppText>

        <Card className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft dark:bg-primary-dark-soft">
            <Ionicons name="person" size={22} color={colors.primary} />
          </View>
          <View className="flex-1">
            <AppText variant="heading" className="text-base">
              {(session?.user.user_metadata?.display_name as string) ?? "Traveler"}
            </AppText>
            <AppText variant="caption">{session?.user.email}</AppText>
          </View>
        </Card>

        <Card>
          <AppText variant="heading" className="mb-3">
            Appearance
          </AppText>
          <View className="flex-row gap-2">
            {THEME_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={theme === option.value}
                onPress={() => setTheme(option.value)}
              />
            ))}
          </View>
        </Card>

        <Card className="gap-3">
          <AppText variant="heading">Data</AppText>
          <Button
            title="Export my travel data"
            variant="secondary"
            loading={exporting}
            onPress={onExport}
          />
          <AppText variant="caption">
            Exports all countries, cities and trips as JSON.
          </AppText>
        </Card>

        <Card className="gap-3">
          <AppText variant="heading">Account</AppText>
          <Button title="Sign out" variant="secondary" loading={signingOut} onPress={onSignOut} />
          <Button
            title="Delete account"
            variant="danger"
            loading={deleting}
            onPress={onDeleteAccount}
          />
        </Card>

        <AppText variant="caption" className="text-center">
          Odyssey v0.1.0 — every journey matters.
        </AppText>
      </ScrollView>
    </Screen>
  );
}
