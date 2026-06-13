import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEYS = {
  onboardingDone: 'onboarding_done',
  premium: 'is_premium',
  batteryTip: 'battery_tip_dismissed',
  lastMix: 'last_mix',
};

export type Prefs = {
  ready: boolean;
  onboardingDone: boolean;
  premium: boolean;
  batteryTipDismissed: boolean;
  lastMix: Record<string, number>;
  setOnboardingDone: () => void;
  setPremium: (v: boolean) => void;
  dismissBatteryTip: () => void;
  saveMix: (mix: Record<string, number>) => void;
};

export function usePrefs(): Prefs {
  const [ready, setReady] = useState(false);
  const [onboardingDone, setOnboarding] = useState(false);
  const [premium, setPremiumState] = useState(false);
  const [batteryTipDismissed, setBattery] = useState(false);
  const [lastMix, setLastMix] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(Object.values(KEYS));
        const map = Object.fromEntries(entries);
        setOnboarding(map[KEYS.onboardingDone] === 'true');
        setPremiumState(map[KEYS.premium] === 'true');
        setBattery(map[KEYS.batteryTip] === 'true');
        const storedMix = map[KEYS.lastMix];
        if (storedMix) setLastMix(JSON.parse(storedMix));
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

  const saveMix = useCallback((mix: Record<string, number>) => {
    setLastMix(mix);
    AsyncStorage.setItem(KEYS.lastMix, JSON.stringify(mix));
  }, []);

  return {
    ready,
    onboardingDone,
    premium,
    batteryTipDismissed,
    lastMix,
    setOnboardingDone,
    setPremium,
    dismissBatteryTip,
    saveMix,
  };
}
