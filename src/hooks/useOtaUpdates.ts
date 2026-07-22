import * as Updates from "expo-updates";
import { useEffect } from "react";

/**
 * Checks for an OTA update once on cold start and applies it immediately.
 * No-op in dev mode / the dev client; errors (e.g. offline launch) are
 * swallowed so they never affect startup.
 */
export function useOtaUpdates() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // Offline or the update server is unreachable — launch normally.
      }
    })();
  }, []);
}
