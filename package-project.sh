#!/usr/bin/env bash
set -euo pipefail

ARCHIVE_NAME="${1:-salon-complet.zip}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v zip >/dev/null 2>&1; then
  echo "Erreur : l'outil 'zip' n'est pas installé. Installez-le avec 'sudo apt install zip'." >&2
  exit 1
fi

cd "$ROOT_DIR"

CANDIDATES=(
  "README.md"
  "salon-coiffure"
  "salon-frontend"
  "setup-frontend.sh"
  "setup.sh"
)

INCLUDE=()
for path in "${CANDIDATES[@]}"; do
  if [ -e "$path" ]; then
    INCLUDE+=("$path")
  else
    echo "Info : '$path' introuvable, saut." >&2
  fi
done

if [ ${#INCLUDE[@]} -eq 0 ]; then
  echo "Rien à archiver." >&2
  exit 1
fi

zip -r "$ARCHIVE_NAME" "${INCLUDE[@]}"

echo "Archive créée : $ROOT_DIR/$ARCHIVE_NAME"
