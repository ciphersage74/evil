import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AudioManager } from './src/audio/AudioManager';
import { useAudio } from './src/audio/useAudio';
import { initPurchases, isPremiumActive, restorePurchases } from './src/billing/purchases';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PaywallReason, PaywallScreen } from './src/screens/PaywallScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { usePrefs } from './src/store/usePrefs';
import { theme } from './src/theme';

export default function App() {
  const prefs = usePrefs();
  const { mix, freeLimitHit } = useAudio();
  const [paywall, setPaywall] = useState<PaywallReason | null>(null);
  const [welcomed, setWelcomed] = useState(false);
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

  // Synchronise le statut premium avec le moteur (supprime la limite de session).
  useEffect(() => {
    AudioManager.setPremium(prefs.premium);
  }, [prefs.premium]);

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

  // Conversion : pas de paywall à l'ouverture. L'utilisateur profite des sons,
  // puis le paywall apparaît à la fin de la session gratuite (15 min) ou au tap
  // d'un son premium.

  // Conversion : la session gratuite a expiré -> paywall contextualisé.
  useEffect(() => {
    if (freeLimitHit && !prefs.premium) {
      setPaywall('limit');
      AudioManager.acknowledgeFreeLimit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeLimitHit, prefs.premium]);

  if (!prefs.ready) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.night }} />;
  }

  let screen: React.ReactNode;
  if (!prefs.onboardingDone) {
    screen = welcomed ? (
      <OnboardingScreen onFinish={prefs.setOnboardingDone} />
    ) : (
      <WelcomeScreen onStart={() => setWelcomed(true)} />
    );
  } else if (paywall) {
    screen = (
      <PaywallScreen
        reason={paywall}
        onPremium={() => {
          prefs.setPremium(true);
          setPaywall(null);
        }}
        onClose={() => setPaywall(null)}
      />
    );
  } else {
    screen = (
      <HomeScreen
        premium={prefs.premium}
        batteryTipDismissed={prefs.batteryTipDismissed}
        onDismissBatteryTip={prefs.dismissBatteryTip}
        onOpenPaywall={(reason) => setPaywall(reason)}
        onRestore={async () => {
          const ok = await restorePurchases();
          if (ok) prefs.setPremium(true);
        }}
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
