import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { DraggableTripList, type DragScrollTarget } from "@/features/trips/DraggableTripList";
import { TripCard } from "@/features/trips/TripCard";
import { useAllTripStops, useRenameTripGroup, useReorderTrips, useTrips } from "@/features/trips/queries";
import { useTheme } from "@/hooks/useTheme";
import type { TripRow } from "@/lib/database.types";
import { daysBetween, formatRange, todayIso } from "@/lib/dates";
import { fonts } from "@/lib/theme";

type Filter = "all" | "upcoming" | "past" | "cancelled";

type ListItem =
  | { key: string; kind: "header"; title: string }
  | { key: string; kind: "trip"; trip: TripRow }
  | { key: string; kind: "group"; name: string; trips: TripRow[] };

/**
 * Order trips inside a group: manual sort_order first (nulls sink to the
 * bottom), then chronologically, then by creation time — so same-day trips
 * keep the order they were added instead of going alphabetical.
 */
function groupOrder(a: TripRow, b: TripRow): number {
  if (a.sort_order != null || b.sort_order != null) {
    if (a.sort_order == null) return 1;
    if (b.sort_order == null) return -1;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  }
  const ad = a.start_date ?? "9999";
  const bd = b.start_date ?? "9999";
  if (ad !== bd) return ad < bd ? -1 : 1;
  return a.created_at < b.created_at ? -1 : 1;
}

