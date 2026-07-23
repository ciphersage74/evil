# Checklist Google Play Console — Bébé Dort

Tout ce qu'il faut renseigner pour faire valider l'app. Valeurs prêtes à copier.

---

## 0. Infos de base (déjà décidées)
- **Nom de l'app** : `Bébé Dort : Sons de Pluie`
- **Nom du package** : `com.rezzely.bebedort`
- **Développeur (public)** : `Rezzely Sàrl`
- **Type** : Application · **Gratuite** (avec achats intégrés)
- **Langue par défaut** : Français (France)
- **URL politique de confidentialité** : `https://verify-access.com/bebe-dormir/privacy.html`
- **Email de contact** : `fievetdylan74100@gmail.com`

---

## 1. Fiche du Play Store (Présence sur le Store → Fiche principale)
- **Nom de l'application (30)** : `Bébé Dort : Sons de Pluie`
- **Description courte (80)** :
  `Bruit blanc et sons relaxants pour le sommeil de bébé. Sans pub.`
- **Description complète (4000)** : voir `STORE_LISTING.md`
- **Catégorie** : `Parentalité` (alternative : Style de vie)
- **Tags** : sommeil bébé, bruit blanc, sons de pluie, berceuse
- **Coordonnées** : email ci-dessus (téléphone/site facultatifs)

### Éléments graphiques (obligatoires)
- **Icône** : 512×512 PNG (je peux la générer depuis l'icône de l'app)
- **Image de présentation (feature graphic)** : 1024×500 PNG (à fournir — je peux la créer)
- **Captures d'écran téléphone** : 2 à 8 (je peux les générer depuis l'aperçu)

---

## 2. « Configurer votre application » (toutes les déclarations)
- **Accès à l'application** : « Toutes les fonctionnalités sont disponibles sans
  identifiants » (il n'y a **aucun compte/login** ; le premium se débloque par
  achat, ce n'est pas un accès restreint).
- **Annonces** : **Non**, l'app ne contient pas de publicités.
- **Classification du contenu** : remplir le questionnaire → résultat attendu
  **Tout public** (app de sons, aucun contenu sensible).
- **Public cible** : **adultes (18+)** ou 13+ — surtout **NE PAS** cocher « enfants »
  (sinon programme « Conçu pour les familles », bien plus strict).
- **Application pour enfants** : **Non**.
- **Sécurité des données** : voir section 3.
- **App gouvernementale** : Non · **Fonctionnalités financières** : Non.
- **Santé** : ce n'est **pas** une app de santé (relaxation/confort) → déclarer non.

---

## 3. Sécurité des données (Data safety) — réponses exactes
- **Votre app collecte/partage des données ?** : **Oui** (à cause des achats).
- Données collectées :
  - **Achats intégrés / historique d'achat** → finalité : **Fonctionnalité de l'app**
    (gestion de l'abonnement) · partagé avec notre prestataire **RevenueCat** ·
    **non** utilisé pour la pub · **non** lié à l'identité (identifiant anonyme).
  - (Optionnel selon RevenueCat) **Identifiants de l'appareil** → Fonctionnalité.
- **Aucune** donnée : nom, email, localisation précise, contacts, photos, **micro**.
- **Données chiffrées en transit** : **Oui** (HTTPS).
- **L'utilisateur peut demander la suppression** : **Oui** (via l'email de contact ;
  désinstaller supprime les données locales).

---

## 4. Monétisation → Produits (à créer AVANT la version)
Crée 3 produits avec ces identifiants (ou laisse RevenueCat les importer) :
| Produit | Type | Prix | Particularité |
| --- | --- | --- | --- |
| Mensuel | Abonnement | 6,99 € | — |
| Annuel | Abonnement | 34,99 €/an | **Offre d'essai gratuit 7 jours** |
| À vie | Achat unique | 59,99 € | — |

Puis dans **RevenueCat** : relier ces produits aux packages Monthly/Yearly/Lifetime
et à l'entitlement, et récupérer la **clé `goog_...`** → la mettre dans
`src/billing/purchases.ts` (remplace la clé `test_`).

---

## 5. Version de production
- **Build** : `eas build --profile production --platform android` → fichier **.aab**
- **Notes de version** : voir `STORE_LISTING.md` (section « Nouveautés »)
- **Pays de diffusion** : France, Suisse, Belgique, Canada… (au choix)
- **Signature de l'app** : laisser **Google Play App Signing** (EAS gère la clé d'upload)

---

## 6. Ordre conseillé
1. Créer l'app (nom, package, langue, gratuit).
2. Remplir Fiche + graphiques + déclarations (sections 1-3).
3. Créer les produits (section 4) + brancher RevenueCat + vraie clé `goog_`.
4. Build **production .aab** → l'uploader sur un canal **Test interne** d'abord.
5. Vérifier que l'achat réel fonctionne (avec un compte testeur).
6. Promouvoir en **Production** → soumettre à l'examen.

> ℹ️ Compte **organisation** (Rezzely Sàrl) : tu n'es **pas** soumis à l'obligation
> de test fermé 14 jours / 12 testeurs (ça ne vise que les comptes personnels).

---

## ⚠️ Les 3 oublis qui font échouer
1. **Clé `goog_` réelle** dans le code (sinon personne ne peut payer).
2. **URL de confidentialité** hébergée + collée dans la Console.
3. **Public cible = adultes** (pas « enfants »).
