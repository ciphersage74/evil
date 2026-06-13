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
individuel), **minuterie de sommeil avec fondu** (préréglages **+ durée
personnalisée**), fonctionne **hors-ligne**, sons spécial nourrisson
(**cœur maternel / womb**).

## 🏆 L'avantage unique : « Sommeil sûr » (ce que personne ne fait)

Toutes les apps concurrentes poussent du bruit blanc **sans aucune information sur
le volume**, alors que les pédiatres (AAP) recommandent explicitement **< 50 dB, à
au moins 2 m du berceau, durée limitée** — et une étude a montré que beaucoup de
machines dépassent **85 dB** (dangereux pour l'audition). Les parents sont même
invités à « utiliser une app pour mesurer le volume ». **Aucune app de bruit pour
bébé n'intègre cette sécurité.**

DreamDrops en fait son positionnement : l'app de sommeil pour bébé **sûre,
informée par la pédiatrie**.
- **Volume maître avec zone sûre** : le curseur passe en alerte au-delà du seuil
  recommandé et conseille d'éloigner le téléphone du berceau.
- **Fiche « Sommeil sûr »** : les 4 règles clés de l'AAP, intégrées dans l'app.
- **Démarrage à volume modéré par défaut** + minuterie pour limiter la durée.

C'est un différenciateur fort pour l'**ASO** (mots-clés « sûr », « pédiatre »), pour
les **avis** (les parents font confiance) et donc pour la **conversion**.

## 💰 Monétisation & conversion — basé sur les données

Le freemium « gentil » (sons gratuits illimités) convertit très mal : les parents
se contentent du gratuit. D'après **RevenueCat State of Subscription Apps 2025**
(75 000+ apps) :

- Un **paywall avec essai gratuit dès l'onboarding convertit ~12 %**, soit **5,5×
  plus** que le freemium (~2 %), et génère **2× la valeur par client**.
- **82 % des essais démarrent au jour 0** → il faut proposer l'offre tout de suite.
- Les écrans paywall « format essai » (sélecteur de plans) gagnent dans 64,5 % des tests.

### Stratégie implémentée (3 leviers)

1. **Sessions gratuites limitées à 15 min.** Le bénéfice clé « joue toute la nuit »
   devient une vraie raison de payer. Le son s'estompe en douceur puis le paywall
   s'ouvre (`FREE_SESSION_SECONDS` dans `AudioManager.ts`). Message clair côté UI
   pour éviter l'effet « bug ».
2. **Paywall d'essai présenté juste après l'onboarding** (jour 0), une seule fois.
3. **Paywall haute conversion** : sélecteur 3 plans, plan annuel mis en avant avec
   badge « 7 jours offerts », preuve sociale, et **messages contextualisés** selon
   le déclencheur (fin de session, son verrouillé, bouton premium).

### Tarification — pensée pour des revenus récurrents CHAQUE MOIS
Les leaders : Hatch **49,99 $/an**, BetterSleep **9,99 $/mois · 59,99 $/an**. On se
positionne dessous :

| Plan | Prix | Rôle |
| --- | --- | --- |
| **Mensuel** | **6,99 €/mois** | **Revenus récurrents réguliers (MRR)** |
| Annuel **(mis en avant)** | 34,99 €/an, 7 j offerts | Meilleure conversion + rétention, encaissé d'avance |
| À vie | 59,99 € | Rassure les anti-abonnement |

> 💡 **Pour un revenu mensuel stable**, le plan mensuel donne du cash chaque mois ;
> l'annuel (mis en avant) maximise la conversion et la valeur par client. Le mix des
> deux = MRR régulier **et** trésorerie. Modifiable dans `src/billing/purchases.ts`
> (`FALLBACK_PLANS`).

### Comment encaisser (in-app, multiplateforme)
On utilise **RevenueCat** (`react-native-purchases`) : un seul SDK gère **Google
Play ET l'App Store**, l'essai gratuit, la restauration et le statut d'abonnement.

> ⚠️ Les achats in-app **ne marchent pas dans Expo Go** (module natif). Dans Expo Go,
> le bouton premium débloque l'app en *mode démo* pour tester l'interface. Pour la
> vraie facturation il faut un **development build** (`npx expo run:android`) ou EAS.

Étapes de mise en production (voir `src/billing/purchases.ts`) :
1. `npm install react-native-purchases`
2. Renseigner les clés RevenueCat (iOS + Android).
3. Créer 3 produits (hebdo / annuel avec essai / à vie) dans la Play Console et
   l'App Store Connect, puis une **Offering** RevenueCat avec les packages
   `$rc_weekly`, `$rc_annual`, `$rc_lifetime` liés à l'entitlement `premium`.
4. Builder avec **EAS** (`eas build`).

### Conformité stores (déjà en place)
- **Gérer / résilier l'abonnement** : bouton dans ⚙️ Réglages qui ouvre la page
  d'abonnements du store (Play Store sur Android, App Store sur iPhone) — obligatoire
  et évite les avis « impossible de se désabonner ».
- **Restaurer mes achats** : dans Réglages et sur le paywall.
- **Liens Confidentialité / Conditions** : sur le paywall et dans Réglages.
  ⚠️ Remplace les URLs `https://dreamdrops.app/...` (dans `HomeScreen.tsx` et
  `PaywallScreen.tsx`) par tes vraies pages avant publication.

### Pour aller plus loin (recommandé)
- **A/B teste le paywall** (RevenueCat Experiments) : les équipes qui testent font
  jusqu'à 40× plus de revenus.
- Teste 15 min vs 10 min de session gratuite, et l'annuel à 34,99 € vs 39,99 €.

## 🏗️ Architecture

```
App.tsx                      Routage welcome / onboarding / home / paywall + persistance
src/
  audio/
    sounds.ts                Catalogue (require des .wav)
    AudioManager.ts          Lecture, mixage, volume maître, minuterie, arrière-plan, limite gratuite
    useAudio.ts              Hook d'état (useSyncExternalStore)
  billing/purchases.ts       Abonnements RevenueCat (mensuel/annuel/à vie, repli démo)
  store/usePrefs.ts          Préférences (AsyncStorage)
  screens/                   Welcome (animé), Onboarding, Home, Paywall
  components/ui.tsx          Composants partagés (boutons, fond, chips)
  components/StarField.tsx   Fond d'étoiles scintillantes animé
  theme.ts                   Couleurs / espacements
assets/sounds/*.wav          Ambiances générées (libres de droits)
tools/generate_*.py          Générateurs de sons et d'icônes (Python pur)
```

## 🎨 Design

- **Écran de bienvenue animé** (logo, lueur qui respire, étoiles scintillantes, fondu).
- Thème nocturne cohérent, dégradés, fond étoilé partagé welcome/onboarding.
- Bouton lecture avec halo « respirant » quand le son joue.
- Paywall premium avec sélecteur de plans et preuve sociale.

## 🚀 Publier (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build:configure        # déjà préconfiguré dans eas.json
eas build -p android --profile production
eas build -p ios --profile production
eas submit -p android      # envoi au Play Store
```

## 🔊 Remplacer les sons

Les `.wav` sont générés (synthèse, libres de droits). Pour des sons « réels »,
remplace les fichiers dans `assets/sounds/` (garde les mêmes noms) par des samples
**libres de droits** bien bouclés (Pixabay, Freesound CC0…). Garde `isLooping`.

## ✅ État (contrôlé — zéro erreur)

- TypeScript : `npx tsc --noEmit` ✅
- ESLint (`eslint-config-expo`) : `npx eslint App.tsx "src/**/*.{ts,tsx}"` ✅ (0 erreur, 0 warning)
- Bundle Metro **Android + iOS** : ✅
- Testable immédiatement dans **Expo Go**.
