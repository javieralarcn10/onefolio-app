import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getHapticsPermission } from "@/utils/storage";
import * as Haptics from "expo-haptics";

type HapticStyle = "Heavy" | "Light" | "Medium" | "Rigid" | "Soft" | "Error" | "Success" | "Warning";

let enabledState = true;
const listeners = new Set<() => void>();
let hasHydrated = false;

function notify() {
  listeners.forEach((listener) => listener());
}

function setEnabledState(value: boolean) {
  if (enabledState === value) return;
  enabledState = value;
  notify();
}

async function hydrateFromStorage() {
  if (hasHydrated) return;
  hasHydrated = true;

  try {
    const stored = await getHapticsPermission();
    const nextValue = stored ?? true;
    if (nextValue !== enabledState) {
      setEnabledState(nextValue);
    }
  } catch (error) {
    console.error("Failed to hydrate haptics permission", error);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return enabledState;
}

export function useHaptics() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void hydrateFromStorage();
  }, []);

  const triggerHaptics = useCallback(
    async (style: HapticStyle) => {
      if (!enabled) return;

      if (style === "Heavy") return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (style === "Light") return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (style === "Medium") return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (style === "Rigid") return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      if (style === "Soft") return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      if (style === "Error") return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (style === "Success") return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (style === "Warning") return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    [enabled],
  );

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
  }, []);

  return { triggerHaptics, setEnabled, enabled };
}
