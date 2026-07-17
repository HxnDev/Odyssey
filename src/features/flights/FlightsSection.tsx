import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { AppText } from "@/components/ui/AppText";
import { CalendarField } from "@/components/ui/CalendarField";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/hooks/useTheme";
import type { TripFlightRow } from "@/lib/database.types";
import { formatIso } from "@/lib/dates";
import { useAddTripFlight, useDeleteTripFlight, useTripFlights, useUpdateTripFlight } from "./queries";
import { cityForIata } from "./airports";
import { connectionBetween, parseTimeHHMM } from "./connection";
import { lookupFlight, normalizeFlightNumber, withinLookupWindow } from "./lookup";

export interface ScrollContext {
  ref: RefObject<ScrollView | null>;
  offsetY: RefObject<number>;
}

/**
 * When `active` turns true, waits for the keyboard to settle, then scrolls
 * just enough that the referenced view's bottom clears the keyboard.
 * Uses measure() (Fabric-safe; measureLayout with a node handle is not).
 */
function useScrollIntoView(scroll: ScrollContext | undefined, active: boolean) {
  const viewRef = useRef<View>(null);
  useEffect(() => {
    if (!active || !scroll) return;
    const timer = setTimeout(() => {
      viewRef.current?.measure((_x, _y, _w, height, _pageX, pageY) => {
        const keyboardHeight = Keyboard.metrics()?.height ?? 0;
        const visibleBottom = Dimensions.get("window").height - keyboardHeight - 16;
        const overflow = pageY + height - visibleBottom;
        if (overflow > 0) {
          scroll.ref.current?.scrollTo({ y: scroll.offsetY.current + overflow, animated: true });
        }
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [active, scroll]);
  return viewRef;
}

function TimeInput({
  label,
  value,
  onChangeText,
  className,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  className?: string;
}) {
  return (
    <Input
      label={label}
      placeholder="23:10"
      keyboardType="numbers-and-punctuation"
      autoCorrect={false}
      value={value}
      onChangeText={onChangeText}
      className={className}
    />
  );
}

/**
 * Flighty-style multi-leg flight list for a trip. Adding a leg auto-resolves
 * the airline and route from the flight number; every saved card can be
 * edited inline (route databases can lag airline schedule changes).
 */
export function FlightsSection({ tripId, scroll }: { tripId: string; scroll?: ScrollContext }) {
  const { colors } = useTheme();
  const { data: flights = [] } = useTripFlights(tripId);
  const addFlight = useAddTripFlight();
  const deleteFlight = useDeleteTripFlight();

  const [adding, setAdding] = useState(false);
  const [number, setNumber] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [depTime, setDepTime] = useState("");
  const [arrTime, setArrTime] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const addFormRef = useScrollIntoView(scroll, adding);

  const resetForm = () => {
    setNumber("");
    setDate(null);
    setDepTime("");
    setArrTime("");
    setError(undefined);
  };

  const onAdd = async () => {
    const normalized = normalizeFlightNumber(number);
    if (!normalized) {
      setError("Use the airline code + number, e.g. EY 146");
      return;
    }
    if ((depTime.trim() && !parseTimeHHMM(depTime)) || (arrTime.trim() && !parseTimeHHMM(arrTime))) {
      setError("Times should be 24h local, e.g. 23:10");
      return;
    }
    setError(undefined);
    setSaving(true);
    try {
      const info = await lookupFlight(normalized, date);
      // Manually entered times win over the API's scheduled times.
      await addFlight.mutateAsync({
        trip_id: tripId,
        position: flights.length,
        flight_number: normalized,
        flight_date: date,
        dep_time: parseTimeHHMM(depTime) ?? info?.depTime ?? null,
        arr_time: parseTimeHHMM(arrTime) ?? info?.arrTime ?? null,
        airline: info?.airline ?? null,
        origin_iata: info?.originIata ?? null,
        origin_city: info?.originCity ?? (info?.originIata ? cityForIata(info.originIata) : null),
        dest_iata: info?.destIata ?? null,
        dest_city: info?.destCity ?? (info?.destIata ? cityForIata(info.destIata) : null),
      });
      resetForm();
      setAdding(false);
    } catch (err) {
      Alert.alert("Could not save flight", err instanceof Error ? err.message : "Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between px-1 pb-2">
        <AppText variant="heading">Flights</AppText>
        {!adding ? (
          <Pressable
            onPress={() => setAdding(true)}
            className="flex-row items-center gap-1 rounded-chip bg-primary px-3 py-1.5 dark:bg-primary-dark"
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <AppText className="font-sans-semibold text-sm text-white">Add flight</AppText>
          </Pressable>
        ) : null}
      </View>

      {adding ? (
        <View ref={addFormRef} collapsable={false}>
          <Card className="mb-2 gap-3">
            <Input
              label="Flight number"
              placeholder="e.g. EY 146"
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              value={number}
              onChangeText={(t) => {
                setNumber(t);
                setError(undefined);
              }}
              error={error}
            />
            <CalendarField label="Date" value={date} onChange={setDate} />
            <View className="flex-row gap-3">
              <TimeInput label="Departs (local)" value={depTime} onChangeText={setDepTime} className="flex-1" />
              <TimeInput label="Arrives (local)" value={arrTime} onChangeText={setArrTime} className="flex-1" />
            </View>
            {date && !withinLookupWindow(date) ? (
              <AppText variant="caption">
                Flight data is only available for the past year — enter the times above yourself.
              </AppText>
            ) : null}
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => {
                  setAdding(false);
                  resetForm();
                }}
                className="h-11 flex-1 items-center justify-center rounded-2xl bg-paper-sunken dark:bg-paper-dark-sunken"
              >
                <AppText variant="heading" className="text-sm">
                  Cancel
                </AppText>
              </Pressable>
              <Pressable
                onPress={onAdd}
                disabled={saving}
                className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary dark:bg-primary-dark"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="airplane" size={15} color="#FFFFFF" />
                )}
                <AppText variant="heading" className="text-sm text-white">
                  {saving ? "Adding…" : "Add"}
                </AppText>
              </Pressable>
            </View>
          </Card>
        </View>
      ) : null}

      {flights.length === 0 && !adding ? (
        <Card className="items-center gap-1 py-5">
          <AppText className="text-2xl">✈️</AppText>
          <AppText variant="label" className="text-center">
            Add each leg — outbound and return — by flight number.
          </AppText>
        </Card>
      ) : null}

      {flights.map((flight, index) => {
        const prev = index > 0 ? flights[index - 1] : null;
        const connection = prev ? connectionBetween(prev, flight) : null;
        return (
          <View key={flight.id}>
            {connection ? (
              <View className="mb-2 flex-row items-center gap-2 self-start rounded-chip bg-paper-sunken px-3 py-1.5 dark:bg-paper-dark-sunken">
                <Ionicons
                  name={connection.kind === "stay" ? "bed-outline" : "walk"}
                  size={13}
                  color={connection.kind === "stay" ? colors.primary : colors.inkSoft}
                />
                <AppText variant="caption" className="font-sans-medium">
                  {connection.kind === "stay"
                    ? `${connection.duration ? `${connection.duration} ` : ""}stay in ${
                        cityForIata(connection.airport) ?? connection.airport
                      }`
                    : `${connection.duration ? `${connection.duration} ` : ""}layover at ${connection.airport}`}
                </AppText>
              </View>
            ) : null}
            <FlightCard
              flight={flight}
              scroll={scroll}
              onDelete={() => deleteFlight.mutate({ id: flight.id, trip_id: tripId })}
            />
          </View>
        );
      })}
    </View>
  );
}

function FlightCard({
  flight,
  scroll,
  onDelete,
}: {
  flight: TripFlightRow;
  scroll?: ScrollContext;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const updateFlight = useUpdateTripFlight();
  const [editing, setEditing] = useState(false);
  const [fromCode, setFromCode] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCode, setToCode] = useState("");
  const [toCity, setToCity] = useState("");
  const [depTime, setDepTime] = useState("");
  const [arrTime, setArrTime] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const cardRef = useScrollIntoView(scroll, editing);

  const startEditing = () => {
    setFromCode(flight.origin_iata ?? "");
    setFromCity(flight.origin_city ?? "");
    setToCode(flight.dest_iata ?? "");
    setToCity(flight.dest_city ?? "");
    setDepTime(flight.dep_time ?? "");
    setArrTime(flight.arr_time ?? "");
    setDate(flight.flight_date);
    setEditing(true);
  };

  const onSave = () => {
    if ((depTime.trim() && !parseTimeHHMM(depTime)) || (arrTime.trim() && !parseTimeHHMM(arrTime))) {
      Alert.alert("Check the times", "Times should be 24h local, e.g. 23:10");
      return;
    }
    updateFlight.mutate({
      id: flight.id,
      trip_id: flight.trip_id,
      flight_date: date,
      dep_time: parseTimeHHMM(depTime),
      arr_time: parseTimeHHMM(arrTime),
      origin_iata: fromCode.trim().toUpperCase() || null,
      origin_city: fromCity.trim() || null,
      dest_iata: toCode.trim().toUpperCase() || null,
      dest_city: toCity.trim() || null,
    });
    setEditing(false);
  };

  return (
    <View ref={cardRef} collapsable={false}>
      <Card className="mb-2 gap-3">
        {/* Header: airline + number, date, edit/delete */}
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-primary-soft dark:bg-primary-dark-soft">
            <Ionicons name="airplane" size={13} color={colors.primary} />
          </View>
          <AppText variant="label" className="flex-1 font-sans-semibold text-ink dark:text-ink-dark" numberOfLines={1}>
            {flight.airline ?? "Unknown airline"} · {flight.flight_number}
          </AppText>
          {!editing && flight.flight_date ? (
            <AppText variant="caption">{formatIso(flight.flight_date)}</AppText>
          ) : null}
          {!editing ? (
            <Pressable onPress={startEditing} className="p-1" accessibilityLabel="Edit flight">
              <Ionicons name="pencil" size={15} color={colors.inkFaint} />
            </Pressable>
          ) : null}
          <Pressable onPress={onDelete} className="p-1" accessibilityLabel="Remove flight">
            <Ionicons name="close" size={16} color={colors.inkFaint} />
          </Pressable>
        </View>

        {editing ? (
          <View className="gap-3">
            <View className="flex-row gap-3">
              <Input
                label="From (code)"
                placeholder="AUH"
                autoCapitalize="characters"
                autoCorrect={false}
                value={fromCode}
                onChangeText={(t) => {
                  setFromCode(t);
                  setFromCity(cityForIata(t) ?? "");
                }}
                className="flex-1"
              />
              <Input
                label="To (code)"
                placeholder="ISB"
                autoCapitalize="characters"
                autoCorrect={false}
                value={toCode}
                onChangeText={(t) => {
                  setToCode(t);
                  setToCity(cityForIata(t) ?? "");
                }}
                className="flex-1"
              />
            </View>
            <View className="flex-row gap-3">
              <Input
                label="From city (optional)"
                placeholder="Abu Dhabi"
                value={fromCity}
                onChangeText={setFromCity}
                className="flex-1"
              />
              <Input
                label="To city (optional)"
                placeholder="Islamabad"
                value={toCity}
                onChangeText={setToCity}
                className="flex-1"
              />
            </View>
            <View className="flex-row gap-3">
              <TimeInput label="Departs (local)" value={depTime} onChangeText={setDepTime} className="flex-1" />
              <TimeInput label="Arrives (local)" value={arrTime} onChangeText={setArrTime} className="flex-1" />
            </View>
            <CalendarField label="Date" value={date} onChange={setDate} />
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setEditing(false)}
                className="h-11 flex-1 items-center justify-center rounded-2xl bg-paper-sunken dark:bg-paper-dark-sunken"
              >
                <AppText variant="heading" className="text-sm">
                  Cancel
                </AppText>
              </Pressable>
              <Pressable
                onPress={onSave}
                className="h-11 flex-1 items-center justify-center rounded-2xl bg-primary dark:bg-primary-dark"
              >
                <AppText variant="heading" className="text-sm text-white">
                  Save
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={startEditing} className="flex-row items-center active:opacity-70">
            <View className="flex-1">
              <AppText variant="display" className="text-3xl">
                {flight.origin_iata ?? "···"}
              </AppText>
              <AppText variant="caption" numberOfLines={1}>
                {flight.origin_city ?? "Unknown"}
              </AppText>
              {flight.dep_time ? (
                <AppText variant="caption" className="font-sans-semibold text-primary dark:text-primary-dark">
                  {flight.dep_time}
                </AppText>
              ) : null}
            </View>
            <View className="flex-1 items-center px-2">
              <View className="w-full flex-row items-center gap-1">
                <View className="h-px flex-1 bg-line dark:bg-line-dark" />
                <Ionicons name="airplane" size={14} color={colors.primary} />
                <View className="h-px flex-1 bg-line dark:bg-line-dark" />
              </View>
            </View>
            <View className="flex-1 items-end">
              <AppText variant="display" className="text-3xl">
                {flight.dest_iata ?? "···"}
              </AppText>
              <AppText variant="caption" numberOfLines={1}>
                {flight.dest_city ?? "Unknown"}
              </AppText>
              {flight.arr_time ? (
                <AppText variant="caption" className="font-sans-semibold text-primary dark:text-primary-dark">
                  {flight.arr_time}
                </AppText>
              ) : null}
            </View>
          </Pressable>
        )}
      </Card>
    </View>
  );
}
