#!/bin/bash
# Kopiert GreasyFork-Beschreibung (DE oder EN) in die Zwischenablage.
# Nutzung: ./update-greasyfork-info.sh [de|en]
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LANG="${1:-de}"
case "$LANG" in
  de)
    INFO_FILE="${SCRIPT_DIR}/greasyfork-info-de.html"
    GF_URL="https://greasyfork.org/de/scripts/517767-twitter-x-timeline-sync/edit"
    GF_NAME="X Leseposition & Medien-Download"
    ;;
  en)
    INFO_FILE="${SCRIPT_DIR}/greasyfork-info-en.html"
    GF_URL="https://greasyfork.org/en/scripts/517767-twitter-x-timeline-sync/edit"
    GF_NAME="X Reading Position & Media Download"
    ;;
  *)
    echo "❌ Sprache: de oder en"
    exit 1
    ;;
esac
if [[ ! -f "$INFO_FILE" ]]; then
  echo "❌ Nicht gefunden: $INFO_FILE"
  exit 1
fi
if ! command -v xclip >/dev/null 2>&1; then
  echo "❌ xclip fehlt"
  exit 1
fi
xclip -selection clipboard < "$INFO_FILE"
echo "✅ GreasyFork-Beschreibung (${LANG^^}) → Zwischenablage"
echo "   Skriptname (Feld oben): ${GF_NAME}"
echo "   Bearbeiten: ${GF_URL}"
echo "   Zusätzliche Informationen → Ctrl+V → Veröffentlichen"
echo ""
echo "Code-Sync-URL:"
echo "   https://raw.githubusercontent.com/Copiis/x-leseposition-medien-download/master/Twitter-X-Timeline-Sync.js"