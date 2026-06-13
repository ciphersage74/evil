import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NightBackground, PrimaryButton } from '../components/ui';
import { fetchPrice, purchasePremium, restorePurchases } from '../billing/purchases';
import { theme } from '../theme';

const FEATURES = [
  'Tous les sons premium',
  'Mixage de sons illimité',
  'Minuteries personnalisées et fondu auto',
  'Sans publicité, pour toujours',
];

export function PaywallScreen({
  onPremium,
  onClose,
}: {
  onPremium: () => void;
  onClose: () => void;
}) {
  const [price, setPrice] = useState('€19.99');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPrice().then(setPrice).catch(() => {});
  }, []);

  const subscribe = async () => {
    setLoading(true);
    const ok = await purchasePremium();
    setLoading(false);
    if (ok) onPremium();
  };

  const restore = async () => {
    const ok = await restorePurchases();
    if (ok) onPremium();
  };

  return (
    <NightBackground>
      <ScrollView contentContainerStyle={styles.root}>
        <Pressable style={styles.close} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <Text style={styles.sparkle}>✨</Text>
        <Text style={styles.title}>DreamDrops Premium</Text>
        <Text style={styles.subtitle}>
          Tout ce qu'il faut à bébé pour une nuit complète
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <View style={styles.check}>
                <Text style={styles.checkText}>✓</Text>
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton
          title="Essai gratuit de 7 jours"
          onPress={subscribe}
          loading={loading}
          style={{ marginTop: 12 }}
        />
        <Text style={styles.terms}>Puis {price}/an. Annulable à tout moment.</Text>

        <Pressable onPress={restore} style={styles.restore}>
          <Text style={styles.restoreText}>Restaurer l'achat</Text>
        </Pressable>
      </ScrollView>
    </NightBackground>
  );
}

const styles = StyleSheet.create({
  root: { padding: 24, paddingTop: 56, flexGrow: 1 },
  close: { alignSelf: 'flex-end', padding: 4 },
  closeText: { color: theme.colors.textSecondary, fontSize: 22 },
  sparkle: { fontSize: 64, textAlign: 'center', marginTop: 8 },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  features: { marginTop: 32, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,233,168,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkText: { color: theme.colors.moon, fontWeight: '700' },
  featureText: { color: theme.colors.textPrimary, fontSize: 16 },
  terms: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  restore: { marginTop: 16, alignItems: 'center', padding: 8 },
  restoreText: { color: theme.colors.lavender, fontSize: 15 },
});
