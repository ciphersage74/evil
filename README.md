# DreamDrops 🌙 — Sons de pluie pour endormir bébé

Application mobile **Android + iPhone** (React Native / Expo, TypeScript) qui aide
les bébés à s'endormir avec des bruits de pluie, de cœur maternel et de bruit blanc.
Conçue dès le départ pour être **vendable** : design soigné, tunnel d'abonnement et
correction des défauts les plus critiqués des apps concurrentes.

## ⚡ Démarrage rapide (test sur ton téléphone)

```bash
npm install
npm start            # ouvre le QR code
```

Installe **Expo Go** (Play Store / App Store), scanne le QR code → l'app se lance.

> Tu peux régénérer les sons/icônes : `npm run gen:sounds` et `npm run gen:icons`
> (nécessite Python 3).

## 🎯 Ce qui rend l'app meilleure que les concurrentes

J'ai analysé les meilleures apps du Play Store **et leurs avis négatifs**. Les 3
plaintes récurrentes — et comment DreamDrops les corrige :

| Plainte fréquente (concurrents) | Correction dans DreamDrops |
| --- | --- |
| « Le son **s'arrête tout seul la nuit** » | Lecture en arrière-plan + écran éteint (`staysActiveInBackground`, mode audio iOS, `keep-awake`) **et** une carte qui guide l'utilisateur pour désactiver l'optimisation batterie. |
| « On **entend la boucle** / ça coupe » | Les sons sont **synthétisés** et raccordés avec un **fondu enchaîné** : la boucle est imperceptible et infinie. |
| « **Trop de pubs** avant de jouer » | **Zéro publicité.** Modèle premium par abonnement uniquement. |

Autres atouts repris des meilleures apps : **mixeur** (plusieurs sons + volume
individuel), **minuterie de sommeil avec fondu**, fonctionne **hors-ligne**, sons
spécial nourrisson (**cœur maternel / womb**).

## 💰 Monétisation — quoi facturer et comment

**Modèle recommandé : Freemium + abonnement (in-app).**

- **Gratuit** : 4 ambiances (pluie, cœur maternel, bruit blanc, océan) + minuterie.
  Assez pour accrocher, frustrant juste ce qu'il faut.
- **Premium (abonnement)** : tous les sons + mixage illimité.

### Tarification conseillée
- **Essai gratuit 7 jours** puis **~19,99 €/an** (mis en avant) — meilleur revenu/utilisateur.
- Option **hebdomadaire ~4,99 €/sem** pour capter les achats impulsifs.
- (Optionnel) **achat à vie ~29,99 €** pour les réfractaires à l'abonnement.

### Comment encaisser (in-app, multiplateforme)
On utilise **RevenueCat** (`react-native-purchases`) : un seul SDK gère **Google
Play ET l'App Store**, l'essai gratuit, la restauration et le statut d'abonnement.

> ⚠️ Les achats in-app **ne marchent pas dans Expo Go** (module natif). Dans Expo Go,
> le bouton premium débloque l'app en *mode démo* pour tester l'interface. Pour la
> vraie facturation il faut un **development build** (`npx expo run:android`) ou un
> build **EAS**.

Étapes de mise en production (voir `src/billing/purchases.ts`) :
1. `npm install react-native-purchases`
2. Renseigner les clés RevenueCat (iOS + Android).
3. Créer l'abonnement dans la Play Console / App Store Connect.
4. Lier l'« entitlement » `premium` dans RevenueCat.
5. Builder avec **EAS** (`eas build`).

### Conversion (déjà intégré)
- **Onboarding** en 3 écrans qui vend les bénéfices (dont « sans pub », « toute la nuit »).
- **Paywall** avec essai gratuit mis en avant, liste de bénéfices, prix annuel discret.
- Cadenas 🔒 sur les sons premium → ouverture du paywall au tap (déclencheur naturel).

## 🏗️ Architecture

```
App.tsx                      Routage onboarding / home / paywall + persistance
src/
  audio/
    sounds.ts                Catalogue (require des .wav)
    AudioManager.ts          Lecture, mixage, volume maître, minuterie, arrière-plan
    useAudio.ts              Hook d'état (useSyncExternalStore)
  billing/purchases.ts       Abonnement RevenueCat (repli mode démo)
  store/usePrefs.ts          Préférences (AsyncStorage)
  screens/                   Onboarding, Home, Paywall
  components/ui.tsx          Composants partagés (boutons, fond, chips)
  theme.ts                   Couleurs / espacements
assets/sounds/*.wav          Ambiances générées (libres de droits)
tools/generate_*.py          Générateurs de sons et d'icônes (Python pur)
```

## 🔊 Remplacer les sons

Les `.wav` sont générés (synthèse, libres de droits). Pour des sons « réels »,
remplace les fichiers dans `assets/sounds/` (garde les mêmes noms) par des samples
**libres de droits** bien bouclés (Pixabay, Freesound CC0…). Garde `isLooping`.

## ✅ État

- TypeScript : `npx tsc --noEmit` ✅
- Bundle Metro Android : ✅ (598 modules, 10 assets)
- Testable immédiatement dans **Expo Go**.
