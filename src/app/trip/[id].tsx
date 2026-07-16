import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { CalendarField } from "@/components/ui/CalendarField";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/AuthProvider";
import { CityPicker, type PickedCity } from "@/features/cities/CityPicker";
import { useAddCityVisit } from "@/features/cities/queries";
import { FlightNumberField } from "@/features/flights/FlightNumberField";
import { useSetCountryStatus, useCountryVisits } from "@/features/countries/queries";
import { deleteCoverPhoto, pickCoverPhoto, uploadCoverPhoto } from "@/features/trips/coverPhoto";
import { StopCard } from "@/features/trips/StopCard";
import { TransportPicker } from "@/features/trips/TransportPicker";
import {
  useAddTripStop,
  useDeleteTrip,
  useTrip,
  useTripStops,
  useUpdateTrip,
  useUpdateTripStop,
} from "@/features/trips/queries";
import { useTheme } from "@/hooks/useTheme";
import type { TripStopRow } from "@/lib/database.types";
import { daysBetween, isPast } from "@/lib/dates";
import { fonts } from "@/lib/theme";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useAuth();
  const { trip } = useTrip(id ?? "");
  const { data: stops = [] } = useTripStops(id ?? "");
  const { data: countryVisits = [] } = useCountryVisits();

  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();
  const addStop = useAddTripStop();
  const updateStop = useUpdateTripStop();
  const addCityVisit = useAddCityVisit();
  const setCountryStatus = useSetCountryStatus();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [highlights, setHighlights] = useState(trip?.highlights ?? "");
  const [prevTripId, setPrevTripId] = useState(trip?.id);
  if (trip && trip.id !== prevTripId) {
    setPrevTripId(trip.id);
    setHighlights(trip.highlights ?? "");
  }

  if (!trip) {
    return (
      <Screen>
        <EmptyState emoji="🧳" title="Trip not found" actionTitle="Go back" onAction={() => router.back()} />
      </Screen>
    );
  }

  const days = daysBetween(trip.start_date, trip.end_date);
  const tripIsPast = !trip.cancelled && isPast(trip.end_date);

  const onChangeCover = async () => {
    if (!session) return;
    try {
      const uri = await pickCoverPhoto();
      if (!uri) return;
      setUploadingCover(true);
      const url = await uploadCoverPhoto(uri, session.user.id, trip.id);
      updateTrip.mutate({ id: trip.id, cover_photo_url: url });
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setUploadingCover(false);
    }
  };

  const onRemoveCover = () => {
    Alert.alert("Remove cover photo?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          if (session) void deleteCoverPhoto(session.user.id, trip.id);
          updateTrip.mutate({ id: trip.id, cover_photo_url: null });
        },
      },
    ]);
  };

  const onAddStop = (city: PickedCity) => {
    addStop.mutate({
      trip_id: trip.id,
      city_name: city.name,
      country_iso: city.iso,
      lat: city.lat,
      lng: city.lng,
      position: stops.length,
    });

    // Completed trips feed the archive: log the city and mark the country visited.
    if (tripIsPast) {
      addCityVisit.mutate({ city_id: city.cityId, name: city.name, country_iso: city.iso, lat: city.lat, lng: city.lng });
      const existing = countryVisits.find((v) => v.country_iso === city.iso);
      if (!existing) setCountryStatus.mutate({ iso: city.iso, status: "visited" });
    }
  };

  const onMoveStop = (stop: TripStopRow, direction: -1 | 1) => {
    const index = stops.findIndex((s) => s.id === stop.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= stops.length) return;
    const other = stops[targetIndex];
    updateStop.mutate({ id: stop.id, trip_id: trip.id, position: other.position });
    updateStop.mutate({ id: other.id, trip_id: trip.id, position: stop.position });
  };

  const onDelete = () => {
    Alert.alert("Delete trip", `Delete “${trip.name}” and all its stops?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (session) void deleteCoverPhoto(session.user.id, trip.id);
          await deleteTrip.mutateAsync(trip.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-2">
        <Pressable onPress={() => router.back()} className="p-2" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <AppText variant="title" className="flex-1" numberOfLines={1}>
          {trip.name}
        </AppText>
        <Pressable onPress={onDelete} className="p-2" accessibilityLabel="Delete trip">
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 pb-10" keyboardShouldPersistTaps="handled">
        {/* Cover photo */}
        {trip.cover_photo_url ? (
          <View className="overflow-hidden rounded-card">
            <Image
              source={{ uri: trip.cover_photo_url }}
              style={{ width: "100%", height: 180 }}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
            />
            <View className="absolute bottom-3 right-3 flex-row gap-2">
              <Pressable
                onPress={onChangeCover}
                disabled={uploadingCover}
                className="flex-row items-center gap-1.5 rounded-chip bg-black/55 px-3 py-1.5"
              >
                {uploadingCover ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                )}
                <AppText className="font-sans-semibold text-xs text-white">Change</AppText>
              </Pressable>
              <Pressable
                onPress={onRemoveCover}
                accessibilityLabel="Remove cover photo"
                className="items-center justify-center rounded-chip bg-black/55 px-3 py-1.5"
              >
                <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={onChangeCover}
            disabled={uploadingCover}
            className="items-center justify-center gap-2 rounded-card border-2 border-dashed border-line bg-paper-sunken py-8 dark:border-line-dark dark:bg-paper-dark-sunken"
          >
            {uploadingCover ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="image-outline" size={28} color={colors.inkFaint} />
            )}
            <AppText variant="label">{uploadingCover ? "Uploading…" : "Add a cover photo"}</AppText>
          </Pressable>
        )}

        {trip.cancelled ? (
          <Card className="flex-row items-center gap-2 bg-paper-sunken dark:bg-paper-dark-sunken">
            <Ionicons name="close-circle" size={18} color={colors.inkFaint} />
            <AppText variant="label" className="flex-1">
              This trip is cancelled.
            </AppText>
            <Chip label="Restore" onPress={() => updateTrip.mutate({ id: trip.id, cancelled: false })} />
          </Card>
        ) : null}

        <Card className="gap-4">
          <View className="flex-row gap-3">
            <CalendarField
              label="Start date"
              value={trip.start_date}
              onChange={(value) => updateTrip.mutate({ id: trip.id, start_date: value })}
              className="flex-1"
            />
            <CalendarField
              label="End date"
              value={trip.end_date}
              onChange={(value) => updateTrip.mutate({ id: trip.id, end_date: value })}
              className="flex-1"
            />
          </View>
          {days ? (
            <AppText variant="caption">
              {days} days{stops.length > 1 ? ` · ${stops.length} destinations` : ""}
            </AppText>
          ) : null}
          <TransportPicker
            value={trip.transport}
            onChange={(mode) => mode && updateTrip.mutate({ id: trip.id, transport: mode })}
          />
          {trip.transport === "plane" ? (
            <FlightNumberField
              value={trip.flight_number}
              onCommit={(flightNumber) =>
                updateTrip.mutate({ id: trip.id, flight_number: flightNumber })
              }
            />
          ) : null}
          <Input
            label="Trip group"
            placeholder="e.g. Japan 2026 — groups related trips together"
            defaultValue={trip.group_name ?? ""}
            onEndEditing={(e) =>
              updateTrip.mutate({ id: trip.id, group_name: e.nativeEvent.text.trim() || null })
            }
          />
        </Card>

        {/* Destinations: single-destination trips stay simple; per-stop dates
            and transport only appear once the journey has multiple legs. */}
        <View className="gap-1">
          <View className="flex-row items-center justify-between px-1 pb-2">
            <AppText variant="heading">
              {stops.length > 1 ? "Destinations" : "Destination"}
            </AppText>
            <Pressable
              onPress={() => setPickerOpen(true)}
              className="flex-row items-center gap-1 rounded-chip bg-primary px-3 py-1.5 dark:bg-primary-dark"
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <AppText className="font-sans-semibold text-sm text-white">
                {stops.length === 0 ? "Set destination" : "Add stop"}
              </AppText>
            </Pressable>
          </View>

          {stops.length === 0 ? (
            <Card className="items-center gap-1 py-6">
              <AppText className="text-2xl">🗺️</AppText>
              <AppText variant="label" className="text-center">
                Where did this trip go? Set the destination city.
              </AppText>
            </Card>
          ) : (
            stops.map((stop, index) => (
              <StopCard
                key={stop.id}
                stop={stop}
                index={index}
                isLast={index === stops.length - 1}
                compact={stops.length === 1}
                onMove={onMoveStop}
              />
            ))
          )}
        </View>

        <Card className="gap-2">
          <AppText variant="heading">Highlights</AppText>
          <TextInput
            multiline
            value={highlights}
            onChangeText={setHighlights}
            onEndEditing={() => updateTrip.mutate({ id: trip.id, highlights: highlights.trim() || null })}
            placeholder="Best moments, plans, things to remember..."
            placeholderTextColor={colors.inkFaint}
            style={{ fontFamily: fonts.sans, color: colors.ink, minHeight: 70 }}
            className="rounded-2xl border border-line bg-paper-sunken p-3 text-base dark:border-line-dark dark:bg-paper-dark-sunken"
            textAlignVertical="top"
          />
        </Card>

        {!trip.cancelled ? (
          <Button
            title="Cancel this trip"
            variant="secondary"
            onPress={() => updateTrip.mutate({ id: trip.id, cancelled: true })}
          />
        ) : null}
      </ScrollView>

      <CityPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={onAddStop}
        title={stops.length === 0 ? "Set destination" : "Add stop"}
      />
    </Screen>
  );
}
