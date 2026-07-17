import { Ionicons } from "@expo/vector-icons";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector, type PanGesture } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withSpring,
  withTiming,
  type AnimatedRef,
  type SharedValue,
} from "react-native-reanimated";
import { TripCard } from "./TripCard";
import { useTheme } from "@/hooks/useTheme";
import type { TripRow } from "@/lib/database.types";

const SPRING = { damping: 24, stiffness: 260 };
const EDGE_ZONE = 130; // px from screen edge where auto-scroll kicks in
const MAX_SCROLL_SPEED = 12; // px per frame

/** Handle to the outer scrollable, so drags near screen edges can scroll it. */
export interface DragScrollTarget {
  // AnimatedRef is invariant in its component type, so the concrete FlatList
  // item type can't be named here without coupling; scrollTo only needs a ref
  // to "some scrollable".
  listRef: AnimatedRef<any>;
  offset: SharedValue<number>;
  maxOffset: SharedValue<number>;
}

interface DraggableTripListProps {
  trips: TripRow[];
  countryByTrip: Map<string, string>;
  /** Called with the full id list in its new order after a drop. */
  onReorder: (orderedIds: string[]) => void;
  scroll?: DragScrollTarget;
}

/**
 * Two ways to drag a card to a new slot: grab the ≡ handle directly, or
 * long-press anywhere on the card. Cards are uniform height, so slots are
 * simple multiples of the measured row height; the other cards spring out
 * of the way while dragging. Dragging near the top/bottom of the screen
 * auto-scrolls the outer list — entirely on the UI thread.
 *
 * Drop sequence: the card settles into its new slot visually first, and the
 * transforms are only cleared once React has re-rendered the reordered data
 * (the layout effect below) — otherwise the card would flash back to its old
 * position for a frame.
 */
