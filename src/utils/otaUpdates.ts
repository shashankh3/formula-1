import { useEffect, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Updates from 'expo-updates';

export interface UpdateStatus {
  isChecking: boolean;
  isAvailable: boolean;
  isDownloading: boolean;
  isDownloaded: boolean;
  error?: string;
  updateId?: string;
  channel?: string;
  runtimeVersion?: string;
  isDev: boolean;
}

/**
 * Checks for OTA updates safely. Returns status object.
 */
export async function checkForOTAUpdate(): Promise<{ available: boolean; error?: string }> {
  // Updates are only enabled in standalone builds (EAS build / installed APK/IPA)
  if (__DEV__ || !Updates.isEnabled) {
    return { available: false, error: 'OTA updates are active in installed standalone builds (disabled in dev/Expo Go).' };
  }

  try {
    const check = await Updates.checkForUpdateAsync();
    if (check.isAvailable) {
      await Updates.fetchUpdateAsync();
      return { available: true };
    }
    return { available: false };
  } catch (err: any) {
    return { available: false, error: err?.message || 'Check failed' };
  }
}

/**
 * Reloads the app to immediately apply the downloaded OTA update bundle.
 */
export async function reloadAppWithUpdate(): Promise<void> {
  if (Updates.isEnabled) {
    await Updates.reloadAsync();
  }
}

/**
 * Hook to automatically check for OTA updates on app launch and when returning to foreground.
 */
export function useAutoOTAUpdate() {
  const [status, setStatus] = useState<UpdateStatus>({
    isChecking: false,
    isAvailable: false,
    isDownloading: false,
    isDownloaded: false,
    isDev: __DEV__ || !Updates.isEnabled,
    channel: Updates.channel || undefined,
    runtimeVersion: Updates.runtimeVersion || undefined,
    updateId: Updates.updateId || undefined,
  });

  const check = async () => {
    if (__DEV__ || !Updates.isEnabled) return;
    try {
      setStatus((s) => ({ ...s, isChecking: true, error: undefined }));
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setStatus((s) => ({ ...s, isChecking: false, isAvailable: true, isDownloading: true }));
        await Updates.fetchUpdateAsync();
        setStatus((s) => ({
          ...s,
          isDownloading: false,
          isDownloaded: true,
          updateId: Updates.updateId || undefined,
        }));
      } else {
        setStatus((s) => ({ ...s, isChecking: false, isAvailable: false }));
      }
    } catch (err: any) {
      setStatus((s) => ({
        ...s,
        isChecking: false,
        isDownloading: false,
        error: err?.message,
      }));
    }
  };

  useEffect(() => {
    // Check on initial load
    check();

    // Check whenever the app returns from background to active
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        check();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    ...status,
    checkNow: check,
    applyUpdate: reloadAppWithUpdate,
  };
}
