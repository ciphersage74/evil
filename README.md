# Générateur de site vitrine gastronomique

Cette application Flask génère un site web élégant pour un restaurant (ou toute autre activité) à partir d'un fichier de contenu JSON. Un panneau d'administration sécurisé permet de modifier les textes, les liens et les images sans toucher au code source.

## Fonctionnalités

- Page d'accueil responsive inspirée de l'exemple fourni (sections Héro, À propos, Menu, Horaires, Contact, Carte Google et pied de page).
- Contenu dynamique alimenté par `content.json`.
- Interface d'administration protégée par mot de passe pour mettre à jour :
  - les informations générales (titre, description, navigation),
  - les textes et images des sections Héro et À propos,
  - les éléments du menu (avec ajout/suppression et téléchargement d'images),
  - les horaires d'ouverture,
  - les coordonnées de contact et l'intégration Google Maps,
  - les libellés du formulaire de contact,
  - les liens et réseaux sociaux du pied de page.
- Personnalisation du thème : choix des couleurs clés et des polices (titres & texte) depuis le panneau admin.
- Export en un clic d'un dossier statique prêt à déployer (HTML, contenu JSON et images uploadées).
- Téléversement d'images (PNG, JPG, JPEG, GIF, WebP) stockées dans `static/uploads/`.
- Possibilité d'ajouter/supprimer dynamiquement des éléments via l'interface.

## Prérequis

- Python 3.9 ou plus récent
- Virtualenv recommandé

## Installation

```bash
python -m venv .venv
source .venv/bin/activate  # Sur Windows : .venv\\Scripts\\activate
pip install -r requirements.txt
```

## Lancement du serveur

```bash
export FLASK_APP=app.py
export FLASK_ENV=development  # optionnel, pour le rechargement automatique
flask run
```

Le site public est disponible sur http://127.0.0.1:5000/ et l'administration sur http://127.0.0.1:5000/admin.

## Identifiants par défaut

- utilisateur : `admin`
- mot de passe : `changeme`

Pour les modifier, définissez les variables d'environnement `ADMIN_USERNAME` et `ADMIN_PASSWORD`. La clé secrète Flask peut être changée via la variable `SECRET_KEY`.

## Gestion des images

Les fichiers téléversés depuis le panneau admin sont enregistrés dans `static/uploads/`. Ce dossier est ignoré par Git : pensez à sauvegarder vos images si vous déployez l'application sur un autre serveur ou utilisez la fonction d'export pour récupérer une copie complète.

## Personnalisation avancée

Le fichier `content.json` contient l'ensemble des données affichées sur le site. Vous pouvez l'éditer manuellement ou via le panneau admin. Les listes (navigation, menu, horaires, etc.) peuvent être complétées ou réduites directement dans l'interface.

### Couleurs & polices

L'onglet « Apparence du site » de l'administration permet de définir :

- les couleurs principale, secondaire, d'accent, de fond et du texte ;
- la couleur du texte des boutons pour garantir la lisibilité ;
- les polices utilisées pour les titres et le corps du texte (renseignez le nom de la police et, si besoin, l'URL CSS fournie par Google Fonts ou un autre fournisseur).

Les valeurs enregistrées sont immédiatement reflétées sur la page publique.

## Export statique

Depuis le panneau d'administration, la section « Exporter votre site » permet de télécharger une archive ZIP contenant :

- le fichier `index.html` généré avec vos contenus et votre thème ;
- une copie du `content.json` actuel ;
- l'intégralité du dossier `static/` (y compris les images téléversées).

Décompressez simplement l'archive pour obtenir un dossier prêt à être déployé sur un hébergement statique.

## Déploiement

Avant un déploiement en production :

- configurez une clé secrète forte (`SECRET_KEY`),
- changez le mot de passe administrateur,
- mettez en place un serveur web (gunicorn, uwsgi, etc.) derrière un reverse proxy,
- servez les fichiers statiques via un CDN ou un serveur optimisé,
- sécurisez l'accès à l'administration (HTTPS, IP filtering si nécessaire).

