import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEYS = {
  onboardingDone: 'onboarding_done',
  premium: 'is_premium',
  batteryTip: 'battery_tip_dismissed',
};

export type Prefs = {
  ready: boolean;
  onboardingDone: boolean;
  premium: boolean;
  batteryTipDismissed: boolean;
  setOnboardingDone: () => void;
  setPremium: (v: boolean) => void;
  dismissBatteryTip: () => void;
};

export function usePrefs(): Prefs {
  const [ready, setReady] = useState(false);
  const [onboardingDone, setOnboarding] = useState(false);
  const [premium, setPremiumState] = useState(false);
  const [batteryTipDismissed, setBattery] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(Object.values(KEYS));
        const map = Object.fromEntries(entries);
        setOnboarding(map[KEYS.onboardingDone] === 'true');
        setPremiumState(map[KEYS.premium] === 'true');
        setBattery(map[KEYS.batteryTip] === 'true');
      } catch {
        // valeurs par défaut
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setOnboardingDone = useCallback(() => {
    setOnboarding(true);
    AsyncStorage.setItem(KEYS.onboardingDone, 'true');
  }, []);

  const setPremium = useCallback((v: boolean) => {
    setPremiumState(v);
    AsyncStorage.setItem(KEYS.premium, String(v));
  }, []);

  const dismissBatteryTip = useCallback(() => {
    setBattery(true);
    AsyncStorage.setItem(KEYS.batteryTip, 'true');
  }, []);

  return {
    ready,
    onboardingDone,
    premium,
    batteryTipDismissed,
    setOnboardingDone,
    setPremium,
    dismissBatteryTip,
  };
}
