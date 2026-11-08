import * as Updates from "expo-updates";
import { useEffect } from "react";
import { AppState } from "react-native";

/**
 * Over-the-air updates for installed builds.
 *
 * - Checks for a newer JS bundle on launch and every time the app returns to
 *   the foreground, and downloads it in the background.
 * - Applies it (restarts the JS runtime) only while the app is locked, so it
 *   never interrupts someone who is using the app.
 *
 * This only delivers JavaScript/asset changes to builds that share the same
 * runtime version. It cannot change the Expo SDK or any native code — see the
 * "Keeping up with Expo SDK releases" section of the README.
 *
 * It does nothing in development, in Expo Go, or on the web.
 */
export function useAutoUpdate(isLocked: boolean) {
  const { isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    const check = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) await Updates.fetchUpdateAsync();
      } catch (e) {
        console.warn("Update check failed:", e);
      }
    };

    void check();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void check();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!__DEV__ && Updates.isEnabled && isUpdatePending && isLocked) {
      Updates.reloadAsync().catch((e) =>
        console.warn("Could not apply update:", e),
      );
    }
  }, [isUpdatePending, isLocked]);
}
