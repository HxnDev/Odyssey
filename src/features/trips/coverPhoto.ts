import { decode } from "base64-arraybuffer";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";

/**
 * Trip cover photo pipeline, following the bandwidth optimization plan:
 * pick → resize to max 1200px → WebP @ 75% (typically 150–400 KB) → upload
 * to the public "trip-covers" bucket → store the CDN URL on the trip.
 * A `?v=<timestamp>` suffix busts expo-image's disk cache when the cover is
 * replaced; otherwise the image is downloaded exactly once per device.
 */

const MAX_DIMENSION = 1200;

/** Opens the system picker. Returns null if the user cancels. */
export async function pickCoverPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [16, 9],
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

/** Compresses and uploads a local image; returns the public (cacheable) URL. */
export async function uploadCoverPhoto(
  localUri: string,
  userId: string,
  tripId: string,
): Promise<string> {
  const compressed = await manipulateAsync(
    localUri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: 0.75, format: SaveFormat.WEBP, base64: true },
  );
  if (!compressed.base64) throw new Error("Could not compress the image");

  const path = `${userId}/${tripId}.webp`;
  const { error } = await supabase.storage
    .from("trip-covers")
    .upload(path, decode(compressed.base64), {
      contentType: "image/webp",
      upsert: true,
    });
  if (error) throw error;

  const { data } = supabase.storage.from("trip-covers").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Removes the stored cover object (ignores missing files). */
export async function deleteCoverPhoto(userId: string, tripId: string): Promise<void> {
  await supabase.storage.from("trip-covers").remove([`${userId}/${tripId}.webp`]);
}
