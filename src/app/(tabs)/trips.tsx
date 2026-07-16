import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { TripCard } from "@/features/trips/TripCard";
import { useAllTripStops, useTrips } from "@/features/trips/queries";
import { useTheme } from "@/hooks/useTheme";
import type { TripRow } from "@/lib/database.types";
import { daysBetween, formatIso, todayIso } from "@/lib/dates";
import { fonts } from "@/lib/theme";

type Filter = "all" | "upcoming" | "past" | "cancelled";

type ListItem =
  | { key: string; kind: "header"; title: string }
  | { key: string; kind: "trip"; trip: TripRow }
  | { key: string; kind: "group"; name: string; trips: TripRow[] };

export default function TripsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { data: trips = [] } = useTrips();
  const { data: allStops = [] } = useAllTripStops();

  // First stop's country → flag on the trip card.
  const countryByTrip = useMemo(() => {
    const map = new Map<string, string>();
    for (const stop of allStops) {
      if (!map.has(stop.trip_id)) map.set(stop.trip_id, stop.country_iso);
    }
    return map;
  }, [allStops]);

  const today = todayIso();
  const items = useMemo<ListItem[]>(() => {
    const q = query.trim().toLowerCase();
    const filtered = trips.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q) && !t.group_name?.toLowerCase().includes(q)) {
        return false;
      }
      switch (filter) {
        case "upcoming":
          return !t.cancelled && (!t.end_date || t.end_date >= today);
        case "past":
          return !t.cancelled && !!t.end_date && t.end_date < today;
        case "cancelled":
          return t.cancelled;
        default:
          return true;
      }
    });

    // Trips sharing a group_name collapse into one entry, in first-seen order
    // (the server already sorts by start_date descending).
    const entries: (ListItem & { kind: "trip" | "group" })[] = [];
    const groups = new Map<string, ListItem & { kind: "group" }>();
    for (const trip of filtered) {
      if (trip.group_name) {
        let group = groups.get(trip.group_name);
        if (!group) {
          group = { key: `group:${trip.group_name}`, kind: "group", name: trip.group_name, trips: [] };
          groups.set(trip.group_name, group);
          entries.push(group);
        }
        group.trips.push(trip);
      } else {
        entries.push({ key: trip.id, kind: "trip", trip });
      }
    }

    // "All" splits into Upcoming / Past / Cancelled sections like Been.
    if (filter !== "all") return entries;
    const upcoming: typeof entries = [];
    const past: typeof entries = [];
    const cancelled: typeof entries = [];
    const bucket = (t: TripRow) =>
      t.cancelled ? cancelled : !t.end_date || t.end_date >= today ? upcoming : past;
    for (const entry of entries) {
      if (entry.kind === "trip") bucket(entry.trip).push(entry);
      else bucket(entry.trips[0]).push(entry);
    }
    // Upcoming reads soonest-first.
    upcoming.reverse();

    const result: ListItem[] = [];
    if (upcoming.length) result.push({ key: "h-upcoming", kind: "header", title: "Upcoming" }, ...upcoming);
    if (past.length) result.push({ key: "h-past", kind: "header", title: "Past" }, ...past);
    if (cancelled.length) result.push({ key: "h-cancelled", kind: "header", title: "Cancelled" }, ...cancelled);
    return result;
  }, [trips, query, filter, today]);

  const toggleGroup = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Screen style={{ backgroundColor: colors.paperSunken }}>
      <View className="gap-4 px-4 pb-3 pt-2">
        <AppText variant="display" className="text-3xl">
          Trips
        </AppText>

        <View className="flex-row items-center gap-2 rounded-2xl bg-paper-raised px-4 dark:bg-paper-dark-raised">
          <Ionicons name="search" size={18} color={colors.inkFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search trips"
            placeholderTextColor={colors.inkFaint}
            style={{ fontFamily: fonts.sans, color: colors.ink }}
            className="h-12 flex-1 text-base"
          />
        </View>

        <View className="flex-row gap-2">
          {(["all", "upcoming", "past", "cancelled"] as Filter[]).map((f) => (
            <Chip
              key={f}
              label={f[0].toUpperCase() + f.slice(1)}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        contentContainerClassName="flex-grow px-4 pb-8 pt-1"
        renderItem={({ item }) => {
          if (item.kind === "header") {
            return (
              <AppText variant="label" className="pb-2 pt-2 font-sans-bold uppercase tracking-wider">
                {item.title}
              </AppText>
            );
          }
          if (item.kind === "trip") {
            return <TripCard trip={item.trip} countryIso={countryByTrip.get(item.trip.id)} />;
          }
          return (
            <TripGroupCard
              group={item}
              countryByTrip={countryByTrip}
              expanded={expanded.has(item.key)}
              onToggle={() => toggleGroup(item.key)}
            />
          );
        }}
        ListEmptyComponent={
          <EmptyState
            emoji="🧳"
            title={trips.length === 0 ? "No trips yet" : "Nothing matches"}
            message={
              trips.length === 0
                ? "Log your first adventure — past or upcoming."
                : "Try a different search or filter."
            }
            actionTitle={trips.length === 0 ? "Create a trip" : undefined}
            onAction={trips.length === 0 ? () => router.push("/trip/new") : undefined}
          />
        }
      />

      {/* Floating add button */}
      <Pressable
        onPress={() => router.push("/trip/new")}
        accessibilityLabel="New trip"
        style={{ elevation: 6, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-90 dark:bg-primary-dark"
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>
    </Screen>
  );
}

function TripGroupCard({
  group,
  countryByTrip,
  expanded,
  onToggle,
}: {
  group: { name: string; trips: TripRow[] };
  countryByTrip: Map<string, string>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const starts = group.trips.map((t) => t.start_date).filter((d): d is string => !!d);
  const ends = group.trips.map((t) => t.end_date).filter((d): d is string => !!d);
  const from = starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : null;
  const to = ends.length ? ends.reduce((a, b) => (a > b ? a : b)) : null;
  const totalDays = from && to ? daysBetween(from, to) : null;

  return (
    <View className="mb-3">
      <Pressable
        onPress={onToggle}
        style={{ elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
        className={`rounded-card border-2 bg-paper-raised p-4 dark:bg-paper-dark-raised ${
          expanded
            ? "border-primary dark:border-primary-dark"
            : "border-primary/30 dark:border-primary-dark/30"
        }`}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary dark:bg-primary-dark">
            <Ionicons name="albums" size={20} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <AppText variant="heading" className="text-base" numberOfLines={1}>
                {group.name}
              </AppText>
              <View className="rounded-chip bg-primary-soft px-2 py-0.5 dark:bg-primary-dark-soft">
                <AppText variant="caption" className="font-sans-bold text-primary-strong dark:text-primary-strong">
                  {group.trips.length}
                </AppText>
              </View>
            </View>
            <AppText variant="caption">
              {from ? `${formatIso(from)}${to ? ` – ${formatIso(to)}` : ""}` : "No dates"}
              {totalDays ? ` · ${totalDays} days` : ""}
            </AppText>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.inkFaint}
          />
        </View>
      </Pressable>
      {expanded ? (
        <View className="mt-2 border-l-2 border-primary/30 pl-3 dark:border-primary-dark/30">
          {group.trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} countryIso={countryByTrip.get(trip.id)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
