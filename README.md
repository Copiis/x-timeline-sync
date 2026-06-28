# X Leseposition & Medien-Download

Tampermonkey-Userscript für **x.com** — Leseposition in der Timeline merken und wiederfinden, plus Bilder und Videos aus Tweets speichern.

| | |
|---|---|
| **Tampermonkey (DE)** | X Leseposition & Medien-Download |
| **Tampermonkey (EN)** | X Reading Position & Media Download |
| **Aktuelle Version** | `2026.6.28i` |

## Installation

**GreasyFork (empfohlen):** https://greasyfork.org/de/scripts/517767-twitter-x-timeline-sync

**Direkt von GitHub (Raw-URL):**

```
https://raw.githubusercontent.com/Copiis/x-timeline-sync/master/Twitter-X-Timeline-Sync.js
```

Tampermonkey, Violentmonkey oder Greasemonkey installieren → Link oben öffnen → Script installieren.

## Funktionen

### Leseposition

- Automatisches Speichern beim Scrollen (Tweet-ID, Autor, Kontext, Reposts)
- **Resolve-Engine** — exakt → Kontext → Trail → temporal → Notfall
- **Neue Beiträge** — lädt oben nach und stellt die Lesestelle wieder her
- Timeline-Landkarte, JSON-Export/Import, 12+ Sprachen
- Orangener 1px-Rahmen an der aktuellen Lesestelle

Leseposition-Sync aktiv auf **x.com/home**; schwebende Buttons links unten (Lupe, Speichern, Import, Auto-Save).

### Medien-Download

- Download-Button oben links auf Tweet-**Bildern** und -**Videos** (beim Hover)
- Bilder in Originalauflösung (`orig`), Videos als beste MP4-Qualität
- Auf **allen x.com-Seiten** mit Medien (Timeline, Profil, Einzeltweet)

## Quelle

**GitHub (einzige Spiegelung):** https://github.com/Copiis/x-timeline-sync

## Entwicklung

- Arbeitsdatei: `Twitter-X-Timeline-Sync.js`
- Nach Änderung: `@version` erhöhen → `git commit` → `git push`
- Lokal testen: `./update-tampermonkey.sh` → Zwischenablage → Tampermonkey einfügen

### GreasyFork pflegen

**Code-Sync-URL:**

```
https://raw.githubusercontent.com/Copiis/x-timeline-sync/master/Twitter-X-Timeline-Sync.js
```

**Beschreibung (DE/EN):** Als Copiis einloggen → Bearbeiten → Name + „Zusätzliche Informationen“:

| Sprache | Skriptname | Datei |
|---------|------------|--------|
| DE | X Leseposition & Medien-Download | `greasyfork-info-de.html` |
| EN | X Reading Position & Media Download | `greasyfork-info-en.html` |

Zwischenablage: `./update-greasyfork-info.sh de` bzw. `./update-greasyfork-info.sh en`  
Automatisch (Chrome CDP Port 9222): `node greasyfork-cdp-fill.mjs de --publish`

## Lizenz

MIT · [Copiis](https://github.com/Copiis)