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
import { Linking, Platform } from 'react-native';

const REVENUECAT_API_KEY = {
  ios: 'appl_XXXXXXXXXXXXXXXXXXXX',
  android: 'goog_XXXXXXXXXXXXXXXXXXXX',
};
const ENTITLEMENT_ID = 'premium';

export type PlanId = 'monthly' | 'annual' | 'lifetime';

export type Plan = {
  id: PlanId;
  /** Identifiant du package dans l'Offering RevenueCat. */
  packageId: string;
  title: string;
  price: string;
  /** Détail sous le prix (ex. "soit 2,92 €/mois"). */
  caption: string;
  /** Sert à formuler les conditions (".../mois", ".../an", paiement unique). */
  period: 'week' | 'month' | 'year' | 'once';
  badge?: string;
  trialDays?: number;
  highlighted?: boolean;
};

const PLAN_PACKAGE_ID: Record<PlanId, string> = {
  monthly: '$rc_monthly',
  annual: '$rc_annual',
  lifetime: '$rc_lifetime',
};

/**
 * Prix par défaut (mode démo / repli).
 * Pensés pour des REVENUS RÉCURRENTS CHAQUE MOIS tout en maximisant la conversion :
 *  - Mensuel : génère du chiffre d'affaires régulier (MRR) tous les mois.
 *  - Annuel (mis en avant, essai 7 j) : meilleure conversion + rétention, encaissé
 *    d'avance — positionné SOUS les leaders (Hatch 49,99 $/an, BetterSleep 59,99 $/an).
 *  - À vie : rassure les réfractaires à l'abonnement.
 */
const FALLBACK_PLANS: Plan[] = [
  {
    id: 'monthly',
    packageId: PLAN_PACKAGE_ID.monthly,
    title: 'Mensuel',
    price: '6,99 €',
    caption: 'Facturé chaque mois',
    period: 'month',
  },
  {
    id: 'annual',
    packageId: PLAN_PACKAGE_ID.annual,
    title: 'Annuel',
    price: '34,99 €',
    caption: 'soit 2,92 €/mois — 58 % d\'économie',
    period: 'year',
    badge: 'MEILLEURE OFFRE · 7 JOURS OFFERTS',
    trialDays: 7,
    highlighted: true,
  },
  {
    id: 'lifetime',
    packageId: PLAN_PACKAGE_ID.lifetime,
    title: 'À vie',
    price: '59,99 €',
    caption: 'Paiement unique, pour toujours',
    period: 'once',
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

/**
 * Récupère le package standard correspondant au plan dans l'offering courant.
 * Utilise les emplacements standard RevenueCat (monthly / annual / lifetime),
 * ce qui marche quel que soit l'identifiant exact configuré.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function packageForPlan(offering: any, planId: PlanId) {
  if (!offering) return null;
  if (planId === 'monthly') return offering.monthly ?? null;
  if (planId === 'annual') return offering.annual ?? null;
  return offering.lifetime ?? null;
}

/** Renvoie les plans avec prix réels (ou prix de repli en mode démo). */
export async function fetchPlans(): Promise<Plan[]> {
  load();
  if (!available) return FALLBACK_PLANS;
  try {
    const offering = (await Purchases.getOfferings()).current;
    if (!offering) return FALLBACK_PLANS;
    return FALLBACK_PLANS.map((plan) => ({
      ...plan,
      price: packageForPlan(offering, plan.id)?.product?.priceString || plan.price,
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
    const offering = (await Purchases.getOfferings()).current;
    const target = packageForPlan(offering, planId);
    if (!target) return false;
    const { customerInfo } = await Purchases.purchasePackage(target);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    // Annulation utilisateur ou erreur réseau.
    return false;
  }
}

/**
 * Ouvre la page de gestion des abonnements du store, où l'utilisateur peut
 * résilier. Obligatoire (politiques Google Play / Apple) et rassure les parents
 * — évite les avis « impossible de se désabonner ».
 */
export async function openManageSubscriptions(packageName = 'com.dreamdrops.babysleep'): Promise<void> {
  const url =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : `https://play.google.com/store/account/subscriptions?package=${packageName}`;
  await Linking.openURL(url).catch(() => {});
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
