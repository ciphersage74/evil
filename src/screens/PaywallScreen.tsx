import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NightBackground, PrimaryButton } from '../components/ui';
import {
  Plan,
  PlanId,
  fetchPlans,
  purchasePlan,
  restorePurchases,
} from '../billing/purchases';
import { theme } from '../theme';

export type PaywallReason = 'intro' | 'limit' | 'locked' | 'manual';

const FEATURES = [
  'Toutes les ambiances premium',
  'Lecture illimitée, toute la nuit',
  'Mixage de sons illimité',
  'Minuteries personnalisées et fondu auto',
  'Sans publicité, pour toujours',
];

const HEADLINES: Record<PaywallReason, { title: string; subtitle: string }> = {
  intro: {
    title: 'Offrez à bébé ses plus belles nuits',
    subtitle: 'Essayez Bébé Dort Premium gratuitement pendant 7 jours.',
  },
  limit: {
    title: 'Votre aperçu gratuit est terminé',
    subtitle: 'Passez premium pour que le son joue toute la nuit, sans coupure.',
  },
  locked: {
    title: 'Débloquez toutes les ambiances',
    subtitle: 'Pluie forte, vent, ruisseau… et bien plus, en illimité.',
  },
  manual: {
    title: 'Bébé Dort Premium',
    subtitle: 'Tout ce qu\'il faut à bébé pour une nuit complète.',
  },
};

export function PaywallScreen({
  reason = 'manual',
  onPremium,
  onClose,
}: {
  reason?: PaywallReason;
  onPremium: () => void;
  onClose: () => void;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<PlanId>('annual');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans()
      .then((p) => {
        setPlans(p);
        const def = p.find((x) => x.highlighted) ?? p[0];
        if (def) setSelected(def.id);
      })
      .catch(() => {});
  }, []);

  const current = plans.find((p) => p.id === selected);
  const head = HEADLINES[reason];

  const subscribe = async () => {
    setLoading(true);
    const ok = await purchasePlan(selected);
    setLoading(false);
    if (ok) onPremium();
  };

  const restore = async () => {
    const ok = await restorePurchases();
    if (ok) onPremium();
  };

  const periodWord = (p: Plan['period']) =>
    p === 'week' ? 'semaine' : p === 'month' ? 'mois' : p === 'year' ? 'an' : '';

  const ctaLabel = !current
    ? 'Continuer'
    : current.trialDays
      ? `Démarrer l'essai gratuit de ${current.trialDays} jours`
      : current.period === 'once'
        ? 'Débloquer à vie'
        : 'S\'abonner';

  const terms = !current
    ? ''
    : current.trialDays
      ? `${current.trialDays} jours gratuits, puis ${current.price}/${periodWord(current.period)}. Annulable à tout moment.`
      : current.period === 'once'
        ? `Paiement unique de ${current.price}.`
        : `${current.price}/${periodWord(current.period)}. Annulable à tout moment.`;

  return (
    <NightBackground>
      <ScrollView contentContainerStyle={styles.root}>
        <Pressable style={styles.close} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <Text style={styles.sparkle}>🌙</Text>
        <Text style={styles.title}>{head.title}</Text>
        <Text style={styles.subtitle}>{head.subtitle}</Text>

        {/* Preuve sociale */}
        <View style={styles.social}>
          <Text style={styles.stars}>★★★★★</Text>
          <Text style={styles.socialText}>Rejoint par des milliers de parents apaisés</Text>
        </View>

        {/* Bénéfices */}
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

        {/* Sélecteur de plans */}
        <View style={styles.plans}>
          {plans.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => setSelected(plan.id)}
              style={[styles.plan, selected === plan.id && styles.planSelected]}
            >
              {plan.badge && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              )}
              <View style={styles.planRow}>
                <View style={styles.radio}>
                  {selected === plan.id && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planCaption}>{plan.caption}</Text>
                </View>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <PrimaryButton title={ctaLabel} onPress={subscribe} loading={loading} />
        <Text style={styles.terms}>{terms}</Text>

        <Pressable onPress={restore} style={styles.restore}>
          <Text style={styles.restoreText}>Restaurer l'achat</Text>
        </Pressable>

        <View style={styles.legalRow}>
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://dreamdrops.app/privacy').catch(() => {})}
          >
            Confidentialité
          </Text>
          <Text style={styles.legalDot}>·</Text>
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://dreamdrops.app/terms').catch(() => {})}
          >
            Conditions
          </Text>
        </View>
      </ScrollView>
    </NightBackground>
  );
}

const styles = StyleSheet.create({
  root: { padding: 24, paddingTop: 52, flexGrow: 1 },
  close: { alignSelf: 'flex-end', padding: 4 },
  closeText: { color: theme.colors.textSecondary, fontSize: 22 },
  sparkle: { fontSize: 52, textAlign: 'center', marginTop: 4 },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  social: { alignItems: 'center', marginTop: 16 },
  stars: { color: theme.colors.moon, fontSize: 18, letterSpacing: 2 },
  socialText: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 },
  features: { marginTop: 20, marginBottom: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,233,168,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkText: { color: theme.colors.moon, fontWeight: '700' },
  featureText: { color: theme.colors.textPrimary, fontSize: 15 },
  plans: { marginTop: 12, marginBottom: 16 },
  plan: {
    borderWidth: 1.5,
    borderColor: theme.colors.surfaceVariant,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 10,
    backgroundColor: theme.colors.surface,
  },
  planSelected: {
    borderColor: theme.colors.lavender,
    backgroundColor: 'rgba(185,168,255,0.12)',
  },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: theme.colors.lavender,
  },
  planTitle: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '600' },
  planCaption: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  planPrice: { color: theme.colors.textPrimary, fontSize: 17, fontWeight: '700' },
  planBadge: {
    position: 'absolute',
    top: -9,
    left: 14,
    backgroundColor: theme.colors.moon,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planBadgeText: { color: theme.colors.night, fontSize: 10, fontWeight: '800' },
  terms: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  restore: { marginTop: 14, alignItems: 'center', padding: 8 },
  restoreText: { color: theme.colors.lavender, fontSize: 15 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 6 },
  legalLink: { color: theme.colors.textSecondary, fontSize: 12 },
  legalDot: { color: theme.colors.textSecondary, fontSize: 12 },
});
