# X/Twitter Timeline Sync (Refactored)

Userscript zur präzisen Speicherung und Wiederherstellung der Leseposition auf X.com (Twitter).

**Original Author:** Copiis  
**Refactoring Status:** Phase 1 + Phase 2 weitgehend abgeschlossen

## Aktueller Stand (Mai 2026)

- Phase 1: CONFIG-Objekt mit allen Magic Numbers, Header aufgeräumt
- Phase 2: Zentrale `isRepost()` + `parsePost()` hinzugefügt
- Alle Aufrufe von `isPostRepost(...)` auf die neue zentrale Funktion umgestellt
- Duplizierte Repost-Erkennungs-Funktionen entfernt (5 Kopien eliminiert)

**Wichtiger Hinweis:** Die Kern-Suchlogik (`startRefinedSearchForLastReadPost` etc.) wurde bewusst noch nicht stark verändert, um Stabilität zu gewährleisten.

Nächste geplante Schritte: Bessere State-Kapselung und Vereinfachung der Suchlogik.

## Installation

1. Tampermonkey oder Violentmonkey installieren
2. `Twitter-X-Timeline-Sync.user.js` als Userscript laden

## Lizenz

MIT

## Spenden (Original)

- Bitcoin: bc1quc5mkudlwwkktzhvzw5u2nruxyepef957p68r7
- PayPal: https://www.paypal.com/paypalme/Coopiis