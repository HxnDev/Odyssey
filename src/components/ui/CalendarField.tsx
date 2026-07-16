import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { cn } from "@/lib/cn";
import { MONTH_NAMES, parseIso, todayIso } from "@/lib/dates";
import { useTheme } from "@/hooks/useTheme";

interface CalendarFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** Pure-JS date picker: a themed month-grid calendar in a modal. */
export function CalendarField({ label, value, onChange, placeholder = "Select date", className }: CalendarFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const initial = value ? parseIso(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const openPicker = () => {
    const base = value ? parseIso(value) : new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(true);
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Monday-first weekday index of the 1st of the month.
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedDay =
    value && parseIso(value).getFullYear() === viewYear && parseIso(value).getMonth() === viewMonth
      ? parseIso(value).getDate()
      : null;
  const today = todayIso();

  return (
    <View className={cn("gap-1.5", className)}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        onPress={openPicker}
        className="flex-row items-center justify-between rounded-2xl border border-line bg-paper-raised px-4 py-3.5 dark:border-line-dark dark:bg-paper-dark-raised"
      >
        <AppText variant="body" className={value ? "" : "text-ink-faint dark:text-ink-dark-faint"}>
          {value ?? placeholder}
        </AppText>
        <Ionicons name="calendar-outline" size={18} color={colors.inkFaint} />
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Animated.View entering={FadeIn.duration(150)} className="flex-1 justify-center bg-black/40 px-6">
          <Pressable className="absolute inset-0" onPress={() => setOpen(false)} />
          <Animated.View
            entering={FadeInDown.duration(250).springify()}
            className="rounded-card border border-line bg-paper-raised p-4 dark:border-line-dark dark:bg-paper-dark-raised"
          >
            <View className="mb-3 flex-row items-center justify-between">
              <Pressable onPress={() => shiftMonth(-1)} className="p-2" accessibilityLabel="Previous month">
                <Ionicons name="chevron-back" size={20} color={colors.inkSoft} />
              </Pressable>
              <AppText variant="heading">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </AppText>
              <Pressable onPress={() => shiftMonth(1)} className="p-2" accessibilityLabel="Next month">
                <Ionicons name="chevron-forward" size={20} color={colors.inkSoft} />
              </Pressable>
            </View>

            <View className="mb-1 flex-row">
              {WEEKDAYS.map((d, i) => (
                <View key={`${d}-${i}`} className="flex-1 items-center py-1">
                  <AppText variant="caption">{d}</AppText>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {cells.map((day, index) => {
                const iso = day ? `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}` : null;
                const isSelected = day !== null && day === selectedDay;
                const isToday = iso === today;
                return (
                  <View key={index} style={{ width: `${100 / 7}%` }} className="items-center py-0.5">
                    {day ? (
                      <Pressable
                        onPress={() => {
                          onChange(iso);
                          setOpen(false);
                        }}
                        className={cn(
                          "h-10 w-10 items-center justify-center rounded-full",
                          isSelected && "bg-primary dark:bg-primary-dark",
                          !isSelected && isToday && "border border-primary dark:border-primary-dark",
                        )}
                      >
                        <AppText
                          variant="body"
                          className={cn(
                            "text-sm",
                            isSelected && "font-sans-semibold text-white dark:text-paper-dark",
                          )}
                        >
                          {day}
                        </AppText>
                      </Pressable>
                    ) : (
                      <View className="h-10 w-10" />
                    )}
                  </View>
                );
              })}
            </View>

            <View className="mt-3 flex-row justify-between">
              <Button
                title="Clear"
                variant="ghost"
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
              />
              <Button title="Close" variant="secondary" onPress={() => setOpen(false)} />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}
