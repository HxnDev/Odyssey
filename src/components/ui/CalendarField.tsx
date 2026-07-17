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
const YEARS_PER_PAGE = 12;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/**
 * Pure-JS date picker: a themed month-grid calendar in a modal.
 * Tapping the "June 2026" header jumps to a year grid, then a month grid —
 * so any date is a couple of taps away instead of dozens of swipes.
 */
export function CalendarField({ label, value, onChange, placeholder = "Select date", className }: CalendarFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"days" | "months" | "years">("days");
  const initial = value ? parseIso(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const openPicker = () => {
    const base = value ? parseIso(value) : new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setMode("days");
    setOpen(true);
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  // Header chevrons page by month, year, or 12-year block depending on mode.
  const shiftView = (delta: number) => {
    if (mode === "days") shiftMonth(delta);
    else if (mode === "months") setViewYear((y) => y + delta);
    else setViewYear((y) => y + delta * YEARS_PER_PAGE);
  };

  const yearPageStart = viewYear - ((viewYear % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE;
  const yearPage = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Monday-first weekday index of the 1st of the month.
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Chunk into rows of exactly 7. (flex-wrap with 100/7% widths overflows
  // 100% by a rounding hair, wrapping the 7th cell and shifting weekdays.)
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

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
              <Pressable onPress={() => shiftView(-1)} className="p-2" accessibilityLabel="Previous">
                <Ionicons name="chevron-back" size={20} color={colors.inkSoft} />
              </Pressable>
              <Pressable
                onPress={() => setMode(mode === "days" ? "years" : "days")}
                className="flex-row items-center gap-1 rounded-chip px-3 py-1"
                accessibilityLabel="Pick month and year"
              >
                <AppText variant="heading">
                  {mode === "days"
                    ? `${MONTH_NAMES[viewMonth]} ${viewYear}`
                    : mode === "months"
                      ? `${viewYear}`
                      : `${yearPage[0]} – ${yearPage[yearPage.length - 1]}`}
                </AppText>
                <Ionicons
                  name={mode === "days" ? "chevron-down" : "chevron-up"}
                  size={14}
                  color={colors.primary}
                />
              </Pressable>
              <Pressable onPress={() => shiftView(1)} className="p-2" accessibilityLabel="Next">
                <Ionicons name="chevron-forward" size={20} color={colors.inkSoft} />
              </Pressable>
            </View>

            {mode === "years" ? (
              <View className="flex-row flex-wrap">
                {yearPage.map((year) => (
                  <View key={year} className="w-1/4 items-center py-1.5">
                    <Pressable
                      onPress={() => {
                        setViewYear(year);
                        setMode("months");
                      }}
                      className={cn(
                        "rounded-chip px-3 py-2",
                        year === viewYear && "bg-primary dark:bg-primary-dark",
                      )}
                    >
                      <AppText
                        variant="body"
                        className={cn(
                          "text-sm",
                          year === viewYear && "font-sans-semibold text-white dark:text-paper-dark",
                        )}
                      >
                        {year}
                      </AppText>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : mode === "months" ? (
              <View className="flex-row flex-wrap">
                {MONTH_NAMES.map((name, month) => (
                  <View key={name} className="w-1/4 items-center py-1.5">
                    <Pressable
                      onPress={() => {
                        setViewMonth(month);
                        setMode("days");
                      }}
                      className={cn(
                        "rounded-chip px-3 py-2",
                        month === viewMonth && "bg-primary dark:bg-primary-dark",
                      )}
                    >
                      <AppText
                        variant="body"
                        className={cn(
                          "text-sm",
                          month === viewMonth && "font-sans-semibold text-white dark:text-paper-dark",
                        )}
                      >
                        {name.slice(0, 3)}
                      </AppText>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <>
                <View className="mb-1 flex-row">
                  {WEEKDAYS.map((d, i) => (
                    <View key={`${d}-${i}`} className="flex-1 items-center py-1">
                      <AppText variant="caption">{d}</AppText>
                    </View>
                  ))}
                </View>

                <View>
                  {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} className="flex-row">
                      {week.map((day, dayIndex) => {
                        const iso = day ? `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}` : null;
                        const isSelected = day !== null && day === selectedDay;
                        const isToday = iso === today;
                        return (
                          <View key={dayIndex} className="flex-1 items-center py-0.5">
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
                  ))}
                </View>
              </>
            )}

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
