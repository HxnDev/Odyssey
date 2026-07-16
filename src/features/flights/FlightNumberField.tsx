import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/hooks/useTheme";
import { lookupFlight, normalizeFlightNumber, type FlightInfo } from "./lookup";

interface FlightNumberFieldProps {
  value: string | null;
  onCommit: (flightNumber: string | null) => void;
  className?: string;
}

/**
 * Flight number input with automatic airline + route resolution
 * (offline IATA prefix → airline; adsbdb.com → route when online).
 */
export function FlightNumberField({ value, onCommit, className }: FlightNumberFieldProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(value ?? "");
  const [info, setInfo] = useState<FlightInfo | null>(null);
  const [error, setError] = useState<string | undefined>();

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value ?? "");
    if (!value) setInfo(null);
  }

  useEffect(() => {
    if (!value) return;
    let alive = true;
    lookupFlight(value).then((result) => {
      if (alive) setInfo(result);
    });
    return () => {
      alive = false;
    };
  }, [value]);

  const commit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError(undefined);
      onCommit(null);
      return;
    }
    const normalized = normalizeFlightNumber(trimmed);
    if (!normalized) {
      setError("Use the airline code + number, e.g. EK 202");
      return;
    }
    setError(undefined);
    onCommit(normalized);
  };

  return (
    <View className={className}>
      <Input
        label="Flight number"
        placeholder="e.g. EK 202"
        autoCapitalize="characters"
        autoCorrect={false}
        value={text}
        onChangeText={(t) => {
          setText(t);
          setError(undefined);
        }}
        onEndEditing={commit}
        error={error}
      />
      {info ? (
        <View className="mt-2 flex-row items-center gap-2 rounded-2xl bg-primary-soft px-3 py-2.5 dark:bg-primary-dark-soft">
          <Ionicons name="airplane" size={16} color={colors.primary} />
          <View className="flex-1">
            <AppText variant="label" className="font-sans-semibold text-ink dark:text-ink-dark">
              {info.airline ?? "Unknown airline"} · {info.flightNumber}
            </AppText>
            {info.origin && info.destination ? (
              <AppText variant="caption">
                {info.origin}  →  {info.destination}
              </AppText>
            ) : (
              <AppText variant="caption">Route unavailable for this flight</AppText>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}
