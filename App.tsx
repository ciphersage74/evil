import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AudioManager } from './src/audio/AudioManager';
import { useAudio } from './src/audio/useAudio';
import { initPurchases, isPremiumActive } from './src/billing/purchases';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { usePrefs } from './src/store/usePrefs';
import { theme } from './src/theme';

export default function App() {
  const prefs = usePrefs();
  const { mix } = useAudio();
  const [showPaywall, setShowPaywall] = useState(false);
  const [restored, setRestored] = useState(false);

  // Init audio + facturation au démarrage.
  useEffect(() => {
    AudioManager.init();
    initPurchases().then(() => {
      isPremiumActive().then((active) => {
        if (active) prefs.setPremium(true);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restaure le dernier mix une fois les préférences chargées.
  useEffect(() => {
    if (prefs.ready && !restored) {
      setRestored(true);
      if (Object.keys(prefs.lastMix).length > 0) {
        AudioManager.restoreMix(prefs.lastMix);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.ready, restored]);

  // Sauvegarde le mix à chaque changement.
  useEffect(() => {
    if (restored) prefs.saveMix(mix);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mix, restored]);

  if (!prefs.ready) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.night }} />;
  }

  let screen: React.ReactNode;
  if (!prefs.onboardingDone) {
    screen = <OnboardingScreen onFinish={prefs.setOnboardingDone} />;
  } else if (showPaywall) {
    screen = (
      <PaywallScreen
        onPremium={() => {
          prefs.setPremium(true);
          setShowPaywall(false);
        }}
        onClose={() => setShowPaywall(false)}
      />
    );
  } else {
    screen = (
      <HomeScreen
        premium={prefs.premium}
        batteryTipDismissed={prefs.batteryTipDismissed}
        onDismissBatteryTip={prefs.dismissBatteryTip}
        onOpenPaywall={() => setShowPaywall(true)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.night }}>
      <StatusBar style="light" />
      {screen}
    </View>
  );
}