export function DraggableTripList({ trips, countryByTrip, onReorder, scroll }: DraggableTripListProps) {
  const { height: windowHeight } = useWindowDimensions();
  const activeIndex = useSharedValue(-1);
  const activeId = useSharedValue("");
  const translationY = useSharedValue(0);
  const pinnedY = useSharedValue(0);
  const dropping = useSharedValue(false);
  const dragStartOffset = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const rowH = useSharedValue(0);
  // Bumped when a drop has fully landed; rows hard-reset their shift on it.
  const resetTick = useSharedValue(0);

  // Finger movement + however far the outer list scrolled since the lift.
  const dragY = useDerivedValue(() => {
    const scrolled = scroll && activeIndex.value >= 0 ? scroll.offset.value - dragStartOffset.value : 0;
    return translationY.value + scrolled;
  });

  // Where the lifted card would land if dropped now.
  const targetSlot = useDerivedValue(() => {
    if (activeIndex.value < 0 || rowH.value <= 0) return -1;
    const raw = activeIndex.value + dragY.value / rowH.value;
    return Math.min(trips.length - 1, Math.max(0, Math.round(raw)));
  });

  const edgeScroller = useFrameCallback(() => {
    if (!scroll || activeIndex.value < 0 || dropping.value) return;
    const y = fingerY.value;
    let speed = 0;
    if (y > windowHeight - EDGE_ZONE) {
      speed = Math.min(1, (y - (windowHeight - EDGE_ZONE)) / EDGE_ZONE) * MAX_SCROLL_SPEED;
    } else if (y < EDGE_ZONE) {
      speed = -Math.min(1, (EDGE_ZONE - y) / EDGE_ZONE) * MAX_SCROLL_SPEED;
    }
    if (speed === 0) return;
    const next = Math.min(scroll.maxOffset.value, Math.max(0, scroll.offset.value + speed));
    if (next !== scroll.offset.value) scrollTo(scroll.listRef, 0, next, false);
  }, false);

  const setScrollerActive = (active: boolean) => edgeScroller.setActive(active);
  useEffect(() => () => edgeScroller.setActive(false), [edgeScroller]);

  const resetDrag = () => {
    activeIndex.set(-1);
    activeId.set("");
    translationY.set(0);
    pinnedY.set(0);
    dropping.set(false);
    resetTick.set(resetTick.get() + 1);
  };

  // Clear the drag transforms only after the reordered list has rendered, so
  // the dropped card goes straight from "pinned in new slot" to "laid out in
  // new slot" with no flash through its old position.
  const orderKey = trips.map((t) => t.id).join("|");
  const prevOrderKey = useRef(orderKey);
  useLayoutEffect(() => {
    if (prevOrderKey.current !== orderKey) {
      prevOrderKey.current = orderKey;
      resetDrag();
    }
  });

  const commit = (from: number, to: number) => {
    if (from === to) {
      resetDrag();
      return;
    }
    const ids = trips.map((t) => t.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    onReorder(ids);
  };

  return (
    <View>
      {trips.map((trip, index) => (
        <DraggableRow
          key={trip.id}
          trip={trip}
          countryIso={countryByTrip.get(trip.id)}
          index={index}
          activeIndex={activeIndex}
          activeId={activeId}
          translationY={translationY}
          pinnedY={pinnedY}
          dropping={dropping}
          dragStartOffset={dragStartOffset}
          scrollOffset={scroll?.offset}
          fingerY={fingerY}
          dragY={dragY}
          targetSlot={targetSlot}
          rowH={rowH}
          resetTick={resetTick}
          onDrop={commit}
          onDragStateChange={setScrollerActive}
          onMeasure={index === 0 ? (h) => rowH.set(h) : undefined}
        />
      ))}
    </View>
  );
}

function DraggableRow({
  trip,
  countryIso,
  index,
  activeIndex,
  activeId,
  translationY,
  pinnedY,
  dropping,
  dragStartOffset,
  scrollOffset,
  fingerY,
  dragY,
  targetSlot,
  rowH,
  resetTick,
  onDrop,
  onDragStateChange,
  onMeasure,
}: {
  trip: TripRow;
  countryIso?: string;
  index: number;
  activeIndex: SharedValue<number>;
  activeId: SharedValue<string>;
  translationY: SharedValue<number>;
  pinnedY: SharedValue<number>;
  dropping: SharedValue<boolean>;
  dragStartOffset: SharedValue<number>;
  scrollOffset?: SharedValue<number>;
  fingerY: SharedValue<number>;
  dragY: SharedValue<number>;
  targetSlot: SharedValue<number>;
  rowH: SharedValue<number>;
  resetTick: SharedValue<number>;
  onDrop: (from: number, to: number) => void;
  onDragStateChange: (dragging: boolean) => void;
  onMeasure?: (height: number) => void;
}) {
  const { colors } = useTheme();
  // How far this (non-dragged) row is shifted to make room for the lifted card.
  const shift = useSharedValue(0);
  const liftScale = useSharedValue(1);

  // Start a spring only when this row's make-room target actually changes —
  // restarting it every frame (as an inline withSpring in the style would)
  // makes the movement crawl.
  useAnimatedReaction(
    () => {
      const active = activeIndex.value;
      if (active < 0 || activeId.value === trip.id) return 0;
      const slot = targetSlot.value;
      if (index > active && index <= slot) return -rowH.value;
      if (index < active && index >= slot) return rowH.value;
      return 0;
    },
    (target, prev) => {
      if (prev !== null && target !== prev) shift.set(withSpring(target, SPRING));
    },
  );

  useAnimatedReaction(
    () => activeId.value === trip.id,
    (lifted, prev) => {
      if (prev !== null && lifted !== prev) {
        liftScale.set(withTiming(lifted ? 1.03 : 1, { duration: 120 }));
      }
    },
  );

  // A finished drop rendered the new order; kill transforms instantly so
  // nothing springs from stale offsets.
  useAnimatedReaction(
    () => resetTick.value,
    (tick, prev) => {
      if (prev !== null && tick !== prev) shift.set(0);
    },
  );

  const makePan = (): PanGesture =>
    Gesture.Pan()
      .onStart((e) => {
        activeIndex.set(index);
        activeId.set(trip.id);
        translationY.set(0);
        dropping.set(false);
        dragStartOffset.set(scrollOffset ? scrollOffset.value : 0);
        fingerY.set(e.absoluteY);
        runOnJS(onDragStateChange)(true);
      })
      .onUpdate((e) => {
        translationY.set(e.translationY);
        fingerY.set(e.absoluteY);
      })
      .onEnd(() => {
        // Settle into the target slot first; the data swap happens after.
        const slot = targetSlot.value;
        dropping.set(true);
        pinnedY.set(dragY.value);
        pinnedY.set(
          withTiming((slot - index) * rowH.value, { duration: 140 }, () => {
            runOnJS(onDrop)(index, slot);
          }),
        );
      })
      .onFinalize(() => {
        runOnJS(onDragStateChange)(false);
        // Cancelled without a drop (e.g. gesture interrupted): snap back.
        if (!dropping.value) {
          activeIndex.set(-1);
          activeId.set("");
          translationY.set(0);
        }
      });

  // Grabbing the handle drags immediately; anywhere else needs a long press
  // so taps and list scrolling keep working.
  const handlePan = makePan();
  const cardPan = makePan().activateAfterLongPress(220);

  const style = useAnimatedStyle(() => {
    if (activeId.value === trip.id) {
      return {
        transform: [
          { translateY: dropping.value ? pinnedY.value : dragY.value },
          { scale: liftScale.value },
        ],
        zIndex: 10,
        shadowOpacity: 0.15,
        elevation: 8,
      };
    }
    return {
      transform: [{ translateY: shift.value }, { scale: liftScale.value }],
      zIndex: 0,
      shadowOpacity: 0,
      elevation: 0,
    };
  });

  const dragHandle = (
    <GestureDetector gesture={handlePan}>
      <View
        collapsable={false}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        className="-my-2 -mr-2 items-center justify-center px-2.5 py-3"
      >
        <Ionicons name="reorder-three-outline" size={22} color={colors.inkSoft} />
      </View>
    </GestureDetector>
  );

  return (
    <GestureDetector gesture={cardPan}>
      <Animated.View
        style={style}
        onLayout={onMeasure ? (e) => onMeasure(e.nativeEvent.layout.height) : undefined}
      >
        <TripCard trip={trip} countryIso={countryIso} dragHandle={dragHandle} />
      </Animated.View>
    </GestureDetector>
  );
}