export default function TripsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null);
  const { data: trips = [] } = useTrips();
  const { data: allStops = [] } = useAllTripStops();
  const renameGroup = useRenameTripGroup();

  // Scroll plumbing so drag-to-reorder can auto-scroll near screen edges.
  // Everything lives on the UI thread (shared values + scrollTo) so the
  // dragged card and the scrolling list move in the same frame.
  const listRef = useAnimatedRef<Animated.FlatList<ListItem>>();
  const scrollOffset = useSharedValue(0);
  const maxScrollOffset = useSharedValue(0);
  const sizes = useRef({ content: 0, layout: 0 });
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollOffset.set(e.contentOffset.y);
  });
  const dragScroll: DragScrollTarget = { listRef, offset: scrollOffset, maxOffset: maxScrollOffset };

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
    for (const group of groups.values()) group.trips.sort(groupOrder);

    // "All" splits into Upcoming / Past / Cancelled sections like Been.
    if (filter !== "all") return entries;
    const upcoming: typeof entries = [];
    const past: typeof entries = [];
    const cancelled: typeof entries = [];
    const bucket = (t: TripRow) =>
      t.cancelled ? cancelled : !t.end_date || t.end_date >= today ? upcoming : past;
    for (const entry of entries) {
      if (entry.kind === "trip") bucket(entry.trip).push(entry);
      // Groups are chronological, so the last trip decides upcoming vs past.
      else bucket(entry.trips[entry.trips.length - 1]).push(entry);
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

  const onRenameGroup = (from: string, to: string) => {
    setRenamingGroup(null);
    if (!to || to === from) return;
    renameGroup.mutate({ from, to });
    // Keep the renamed group expanded under its new key.
    setExpanded((prev) => {
      if (!prev.has(`group:${from}`)) return prev;
      const next = new Set(prev);
      next.delete(`group:${from}`);
      next.add(`group:${to}`);
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

      <Animated.FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.key}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={(_w, h) => {
          sizes.current.content = h;
          maxScrollOffset.set(Math.max(0, sizes.current.content - sizes.current.layout));
        }}
        onLayout={(e) => {
          sizes.current.layout = e.nativeEvent.layout.height;
          maxScrollOffset.set(Math.max(0, sizes.current.content - sizes.current.layout));
        }}
        contentContainerClassName="flex-grow px-4 pb-8 pt-1"
        renderItem={({ item }) => {
          if (item.kind === "header") {
            return (
              <AppText variant="caption" className="pb-2 pt-2 font-sans-semibold uppercase tracking-wider">
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
              onRename={() => setRenamingGroup(item.name)}
              dragScroll={dragScroll}
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

      {renamingGroup != null ? (
        <RenameGroupModal
          name={renamingGroup}
          onCancel={() => setRenamingGroup(null)}
          onSave={(to) => onRenameGroup(renamingGroup, to)}
        />
      ) : null}
    </Screen>
  );
}

function TripGroupCard({
  group,
  countryByTrip,
  expanded,
  onToggle,
  onRename,
  dragScroll,
}: {
  group: { name: string; trips: TripRow[] };
  countryByTrip: Map<string, string>;
  expanded: boolean;
  onToggle: () => void;
  onRename: () => void;
  dragScroll: DragScrollTarget;
}) {
  const { colors } = useTheme();
  const reorderTrips = useReorderTrips();
  const starts = group.trips.map((t) => t.start_date).filter((d): d is string => !!d);
  const ends = group.trips.map((t) => t.end_date).filter((d): d is string => !!d);
  const from = starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : null;
  const to = ends.length ? ends.reduce((a, b) => (a > b ? a : b)) : null;
  const totalDays = from && to ? daysBetween(from, to) : null;

  return (
    <View className="mb-3">
      <Pressable
        onPress={onToggle}
        style={{ elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
        className="overflow-hidden rounded-card bg-paper-raised active:opacity-80 dark:bg-paper-dark-raised"
      >
        <View className="flex-row items-center justify-between px-4 pb-2.5 pt-3">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-clear-outline" size={12} color={colors.inkFaint} />
            <AppText variant="caption" className="text-[13px]">
              {formatRange(from, to)}
            </AppText>
          </View>
          {totalDays ? (
            <AppText variant="caption" className="text-[13px]">
              Duration{" "}
              <AppText variant="caption" className="font-sans-semibold text-[13px] text-primary-strong dark:text-primary-dark">
                {totalDays} day{totalDays === 1 ? "" : "s"}
              </AppText>
            </AppText>
          ) : null}
        </View>

        <View className="h-px bg-line dark:bg-line-dark" />

        <View className="flex-row items-center gap-3 px-4 py-3">
          <View className="h-8 w-11 items-center justify-center rounded-md bg-primary-soft dark:bg-primary-dark-soft">
            <Ionicons name="albums-outline" size={16} color={colors.primary} />
          </View>
          <View className="flex-1 gap-0.5">
            <AppText variant="caption">
              {group.trips.length} trip{group.trips.length === 1 ? "" : "s"}
            </AppText>
            <AppText className="font-sans-medium text-[16px] text-ink dark:text-ink-dark" numberOfLines={1}>
              {group.name}
            </AppText>
          </View>
          {expanded ? (
            <Pressable onPress={onRename} hitSlop={8} className="p-1" accessibilityLabel="Rename group">
              <Ionicons name="pencil" size={15} color={colors.inkFaint} />
            </Pressable>
          ) : null}
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.inkFaint} />
        </View>
      </Pressable>

      {expanded ? (
        <View className="mt-2 pl-4">
          <DraggableTripList
            trips={group.trips}
            countryByTrip={countryByTrip}
            onReorder={(ids) => reorderTrips.mutate(ids)}
            scroll={dragScroll}
          />
        </View>
      ) : null}
    </View>
  );
}

function RenameGroupModal({
  name,
  onCancel,
  onSave,
}: {
  name: string;
  onCancel: () => void;
  onSave: (to: string) => void;
}) {
  const { colors } = useTheme();
  const [value, setValue] = useState(name);

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/40 px-8">
        <Pressable className="absolute inset-0" onPress={onCancel} />
        <View className="w-full gap-4 rounded-card bg-paper-raised p-5 dark:bg-paper-dark-raised">
          <AppText variant="heading">Rename group</AppText>
          <TextInput
            autoFocus
            value={value}
            onChangeText={setValue}
            selectTextOnFocus
            placeholder="Group name"
            placeholderTextColor={colors.inkFaint}
            style={{ fontFamily: fonts.sans, color: colors.ink }}
            className="h-12 rounded-2xl border border-line bg-paper px-4 text-base dark:border-line-dark dark:bg-paper-dark"
          />
          <View className="flex-row justify-end gap-2">
            <Button title="Cancel" variant="ghost" onPress={onCancel} />
            <Button title="Save" onPress={() => onSave(value.trim())} disabled={!value.trim()} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
