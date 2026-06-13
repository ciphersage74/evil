/**
 * Achats in-app (abonnement premium) via RevenueCat.
 *
 * Pourquoi RevenueCat : un seul SDK gère Google Play ET l'App Store, les essais
 * gratuits, la restauration et le statut d'abonnement côté serveur — idéal pour
 * une app multiplateforme Expo.
 *
 * IMPORTANT : `react-native-purchases` est un module natif. Il NE fonctionne PAS
 * dans Expo Go — il faut un "development build" (`npx expo run:android` ou EAS).
 * Pour que l'app reste lançable dans Expo Go, on charge le module dynamiquement :
 * s'il est absent, on bascule en mode démo (le bouton premium débloque localement
 * pour tester l'UI).
 *
 * Mise en production :
 *   1) npm install react-native-purchases
 *   2) renseigner les clés RevenueCat ci-dessous
 *   3) créer dans RevenueCat un "entitlement" nommé ENTITLEMENT_ID lié à
 *      l'abonnement Play/App Store
 *   4) builder avec EAS (pas Expo Go)
 */
import { Platform } from 'react-native';

const REVENUECAT_API_KEY = {
  ios: 'appl_XXXXXXXXXXXXXXXXXXXX',
  android: 'goog_XXXXXXXXXXXXXXXXXXXX',
};
const ENTITLEMENT_ID = 'premium';

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

/** Prix formaté de l'offre annuelle, ou repli si indisponible. */
export async function fetchPrice(fallback = '€19.99'): Promise<string> {
  load();
  if (!available) return fallback;
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages?.[0];
    return pkg?.product?.priceString ?? fallback;
  } catch {
    return fallback;
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

/** Lance l'achat. Renvoie true si premium actif (ou en mode démo). */
export async function purchasePremium(): Promise<boolean> {
  load();
  if (!available) {
    // Mode démo (Expo Go) : on simule un achat réussi pour tester l'UI.
    return true;
  }
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages?.[0];
    if (!pkg) return false;
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (e: unknown) {
    // L'utilisateur a annulé, ou erreur réseau.
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

export const purchasesAvailable = () => {
  load();
  return available;
};
