/**
 * Achats in-app (abonnement premium) via RevenueCat.
 *
 * Pourquoi RevenueCat : un seul SDK gère Google Play ET l'App Store, les essais
 * gratuits, la restauration et le statut d'abonnement côté serveur — idéal pour
 * une app multiplateforme Expo.
 *
 * IMPORTANT : `react-native-purchases` est un module natif. Il NE fonctionne PAS
 * dans Expo Go — il faut un "development build" (`npx expo run:android`) ou EAS.
 * Pour que l'app reste lançable dans Expo Go, on charge le module dynamiquement :
 * s'il est absent, on bascule en mode démo (prix simulés, achat débloqué localement
 * pour tester l'UI).
 *
 * Mise en production :
 *   1) npm install react-native-purchases
 *   2) renseigner les clés RevenueCat ci-dessous
 *   3) créer une "Offering" RevenueCat avec 3 packages dont les identifiants
 *      correspondent à PLAN_PACKAGE_ID, liés à un entitlement "premium"
 *   4) builder avec EAS (pas Expo Go)
 */
import { Platform } from 'react-native';

const REVENUECAT_API_KEY = {
  ios: 'appl_XXXXXXXXXXXXXXXXXXXX',
  android: 'goog_XXXXXXXXXXXXXXXXXXXX',
};
const ENTITLEMENT_ID = 'premium';

export type PlanId = 'weekly' | 'annual' | 'lifetime';

export type Plan = {
  id: PlanId;
  /** Identifiant du package dans l'Offering RevenueCat. */
  packageId: string;
  title: string;
  price: string;
  /** Détail sous le prix (ex. "soit 0,58 €/semaine"). */
  caption: string;
  badge?: string;
  trialDays?: number;
  highlighted?: boolean;
};

const PLAN_PACKAGE_ID: Record<PlanId, string> = {
  weekly: '$rc_weekly',
  annual: '$rc_annual',
  lifetime: '$rc_lifetime',
};

/**
 * Prix par défaut (mode démo / repli).
 * Pensés pour la conversion : l'annuel avec essai gratuit est mis en avant,
 * positionné sous les leaders (Hatch 49,99 $/an, BetterSleep 59,99 $/an) pour
 * gagner des parts ; l'hebdomadaire capte l'impulsion ; le "à vie" rassure les
 * réfractaires à l'abonnement.
 */
const FALLBACK_PLANS: Plan[] = [
  {
    id: 'weekly',
    packageId: PLAN_PACKAGE_ID.weekly,
    title: 'Hebdomadaire',
    price: '4,99 €',
    caption: 'Facturé chaque semaine',
  },
  {
    id: 'annual',
    packageId: PLAN_PACKAGE_ID.annual,
    title: 'Annuel',
    price: '29,99 €',
    caption: 'soit 0,58 €/semaine — 88 % d\'économie',
    badge: 'MEILLEURE OFFRE · 7 JOURS OFFERTS',
    trialDays: 7,
    highlighted: true,
  },
  {
    id: 'lifetime',
    packageId: PLAN_PACKAGE_ID.lifetime,
    title: 'À vie',
    price: '49,99 €',
    caption: 'Paiement unique, pour toujours',
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Purchases: any = null;
let available = false;

function load() {
  if (Purchases !== null) return;
  try {
    // require dynamique : absent dans Expo Go -> mode démo.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Purchases = require('react-native-purchases').default;
    available = true;
  } catch {
    available = false;
  }
}

export function purchasesAvailable() {
  load();
  return available;
}

export async function initPurchases(): Promise<void> {
  load();
  if (!available) return;
  const key = Platform.OS === 'ios' ? REVENUECAT_API_KEY.ios : REVENUECAT_API_KEY.android;
  try {
    await Purchases.configure({ apiKey: key });
  } catch (e) {
    console.warn('Purchases.configure failed', e);
  }
}

/** Renvoie les plans avec prix réels (ou prix de repli en mode démo). */
export async function fetchPlans(): Promise<Plan[]> {
  load();
  if (!available) return FALLBACK_PLANS;
  try {
    const offerings = await Purchases.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const byId = new Map<string, string>();
    for (const p of packages) {
      byId.set(p.identifier, p.product?.priceString ?? '');
    }
    return FALLBACK_PLANS.map((plan) => ({
      ...plan,
      price: byId.get(plan.packageId) || plan.price,
    }));
  } catch {
    return FALLBACK_PLANS;
  }
}

export async function isPremiumActive(): Promise<boolean> {
  load();
  if (!available) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

/** Lance l'achat du plan choisi. Renvoie true si premium actif (ou en démo). */
export async function purchasePlan(planId: PlanId): Promise<boolean> {
  load();
  if (!available) {
    // Mode démo (Expo Go) : on simule un achat réussi pour tester l'UI.
    return true;
  }
  try {
    const offerings = await Purchases.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const target = packages.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.identifier === PLAN_PACKAGE_ID[planId],
    );
    if (!target) return false;
    const { customerInfo } = await Purchases.purchasePackage(target);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    // Annulation utilisateur ou erreur réseau.
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  load();
  if (!available) return false;
  try {
    const info = await Purchases.restorePurchases();
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}
