import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { CalendarField } from "@/components/ui/CalendarField";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { FlightNumberField } from "@/features/flights/FlightNumberField";
import { TransportPicker } from "@/features/trips/TransportPicker";
import { useCreateTrip } from "@/features/trips/queries";
import { useTheme } from "@/hooks/useTheme";

const COVER_EMOJIS = ["✈️", "🏝️", "🏔️", "🏛️", "🎒", "🚐", "🛳️", "🏜️", "🌃", "⛺"];

export default function NewTripScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const createTrip = useCreateTrip();

  const [name, setName] = useState("");
  const [transport, setTransport] = useState("plane");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [coverEmoji, setCoverEmoji] = useState("✈️");
  const [groupName, setGroupName] = useState("");
  const [flightNumber, setFlightNumber] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();

  const onCreate = async () => {
    if (!name.trim()) {
      setNameError("Give your trip a name");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      Alert.alert("Check the dates", "The end date is before the start date.");
      return;
    }
    try {
      const trip = await createTrip.mutateAsync({
        name: name.trim(),
        transport,
        start_date: startDate,
        end_date: endDate,
        cover_emoji: coverEmoji,
        group_name: groupName.trim() || null,
        flight_number: transport === "plane" ? flightNumber : null,
      });
      router.replace(`/trip/${trip.id}`);
    } catch (error) {
      Alert.alert("Could not create trip", error instanceof Error ? error.message : "Try again.");
    }
  };

  return (
    <Screen>
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-2">
        <Pressable onPress={() => router.back()} className="p-2" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <AppText variant="title" className="flex-1">
          New trip
        </AppText>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 pb-10" keyboardShouldPersistTaps="handled">
        <Card className="gap-4">
          <Input
            label="Trip name"
            placeholder="Summer in the Alps"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setNameError(undefined);
            }}
            error={nameError}
          />

          <View className="flex-row gap-3">
            <CalendarField label="Start date" value={startDate} onChange={setStartDate} className="flex-1" />
            <CalendarField label="End date" value={endDate} onChange={setEndDate} className="flex-1" />
          </View>
        </Card>

        <Card className="gap-3">
          <AppText variant="heading">Main transport</AppText>
          <TransportPicker
            value={transport}
            showLabels
            onChange={(mode) => mode && setTransport(mode)}
          />
          {transport === "plane" ? (
            <FlightNumberField value={flightNumber} onCommit={setFlightNumber} />
          ) : null}
        </Card>

        <Card className="gap-3">
          <AppText variant="heading">Group</AppText>
          <Input
            placeholder='e.g. "Japan 2026" — related trips show as one'
            value={groupName}
            onChangeText={setGroupName}
          />
        </Card>

        <Card className="gap-3">
          <AppText variant="heading">Cover</AppText>
          <View className="flex-row flex-wrap gap-2">
            {COVER_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => setCoverEmoji(emoji)}
                className={`h-12 w-12 items-center justify-center rounded-2xl border ${
                  coverEmoji === emoji
                    ? "border-primary bg-primary-soft dark:border-primary-dark dark:bg-primary-dark-soft"
                    : "border-line bg-paper-sunken dark:border-line-dark dark:bg-paper-dark-sunken"
                }`}
              >
                <AppText className="text-2xl">{emoji}</AppText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Button title="Create trip" loading={createTrip.isPending} onPress={onCreate} />
        <AppText variant="caption" className="text-center">
          You can set the destination, cover photo and highlights on the next screen.
        </AppText>
      </ScrollView>
    </Screen>
  );
}
