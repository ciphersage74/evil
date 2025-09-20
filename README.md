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

Les fichiers téléversés depuis le panneau admin sont enregistrés dans `static/uploads/`. Ce dossier est ignoré par Git (sauf le fichier `.gitkeep`). Pensez à sauvegarder vos images si vous déployez l'application sur un autre serveur.

## Personnalisation avancée

Le fichier `content.json` contient l'ensemble des données affichées sur le site. Vous pouvez l'éditer manuellement ou via le panneau admin. Les listes (navigation, menu, horaires, etc.) peuvent être complétées ou réduites directement dans l'interface.

## Déploiement

Avant un déploiement en production :

- configurez une clé secrète forte (`SECRET_KEY`),
- changez le mot de passe administrateur,
- mettez en place un serveur web (gunicorn, uwsgi, etc.) derrière un reverse proxy,
- servez les fichiers statiques via un CDN ou un serveur optimisé,
- sécurisez l'accès à l'administration (HTTPS, IP filtering si nécessaire).

