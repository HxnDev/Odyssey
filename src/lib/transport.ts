import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

type MciName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export interface TransportMode {
  id: string;
  label: string;
  icon: MciName;
  emoji: string;
}

export const TRANSPORT_MODES: TransportMode[] = [
  { id: "plane", label: "Plane", icon: "airplane", emoji: "✈️" },
  { id: "train", label: "Train", icon: "train", emoji: "🚆" },
  { id: "car", label: "Car", icon: "car", emoji: "🚗" },
  { id: "bus", label: "Bus", icon: "bus", emoji: "🚌" },
  { id: "boat", label: "Boat", icon: "ferry", emoji: "⛴️" },
  { id: "motorcycle", label: "Motorcycle", icon: "motorbike", emoji: "🏍️" },
  { id: "bicycle", label: "Bicycle", icon: "bike", emoji: "🚲" },
  { id: "walk", label: "On foot", icon: "walk", emoji: "🥾" },
];

export const transportById = new Map(TRANSPORT_MODES.map((m) => [m.id, m]));

export function transportLabel(id: string | null | undefined): string {
  return (id && transportById.get(id)?.label) || "Other";
}

export function transportEmoji(id: string | null | undefined): string {
  return (id && transportById.get(id)?.emoji) || "🧳";
}

export function transportIcon(id: string | null | undefined): MciName {
  return (id && transportById.get(id)?.icon) || "bag-suitcase";
}
