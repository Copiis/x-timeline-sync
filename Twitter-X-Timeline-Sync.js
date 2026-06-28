// ==UserScript==
// @name X Reading Position & Media Download
// @name:de X Leseposition & Medien-Download
// @description Tracks and syncs your last reading position on Twitter/X, with manual and automatic options. Ideal for keeping track of new posts without losing your place. Uses Tweet ID for precise positioning and supports reposts.
// @description:de Verfolgt und synchronisiert Ihre letzte Leseposition auf Twitter/X, mit manuellen und automatischen Optionen. Perfekt, um neue Beiträge im Blick zu behalten, ohne die aktuelle Position zu verlieren. Verwendet Tweet-ID für präzise Positionierung und Unterstützung für Reposts.
// @description:es Rastrea y sincroniza tu última posición de lectura en Twitter/X, con opciones manuales y automáticas. Ideal para mantener el seguimiento de las publicaciones nuevas sin perder tu posición. Usa ID de Tweet para posicionamiento preciso y soporte para reposts.
// @description:fr Suit et synchronise votre dernière position de lecture sur Twitter/X, avec des options manuelles et automatiques. Idéal pour suivre les nouveaux posts sans perdre votre place actuelle. Utilise l'ID du Tweet pour un positionnement précis et prise en charge des reposts.
// @description:zh-CN 跟踪并同步您在 Twitter/X 上的最后阅读位置，提供手动和自动选项。完美解决在查看新帖子时不丢失当前位置的问题。使用 Tweet ID 进行精确位置定位和对转发的支持。
// @description:ru Отслеживает и синхронизирует вашу последнюю позицию чтения на Twitter/X с ручными и автоматическими опциями. Идеально подходит для просмотра новых постов без потери текущей позиции. Использует ID твита для точного позиционирования и поддержкой репостов.
// @description:ja Twitter/X での最後の読み取り位置を追跡して同期します。手動および自動オプションを提供します。新しい投稿を見逃さずに現在の位置を維持するのに最適です。ツイートIDを使用して正確な位置特定を行い、リポストをサポートします。
// @description:pt-BR Rastrea e sincroniza sua última posição de lectura no Twitter/X, com opções manuais e automáticas. Perfeito para acompanhar novos posts sem perder sua posição atual. Usa ID do Tweet para posicionamiento preciso e suporte a reposts.
// @description:hi Twitter/X पर आपकी अंतिम पठन स्थिति को ट्रैक और सिंक करता है, मैनुअल और स्वचालित विकल्पों के साथ। नई पोस्ट देखते समय अपनी वर्तमान स्थिति को खोए बिना इसे ट्रैक करें। सटीक स्थिति के लिए ट्वीट ID का उपयोग करता है और रीपोस्ट समर्थन के साथ।
// @description:ar يتتبع ويزامن آخر موضع قراءة لك على Twitter/X، مع خيارات يدوية وتلقائية. مثالي لتتبع المشاركات الجديدة دون فقدان موضعك الحالي. يستخدم معرف التغريدة لتحديد الموضع بدقة ودعم إعادة النشر.
// @description:it Traccia e sincronizza la tua ultima posizione di lettura su Twitter/X, con opzioni manuali e automatiche. Ideale per tenere traccia dei nuovi post senza perdere la posizione attuale. Usa l'ID del Tweet per un posizionamento preciso e supporto per i repost.
// @description:ko Twitter/X에서 마지막 읽기 위치를 추적하고 동기화합니다. 수동 및 자동 옵션 포함. 새로운 게시물을 확인하면서 현재 위치를 잃지 않도록 이상적입니다. 트윗 ID를 사용하여 정확한 위치 지정을 하고, 리포스트를 지원합니다。
// @icon https://x.com/favicon.ico
// @namespace https://github.com/Copiis/x-leseposition-medien-download
// @version 2026.6.28j
// @author Copiis
// @license MIT
// @match https://x.com/*
// @connect x.com
// @connect twitter.com
// @connect pbs.twimg.com
// @connect video.twimg.com
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_registerMenuCommand
// @downloadURL https://raw.githubusercontent.com/Copiis/x-leseposition-medien-download/master/Twitter-X-Timeline-Sync.js
// @updateURL https://raw.githubusercontent.com/Copiis/x-leseposition-medien-download/master/Twitter-X-Timeline-Sync.js
// @description If you find this script useful and would like to support my work, consider making a small donation!
// @description GitHub Sponsors: https://github.com/sponsors/Copiis
// ==/UserScript==
//
(function () {
    'use strict';


    // =====================================================
    // PHASE 1 + PHASE 2 - Clean utilities (re-applied on fresh base)
    // =====================================================

    const CONFIG = {
        // === Such- & Scroll-Limits ===
        MAX_SCROLL_ATTEMPTS: 150,
        MAX_LOADED_POSTS_BEFORE_FALLBACK: 1500,
        // Erweiterte Limits, solange noch keine historischen Landkarten-Posts im DOM sind
        MAP_ANCHOR_SEARCH_MAX_ATTEMPTS: 800,
        MAP_ANCHOR_SEARCH_MAX_LOADED: 6000,
        MAP_ANCHOR_SEARCH_MAX_STAGNANT: 120,
        MAX_STAGNANT_SCROLLS: 35,
        MAX_FALLBACK_ATTEMPTS: 35,
        MAX_POSITION_ATTEMPTS: 6,

        // === Zeitbasierte Werte (in ms) ===
        POSITION_AGE_WARNING: 24 * 60 * 60 * 1000,
        ONE_HOUR_IN_MS: 60 * 60 * 1000,
        FOUR_HOURS_IN_MS: 4 * 60 * 60 * 1000,
        SEVEN_DAYS_IN_MS: 7 * 24 * 60 * 60 * 1000,
        TIME_DIFF_ACCEPTABLE_MS: 60 * 60 * 1000,
        DEBOUNCE_SCROLL_MS: 150,
        NEW_POSTS_CHECK_INTERVAL_MS: 3000,

        // === Schwellen für Auto-Laden neuer Beiträge ===
        NEAR_TOP_SCROLL_THRESHOLD: 100,      // Nur dann automatisch "Neue Beiträge" laden (via Observer/Interval/Scroll), wenn window.scrollY < diesem Wert. Verhindert unerwünschte Feed-Sprünge, wenn User tiefer in der Timeline liest.

        // === Unterdrückungszeiten nach Restore / Neuen Posts (Punkt 3 vereinfacht) ===
        RESTORE_GRACE_MS: 1200,              // Kurzer harter Mindestschutz nach manuellem Restore (früher 3.5s+)
        POST_LUPE_NEWER_BLOCK_MS: 5000,      // Nach Lupe: keine automatische Lesestellen-Vorwärts-Sprünge
        NEW_POSTS_GRACE_MS: 1800,            // Nach "Neue Beiträge" (etwas länger wegen Feed-Sprung)
        NEW_POSTS_SCROLL_SEARCH_MAX_ATTEMPTS: 60,
        NEW_POSTS_SCROLL_STEP_PX: 520,
        NEW_POSTS_SCROLL_SETTLE_MS: 280,
        NEW_POSTS_SCROLL_STAGNANT_LOADS: 3,    // Keine neuen articles mehr im DOM
        NEW_POSTS_SCROLL_STAGNANT_HEIGHT: 2,   // scrollHeight unverändert

        // === Positionierung ===
        READING_POSITION_TOP_OFFSET: 5,      // Oberster sichtbarer Post ab 5px unter Viewport-Oberkante (Lesestelle)
        RESTORE_SCROLL_OFFSET: 175,          // Ziel: obere Kante des Posts 175px unter Viewport-Oberkante (Lupe/Restore/New-Posts)
        POSITION_CORRECTION_TOLERANCE: 35,   // Toleranz in scrollToPostWithHighlight
        FALLBACK_POSITION_TOLERANCE: 40,     // Toleranz in findAndSetClosestPost Feinjustierung

        // === DOM-Heuristiken ===
        SMALL_SVG_MAX_SIZE: 22,              // Max. Breite/Höhe für Repost-Icon-Erkennung

        // === Such-Verhalten (Balance zwischen Geschwindigkeit bei weit entfernten Zielen und Overshoot-Schutz) ===
        MAX_SEARCH_DISTANCE_FACTOR: 3.2,     // Etwas höher als früher, damit weit entfernte Lesestellen schneller erreicht werden
        MAX_SEARCH_STEP_VH: 3.8,             // Deutlich größere Sprünge erlaubt für weit entfernte Lesestellen (vorher zu konservativ)
        SLOW_SEARCH_FINE_STEP_PX: 120,       // Kleine Schritte wenn Ziel-idx bereits im Viewport (Ping-Pong-Schutz)
        SLOW_SEARCH_FINE_MAX_ATTEMPTS: 10,   // Danach Top-Retry + sicheres Resolve
        SEARCH_FINE_ZONE_HYSTERESIS: 2,      // Abstand 0–2: keine großen Sprünge mehr (Ping-Pong-Schutz)
        SEARCH_TOP_RETRY_MAX_IDX: 25,        // Nahe Top: einmal scrollY=0 vor Fallback

        // === Context-Match (Phase 2) ===
        CONTEXT_NEIGHBOR_COUNT: 5,
        CONTEXT_MATCH_MIN_SCORE: 25,
        MASS_INFLUX_PENDING_THRESHOLD: 8,

        // === Timeline-Landkarte (steuert Lesestelle = oberster Post nach Map-Update) ===
        MAX_TIMELINE_MAP: 2500,
        TIMELINE_MAP_DEBOUNCE_MS: 200,
        TIMELINE_MAP_PERSIST_MS: 30000,
        MAP_SCROLL_DIRECTION_THRESHOLD: 40,
    };

    const repostCache = new WeakMap();

    function detectRepost(postElement) {
        // Flexibleres Pattern: Matcht charakteristische Teile des Repost-Icon-Pfads
        // (X ändert die exakte minifizierte Form gelegentlich)
        const repostPathPattern = /M4\.75 3\.79l4\.603.*zm11\.5 2\.71H11V4h5\.25|repost-arrow|repost-icon/i;

        // === Stufe 1: Repost-Icon-Pfad (flexibler) ===
        const allPaths = postElement.querySelectorAll('path');
        for (const p of allPaths) {
            const d = p.getAttribute('d') || '';
            if (repostPathPattern.test(d)) {
                debugLog('Repost', '✅ Repost erkannt (Stage 1 - Icon-Pfad)');
                return true;
            }
        }

        // === Stufe 2: socialContext (Text + Icon) — sehr zuverlässig bei Reposts ===
        const socialContext = postElement.querySelector('span[data-testid="socialContext"]');
        if (socialContext) {
            const txt = (socialContext.textContent || '').toLowerCase();

            // Starke Text-Erkennung für deutsche und englische Varianten
            if (/\b(repost|reposted|repostet|hat repostet)\b/.test(txt)) {
                debugLog('Repost', 'erkannt (Stage 2 - socialContext Text)');
                return true;
            }

            // Icon im socialContext
            const path = socialContext.querySelector('path');
            if (path && repostPathPattern.test(path.getAttribute('d') || '')) {
                debugLog('Repost', 'erkannt (Stage 2 - socialContext Icon)');
                return true;
            }
        }

        // === Stufe 3: Kleine SVGs (Icon oben links) ===
        const svgs = postElement.querySelectorAll('svg');
        for (let i = 0; i < Math.min(svgs.length, 6); i++) {
            const svg = svgs[i];
            const rect = svg.getBoundingClientRect();
            if (rect.height <= CONFIG.SMALL_SVG_MAX_SIZE && rect.width <= CONFIG.SMALL_SVG_MAX_SIZE) {
                const path = svg.querySelector('path');
                if (path && repostPathPattern.test(path.getAttribute('d') || '')) {
                    debugLog('Repost', 'erkannt (Stage 3 - kleines Icon SVG)');
                    return true;
                }
            }
        }

        // === Fallback: Icon-Pfad + Größen-Check ===
        const allPaths2 = postElement.querySelectorAll('path');
        for (const path of allPaths2) {
            if (repostPathPattern.test(path.getAttribute('d') || '')) {
                const parentSvg = path.closest('svg');
                if (parentSvg) {
                    const r = parentSvg.getBoundingClientRect();
                    if (r.height <= 22 && r.width <= 22) {
                        debugLog('Repost', 'erkannt (Fallback Icon + Größe)');
                        return true;
                    }
                }
            }
        }

        // === Letzter Fallback: Breite Text-Suche ===
        const repostTextPattern = /\b(reposted|hat repostet|retweeté|retwittato|リポストしました|перепостил|republicou|إعادة نشر|repostado|리트윗|reposted by|repostet by|retweeted by)\b/i;

        const textElement = postElement.querySelector('span[data-testid="socialContext"], span[class*="css-"][dir="ltr"]');
        if (textElement) {
            const text = (textElement.textContent || '').toLowerCase().trim();
            if (repostTextPattern.test(text)) {
                debugLog('Repost', 'erkannt (Text-Fallback)');
                return true;
            }
        }

        return false;
    }

    function isRepost(postElement) {
        if (!postElement) return false;
        if (repostCache.has(postElement)) return repostCache.get(postElement);
        const result = detectRepost(postElement);
        repostCache.set(postElement, result);
        return result;
    }

    function getReposterHandler(postElement) {
        if (!postElement) return null;

        // Try socialContext first
        const socialContext = postElement.querySelector('span[data-testid="socialContext"]');
        if (socialContext) {
            const link = socialContext.querySelector('a[role="link"][href^="/"]:not([href*="/status/"])');
            if (link) {
                const href = link.getAttribute('href') || '';
                const match = href.match(/^\/([^/?#]+)/);
                if (match && match[1] && !['home', 'explore', 'notifications', 'messages', 'i'].includes(match[1])) {
                    debugLog('Repost', 'getReposterHandler success via socialContext →', match[1]);
                    return match[1];
                }
            }
        }

        // Fallback
        const allLinks = postElement.querySelectorAll('a[role="link"][href^="/"]:not([href*="/status/"])');
        for (const link of allLinks) {
            const href = link.getAttribute('href') || '';
            const match = href.match(/^\/([^/?#]+)/);
            if (match && match[1] && !['home', 'explore', 'notifications', 'messages', 'i'].includes(match[1])) {
                debugLog('Repost', 'getReposterHandler success via fallback link →', match[1]);
                return match[1];
            }
        }

        return null;
    }

    const REPOST_LOG_KEY = (account) => `repostLog_${account}`;
    const MAX_REPOST_LOG = 500;
    const MAX_POST_HISTORY = 500;   // Erhöht von 100 auf 500 (User-Wunsch 30.05.2026)

    function addRepostToLog(repostData) {
        if (!repostData || !repostData.reposter || !repostData.originalAuthor) {
            debugLog('Repost', 'Skipped - missing reposter or originalAuthor');
            return;
        }

        const account = repostData.account || 'unknown';
        const key = REPOST_LOG_KEY(account);

        let repostLogEntries = GM_getValue(key, []);

        // Deduplication
        const isDuplicate = repostLogEntries.some(entry => 
            entry.reposter === repostData.reposter &&
            entry.originalAuthor === repostData.originalAuthor &&
            Math.abs(new Date(entry.repostDate).getTime() - new Date(repostData.repostDate).getTime()) < 1000 * 60 * 60 * 24
        );

        if (isDuplicate) {
            debugLog('Repost', 'Duplicate skipped for', repostData.reposter, '→', repostData.originalAuthor);
            return;
        }

        repostLogEntries.push({
            reposter: repostData.reposter,
            originalAuthor: repostData.originalAuthor,
            repostDate: repostData.repostDate,
            discoveredAt: repostData.discoveredAt || new Date().toISOString()
        });

        if (repostLogEntries.length > MAX_REPOST_LOG) {
            repostLogEntries = repostLogEntries.slice(-MAX_REPOST_LOG);
        }

        GM_setValue(key, repostLogEntries);
        log('Repost', `Repost erfasst: @${repostData.reposter} → @${repostData.originalAuthor}`);
        debugLog('Repost', 'Total reposts logged for account', account, '=', repostLogEntries.length);
    }

    function parsePost(postElement) {
        if (!postElement) return null;
        return {
            element: postElement,
            tweetId: getPostTweetId(postElement),
            authorHandler: getPostAuthorHandler(postElement),
            timestamp: getPostTimestamp(postElement),
            isRepost: isRepost(postElement)
        };
    }


    const translations = {
        en: {
            noValidPosition: "❌ No valid reading position to download.",
            alreadyDownloaded: "ℹ️ This reading position has already been downloaded.",
            downloadSuccess: "✅ Reading position downloaded as {fileName}.",
            downloadFailed: "❌ Download failed. Reading position copied to clipboard. Please paste it into a .json file manually.",
            downloadClipboardFailed: "❌ Download and clipboard copy failed. Please save manually.",
            noPositionFound: "ℹ️ Scroll to set a reading position.",
            scriptError: "❌ Error loading the script.",
            invalidPosition: "❌ Invalid reading position.",
            fileSelectError: "❌ Please select a JSON file.",
            fileReadError: "❌ Error reading the file.",
            fileDialogError: "❌ Error opening file dialog.",
            fileLoadSuccess: "✅ Reading position successfully loaded!",
            buttonsError: "❌ Error displaying buttons.",
            oldPositionWarning: "⚠️ The saved reading position is older than 24 hours. Continue searching?",
            searchPopup: "🔍 Searching for position: @{authorHandler} - Tweet: {tweetId}... Press Space to cancel.",
            searchNoPosition: "❌ No reading position available.",
            searchScrollPrompt: "ℹ️ Please scroll or click the magnifier.",
            tweetIdNotFound: "❌ Tweet ID not found, using closest post by timestamp.",
            postDeletedFallback: "ℹ️ Post possibly deleted - using closest post by timestamp.",
            newPostsDetectionDelayed: "ℹ️ No new posts detected after checking. Please refresh or scroll to load them.",
            autoDownloadToggled: "ℹ️ Auto-download {status}.",
            enabled: "enabled",
            disabled: "disabled",
            fallbackSearchCancelled: "ℹ️ Fallback search cancelled.",
            redirectToHome: "ℹ️ Redirecting to home to search for reading position.",
            saveError: "❌ Save failed after retries. Data may be lost.",
            approximatePosition: "ℹ️ Approximate reading position restored ({strategy}).",
            feedStronglyChanged: "ℹ️ Feed changed significantly — landed at best guess.",
            mediaDownloadNoMedia: "❌ No media found for this post.",
            mediaDownloadFailed: "❌ Media download failed.",
            mediaDownloadSuccess: "✅ Downloaded: {fileName}",
            mediaDownloadInProgress: "Downloading media…"
        },
        de: {
            noValidPosition: "❌ Keine gültige Leseposition zum Downloaden.",
            alreadyDownloaded: "ℹ️ Diese Leseposition wurde bereits heruntergeladen.",
            downloadSuccess: "✅ Leseposition als {fileName} heruntergeladen.",
            downloadFailed: "❌ Download fehlgeschlagen. Leseposition wurde in die Zwischenablage kopiert. Bitte manuell in eine .json-Datei einfügen.",
            downloadClipboardFailed: "❌ Download und Kopieren fehlgeschlagen. Bitte manuell speichern.",
            noPositionFound: "ℹ️ Scrolle, um eine Leseposition zu setzen.",
            scriptError: "❌ Fehler beim Laden des Skripts.",
            invalidPosition: "❌ Ungültige Leseposition.",
            fileSelectError: "❌ Bitte wähle eine JSON-Datei aus.",
            fileReadError: "❌ Fehler beim Lesen der Datei.",
            fileDialogError: "❌ Fehler beim Öffnen des Datei-Dialogs.",
            fileLoadSuccess: "✅ Leseposition erfolgreich geladen!",
            buttonsError: "❌ Fehler beim Anzeigen der Buttons.",
            oldPositionWarning: "⚠️ Die gespeicherte Leseposition ist älter als 24 Stunden. Suche fortsetzen?",
            searchPopup: "🔍 Suche läuft für Position: @{authorHandler} - Tweet: {tweetId}... Drücke Space zum Abbrechen.",
            searchNoPosition: "❌ Keine Leseposition vorhanden.",
            searchScrollPrompt: "ℹ️ Bitte scrollen oder Lupe klicken.",
            tweetIdNotFound: "❌ Tweet-ID nicht gefunden, verwende zeitlich nächsten Post.",
            postDeletedFallback: "ℹ️ Beitrag möglicherweise gelöscht - verwende zeitlich nächsten Post.",
            newPostsDetectionDelayed: "ℹ️ Keine neuen Beiträge nach Prüfung erkannt. Bitte die Seite aktualisieren oder scrollen, um sie zu laden.",
            autoDownloadToggled: "ℹ️ Automatischer Download {status}.",
            enabled: "aktiviert",
            disabled: "deaktiviert",
            fallbackSearchCancelled: "ℹ️ Fallback-Suche abgebrochen.",
            redirectToHome: "ℹ️ Weiterleitung zur Startseite, um die Leseposition zu suchen.",
            saveError: "❌ Speichern fehlgeschlagen nach Wiederholungen. Daten könnten verloren gehen.",
            approximatePosition: "ℹ️ Ungefähre Leseposition wiederhergestellt ({strategy}).",
            feedStronglyChanged: "ℹ️ Feed stark verändert — beste Schätzung gesetzt.",
            mediaDownloadNoMedia: "❌ Keine Medien für diesen Post gefunden.",
            mediaDownloadFailed: "❌ Medien-Download fehlgeschlagen.",
            mediaDownloadSuccess: "✅ Heruntergeladen: {fileName}",
            mediaDownloadInProgress: "Medien werden heruntergeladen…"
        },

        es: {
            noValidPosition: "❌ No hay posición de lectura válida para descargar.",
            alreadyDownloaded: "ℹ️ Esta posición de lectura ya ha sido descargada.",
            downloadSuccess: "✅ Posición de lectura descargada como {fileName}.",
            downloadFailed: "❌ Falló la descarga. La posición de lectura se copió al portapapeles. Pégala manualmente en un archivo .json.",
            downloadClipboardFailed: "❌ Falló la descarga y la copia al portapapeles. Por favor, guarda manualmente.",
            noPositionFound: "ℹ️ Desplázate para establecer una posición de lectura.",
            scriptError: "❌ Error al cargar el script.",
            invalidPosition: "❌ Posición de lectura no válida.",
            fileSelectError: "❌ Por favor, selecciona un archivo JSON.",
            fileReadError: "❌ Error al leer el archivo.",
            fileDialogError: "❌ Error al abrir el diálogo de archivo.",
            fileLoadSuccess: "✅ ¡Posición de lectura cargada con éxito!",
            buttonsError: "❌ Error al mostrar los botones.",
            searchPopup: "🔍 Buscando posición: @{authorHandler} - Tweet: {tweetId}... Presiona ESPACIO para cancelar.",
            searchNoPosition: "❌ No hay posición de lectura disponible.",
            searchScrollPrompt: "ℹ️ Por favor, desplázate o haz clic en la lupa.",
            tweetIdNotFound: "❌ ID de Tweet no encontrado, usando el post más cercano por timestamp.",
            postDeletedFallback: "ℹ️ Publicación posiblemente eliminada - usando el post más cercano por timestamp.",
            newPostsDetectionDelayed: "ℹ️ No se detectaron nuevas publicaciones después de verificar. Por favor, actualiza o desplázate para cargarlas.",
            autoDownloadToggled: "ℹ️ Descarga automática {status}.",
            enabled: "activada",
            disabled: "desactivada",
            fallbackSearchCancelled: "ℹ️ Búsqueda fallback cancelada.",
            saveError: "❌ Falló el guardado después de reintentos. Los datos podrían perderse."
        },

        fr: {
            noValidPosition: "❌ Aucune position de lecture valide à télécharger.",
            alreadyDownloaded: "ℹ️ Cette position de lecture a déjà été téléchargée.",
            downloadSuccess: "✅ Position de lecture téléchargée sous {fileName}.",
            downloadFailed: "❌ Échec du téléchargement. Position de lecture copiée dans le presse-papiers. Veuillez la coller manuellement dans un fichier .json.",
            downloadClipboardFailed: "❌ Échec du téléchargement et de la copie dans le presse-papiers. Veuillez sauvegarder manuellement.",
            noPositionFound: "ℹ️ Faites défiler pour définir une position de lecture.",
            scriptError: "❌ Erreur lors du chargement du script.",
            invalidPosition: "❌ Position de lecture invalide.",
            fileSelectError: "❌ Veuillez sélectionner un fichier JSON.",
            fileReadError: "❌ Erreur lors de la lecture du fichier.",
            fileDialogError: "❌ Erreur lors de l'ouverture de la boîte de dialogue.",
            fileLoadSuccess: "✅ Position de lecture chargée avec succès !",
            buttonsError: "❌ Erreur lors de l'affichage des boutons.",
            searchPopup: "🔍 Recherche en cours pour position: @{authorHandler} - Tweet: {tweetId}... Appuyez sur ESPACE pour annuler.",
            searchNoPosition: "❌ Aucune position de lecture disponible.",
            searchScrollPrompt: "ℹ️ Veuillez faire défiler ou cliquer sur la loupe.",
            tweetIdNotFound: "❌ ID de Tweet non trouvé, utilisant le post le plus proche par timestamp.",
            postDeletedFallback: "ℹ️ Post éventuellement supprimé - utilisant le post le plus proche par timestamp.",
            newPostsDetectionDelayed: "ℹ️ Aucun nouveau post détecté après vérification. Veuillez actualiser ou défiler pour les charger.",
            autoDownloadToggled: "ℹ️ Téléchargement automatique {status}.",
            enabled: "activé",
            disabled: "désactivé",
            fallbackSearchCancelled: "ℹ️ Recherche de fallback annulée.",
            saveError: "❌ Échec de la sauvegarde après réessais. Les données pourraient être perdues."
        },
        'zh-CN': {
            noValidPosition: "❌ 没有有效的阅读位置可以下载。",
            alreadyDownloaded: "ℹ️ 此阅读位置已下载。",
            downloadSuccess: "✅ 阅读位置已下载为 {fileName}。",
            downloadFailed: "❌ 下载失败。阅读位置已复制到剪贴板。请手动粘贴到 .json 文件中。",
            downloadClipboardFailed: "❌ 下载和剪贴板复制失败。请手动保存。",
            noPositionFound: "ℹ️ 滚动以设置阅读位置。",
            scriptError: "❌ 加载脚本时出错。",
            invalidPosition: "❌ 无效的阅读位置。",
            fileSelectError: "❌ 请选择一个 JSON 文件。",
            fileReadError: "❌ 读取文件时出错。",
            fileDialogError: "❌ 打开文件对话框时出错。",
            fileLoadSuccess: "✅ 阅读位置加载成功！",
            buttonsError: "❌ 显示按钮时出错。",
            searchPopup: "🔍 正在搜索位置: @{authorHandler} - Tweet: {tweetId}... 按空格键取消。",
            searchNoPosition: "❌ 没有可用的阅读位置。",
            searchScrollPrompt: "ℹ️ 请滚动或点击放大镜。",
            tweetIdNotFound: "❌ 未找到推文ID，使用时间戳最近的帖子。",
            postDeletedFallback: "ℹ️ 帖子可能已删除 - 使用时间戳最近的帖子。",
            newPostsDetectionDelayed: "ℹ️ 检查后未检测到新帖子。请刷新或滚动以加载它们。",
            autoDownloadToggled: "ℹ️ 自动下载 {status}。",
            enabled: "启用",
            disabled: "禁用",
            fallbackSearchCancelled: "ℹ️ Fallback搜索已取消。",
            saveError: "❌ 重试后保存失败。数据可能丢失。"
        },
        ru: {
            noValidPosition: "❌ Нет действительной позиции чтения для загрузки.",
            alreadyDownloaded: "ℹ️ Эта позиция чтения уже была загружена.",
            downloadSuccess: "✅ Позиция чтения загружена как {fileName}.",
            downloadFailed: "❌ Не удалось выполнить загрузку. Позиция чтения скопирована в буфер обмена. Пожалуйста, вставьте вручную в файл .json.",
            downloadClipboardFailed: "❌ Не удалось выполнить загрузку и копирование в буфер обмена. Пожалуйста, сохраните вручную.",
            noPositionFound: "ℹ️ Прокрутите, чтобы установить позицию чтения.",
            scriptError: "❌ Ошибка при загрузке скрипта.",
            invalidPosition: "❌ Недействительная позиция чтения.",
            fileSelectError: "❌ Пожалуйста, выберите файл JSON.",
            fileReadError: "❌ Ошибка при чтении файла.",
            fileDialogError: "❌ Ошибка при открытии диалогового окна.",
            fileLoadSuccess: "✅ Позиция чтения успешно загружена!",
            buttonsError: "❌ Ошибка при отображении кнопок.",
            searchPopup: "🔍 Поиск позиции: @{authorHandler} - Tweet: {tweetId}... Нажмите ПРОБЕЛ для отмены.",
            searchNoPosition: "❌ Позиция чтения недоступна.",
            searchScrollPrompt: "ℹ️ Прокрутите или нажмите на лупу.",
            tweetIdNotFound: "❌ ID твита не найден, использование ближайшего поста по временной метке.",
            postDeletedFallback: "ℹ️ Пост возможно удален - использование ближайшего поста по временной метке.",
            newPostsDetectionDelayed: "ℹ️ После проверки новых постов не обнаружено. Пожалуйста, обновите или прокрутите, чтобы загрузить их.",
            autoDownloadToggled: "ℹ️ Автоматическая загрузка {status}.",
            enabled: "включено",
            disabled: "отключено",
            fallbackSearchCancelled: "ℹ️ Fallback-поиск отменен.",
            saveError: "❌ Сохранение не удалось после повторных попыток. Данные могут быть потеряны."
        },
        ja: {
            noValidPosition: "❌ ダウンロードする有効な読み取り位置がありません。",
            alreadyDownloaded: "ℹ️ この読み取り位置はすでにダウンロードされています。",
            downloadSuccess: "✅ 読み取り位置が{fileName}としてダウンロードされました。",
            downloadFailed: "❌ ダウンロードに失敗しました。読み取り位置がクリップボードにコピーされました。手動で.jsonファイルに貼り付けてください。",
            downloadClipboardFailed: "❌ ダウンロードおよびクリップボードへのコピーに失敗しました。手動で保存してください。",
            noPositionFound: "ℹ️ スクロールして読み取り位置を設定してください。",
            scriptError: "❌ スクリプトの読み込み中にエラーが発生しました。",
            invalidPosition: "❌ 無効な読み取り位置です。",
            fileSelectError: "❌ JSONファイルを選択してください。",
            fileReadError: "❌ ファイルの読み込み中にエラーが発生しました。",
            fileDialogError: "❌ ファイルダイアログのオープン中にエラーが発生しました。",
            fileLoadSuccess: "✅ 読み取り位置が正常にロードされました！",
            buttonsError: "❌ ボタンの表示中にエラーが発生しました。",
            searchPopup: "🔍 位置を検索中: @{authorHandler} - Tweet: {tweetId}... スペースキーを押してキャンセル。",
            searchNoPosition: "❌ 読み取り位置がありません。",
            searchScrollPrompt: "ℹ️ スクロールするか、虫眼鏡をクリックしてください。",
            tweetIdNotFound: "❌ ツイートIDが見つかりません。タイムスタンプに最も近い投稿を使用します。",
            postDeletedFallback: "ℹ️ 投稿が削除された可能性 - タイムスタンプに最も近い投稿を使用。",
            newPostsDetectionDelayed: "ℹ️ チェック後、新しい投稿は検出されませんでした。ページを更新するかスクロールしてロードしてください。",
            autoDownloadToggled: "ℹ️ 自動ダウンロード {status}。",
            enabled: "有効",
            disabled: "無効",
            fallbackSearchCancelled: "ℹ️ Fallback検索がキャンセルされました。",
            saveError: "❌ リトライ後、保存に失敗しました。データが失われる可能性があります。"
        },
                'pt-BR': {
            noValidPosition: "❌ Nenhuma posição de leitura válida para download.",
            alreadyDownloaded: "ℹ️ Esta posição de leitura já foi baixada.",
            downloadSuccess: "✅ Posição de leitura baixada como {fileName}.",
            downloadFailed: "❌ Falha no download. Posição de leitura copiada para a área de transferência. Cole manualmente em um arquivo .json.",
            downloadClipboardFailed: "❌ Falha no download e na cópia para a área de transferência. Por favor, salve manualmente.",
            noPositionFound: "ℹ️ Role para definir uma posição de leitura.",
            scriptError: "❌ Erro ao carregar o script.",
            invalidPosition: "❌ Posição de leitura inválida.",
            fileSelectError: "❌ Por favor, selecione um arquivo JSON.",
            fileReadError: "❌ Erro ao ler o arquivo.",
            fileDialogError: "❌ Erro ao abrir o diálogo de arquivo.",
            fileLoadSuccess: "✅ Posição de leitura carregada com sucesso!",
            buttonsError: "❌ Erro ao exibir os botões.",
            searchPopup: "🔍 Pesquisando posição: @{authorHandler} - Tweet: {tweetId}... Pressione ESPAÇO para cancelar.",
            searchNoPosition: "❌ Nenhuma posição de leitura disponível.",
            searchScrollPrompt: "ℹ️ Role ou clique na lupa.",
            tweetIdNotFound: "❌ ID do Tweet não encontrado, usando o post mais próximo por timestamp.",
            postDeletedFallback: "ℹ️ Post possivelmente deletado - usando o post mais próximo por timestamp.",
            newPostsDetectionDelayed: "ℹ️ Nenhum novo post detectado após verificação. Por favor, atualize ou role para carregá-los.",
            autoDownloadToggled: "ℹ️ Download automático {status}.",
            enabled: "ativado",
            disabled: "desativado",
            fallbackSearchCancelled: "ℹ️ Pesquisa fallback cancelada.",
            saveError: "❌ Falha no salvamento após tentativas. Os dados podem ser perdidos."
        },
        hi: {
            noValidPosition: "❌ डाउनलोड करने के लिए कोई वैध पढ़ने की स्थिति नहीं है।",
            alreadyDownloaded: "ℹ️ यह पढ़ने की स्थिति पहले ही डाउनलोड की जा चुकी है।",
            downloadSuccess: "✅ पढ़ने की स्थिति {fileName} के रूप में डाउनलोड की गई।",
            downloadFailed: "❌ डाउनलोड विफल। पढ़ने की स्थिति क्लिपबोर्ड में कॉपी की गई है। कृपया इसे मैन्युअल रूप से .json फ़ाइल में पेस्ट करें।",
            downloadClipboardFailed: "❌ डाउनलोड और क्लिपबोर्ड कॉपी विफल। कृपया मैन्युअल रूप से सहेजें।",
            noPositionFound: "ℹ️ पढ़ने की स्थिति सेट करने के लिए स्क्रॉल करें।",
            scriptError: "❌ स्क्रिप्ट लोड करने में त्रुटि।",
            invalidPosition: "❌ अमान्य पढ़ने की स्थिति।",
            fileSelectError: "❌ कृपया एक JSON फ़ाइल चुनें।",
            fileReadError: "❌ फ़ाइल पढ़ने में त्रुटि।",
            fileDialogError: "❌ फ़ाइल डायलॉग खोलने में त्रुटि।",
            fileLoadSuccess: "✅ पढ़ने की स्थिति सफलतापूर्वक लोड की गई!",
            buttonsError: "❌ बटनों को प्रदर्शित करने में त्रुटि।",
            searchPopup: "🔍 खोज चल रही है स्थिति के लिए: @{authorHandler} - Tweet: {tweetId}... रद्द करने के लिए स्पेस दबाएं।",
            searchNoPosition: "❌ कोई पढ़ने की स्थिति उपलब्ध नहीं है।",
            searchScrollPrompt: "ℹ️ कृपया स्क्रॉल करें या मैग्नीफायर पर क्लिक करें।",
            tweetIdNotFound: "❌ ट्वीट ID नहीं मिला, टाइमस्टैम्प के सबसे नजदीकी पोस्ट का उपयोग कर रहा है।",
            postDeletedFallback: "ℹ️ पोस्ट संभवतः हटा दी गई - टाइमस्टैम्प के सबसे नजदीकी पोस्ट का उपयोग कर रहा है।",
            newPostsDetectionDelayed: "ℹ️ जाँच के बाद कोई नए पोस्ट नहीं पाए गए। कृपया पेज रिफ्रेश करें या स्क्रॉल करें ताकि उन्हें लोड किया जा सके।",
            autoDownloadToggled: "ℹ️ स्वचालित डाउनलोड {status}।",
            enabled: "सक्षम",
            disabled: "अक्षम",
            fallbackSearchCancelled: "ℹ️ Fallback खोज रद्द की गई।",
            saveError: "❌ पुन: प्रयासों के बाद सहेजने में विफल। डेटा खो सकता है।"
        },
        ar: {
            noValidPosition: "❌ لا توجد مواضع قراءة صالحة للتحميل.",
            alreadyDownloaded: "ℹ️ تم تحميل موضع القراءة هذا بالفعل.",
            downloadSuccess: "✅ تم تحميل موضع القراءة باسم {fileName}.",
            downloadFailed: "❌ فشل التحميل. تم نسخ موضع القراءة إلى الحافظة. يرجى لصقه يدويًا في ملف .json.",
            downloadClipboardFailed: "❌ فشل التحميل والنسخ إلى الحافظة. يرجى الحفظ يدويًا.",
            noPositionFound: "ℹ️ قم بالتمرير لتحديد موضع القراءة.",
            scriptError: "❌ خطأ أثناء تحميل السكربت.",
            invalidPosition: "❌ موضع قراءة غير صالح.",
            fileSelectError: "❌ يرجى اختيار ملف JSON.",
            fileReadError: "❌ خطأ أثناء قراءة الملف.",
            fileDialogError: "❌ خطأ أثناء فتح حوار الملف.",
            fileLoadSuccess: "✅ تم تحميل موضع القراءة بنجاح!",
            buttonsError: "❌ خطأ أثناء عرض الأزرار.",
            searchPopup: "🔍 جارٍ البحث عن الموقع: @{authorHandler} - Tweet: {tweetId}... اضغط على مفتاح المسافة للإلغاء.",
            searchNoPosition: "❌ لا يوجد موضع قراءة متاح.",
            searchScrollPrompt: "ℹ️ يرجى التمرير أو النقر على العدسة المكبرة.",
            tweetIdNotFound: "❌ معرف التغريدة غير موجود، باستخدام المنشور الأقرب حسب الطابع الزمني.",
            postDeletedFallback: "ℹ️ المنشور ربما محذوف - باستخدام المنشور الأقرب حسب الطابع الزمني.",
            newPostsDetectionDelayed: "ℹ️ لم يتم الكشف عن مشاركات جديدة بعد التحقق. يرجى تحديث الصفحة أو التمرير لتحميلها.",
            autoDownloadToggled: "ℹ️ التحميل التلقائي {status}.",
            enabled: "مفعل",
            disabled: "معطل",
            fallbackSearchCancelled: "ℹ️ بحث Fallback ملغى.",
            saveError: "❌ فشل الحفظ بعد المحاولات. قد تفقد البيانات."
        },
        it: {
            noValidPosition: "❌ Nessuna posizione di lettura valida da scaricare.",
            alreadyDownloaded: "ℹ️ Questa posizione di lettura è già stata scaricata.",
            downloadSuccess: "✅ Posizione di lettura scaricata come {fileName}.",
            downloadFailed: "❌ Download fallito. Posizione di lettura copiata negli appunti. Incollala manualmente in un file .json.",
            downloadClipboardFailed: "❌ Download e copia negli appunti falliti. Salva manualmente.",
            noPositionFound: "ℹ️ Scorri per impostare una posizione di lettura.",
            scriptError: "❌ Errore durante il caricamento dello script.",
            invalidPosition: "❌ Posizione di lettura non valida.",
            fileSelectError: "❌ Seleziona un file JSON.",
            fileReadError: "❌ Errore durante la lettura del file.",
            fileDialogError: "❌ Errore durante l'apertura della finestra di dialogo.",
            fileLoadSuccess: "✅ Posizione di lettura caricata con successo!",
            buttonsError: "❌ Errore durante la visualizzazione dei pulsanti.",
            searchPopup: "🔍 Ricerca in corso per posizione: @{authorHandler} - Tweet: {tweetId}... Premi SPAZIO per annullare.",
            searchNoPosition: "❌ Nessuna posizione di lettura disponibile.",
            searchScrollPrompt: "ℹ️ Scorri o fai clic sulla lente d'ingrandimento.",
            tweetIdNotFound: "❌ ID del Tweet non trovato, utilizzo del post più vicino per timestamp.",
            postDeletedFallback: "ℹ️ Post possibilmente eliminato - utilizzo del post più vicino per timestamp.",
            newPostsDetectionDelayed: "ℹ️ Nessun nuovo post rilevato dopo il controllo. Per favore aggiorna o scorri per caricarli.",
            autoDownloadToggled: "ℹ️ Download automatico {status}.",
            enabled: "abilitato",
            disabled: "disabilitato",
            fallbackSearchCancelled: "ℹ️ Ricerca fallback annullata.",
            saveError: "❌ Salvataggio fallito dopo i tentativi. I dati potrebbero essere persi."
        },
        ko: {
            noValidPosition: "❌ 다운로드할 유효한 읽기 위치가 없습니다.",
            alreadyDownloaded: "ℹ️ 이 읽기 위치는 이미 다운로드되었습니다.",
            downloadSuccess: "✅ 읽기 위치가 {fileName}으로 다운로드되었습니다.",
            downloadFailed: "❌ 다운로드 실패. 읽기 위치가 클립보드에 복사되었습니다. .json 파일에 수동으로 붙여넣으세요.",
            downloadClipboardFailed: "❌ 다운로드 및 클립보드 복사 실패. 수동으로 저장하세요.",
            noPositionFound: "ℹ️ 읽기 위치를 설정하려면 스크롤하세요.",
            scriptError: "❌ 스크립트 로드 중 오류가 발생했습니다.",
            invalidPosition: "❌ 유효하지 않은 읽기 위치입니다.",
            fileSelectError: "❌ JSON 파일을 선택하세요.",
            fileReadError: "❌ 파일 읽기 중 오류가 발생했습니다.",
            fileDialogError: "❌ 파일 대화 상자를 여는 중 오류가 발생했습니다.",
            fileLoadSuccess: "✅ 읽기 위치가 성공적으로 로드되었습니다!",
            buttonsError: "❌ 버튼 표시 중 오류가 발생했습니다.",
            searchPopup: "🔍 위치 검색 중: @{authorHandler} - Tweet: {tweetId}... 취소하려면 스페이스바를 누르세요.",
            searchNoPosition: "❌ 사용 가능한 읽기 위치가 없습니다.",
            searchScrollPrompt: "ℹ️ 스크롤하거나 돋보기를 클릭하세요.",
            tweetIdNotFound: "❌ 트윗 ID를 찾을 수 없습니다. 타임스탬프에 가장 가까운 게시물을 사용합니다.",
            postDeletedFallback: "ℹ️ 게시물이 삭제되었을 수 있음 - 타임스탬프에 가장 가까운 게시물을 사용.",
            newPostsDetectionDelayed: "ℹ️ 확인 후 새로운 게시물이 감지되지 않았습니다. 페이지를 새로 고침하거나 스크롤하여 로드하세요.",
            autoDownloadToggled: "ℹ️ 자동 다운로드 {status}。",
            enabled: "활성화됨",
            disabled: "비활성화됨",
            fallbackSearchCancelled: "ℹ️ Fallback 검색이 취소되었습니다。",
            saveError: "❌ 재시도 후 저장 실패. 데이터가 손실될 수 있습니다."
        }
    };

        function getUserLanguage() {
        const lang = (navigator.language || navigator.languages[0] || 'en').toLowerCase();
        const langCode = lang.split('-')[0];
        return Object.keys(translations).find(key => key.toLowerCase().startsWith(langCode)) || 'en';
    }

    function getTranslatedMessage(key, lang, params = {}) {
        const translation = translations[lang] || translations['en'];
        let message = translation[key] || translations['en'][key] || key;
        Object.keys(params).forEach(param => {
            message = message.replace(`{${param}}`, params[param]);
        });
        return message;
    }

    function getSelectorFallback(element, selectors) {
        for (const selector of selectors) {
            const found = element.querySelector(selector);
            if (found) return found;
        }
        return null;
    }

    function debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    async function getCurrentUserHandle() {

    return new Promise((resolve) => {
        const tryFromNav = () => {
            const navLink = document.querySelector("a[data-testid='AppTabBar_Profile_Link'][href^='/']");
            if (navLink) {
                const href = navLink.getAttribute('href');
                const match = href.match(/^\/([^/]+)/);
                if (match && match[1] && !['i', 'home', 'explore', 'messages', 'notifications'].includes(match[1])) {
                    return match[1];
                }
            }
            return null;
        };

        const tryFromLocalStorage = () => {
            const storedHandle = localStorage.getItem('currentUserHandle');
            if (storedHandle && !['i', 'home', 'explore', 'messages', 'notifications'].includes(storedHandle)) {
                return storedHandle;
            }
            return 'unknown';
        };

        const saveHandle = (handle) => {
            if (handle && handle !== 'unknown' && !['i', 'home', 'explore', 'messages', 'notifications'].includes(handle)) {
                localStorage.setItem('currentUserHandle', handle);
            }
        };

        let handle = tryFromNav();
        if (handle && /^[a-zA-Z0-9_]{1,15}$/.test(handle)) {
            saveHandle(handle);
            resolve(handle);
            return;
        }

        const navContainer = document.querySelector("nav[role='navigation']") ||
                            document.querySelector('header') ||
                            document.documentElement;

        const observer = new MutationObserver(() => {
            handle = tryFromNav();
            if (handle && /^[a-zA-Z0-9_]{1,15}$/.test(handle)) {
                saveHandle(handle);
                observer.disconnect();
                resolve(handle);
            }
        });

        observer.observe(navContainer, { childList: true, subtree: true });

        setTimeout(() => {
            if (!handle || !/^[a-zA-Z0-9_]{1,15}$/.test(handle)) {
                observer.disconnect();
                handle = tryFromLocalStorage();
                if (!/^[a-zA-Z0-9_]{1,15}$/.test(handle)) {
                    handle = 'unknown';
                }
                log('Init', 'Warning: Benutzerhandle konnte nicht ermittelt werden, Fallback auf:', handle);
                resolve(handle);
            }
        }, 3000);
    });
}

    const DEBUG = true;

    // Hinweis (2026-05-30 nach Punkt 2): Alle direkten console.log / if(DEBUG) console.log wurden
    // auf das zentrale log('Kategorie', ...) + debugLog('Kategorie', ...) System umgestellt.
    // Repost-Logs sind bewusst auf DEBUG-only reduziert (kein Spam beim normalen Scrollen).
    // Kategorien: Search, Fallback, Position, Save, Load, Restore, NewPosts, Repost, Init, UI, Highlight, Cache, Error

    /**
     * Logging Helpers (Vereinheitlicht - 30.05.2026)
     * 
     * log(category, ...args)     → Wird immer ausgegeben (wichtige User-Informationen)
     * debugLog(category, ...args) → Nur bei DEBUG=true (detaillierte Entwickler-Infos)
     */

    function log(category, ...args) {
        console.log(`[${category}]`, ...args);
    }

    function debugLog(category, ...args) {
        if (DEBUG) {
            console.log(`[${category}]`, ...args);
        }
    }

    // ============================================================
    // Diagnostic Logging — strukturierte Logs für Fehleranalyse (AI + User)
    //
    // Severity: info (console.log) | warn/anomaly (console.warn) | error (console.error)
    // Codes: FLOW_*, BOOKMARK_*, RESTORE_*, SEARCH_*, GUARD_*
    // Bei Problemen: nach [Diag:ERROR] oder [Diag:WARN] filtern, dann [Diag:SESSION]
    // ============================================================

    const DIAG = {
        enabled: true,
        flowCounter: 0,
        activeFlow: null,
        sessionAnomalies: [],
        maxSessionAnomalies: 40,
    };

    function diagBookmark(bm) {
        if (!bm?.tweetId) return null;
        return {
            id: String(bm.tweetId),
            author: bm.authorHandler || '?',
            repost: !!bm.isRepost,
            label: `@${bm.authorHandler || '?'} ${bm.tweetId}${bm.isRepost ? ' (Repost)' : ''}`,
        };
    }

    function diagSnapshot(extra = {}) {
        return {
            scrollY: Math.round(window.scrollY),
            articles: document.querySelectorAll('article').length,
            bookmark: diagBookmark(lastReadPost)?.label || '(keins)',
            flags: {
                manualSearch: searchControl.manualSearchActive,
                newPostsRestore: searchControl.newPostsRestoreActive,
                isSearching: searchControl.isSearching,
                isFallback: searchControl.isFallbackSearching,
            },
            activeFlow: DIAG.activeFlow?.name || null,
            flowId: DIAG.activeFlow?.id || null,
            timelineMap: timelineMapOrderedKeys.length,
            ...extra,
        };
    }

    function diagPush(code, severity, message, context = {}) {
        if (!DIAG.enabled) return;
        const entry = {
            code,
            severity,
            message,
            flow: DIAG.activeFlow?.name || null,
            flowId: DIAG.activeFlow?.id || null,
            ...context,
        };
        if (severity !== 'info') {
            DIAG.sessionAnomalies.push(entry);
            if (DIAG.sessionAnomalies.length > DIAG.maxSessionAnomalies) {
                DIAG.sessionAnomalies.shift();
            }
        }
        const prefix = `[Diag:${severity.toUpperCase()}]`;
        const line = { code, msg: message, ...context };
        if (severity === 'error') {
            console.error(prefix, line);
        } else if (severity === 'warn' || severity === 'anomaly') {
            console.warn(prefix, line);
        } else {
            console.log(prefix, line);
        }
    }

    function diagBeginFlow(name, context = {}) {
        DIAG.flowCounter += 1;
        DIAG.activeFlow = { id: DIAG.flowCounter, name, started: Date.now() };
        diagPush('FLOW_START', 'info', `▶ ${name} #${DIAG.flowCounter}`, {
            snapshot: diagSnapshot(context),
        });
        return DIAG.flowCounter;
    }

    function diagEndFlow(outcome, code, message, context = {}) {
        const flow = DIAG.activeFlow;
        if (!flow) return;
        const ms = Date.now() - flow.started;
        const severity = outcome === 'ok' ? 'info' : outcome === 'warn' ? 'warn' : 'error';
        const icon = outcome === 'ok' ? '✓' : outcome === 'warn' ? '⚠' : '✗';
        diagPush(code, severity, `${icon} ${flow.name} #${flow.id} (${ms}ms): ${message}`, {
            snapshot: diagSnapshot(context),
            durationMs: ms,
        });
        if (severity !== 'info') {
            const recent = DIAG.sessionAnomalies
                .filter(a => a.severity === 'warn' || a.severity === 'error' || a.severity === 'anomaly')
                .slice(-6)
                .map(a => `${a.code}: ${a.message}`);
            if (recent.length > 0) {
                console.warn('[Diag:SESSION] Letzte Anomalien:', recent);
            }
        }
        DIAG.activeFlow = null;
    }

    function diagBlocked(code, message, extra = {}) {
        diagPush(code, 'warn', `BLOCKED — ${message}`, { snapshot: diagSnapshot(extra) });
    }

    function diagVerifyLanding(expectedBookmark, resolved, source) {
        if (!expectedBookmark?.tweetId || !resolved?.post?.tweetId) return true;
        const idMatch = String(expectedBookmark.tweetId) === String(resolved.post.tweetId);
        const authorMatch = expectedBookmark.authorHandler === resolved.post.authorHandler;
        const repostMatch = !!expectedBookmark.isRepost === !!resolved.post.isRepost;
        if (idMatch && authorMatch && repostMatch) {
            diagPush('LANDING_OK', 'info', `Landing korrekt (${source})`, {
                expected: diagBookmark(expectedBookmark),
                strategy: resolved.strategy,
                confidence: resolved.confidence,
            });
            return true;
        }
        diagPush('RESTORE_TARGET_MISMATCH', 'error',
            `Landing auf falschem Post (${source}) — erwartet vs. tatsächlich`, {
                expected: diagBookmark(expectedBookmark),
                actual: diagBookmark(resolved.post),
                strategy: resolved.strategy,
                confidence: resolved.confidence,
                idMatch,
                authorMatch,
                repostMatch,
                snapshot: diagSnapshot(),
            });
        return false;
    }

    // ============================================================
    // Globale State-Variablen (Punkt 4 - gruppiert mit kleinen Objekten)
    //
    // Vorteil: Logisch zusammengehörige Variablen sind jetzt gebündelt.
    // Kein monolithisches "state"-Objekt (wurde bewusst vermieden).
    //
    // Übersicht:
    //   scrollState         → Alles rund um Scrollen + Suchphasen
    //   searchControl       → Steuerflags für Suche (isSearching etc.)
    //   suppressionState    → Grace-Timer nach Restore/New Posts (Punkt 3)
    //   lastReadPost        → Die eigentliche Leseposition (bleibt top-level)
    //   lastHighlightedPost → Für den glühenden Rand
    //   isScriptActivated   → Ob das Skript aktiv ist (Buttons etc.)
    //   downloadedPosts / postCache → Persistenz & Cache
    // ============================================================

    // === Scroll & Search State ===
    const scrollState = {
        isSlowScrollMode: false,
        largeScrollCount: 0,
        maxLargeScrolls: 12,   // Mehr große Sprünge erlauben, bevor wir in den präzisen (langsamen) Modus wechseln. Wichtig für weit entfernte Lesestellen.
        searchDirection: 'down',
        scrollCyclePhase: 0,
        hasCompletedCycle: false,
        stagnantScrollCount: 0,
        lastScrollHeight: 0,
        totalLoadedPosts: 0,

        // Neue Regel (User-Wunsch): Reposts dürfen nur als Lesestelle gespeichert werden,
        // wenn der User vorher aktiv nach oben gescrollt hat.
        hasScrolledUp: false,
        programmaticScrollEndedAt: 0,
        lastMapScrollY: 0,
        lastMapScrollDirection: 'neutral',
        mapSnapshotAtSearchStart: null,
        mapSnapshotOrderedKeys: null,
        mapSnapshotTweetIdToIdx: null,
        mapSnapshotBookmarkKey: null,
        mapSnapshotBookmarkIdx: -1,
        searchCoarseDirection: null,
        slowScrollLockedDirection: null,
        slowScrollFineAttempts: 0,
        searchTopRetryDone: false,
    };

    // === Search Control Flags ===
    const searchControl = {
        isSearching: false,
        isFallbackSearching: false,
        isSearchCancelled: false,
        isAutoScrolling: false,
        manualSearchActive: false,
        newPostsRestoreActive: false,
        lastManualSearchEndedAt: 0,
    };

    const newPostsState = {
        autoLoadPaused: false,
        lastPausedLogAt: 0,
        lastLesestelleLogKey: null,
        lastRestoreCompletedAt: 0,
    };

    function snapshotReadingBookmark(bookmark = lastReadPost) {
        if (!bookmark?.tweetId || !bookmark?.authorHandler || !bookmark?.timestamp) {
            return null;
        }
        return {
            tweetId: bookmark.tweetId,
            authorHandler: bookmark.authorHandler,
            timestamp: bookmark.timestamp,
            isRepost: !!bookmark.isRepost,
            readAt: bookmark.readAt || bookmark.timestamp,
            account: bookmark.account,
            context: bookmark.context
        };
    }

    function beginManualSearchSession() {
        searchControl.manualSearchActive = true;
        searchControl.isSearching = true;
        searchControl.isSearchCancelled = false;
    }

    function endManualSearchSession(clearSearching = true) {
        searchControl.manualSearchActive = false;
        searchControl.lastManualSearchEndedAt = Date.now();
        if (clearSearching) {
            searchControl.isSearching = false;
        }
        flushDeferredTimelineMapUpdate('search-end');
    }

    function isPostLupeProtectionActive() {
        return suppressionState.blockNewerAdoptionUntil > Date.now() ||
            (searchControl.lastManualSearchEndedAt > 0 &&
                Date.now() - searchControl.lastManualSearchEndedAt < CONFIG.POST_LUPE_NEWER_BLOCK_MS);
    }

    // === Suppression / Restore Protection (Punkt 3) ===
    const suppressionState = {
        until: 0,
        pastTweetId: null,
        blockNewerAdoptionUntil: 0,
    };

    // === Core Position & Highlight ===
    let lastReadPost = null;
    let lastHighlightedPost = null;
    let highlightRetryGeneration = 0;

    function invalidateHighlightRetries() {
        highlightRetryGeneration++;
    }

    function isScrollAnchorStale(anchorTweetId, anchorAuthor = null) {
        if (!lastReadPost?.tweetId || !anchorTweetId) return false;
        if (anchorTweetId !== lastReadPost.tweetId) return true;
        if (anchorAuthor && lastReadPost.authorHandler && anchorAuthor !== lastReadPost.authorHandler) {
            return true;
        }
        return false;
    }

    function syncHighlightIfDrifted() {
        if (!lastReadPost?.tweetId || !lastReadPost.authorHandler) return;
        const expected = findPostElementInDOM(lastReadPost.tweetId, lastReadPost.authorHandler);
        if (!expected || lastHighlightedPost === expected) return;
        updateHighlightedPost();
    }

    // === UI / Activation Control ===
    let isScriptActivated = false;
    let popup = null;

    function dismissActionPopup() {
        if (popup && popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
        popup = null;
    }

    function showActionPopup(messageKey, params = {}) {
        const lang = getUserLanguage();
        const message = getTranslatedMessage(messageKey, lang, params);

        if (!popup) {
            popup = document.createElement('div');
            Object.assign(popup.style, {
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                boxShadow: '0 0 10px rgba(246, 146, 25, 0.8)',
                zIndex: '10000',
                maxWidth: '500px',
                whiteSpace: 'pre-wrap',
                transition: 'opacity 0.3s ease',
                opacity: '0'
            });
            if (document.body) {
                document.body.appendChild(popup);
                setTimeout(() => { if (popup) popup.style.opacity = '1'; }, 50);
            }
        }

        if (popup) {
            popup.textContent = message;
        }
        return popup;
    }

    function updateActionPopup(messageKey, params = {}) {
        return showActionPopup(messageKey, params);
    }
    let pendingNewPosts = 0;
    let currentPost = null;   // wird aktuell kaum genutzt

    // === Data & Cache ===
    let downloadedPosts = new Set(GM_getValue('downloadedPosts', []));
    let postCache = new Map();

    // Cache für History (wird bei Saves aktualisiert für schnellen Abgleich)
    let postHistoryCache = [];

    // Timeline-Landkarte: Feed-Reihenfolge (oben→unten), fortlaufend aktualisiert
    let timelineMapOrderedKeys = [];
    const timelineMapByKey = new Map();
    let timelineMapAccount = null;
    let timelineMapLastPersist = 0;
    let timelineMapUpdateTimer = null;
    let timelineMapPendingSource = 'unknown';

    // Schnelles Gedächtnis: Alle bereits markierten Positionen (tweetId + Repost-Flag)
    // Wird aus der History befüllt. Ein Post/RePost wird nur dann als neue Lesestelle übernommen,
    // wenn er noch NICHT in diesem Set ist.
    const knownMarkedKeys = new Set();

    // Ende der gruppierten State-Definition (Punkt 4)

    function updatePostCache(visiblePosts) {

    if (!Array.isArray(visiblePosts)) {
        log('Cache', 'visiblePosts ist kein Array (war:', visiblePosts, ') → überspringe');
        return [];
    }

    visiblePosts.forEach(postData => {
        if (postData && postData.element) {
            const repostFlag = isRepost(postData.element);
            postData.isRepost = repostFlag;

            if (!postData.timestamp) postData.timestamp = getPostTimestamp(postData.element);
            if (!postData.authorHandler) postData.authorHandler = getPostAuthorHandler(postData.element);
        }
    });

    debugLog('Cache', `Post-Cache aktualisiert mit ${visiblePosts.length} Posts`);
    return visiblePosts;
}

    function saveDownloadedPosts() {
        GM_setValue('downloadedPosts', Array.from(downloadedPosts));
    }

    const STORAGE_KEY = (account) => `lastReadPost_${account}`;
    const AUTO_DOWNLOAD_KEY = 'autoDownloadEnabled';
    let autoDownloadEnabled = GM_getValue(AUTO_DOWNLOAD_KEY, false);

    async function saveLastReadPost(postData, options = {}) {
    const { force = false } = options;
    if (!postData || !postData.account || !postData.tweetId) {
        log('Save', 'Ungültige Daten – Speichern abgebrochen', postData);
        return;
    }

    const storageKey = STORAGE_KEY(postData.account);

    const currentDataStr = GM_getValue(storageKey, null);
    if (!force && currentDataStr) {
        try {
            const current = JSON.parse(currentDataStr);
            if (current && current.tweetId) {
                // Verwende die gleiche typ-getrennte "isNewer" Logik wie beim Live-Update
                if (!isCandidateNewer(postData, current)) {
                    debugLog('Save', `Ältere/gleiche Position (${postData.tweetId}) – übersprungen`);
                    return;
                }
            }
        } catch (e) {
            log('Save', 'Fehler beim Vergleich der alten Position:', e);
        }
    }

    const historyKey = `postHistory_${postData.account}`;

    try {

        GM_setValue(storageKey, JSON.stringify(postData));

        let history = GM_getValue(historyKey, []);
        history.push({
            ...postData,
            savedAt: new Date().toISOString()
        });

        if (history.length > MAX_POST_HISTORY) {
            history = history.slice(-MAX_POST_HISTORY);
        }

        GM_setValue(historyKey, history);

        postHistoryCache = history; // Cache aktualisieren für schnellen Timeline-Abgleich
        rebuildKnownMarkedKeys();
        timelineMapAccount = postData.account;
        scheduleTimelineMapUpdate('save', 'neutral');

        debugLog('Save', `Position + Historie gespeichert (${history.length}/${MAX_POST_HISTORY} Einträge)`);

    } catch (err) {
        log('Save', 'Fehler beim Speichern:', err);
        showPopup('saveError', 6000);
    }
}

    async function redirectToHomeAndSearch(fromFile = false) {
    if (window.location.href.includes('/home')) {
        startRefinedSearchForLastReadPost(fromFile);
        return;
    }
    showPopup('redirectToHome', 3000);

    const homeButton = document.querySelector("a[data-testid='AppTabBar_Home_Link']");
    if (homeButton) {
        homeButton.click();
        setTimeout(() => {
            if (window.location.href.includes('/home')) {
                startRefinedSearchForLastReadPost(fromFile);
            } else {
                log('Init', 'Weiterleitung zur Startseite fehlgeschlagen.');
                showPopup('scriptError', 5000);
            }
        }, 1000);
    } else {

        log('Init', 'Home-Button nicht gefunden.');
        window.location.href = 'https://x.com/home';
        setTimeout(() => startRefinedSearchForLastReadPost(fromFile), 1000);
    }
}

    async function loadLastReadPostFromFile() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        document.body.appendChild(input);

        input.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) {
                showPopup('fileSelectError', 5000);
                document.body.removeChild(input);
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (!data || !data.current || !data.current.tweetId || !data.current.authorHandler) {
                        showPopup('invalidPosition', 5000);
                        document.body.removeChild(input);
                        return;
                    }

                    const account = await getCurrentUserHandle();

                    lastReadPost = {
                        ...data.current,
                        account
                    };
                    if (!lastReadPost.readAt) {
                        lastReadPost.readAt = lastReadPost.timestamp;
                    }

                    const historyKey = `postHistory_${account}`;
                    let importedHistory = data.history || [];
                    if (importedHistory.length > 50) {
                        importedHistory = importedHistory.slice(-50);
                    }

                    GM_setValue(historyKey, importedHistory);
                    GM_setValue(STORAGE_KEY(account), JSON.stringify(lastReadPost));

                    // Repost-Log importieren, falls in der Datei vorhanden (User-Wunsch)
                    if (data.repostLog && Array.isArray(data.repostLog)) {
                        let importedRepostLog = data.repostLog;
                        if (importedRepostLog.length > MAX_REPOST_LOG) {
                            importedRepostLog = importedRepostLog.slice(-MAX_REPOST_LOG);
                        }
                        GM_setValue(REPOST_LOG_KEY(account), importedRepostLog);
                        debugLog('Repost', `Repost-Log aus Datei importiert: ${importedRepostLog.length} Einträge`);
                    }

                    showPopup('fileLoadSuccess', 4000);

                    updateHighlightedPost();

                    if (!isScriptActivated) {
                        isScriptActivated = true;
                        observeForNewPosts();
                    }

                    redirectToHomeAndSearch(true);

                    // Extra Sicherheit: Nach dem Laden aus Datei nochmal explizit versuchen, den Rahmen zu setzen
                    setTimeout(() => {
                        if (lastReadPost) {
                            updateHighlightedPost();
                        }
                    }, 2500);

                } catch (err) {
                    log('Load', 'JSON Parse Fehler:', err);
                    showPopup('fileReadError', 5000);
                } finally {
                    document.body.removeChild(input);
                }
            };

            reader.readAsText(file);
        });

        input.click();

    } catch (err) {
        log('Load', 'Datei-Dialog Fehler:', err);
        showPopup('fileDialogError', 5000);
    }
}

    async function loadLastReadPost(callback) {
    try {
        const account = await getCurrentUserHandle();
        const storageKey = STORAGE_KEY(account);
        const historyKey = `postHistory_${account}`;

        const storedPost = GM_getValue(storageKey, null);
        const storedHistory = GM_getValue(historyKey, []);

        let position = null;

        if (storedPost) {
            position = JSON.parse(storedPost);
        }

        const downloadedPosition = GM_getValue('downloadedReadingPosition', null);

        if (downloadedPosition && downloadedPosition.tweetId) {
            if (!position || !position.tweetId) {
                position = downloadedPosition;
                GM_setValue(storageKey, JSON.stringify(downloadedPosition));
                log('Load', 'Downgeloadete Position übernommen (keine interne vorhanden).');
            } else {
                try {
                    const internalId = BigInt(position.tweetId);
                    const downloadedId = BigInt(downloadedPosition.tweetId);
                    if (downloadedId > internalId) {
                        position = downloadedPosition;
                        GM_setValue(storageKey, JSON.stringify(downloadedPosition));
                        log('Load', 'Downgeloadete Position ist neuer → interne überschrieben.');
                    } else {
                        debugLog('Load', 'Interne Position ist neuer/gleich – downgeloadete ignoriert.');
                    }
                } catch (e) {
                    log('Load', 'Fehler beim Vergleich der Tweet-IDs.');
                }
            }
        }

        if (position && position.tweetId && position.authorHandler && position.timestamp) {

            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const filteredHistory = storedHistory.filter(h => new Date(h.timestamp).getTime() > sevenDaysAgo);
            GM_setValue(historyKey, filteredHistory);
            postHistoryCache = filteredHistory; // Cache für Gedächtnis/Abgleich füllen
            rebuildKnownMarkedKeys();
            loadTimelineMapForAccount(account);
            debugLog('Load', `Post-Historie: ${filteredHistory.length} Einträge (letzte 7 Tage).`);
            callback(position);
        } else {
            debugLog('Load', `Keine gültige Leseposition für Account ${account}.`);
            callback(null);
        }
    } catch (err) {
        log('Load', 'Fehler beim Laden der Leseposition:', err);
        callback(null);
    }
}

    async function downloadLastReadPost() {
    if (!window.location.href.includes('/home')) {
        debugLog('Load', 'Download übersprungen: Nicht auf Home-Seite.');
        return;
    }

    try {
        if (!lastReadPost || !lastReadPost.tweetId || !lastReadPost.authorHandler) {
            showPopup('noValidPosition', 5000);
            return;
        }

        const postKey = `${lastReadPost.tweetId}-${lastReadPost.authorHandler}`;
        if (downloadedPosts.has(postKey)) {
            showPopup('alreadyDownloaded', 5000);
            return;
        }

        const account = await getCurrentUserHandle();
        const historyKey = `postHistory_${account}`;
        const history = GM_getValue(historyKey, []);

        const exportHistory = history.slice(-50);

        // Repost-Log mit exportieren (User-Wunsch)
        const repostLog = GM_getValue(REPOST_LOG_KEY(account), []);
        const exportRepostLog = repostLog.slice(-300);  // sinnvolle Begrenzung (intern max 500)

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toISOString().slice(11, 16).replace(':', '');

        const postAuthor = lastReadPost.authorHandler || 'unknown';

        const fileName = `${account}_${postAuthor}_${dateStr}_${timeStr}.json`;
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        const exportData = {
            account: account,
            current: { ...lastReadPost },
            history: exportHistory,
            repostLog: exportRepostLog,
            exportedAt: now.toISOString(),
            version: "1.1"   // erhöht wegen neuem repostLog-Feld (30.05.2026)
        };

        const fileContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([fileContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        downloadedPosts.add(postKey);
        saveDownloadedPosts();

        showPopup('downloadSuccess', 8000, { fileName });

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 3000);

    } catch (err) {
        log('Load', 'Download-Fehler:', err);
        showPopup('downloadFailed', 10000);
    }
}

    async function loadNewestLastReadPost() {
        return new Promise(resolve => {
            loadLastReadPost(async (storedPost) => {
                const account = await getCurrentUserHandle();
                if (storedPost && storedPost.tweetId && storedPost.authorHandler) {
                    lastReadPost = storedPost;
                    if (!lastReadPost.readAt) {
                        lastReadPost.readAt = lastReadPost.timestamp;
                    }
                    log('Init', `Leseposition für Account ${account} geladen:`, lastReadPost);

                    // Nach Reload/Start: etwas längerer Grace, weil Fokus/Blur-Zyklen passieren können
                    suppressionState.until = Date.now() + 4000;
                } else {
                    log('Load', `Keine Leseposition für Account ${account} gefunden.`);
                    showPopup('noPositionFound', 5000);
                }
                resolve();
            });
        });
    }

    let lastScrollY = window.scrollY;

    async function initializeScript() {
    try {
        await loadNewestLastReadPost();

        window.addEventListener('scroll', debounce(() => {
            if (!isScriptActivated) {
                isScriptActivated = true;
                observeForNewPosts();
            }
            if (searchControl.isAutoScrolling || searchControl.isSearching || searchControl.isFallbackSearching) {
                return;
            }

            let mapScrollDir = 'neutral';
            if (window.scrollY < lastScrollY - CONFIG.MAP_SCROLL_DIRECTION_THRESHOLD) {
                scrollState.hasScrolledUp = true;
                mapScrollDir = 'up';
                scrollState.lastMapScrollDirection = 'up';
            } else if (window.scrollY > lastScrollY + CONFIG.MAP_SCROLL_DIRECTION_THRESHOLD) {
                mapScrollDir = 'down';
                scrollState.lastMapScrollDirection = 'down';
            }
            lastScrollY = window.scrollY;
            scrollState.lastMapScrollY = window.scrollY;

            if (!isNearTimelineTop()) {
                newPostsState.autoLoadPaused = false;
            } else {
                tryAutoClickNewPosts();
            }
            markTopVisiblePost(true, false, mapScrollDir);
        }, 150), { passive: true });

        setupTimelineMapObserver();
        window.addEventListener('beforeunload', () => persistTimelineMap(true));

        window.addEventListener('focus', () => {
            if (!isScriptActivated || searchControl.isSearching || searchControl.isFallbackSearching || searchControl.isAutoScrolling) {
                return;
            }

            // Stelle sicher, dass der New-Posts-Observer aktiv ist, wenn wir oben in der Timeline sind
            if (isNearTimelineTop()) {
                // Starte / aktualisiere den Observer sofort
                if (!window.newPostsObserver) {
                    observeForNewPosts();
                }

                if (isNewPostsAutoLoadPaused()) {
                    return;
                }

                tryAutoClickNewPosts();

                // Mehrere schnelle Checks, weil der "New Posts"-Button oft erst beim Fokussieren gerendert wird
                const checkNewPostsOnFocus = (attempt = 0) => {
                    if (attempt > 8 || isNewPostsAutoLoadPaused()) return;

                    setTimeout(() => {
                        tryAutoClickNewPosts();
                        if (!isNewPostsAutoLoadPaused()) {
                            checkNewPostsOnFocus(attempt + 1);
                        }
                    }, 300 + (attempt * 130));
                };

                checkNewPostsOnFocus(0);
            }
        });

        // Zusätzlicher visibilitychange Listener für zuverlässiges Erkennen nach Background-Tab
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' &&
                isScriptActivated &&
                !searchControl.isSearching &&
                !searchControl.isFallbackSearching &&
                !searchControl.isAutoScrolling &&
                isNearTimelineTop()) {

                // Sofort Observer neu starten (falls disconnected)
                if (!window.newPostsObserver) {
                    observeForNewPosts();
                }

                if (isNewPostsAutoLoadPaused()) {
                    return;
                }

                tryAutoClickNewPosts();

                // Mehrere schnelle Versuche, weil der New-Posts-Button oft erst beim Sichtbar-Werden gerendert wird
                const checkOnVisibility = (attempt = 0) => {
                    if (attempt > 8 || isNewPostsAutoLoadPaused()) return;

                    setTimeout(() => {
                        tryAutoClickNewPosts();
                        if (!isNewPostsAutoLoadPaused()) {
                            checkOnVisibility(attempt + 1);
                        }
                    }, 280 + (attempt * 110));
                };

                checkOnVisibility(0);
            }
        });

        const checkNewPostsInterval = setInterval(() => {
            tryAutoClickNewPosts();
        }, 3000);

        window.addEventListener('unload', () => clearInterval(checkNewPostsInterval));

        const debouncedDownload = debounce(() => {
            if (autoDownloadEnabled && lastReadPost && isScriptActivated && !searchControl.isSearching && !searchControl.isFallbackSearching && window.location.href.includes('/home')) {
                // Während des kurzen Grace nach Restore/New Posts keinen Auto-Download machen
                if (Date.now() < suppressionState.until) {
                    debugLog('Restore', 'Auto-Download auf Blur unterdrückt (Grace aktiv)');
                    return;
                }

                const postKey = `${lastReadPost.tweetId}-${lastReadPost.authorHandler}`;
                if (!downloadedPosts.has(postKey)) {
                    downloadLastReadPost();
                }
            }
        }, 1000);

        window.addEventListener('blur', debouncedDownload);
        window.addEventListener('beforeunload', () => {
            if (autoDownloadEnabled && lastReadPost && isScriptActivated && !searchControl.isSearching && !searchControl.isFallbackSearching && window.location.href.includes('/home')) {
                if (Date.now() < suppressionState.until) {
                    return; // Grace aktiv
                }
                const postKey = `${lastReadPost.tweetId}-${lastReadPost.authorHandler}`;
                if (!downloadedPosts.has(postKey)) {
                    downloadLastReadPost();
                }
            }
        });
    } catch (err) {
        log('Init', 'Fehler bei der Initialisierung:', err);
        showPopup('scriptError', 5000);
    }
}

    function setupHoldReadPosition() {
    log('Init', 'Verbessertes Lesestelle-Festhalten aktiviert');

    let feedElement = null;
    let lastHeight = 0;

    const observer = new MutationObserver(() => {
        if (!feedElement) return;

        setTimeout(() => {
            const currentHeight = feedElement.scrollHeight || 0;

            if (lastHeight > 0 && currentHeight > lastHeight + 40) {
                const addedHeight = currentHeight - lastHeight;
                window.scrollBy(0, addedHeight);
                log('Save', `Lesestelle gehalten (+${Math.round(addedHeight)}px neue Beiträge oberhalb)`);
            }

            lastHeight = currentHeight;
        }, 80);
    });

    const initObserver = () => {

        const possibleFeeds = [
            "div[role='feed']",
            "div[aria-label='Timeline: Your Home timeline']",
            "div[data-testid='primaryColumn'] section[role='region']",
            "main[role='main'] div[role='feed']"
        ];

        for (const selector of possibleFeeds) {
            feedElement = document.querySelector(selector);
            if (feedElement) break;
        }

        if (feedElement) {
            lastHeight = feedElement.scrollHeight || 0;
            observer.observe(feedElement, { childList: true, subtree: true });
            debugLog('Init', 'Lesestellen-Observer läuft auf Feed:', feedElement.tagName);
        } else {
            setTimeout(initObserver, 500);
        }
    };

    initObserver();
}

    function initializeWhenDOMReady() {
    if (!window.location.pathname.startsWith('/home')) {
        debugLog('Init', 'Script nur auf /home aktiv – Abbruch auf anderer Seite.');
        return;
    }

    log('Init', 'Initialisiere Skript auf /home... (Version 2026.6.28f)');
    log('Init', 'Diag-Logging aktiv — bei Problemen Konsole filtern: Diag:ERROR | Diag:WARN | Diag:SESSION');

    const observer = new MutationObserver((mutations, obs) => {
        if (document.body) {
            obs.disconnect();

            let activated = false;

            const activateScript = async () => {
                if (activated) return;
                activated = true;

                await initializeScript().then(() => {
                    createButtons();
                }).catch(err => {
                    log('Init', 'Fehler bei der Initialisierung:', err);
                    showPopup('scriptError', 5000);
                });
            };

            activateScript();

            let hasScrolled = false;
            const onFirstScroll = () => {
                if (!hasScrolled) {
                    hasScrolled = true;
                    activateScript();
                }
            };
            window.addEventListener('scroll', onFirstScroll, { once: true });
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
}

    window.addEventListener('load', initializeWhenDOMReady);

    function clearHighlightFromPost(postElement) {
        if (!postElement) return;
        postElement.style.removeProperty('box-shadow');
        postElement.style.removeProperty('outline');
        postElement.style.removeProperty('outline-style');
        postElement.style.removeProperty('outline-color');
    }

    function applyHighlightToPost(postElement, options = {}) {
        if (!postElement || !postElement.isConnected) return false;
        const { confidence = 100, strategy = 'exact' } = options;

        if (lastHighlightedPost && lastHighlightedPost !== postElement) {
            clearHighlightFromPost(lastHighlightedPost);
        }

        const outlineColor = confidence < 40 || strategy === 'emergency'
            ? 'rgba(255, 107, 107, 0.9)'
            : 'rgba(246, 146, 25, 0.95)';

        postElement.style.setProperty('box-shadow', 'none', 'important');
        postElement.style.setProperty('outline', `1px solid ${outlineColor}`, 'important');
        lastHighlightedPost = postElement;
        return true;
    }

    function resolveFreshPostElement(postElement, tweetId = null, authorHandler = null) {
        if (postElement && postElement.isConnected) return postElement;
        const id = tweetId || (postElement ? getPostTweetId(postElement) : null);
        const author = authorHandler || (postElement ? getPostAuthorHandler(postElement) : null);
        return findPostElementInDOM(id, author);
    }

    function scheduleHighlightRetries(tweetId, authorHandler, delays = [0, 300, 900, 2000]) {
        const gen = ++highlightRetryGeneration;
        delays.forEach(delay => {
            setTimeout(() => {
                if (gen !== highlightRetryGeneration) return;
                if (isScrollAnchorStale(tweetId, authorHandler)) {
                    syncHighlightIfDrifted();
                    debugLog('Highlight', `Retry nach ${delay}ms verworfen — Lesestelle hat sich geändert`);
                    return;
                }
                const el = findPostElementInDOM(tweetId, authorHandler);
                if (el) {
                    applyHighlightToPost(el);
                    debugLog('Highlight', `Rahmen gesetzt (Retry nach ${delay}ms)`);
                }
            }, delay);
        });
    }

    function updateHighlightedPost(preferredElement = null) {
        const freshPreferred = preferredElement
            ? resolveFreshPostElement(
                preferredElement,
                getPostTweetId(preferredElement),
                getPostAuthorHandler(preferredElement)
            )
            : null;
        if (freshPreferred && applyHighlightToPost(freshPreferred)) {
            debugLog('Highlight', 'Rand (1px) auf bevorzugtes Element gesetzt');
            return;
        }

        if (!lastReadPost || !lastReadPost.tweetId || !lastReadPost.authorHandler) {
            debugLog('Highlight', 'Keine gültige Leseposition für Rahmen.');
            return;
        }
        const lastReadElement = findPostElementInDOM(lastReadPost.tweetId, lastReadPost.authorHandler);
        if (lastReadElement) {
            applyHighlightToPost(lastReadElement);
            debugLog('Highlight', 'Rand (1px) auf Leseposition gesetzt');
        } else if (lastHighlightedPost && lastHighlightedPost.isConnected) {
            debugLog('Highlight', 'Leseposition nicht per ID im DOM, behalte aktuellen Rahmen');
        } else {
            debugLog('Highlight', 'Leseposition nicht im DOM, Rahmen nicht gesetzt');
        }
    }

    async function adoptFallbackPost(postElement) {
        if (!postElement) return;

        const account = await getCurrentUserHandle();
        const tweetId = getPostTweetId(postElement);
        const authorHandler = getPostAuthorHandler(postElement);
        const timestamp = getPostTimestamp(postElement);
        const repostFlag = isRepost(postElement);

        if (!tweetId || !authorHandler || !timestamp) {
            log('Fallback', 'Konnte Fallback-Post nicht übernehmen – unvollständige Daten');
            applyHighlightToPost(postElement);
            return;
        }

        lastReadPost = {
            account,
            tweetId,
            authorHandler,
            timestamp,
            isRepost: repostFlag,
            readAt: repostFlag ? new Date().toISOString() : undefined,
            adoptedFromFallback: true,
            context: captureReadingContext(postElement)
        };
        if (repostFlag && !lastReadPost.readAt) {
            lastReadPost.readAt = lastReadPost.timestamp;
        }

        const freshElement = resolveFreshPostElement(postElement, tweetId, authorHandler);
        if (freshElement) {
            applyHighlightToPost(freshElement);
        }

        await saveLastReadPost(lastReadPost, { force: true });
        activateRestoreSuppression(tweetId);
        scheduleHighlightRetries(tweetId, authorHandler);
        log('Fallback', `Lesestelle übernommen: @${authorHandler} ${tweetId}`);
    }

    function activateRestoreSuppression(tweetId) {
        // Kurzer harter Grace + ID für frühe Aufhebung beim Weiterscrollen
        suppressionState.until = Date.now() + CONFIG.RESTORE_GRACE_MS;
        suppressionState.pastTweetId = tweetId || null;
        suppressionState.blockNewerAdoptionUntil = Date.now() + CONFIG.POST_LUPE_NEWER_BLOCK_MS;
        scrollState.hasScrolledUp = false; // Nach Restore/ manueller Suche kein "Hochscrollen" mehr annehmen
        debugLog('Restore', `Grace ${CONFIG.RESTORE_GRACE_MS}ms aktiviert für ${tweetId}`);
    }

    function isLesestelleMutationBlocked() {
        return searchControl.newPostsRestoreActive ||
            searchControl.isSearching ||
            searchControl.isFallbackSearching ||
            searchControl.manualSearchActive;
    }

    async function markTopVisiblePost(save = true, allowOlderRegression = false, mapDirection = null) {
    try {

    if (!window.location.href.includes('/home') || isLesestelleMutationBlocked()) {
        return;
    }

    if (searchControl.lastManualSearchEndedAt > 0 &&
        Date.now() - searchControl.lastManualSearchEndedAt < CONFIG.POST_LUPE_NEWER_BLOCK_MS) {
        debugLog('Save', 'Auto-Save unterdrückt (nach Lupe-Suche / Scrollbalken-Nachlauf)');
        return;
    }

    const dir = mapDirection || scrollState.lastMapScrollDirection || 'neutral';
    refreshMapForLesestelle('mark', dir);

    if (dir === 'up' || scrollState.hasScrolledUp) {
        const promoted = await tryPromoteNewerVisiblePostOnScrollUp(dir);
        if (promoted) return;
    }

    // Wichtiger Gedächtnis-Schritt: Timeline mit History abgleichen
    // (siehe User-Vorschlag mit den letzten MAX_POST_HISTORY Einträgen)
    reconcileLesestelleWithHistory();

    // Punkt 3 vereinfacht: kurzer Grace + sofortige Aufhebung sobald User zu neuerem Post scrollt
    if (save && suppressionState.until > 0) {
        const now = Date.now();
        let suppress = false;

        if (now < suppressionState.until) {
            // Harter kurzer Grace-Timer läuft noch
            suppress = true;
        } else if (suppressionState.pastTweetId) {
            // Grace abgelaufen — oberster Post (Landkarte) vs. Lupe-Ziel prüfen
            const readingPost = getTopVisiblePost();
            if (readingPost) {
                const currentId = getPostTweetId(readingPost);
                if (currentId && BigInt(currentId) <= BigInt(suppressionState.pastTweetId)) {
                    suppress = true;
                } else {
                    suppress = isPostLupeProtectionActive();
                }
            } else {
                suppress = true;
            }
        }

        if (suppress) {
            save = false;
            debugLog('Restore', 'Auto-Save unterdrückt (kurzer Grace aktiv)');
        }
    }

    // Timer abgelaufen → komplett aufräumen
    if (suppressionState.until > 0 && Date.now() >= suppressionState.until) {
        suppressionState.until = 0;
        suppressionState.pastTweetId = null;
        debugLog('Restore', 'Grace abgelaufen — normale Auto-Speicherung wieder aktiv');
    }

    if (save && scrollState.programmaticScrollEndedAt > 0 &&
        Date.now() - scrollState.programmaticScrollEndedAt < 2500) {
        save = false;
        debugLog('Restore', 'Auto-Save unterdrückt (nach programmatischem Scroll)');
    }

    const anchorPost = getLesestelleAnchorPost();
    if (!anchorPost) return;

    const postTweetId = getPostTweetId(anchorPost);
    const postTimestamp = getPostTimestamp(anchorPost);
    const postAuthorHandler = getPostAuthorHandler(anchorPost);
    const repostFlag = isRepost(anchorPost);

    // === Starker History-Gedächtnis-Check (User-Wunsch) ===
    // Ein Post/RePost darf **nur** dann als neue Lesestelle gesetzt werden,
    // wenn er noch NICHT in der History bekannt ist.
    // Das ist die primäre Regel für echtes Gedächtnis beim normalen Scrollen (rauf/runter).
    const positionKey = `${postTweetId}-${repostFlag}`;

    if (knownMarkedKeys.has(positionKey) && !allowOlderRegression) {
        if (lastReadPost?.tweetId && postTweetId && postAuthorHandler && postTimestamp) {
            try {
                if (BigInt(postTweetId) > BigInt(lastReadPost.tweetId)) {
                    if (isPostLupeProtectionActive()) {
                        debugLog('Restore', 'GM-Sync übersprungen — Post-Lupe-Schutz aktiv');
                        return;
                    }
                    const account = await getCurrentUserHandle();
                    lastReadPost = {
                        tweetId: postTweetId,
                        timestamp: postTimestamp,
                        authorHandler: postAuthorHandler,
                        isRepost: repostFlag,
                        account,
                        readAt: new Date().toISOString()
                    };
                    await saveLastReadPost(lastReadPost, { force: true });
                    updateHighlightedPost();
                    debugLog('Save', `GM-Sync: bekannter Post ${positionKey} ist neuer — Lesestelle aktualisiert`);
                    return;
                }
            } catch (e) {
                debugLog('Save', 'GM-Sync ID-Vergleich fehlgeschlagen:', e);
            }
        }
        debugLog('Save', `Bereits in History bekannt (${positionKey}) – Lesestelle wird nicht neu gesetzt (Gedächtnis)`);
        syncHighlightIfDrifted();
        return;
    }

    // Repost-Tracking: interne Liste anlegen
    // (defensiv gewrappt – schützt vor historischen Stale-Variablen wie dem früheren
    //  "skipLesestelleUpdate" ReferenceError, der in älteren geladenen Versionen nach
    //  der Punkt-3-Cleanup-Phase auftrat; siehe log.txt 30.05.2026)
    try {
        if (repostFlag && postAuthorHandler) {
            const reposter = getReposterHandler(anchorPost);
            const account = await getCurrentUserHandle();

            debugLog('Repost', 'markTopVisiblePost repostFlag=true, author=', postAuthorHandler, 'reposter=', reposter);

            if (reposter) {
                addRepostToLog({
                    reposter,
                    originalAuthor: postAuthorHandler,
                    repostDate: postTimestamp,
                    discoveredAt: new Date().toISOString(),
                    account
                });
            } else {
                debugLog('Repost', 'detected but getReposterHandler returned null');
                debugLog('Repost', 'Repost erkannt, aber Reposter-Handler nicht extrahiert');
            }
        } else if (repostFlag) {
            debugLog('Repost', 'repostFlag=true but no postAuthorHandler');
        }
    } catch (repostErr) {
        debugLog('Repost', 'Unerwarteter Fehler im Repost-Tracking-Block (nicht kritisch):', repostErr);
    }

    if (postTweetId && postAuthorHandler && postTimestamp && save && isScriptActivated) {

        // Gedächtnis-Schutz (ID-basiert) als zusätzliche Absicherung
        if (save && lastReadPost && lastReadPost.tweetId && !allowOlderRegression) {
            const candId = BigInt(postTweetId);
            const lastId = BigInt(lastReadPost.tweetId);
            if (candId < lastId) {
                debugLog('Save', `Gedächtnis-Schutz: ältere ID ${postTweetId} wird nicht automatisch übernommen (aktuelle Lesestelle: ${lastReadPost.tweetId})`);
                save = false;
            }
        }

        const account = await getCurrentUserHandle();
        const nowIso = new Date().toISOString();
        const newPost = {
            tweetId: postTweetId,
            timestamp: postTimestamp,
            authorHandler: postAuthorHandler,
            isRepost: repostFlag,
            account,
            readAt: nowIso,
            context: captureReadingContext(anchorPost)
        };

        let shouldUpdate = true;

        if (lastReadPost && lastReadPost.tweetId) {
            try {
                const newPostData = {
                    tweetId: postTweetId,
                    timestamp: postTimestamp,
                    isRepost: repostFlag,
                    readAt: nowIso
                };

                // Verwende die zentrale, typ-getrennte Logik
                shouldUpdate = isCandidateNewer(newPostData, lastReadPost);

                // Zusätzlicher konservativer Zeit-Guard NUR innerhalb desselben Typs
                // (1 Stunde Rückschritt innerhalb von Reposts bzw. innerhalb von normalen Posts)
                if (shouldUpdate) {
                    const newTime = repostFlag ? Date.now() : new Date(postTimestamp).getTime();
                    const currTime = new Date(getComparisonTimestamp(lastReadPost)).getTime();
                    if (!isNaN(currTime) && newTime < currTime - 3600000) {
                        // Nur blocken, wenn gleicher Typ (die isCandidateNewer hat schon Kreuz-Typ abgelehnt)
                        const currIsRep = !!lastReadPost.isRepost;
                        if (repostFlag === currIsRep) {
                            shouldUpdate = false;
                        }
                    }
                }
            } catch (e) {
                log('Save', 'Fehler bei isCandidateNewer:', e);
            }
        }

        if (shouldUpdate) {
            lastReadPost = newPost;
            currentPost = newPost;
            await saveLastReadPost(lastReadPost);
            log('Save', 'Neue Leseposition gespeichert: @' + postAuthorHandler, postTweetId, repostFlag ? '(Repost)' : '');

            // Nach jedem erfolgreichen Speichern das Hochscroll-Flag zurücksetzen.
            scrollState.hasScrolledUp = false;
        }
    }

    if (lastReadPost && lastReadPost.tweetId && lastReadPost.authorHandler) {
        const savedElement = Array.from(document.querySelectorAll('article')).find(post => {
            const tweetId = getPostTweetId(post);
            const author = getPostAuthorHandler(post);
            return tweetId === lastReadPost.tweetId && author === lastReadPost.authorHandler;
        });

        if (savedElement) {
            applyHighlightToPost(savedElement);
        }
    }
    } catch (err) {
        log('Highlight', 'Unerwarteter Fehler in markTopVisiblePost:', err);
        // Wichtig: isSearching wird hier NICHT angefasst – das übernimmt der Caller oder startRefinedSearch...
    }
}

    function waitForNewPosts(callback, options = {}) {
    const timelineContainer = document.querySelector("div[data-testid='primaryColumn']") || document.body;
    const initialPostCount = options.baselinePostCount ?? document.querySelectorAll('article').length;
    const initialCellCount = options.baselineCellCount ?? document.querySelectorAll("div[data-testid='cellInnerDiv']").length;
    const initialScrollHeight = options.baselineScrollHeight ??
        (document.body.scrollHeight || document.documentElement.scrollHeight);
    const settleMs = options.settleMs ?? 1600;
    const fallbackMs = options.fallbackMs ?? 3200;
    const aggressiveScroll = options.aggressiveScroll ?? false;

    let loadAttempts = 0;
    const maxLoadAttempts = aggressiveScroll ? 80 : 12;
    let callbackTriggered = false;
    let observer = null;
    let timeoutCheck = null;
    let fallbackTimer = null;

    const hasNewDomContent = () => {
        const currentPostCount = document.querySelectorAll('article').length;
        const currentCellCount = document.querySelectorAll("div[data-testid='cellInnerDiv']").length;
        const currentScrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight;
        return currentPostCount > initialPostCount
            || currentCellCount > initialCellCount
            || currentScrollHeight > initialScrollHeight + 30;
    };

    const triggerCallback = (reason) => {
        if (callbackTriggered || searchControl.isSearchCancelled) return;
        callbackTriggered = true;
        if (observer) observer.disconnect();
        if (timeoutCheck) clearInterval(timeoutCheck);
        if (fallbackTimer) clearTimeout(fallbackTimer);
        debugLog('NewPosts', `Restore-Trigger: ${reason}`);
        setTimeout(() => {
            callback();
        }, settleMs);
    };

    observer = new MutationObserver(() => {
        if (!hasNewDomContent()) return;
        log('NewPosts', 'Neue Beiträge oder Zellen im DOM erkannt, starte Suche.');
        triggerCallback('mutation');
    });
    observer.observe(timelineContainer, {
        childList: true,
        subtree: true,
        attributes: false
    });

    timeoutCheck = setInterval(() => {
        loadAttempts++;
        if (callbackTriggered || searchControl.isSearchCancelled) {
            clearInterval(timeoutCheck);
            return;
        }
        if (hasNewDomContent()) {
            log('NewPosts', 'Neue Beiträge über Polling erkannt, starte Suche.');
            triggerCallback('poll');
        } else if (loadAttempts >= maxLoadAttempts) {
            log('NewPosts', 'Keine DOM-Änderung erkannt – Restore mit aktuellem Feed.');
            triggerCallback('timeout');
        } else if (aggressiveScroll) {
            const scrollStep = window.innerHeight * 0.6;
            window.scrollBy({ top: scrollStep, behavior: 'smooth' });
        }
    }, 1000);

    fallbackTimer = setTimeout(() => {
        if (callbackTriggered || searchControl.isSearchCancelled) return;
        log('NewPosts', 'Fallback-Restore (DOM bereits beim Klick aktualisiert).');
        triggerCallback('fallback');
    }, fallbackMs);

    window.addEventListener('unload', () => {
        if (observer) observer.disconnect();
        if (timeoutCheck) clearInterval(timeoutCheck);
        if (fallbackTimer) clearTimeout(fallbackTimer);
        searchControl.isSearching = false;
        searchControl.isFallbackSearching = false;
    }, { once: true });
}

    function startNewPostsCheckInterval() {
        const interval = setInterval(() => {
            tryAutoClickNewPosts();
        }, 3000);
        window.addEventListener('unload', () => clearInterval(interval));
    }

    function getTopVisiblePost() {
  const posts = document.querySelectorAll("article[data-testid='tweet']");
  let topPost = null;
  let minTop = Infinity;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const minTopForSaving = CONFIG.READING_POSITION_TOP_OFFSET;  // neue Lesestelle erst ab hier speichern (siehe CONFIG)

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const rect = post.getBoundingClientRect();
    if (rect.height < 5) continue; // leere/virtualisierte Platzhalter überspringen
    let effectiveTop = rect.top;

    // Spezialbehandlung für Antworten (Replies):
    // Der <article> umfasst den "Antwort an @..."-Header, der extra Höhe oben hinzufügt.
    // Wenn der User den eigentlichen Text der Antwort auf der gewünschten Leseposition (~5px) hat,
    // liegt rect.top des Articles oft < minTopForSaving, sodass normale Posts darunter als "top" gewählt werden.
    // Wir messen stattdessen ab dem Ende des Reply-Kontexts, damit der Content der Antwort
    // dieselbe visuelle Schwelle wie normale Posts erreicht, bevor er als neue Lesestelle gilt.
    // Das verhindert, dass neuere Antwort-Posts (höhere IDs) übersprungen werden, obwohl sie
    // visuell die aktuelle Leseposition sind (wie im html.txt-Beispiel mit 2061757693484810313).
    const replyCtx = post.querySelector('div[dir="ltr"], [id*="ch9gg"]');
    if (replyCtx) {
      const txt = (replyCtx.textContent || '').trim();
      if (/Antwort an|Replying to|En respuesta a|En réponse à|返信先|В ответ|답글|الرد على/i.test(txt)) {
        const ctxRect = replyCtx.getBoundingClientRect();
        effectiveTop = Math.max(effectiveTop, ctxRect.bottom || rect.top);
      }
    }

    if (effectiveTop >= minTopForSaving && effectiveTop < vh && effectiveTop < minTop) {
      minTop = effectiveTop;
      topPost = post;
    }
  }
  return topPost;
}

    function findNewestVisiblePostNewerThanBookmark(bookmark) {
        if (!bookmark?.tweetId) return null;

        let bookmarkId;
        try {
            bookmarkId = BigInt(bookmark.tweetId);
        } catch (e) {
            return null;
        }

        const vh = window.innerHeight || document.documentElement.clientHeight;
        let best = null;
        let bestId = bookmarkId;

        for (const post of document.querySelectorAll("article[data-testid='tweet']")) {
            const rect = post.getBoundingClientRect();
            if (rect.height < 5 || rect.bottom <= 0 || rect.top >= vh) continue;

            const parsed = parseLoadedPost(post);
            if (!parsed?.tweetId) continue;
            try {
                if (parsed.bigId > bestId) {
                    bestId = parsed.bigId;
                    best = parsed;
                }
            } catch (e) {
                continue;
            }
        }

        return best;
    }

    /**
     * Beim Hochscrollen: neueren sichtbaren Post oberhalb der Lesestelle sofort markieren.
     * Umgeht Map/Reconcile-Verzögerung nach New-Posts-Restore (stale lastScrollY, Option-2-Skip).
     */
    async function tryPromoteNewerVisiblePostOnScrollUp(mapDirection) {
        if (isLesestelleMutationBlocked()) return false;
        if (mapDirection !== 'up' && !scrollState.hasScrolledUp) return false;
        if (!lastReadPost?.tweetId) return false;

        const newer = findNewestVisiblePostNewerThanBookmark(lastReadPost);
        if (!newer?.tweetId || !newer.authorHandler || !newer.timestamp) return false;

        try {
            if (BigInt(newer.tweetId) <= BigInt(lastReadPost.tweetId)) return false;
        } catch (e) {
            return false;
        }

        const account = await getCurrentUserHandle();
        const nowIso = new Date().toISOString();
        const newPost = {
            tweetId: newer.tweetId,
            timestamp: newer.timestamp,
            authorHandler: newer.authorHandler,
            isRepost: newer.isRepost,
            account,
            readAt: nowIso,
            context: captureReadingContext(newer.element)
        };

        invalidateHighlightRetries();
        lastReadPost = newPost;
        currentPost = newPost;
        await saveLastReadPost(lastReadPost, { force: true });
        updateHighlightedPost(newer.element);
        applyHighlightToPost(newer.element);
        log('Save', 'Hochscrollen: neuerer Post über Lesestelle markiert: @' + newer.authorHandler, newer.tweetId);
        scrollState.hasScrolledUp = false;
        return true;
    }

    /**
     * Post an der Lesestellen-Linie (RESTORE_SCROLL_OFFSET, default 175px).
     * Wichtig: getTopVisiblePost() liefert den obersten Post (ab ~5px) — nach Lupe/Restore
     * stehen dort oft neuere Posts ÜBER der echten Lesestelle und triggern falsche Saves.
     */
    function getPostAtReadingOffset(maxDeviation = 120) {
        const posts = document.querySelectorAll("article[data-testid='tweet']");
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const target = CONFIG.RESTORE_SCROLL_OFFSET;
        let best = null;
        let bestDev = Infinity;

        for (const post of posts) {
            const rect = post.getBoundingClientRect();
            if (rect.height < 5) continue;
            if (rect.bottom <= 0 || rect.top >= vh) continue;

            const dev = Math.abs(rect.top - target);
            if (dev < bestDev) {
                bestDev = dev;
                best = post;
            }
        }

        return best && bestDev <= maxDeviation ? best : null;
    }

    function getLesestelleAnchorPost() {
        return getTopPostFromUpdatedMap();
    }

    function getPostTweetId(post) {
        const linkElement = post.querySelector("a[role='link'][href*='/status/']");
        if (!linkElement) return null;
        const href = linkElement.getAttribute('href');
        const match = href.match(/\/status\/(\d+)/);
        return match ? match[1] : null;
    }

    function findPostElementInDOM(tweetId, authorHandler = null) {
        if (!tweetId) return null;
        return Array.from(document.querySelectorAll('article')).find(post => {
            const id = getPostTweetId(post);
            if (id !== tweetId) return false;
            if (authorHandler) {
                return getPostAuthorHandler(post) === authorHandler;
            }
            return true;
        }) || null;
    }

    function getPostTimestamp(post) {

        if (!post) return null;

    const repostFlag = isRepost(post);

    let timeElement = repostFlag
        ? (post.querySelector('time[datetime]') || post.querySelector('article article time[datetime]'))
        : post.querySelector('time[datetime]');

    return timeElement ? timeElement.getAttribute('datetime') : null;
}

    /**
     * Liefert den effektiven Zeitstempel für eine Leseposition:
     * - Für normale Posts: der X-Timestamp des Posts (nahe am Lesezeitpunkt)
     * - Für Reposts: der lokale Lesezeitpunkt (readAt), da der X-Timestamp dem Original-Post gehört
     * Ermöglicht korrekte Altersprüfungen und Vergleiche auch bei Reposts.
     */
    function getEffectiveReadTimestamp(postData) {
        if (!postData) return null;
        return postData.readAt || postData.timestamp || null;
    }

    /**
     * Gibt den für "neuer als"-Vergleiche relevanten Zeitstempel zurück,
     * strikt getrennt nach Typ (Repost vs. normaler Post).
     * Repost-Positionen verwenden readAt (Wann im Feed gesehen).
     * Normale Posts verwenden ihren Erstellungs-timestamp.
     */
    function getComparisonTimestamp(postData) {
        if (!postData) return null;
        return postData.isRepost
            ? (postData.readAt || postData.timestamp)
            : postData.timestamp;
    }

    /**
     * Zentrale Entscheidung: Ist der Kandidat neuer als die aktuelle Leseposition?
     *
     * Regel (User-Wunsch):
     * - Repost-Timestamps (readAt) werden NUR mit anderen Repost-Timestamps verglichen.
     * - Normale Post-Timestamps werden NUR mit anderen normalen Post-Timestamps verglichen.
     * - Über die Typ-Grenze hinweg zählt nur eine strikt höhere Tweet-ID
     *   (echter neuer Content im Feed). Dadurch wird verhindert, dass
     *   ein Repost-readAt (aktuelle Wandzeit) normale neuere Posts blockiert.
     */
    function isCandidateNewer(candidate, current) {
        if (!current || !current.tweetId) return true;
        if (!candidate || !candidate.tweetId) return false;

        const candIsRep = !!candidate.isRepost;
        const currIsRep = !!current.isRepost;

        const candId = BigInt(candidate.tweetId);
        const currId = BigInt(current.tweetId);

        // Höhere ID = real neuerer Content → immer erlauben (überschreibt Typ-Mischung)
        if (candId > currId) {
            return true;
        }

        // Gleicher Typ → mit dem typspezifischen Timestamp vergleichen
        if (candIsRep === currIsRep) {
            const candT = getComparisonTimestamp(candidate);
            const currT = getComparisonTimestamp(current);
            if (candT && currT) {
                return new Date(candT).getTime() > new Date(currT).getTime();
            }
            return false;
        }

        // Verschiedene Typen und keine höhere ID:
        // Repost-Kandidat (auch mit älterer Tweet-ID) darf die Lesestelle werden,
        // wenn er aktuell als oberster sichtbarer Beitrag im Viewport steht.
        // (Ein frischer Repost eines alten Tweets repräsentiert "aktuellen Lesefortschritt".)
        // Höher-ID-Content (normal oder Repost) kann später trotzdem vorrücken (siehe candId > currId).
        if (candIsRep && !currIsRep) {
            return true;
        }

        // Normale Posts mit <= ID nach einem Repost: nicht vorrücken (verhindert falsche Rücksprünge)
        return false;
    }

    function getPostAuthorHandler(post) {

        const repostFlag = isRepost(post);
    let handlerElement;
    if (repostFlag) {
        // Strategie 1: Original-Post im eingebetteten <article> suchen (sehr zuverlässig)
        const innerArticle = post.querySelector('article');
        if (innerArticle) {
            handlerElement = innerArticle.querySelector("a[role='link'][href^='/']:not([href*='/status/'])");
        }

        // Strategie 2: Ersten Profil-Link nehmen, der NICHT im socialContext (Reposter) liegt
        if (!handlerElement) {
            const socialContext = post.querySelector('span[data-testid="socialContext"]');
            const allLinks = Array.from(post.querySelectorAll("a[role='link'][href^='/']:not([href*='/status/'])"));
            const contentLinks = allLinks.filter(link =>
                !socialContext || !socialContext.contains(link)
            );
            handlerElement = contentLinks[0] || null;
        }

        // Strategie 3: Letzter Fallback (alte Heuristik)
        if (!handlerElement) {
            const allLinks = post.querySelectorAll("a[role='link'][href^='/']:not([href*='/status/'])");
            handlerElement = allLinks[1] || allLinks[0];
        }
    } else {

        handlerElement = post.querySelector("a[role='link'][href*='/']:not([href*='/status/'])");
    }
    if (!handlerElement) {
        return null;
    }
    const href = handlerElement.getAttribute('href') || '';
    const text = handlerElement.textContent || '';
    let handle = null;
    if (href) {
        const match = href.match(/^\/([^/]+)/);
        if (match && match[1] && !['i', 'home', 'explore', 'messages', 'notifications'].includes(match[1])) {
            handle = match[1];
        }
    }
    if (!handle && text.startsWith('@') && text.length > 1) {
        handle = text.slice(1);
    }

    const isValid = handle && /^[a-zA-Z0-9_\p{L}]{1,15}$/u.test(handle);
    return isValid ? handle : null;
}

    function getVisiblePosts() {

        const posts = Array.from(document.querySelectorAll('article'));
    return posts.filter(post => {
        const rect = post.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    }).map(post => ({
        element: post,
        tweetId: getPostTweetId(post),
        timestamp: getPostTimestamp(post),
        authorHandler: getPostAuthorHandler(post),
        isRepost: isRepost(post)
    }));
}

    function getNewestHistoryEntry() {
        if (!postHistoryCache.length) return null;
        return postHistoryCache.reduce((best, entry) => {
            if (!entry?.tweetId) return best;
            if (!best) return entry;
            return isCandidateNewer(entry, best) ? entry : best;
        }, null);
    }

    function rebuildKnownMarkedKeys() {
        knownMarkedKeys.clear();
        postHistoryCache.forEach(entry => {
            if (entry && entry.tweetId) {
                const key = `${entry.tweetId}-${!!entry.isRepost}`;
                knownMarkedKeys.add(key);
            }
        });
    }

    /**
     * Neue Gedächtnis-Funktion (User-Vorschlag):
     * Gleicht die aktuell sichtbare Timeline mit der gespeicherten History (letzte MAX_POST_HISTORY Positionen)
     * ab, um die "wirklich" weiteste erreichte Lesestelle zu finden.
     * Verhindert, dass beim Hochscrollen alte Reposts die neueren Fortschritte überschreiben.
     */
    function reconcileLesestelleWithHistory() {
        if (isLesestelleMutationBlocked()) return;
        if (!lastReadPost || !lastReadPost.tweetId || postHistoryCache.length === 0) {
            return;
        }

        try {
            const visible = getVisiblePosts();
            if (visible.length === 0) return;

            // === Option 2 Fix: Starke Präferenz für den exakten aktuellen lastReadPost ===
            // Solange die exakte gespeicherte Lesestelle (Tweet-ID + isRepost) noch sichtbar ist,
            // erlauben wir KEINE Korrektur zu einem anderen History-Eintrag.
            // Das verhindert das nervige Springen des Rahmens zwischen zwei sehr ähnlichen Reposts.
            const currentKey = `${lastReadPost.tweetId}-${!!lastReadPost.isRepost}`;
            const exactPositionStillVisible = visible.some(p => {
                return `${p.tweetId}-${!!p.isRepost}` === currentKey;
            });

            if (exactPositionStillVisible) {
                if (scrollState.hasScrolledUp || scrollState.lastMapScrollDirection === 'up') {
                    const newerParsed = findNewestVisiblePostNewerThanBookmark(lastReadPost);
                    if (newerParsed?.tweetId && newerParsed.authorHandler && newerParsed.timestamp) {
                        try {
                            if (BigInt(newerParsed.tweetId) > BigInt(lastReadPost.tweetId)) {
                                lastReadPost = {
                                    tweetId: newerParsed.tweetId,
                                    timestamp: newerParsed.timestamp,
                                    authorHandler: newerParsed.authorHandler,
                                    isRepost: newerParsed.isRepost,
                                    account: lastReadPost.account,
                                    readAt: new Date().toISOString()
                                };
                                updateHighlightedPost(newerParsed.element);
                                void saveLastReadPost(lastReadPost, { force: true });
                                debugLog('Save', 'Gedächtnis-Abgleich: Neuerer Post beim Hochscrollen über Lesestelle');
                                return;
                            }
                        } catch (e) {
                            debugLog('Save', 'Hochscroll-Reconcile ID-Vergleich fehlgeschlagen:', e);
                        }
                    }
                }
                debugLog('Save', 'Reconcile übersprungen: Exakte aktuelle Lesestelle ist noch sichtbar (Option 2 Präferenz)');
                syncHighlightIfDrifted();
                return; // Nicht korrigieren, solange die echte aktuelle Position noch im Viewport ist
            }

            // Oben in der Timeline: neuester History-Eintrag hat Vorrang (verhindert GM-Drift)
            if (isNearTimelineTop()) {
                const newestHist = getNewestHistoryEntry();
                if (newestHist?.tweetId) {
                    const newestKey = `${newestHist.tweetId}-${!!newestHist.isRepost}`;
                    const newestVisible = visible.some(p =>
                        `${p.tweetId}-${!!p.isRepost}` === newestKey
                    );
                    if (newestVisible && isCandidateNewer(newestHist, lastReadPost)) {
                        lastReadPost = { ...newestHist };
                        updateHighlightedPost();
                        void saveLastReadPost(lastReadPost, { force: true });
                        debugLog('Save', 'Gedächtnis-Abgleich: Neuester History-Eintrag oben im Feed (GM-Sync)');
                        return;
                    }
                }
            }

            // History als schnelle Lookup-Map aufbauen (getrennt nach Typ für bessere Treffer)
            const historyMap = new Map();
            postHistoryCache.forEach(entry => {
                if (entry && entry.tweetId) {
                    const key = `${entry.tweetId}-${!!entry.isRepost}`;
                    historyMap.set(key, entry);
                }
            });

            let bestFromHistoryAndVisible = null;

            // Durch sichtbare Posts gehen und schauen, welche schon mal in History markiert wurden
            for (const vis of visible) {
                const key = `${vis.tweetId}-${!!vis.isRepost}`;
                const histEntry = historyMap.get(key);
                if (histEntry) {
                    // Kandidat: in History + aktuell sichtbar
                    if (!bestFromHistoryAndVisible || isCandidateNewer(histEntry, bestFromHistoryAndVisible)) {
                        bestFromHistoryAndVisible = histEntry;
                    }
                }
            }

            if (bestFromHistoryAndVisible) {
                // Wenn dieser aus History stammende sichtbare Post "weiter" ist als unser aktuelles lastReadPost,
                // dann setzen wir ihn als autoritative Lesestelle (starkes Gedächtnis).
                if (isCandidateNewer(bestFromHistoryAndVisible, lastReadPost)) {
                    lastReadPost = { ...bestFromHistoryAndVisible };
                    updateHighlightedPost();
                    debugLog('Save', 'Gedächtnis-Abgleich: Lesestelle aus History + sichtbarer Timeline korrigiert');
                }
            }
        } catch (e) {
            debugLog('Save', 'Fehler beim History-Timeline Abgleich:', e);
        }
    }

    // ============================================================
    // Timeline-Landkarte — Feed-Reihenfolge-Gedächtnis
    // ============================================================

    const TIMELINE_MAP_KEY = (account) => `timelineMap_${account}`;

    function getPostDomY(parsed) {
        return parsed.element.getBoundingClientRect().top + window.scrollY;
    }

    function sortPostsByDomY(posts) {
        return [...posts].sort((a, b) => getPostDomY(a) - getPostDomY(b));
    }

    function loadTimelineMapForAccount(account, force = false) {
        if (!force && timelineMapAccount === account && timelineMapOrderedKeys.length > 0) {
            debugLog('Map', `Live-Landkarte beibehalten (${timelineMapOrderedKeys.length} Einträge)`);
            return;
        }

        timelineMapAccount = account;
        timelineMapOrderedKeys = [];
        timelineMapByKey.clear();
        timelineMapLastPersist = 0;

        const stored = GM_getValue(TIMELINE_MAP_KEY(account), null);
        if (!stored) return;

        try {
            const data = typeof stored === 'string' ? JSON.parse(stored) : stored;
            const sevenDaysAgo = Date.now() - CONFIG.SEVEN_DAYS_IN_MS;
            const entries = data.entries || {};
            const ordered = Array.isArray(data.orderedKeys) ? data.orderedKeys : [];
            const filteredOrder = [];

            for (const key of ordered) {
                const entry = entries[key];
                if (!entry?.tweetId) continue;
                const seenAt = new Date(entry.lastSeenAt || 0).getTime();
                if (seenAt <= sevenDaysAgo) continue;
                filteredOrder.push(key);
                timelineMapByKey.set(key, { ...entry, inDom: false });
            }

            timelineMapOrderedKeys = filteredOrder.slice(-CONFIG.MAX_TIMELINE_MAP);
            const orderSet = new Set(timelineMapOrderedKeys);
            for (const key of [...timelineMapByKey.keys()]) {
                if (!orderSet.has(key)) timelineMapByKey.delete(key);
            }

            debugLog('Map', `Landkarte geladen: ${timelineMapOrderedKeys.length} Einträge`);
        } catch (e) {
            log('Map', 'Fehler beim Laden der Landkarte:', e);
        }
    }

    function persistTimelineMap(force = false) {
        if (!timelineMapAccount) return;
        const now = Date.now();
        if (!force && now - timelineMapLastPersist < CONFIG.TIMELINE_MAP_PERSIST_MS) return;

        const entries = {};
        for (const key of timelineMapOrderedKeys) {
            const entry = timelineMapByKey.get(key);
            if (entry) entries[key] = entry;
        }

        GM_setValue(TIMELINE_MAP_KEY(timelineMapAccount), JSON.stringify({
            orderedKeys: timelineMapOrderedKeys,
            entries,
            savedAt: new Date().toISOString()
        }));
        timelineMapLastPersist = now;
    }

    function trimTimelineMap() {
        const sevenDaysAgo = Date.now() - CONFIG.SEVEN_DAYS_IN_MS;
        const kept = [];

        for (const key of timelineMapOrderedKeys) {
            const entry = timelineMapByKey.get(key);
            if (!entry) continue;
            const seenAt = new Date(entry.lastSeenAt || 0).getTime();
            if (seenAt <= sevenDaysAgo) {
                timelineMapByKey.delete(key);
                continue;
            }
            kept.push(key);
        }

        if (kept.length > CONFIG.MAX_TIMELINE_MAP) {
            const removed = kept.splice(0, kept.length - CONFIG.MAX_TIMELINE_MAP);
            for (const key of removed) timelineMapByKey.delete(key);
        }

        timelineMapOrderedKeys = kept;
    }

    function mergeNewDomChunk(oldOrder, domKeys) {
        const domSet = new Set(domKeys);
        const ghosts = oldOrder.filter(k => !domSet.has(k));

        if (!domKeys.length) return ghosts;
        if (!ghosts.length) return [...domKeys];

        const firstDom = timelineMapByKey.get(domKeys[0]);
        const firstGhost = timelineMapByKey.get(ghosts[0]);

        if (firstDom && firstGhost) {
            try {
                if (BigInt(firstDom.tweetId) > BigInt(firstGhost.tweetId)) {
                    return [...domKeys, ...ghosts];
                }
            } catch (e) {
                debugLog('Map', 'mergeNewDomChunk ID-Vergleich fehlgeschlagen:', e);
            }
        }

        return [...ghosts, ...domKeys];
    }

    function mergeDomOrderIntoMap(oldOrder, domKeys) {
        const domSet = new Set(domKeys);
        if (!oldOrder.length) return [...domKeys];
        if (!domKeys.length) return oldOrder.filter(k => timelineMapByKey.has(k));

        const firstDomIdx = oldOrder.findIndex(k => domSet.has(k));
        if (firstDomIdx < 0) return mergeNewDomChunk(oldOrder, domKeys);

        const before = oldOrder.slice(0, firstDomIdx).filter(k => !domSet.has(k));
        const after = oldOrder.slice(firstDomIdx).filter(k => !domSet.has(k));

        return [...before, ...domKeys, ...after];
    }

    function normalizeMapDirection(direction, source) {
        if (direction === 'up' || direction === 'down') return direction;
        if (source === 'mutation' || source === 'save' || source === 'search-init' || source === 'mark') {
            return 'neutral';
        }
        if (source.startsWith('search')) {
            if (scrollState.searchDirection === 'up') return 'up';
            if (scrollState.searchDirection === 'down') return 'down';
        }
        if (scrollState.lastMapScrollDirection === 'up' || scrollState.lastMapScrollDirection === 'down') {
            return scrollState.lastMapScrollDirection;
        }
        return 'neutral';
    }

    /**
     * Richtungsabhängiges Merge:
     * up   → neuere Posts oben einfügen / Top-Segment aktualisieren
     * down → ältere Posts unten anfügen
     * neutral → vollständiger DOM-Abgleich (Suche-Init, Mutation)
     */
    function mergeDirectional(oldOrder, domKeys, direction) {
        const oldSet = new Set(oldOrder);
        if (!oldOrder.length) return domKeys;
        if (!domKeys.length) return oldOrder.filter(k => timelineMapByKey.has(k));
        if (direction === 'neutral') return mergeDomOrderIntoMap(oldOrder, domKeys);

        if (direction === 'up') {
            const anchorIdx = domKeys.findIndex(k => oldSet.has(k));
            if (anchorIdx < 0) {
                const prepend = domKeys.filter(k => !oldSet.has(k));
                return [...prepend, ...oldOrder];
            }
            if (anchorIdx === 0) {
                let topRun = 0;
                while (topRun < domKeys.length && oldSet.has(domKeys[topRun])) topRun++;
                if (topRun > 1) {
                    const newTop = domKeys.slice(0, topRun);
                    const rest = oldOrder.filter(k => !newTop.includes(k));
                    return [...newTop, ...rest];
                }
            }
            const prepend = domKeys.slice(0, anchorIdx);
            const rest = oldOrder.filter(k => !prepend.includes(k));
            return [...prepend, ...rest];
        }

        if (direction === 'down') {
            let anchorIdx = -1;
            for (let i = domKeys.length - 1; i >= 0; i--) {
                if (oldSet.has(domKeys[i])) {
                    anchorIdx = i;
                    break;
                }
            }
            if (anchorIdx < 0) {
                const append = domKeys.filter(k => !oldSet.has(k));
                return [...oldOrder, ...append];
            }
            const append = domKeys.slice(anchorIdx + 1).filter(k => !oldSet.has(k));
            return [...oldOrder, ...append];
        }

        return mergeDomOrderIntoMap(oldOrder, domKeys);
    }

    function scheduleTimelineMapUpdate(source = 'unknown', direction = 'neutral') {
        if (shouldDeferTimelineMapUpdate()) {
            timelineMapDirtyWhileDeferred = true;
            timelineMapPendingSource = source;
            timelineMapPendingDirection = direction;
            return;
        }

        timelineMapPendingSource = source;
        timelineMapPendingDirection = direction;
        if (timelineMapUpdateTimer) return;

        timelineMapUpdateTimer = setTimeout(() => {
            timelineMapUpdateTimer = null;
            updateTimelineMap(timelineMapPendingSource, timelineMapPendingDirection);
        }, CONFIG.TIMELINE_MAP_DEBOUNCE_MS);
    }

    let timelineMapPendingDirection = 'neutral';
    let timelineMapDirtyWhileDeferred = false;

    function shouldDeferTimelineMapUpdate() {
        if (searchControl.newPostsRestoreActive) return true;
        if (searchControl.isFallbackSearching) return true;
        // Lupe: erst nach eingefrorenem Snapshot pausieren (search-init + Snapshot bleiben möglich)
        if (searchControl.isSearching && scrollState.mapSnapshotOrderedKeys?.length) return true;
        return false;
    }

    function flushDeferredTimelineMapUpdate(source = 'deferred-flush') {
        if (!timelineMapDirtyWhileDeferred) return;
        timelineMapDirtyWhileDeferred = false;
        if (timelineMapUpdateTimer) {
            clearTimeout(timelineMapUpdateTimer);
            timelineMapUpdateTimer = null;
        }
        const src = timelineMapPendingSource || source;
        const dir = timelineMapPendingDirection || 'neutral';
        updateTimelineMap(src, dir, true);
    }

    function updateTimelineMap(source = 'unknown', explicitDirection = 'neutral', force = false) {
        if (!force && shouldDeferTimelineMapUpdate()) {
            timelineMapDirtyWhileDeferred = true;
            timelineMapPendingSource = source;
            timelineMapPendingDirection = explicitDirection;
            return;
        }

        if (!window.location.href.includes('/home')) return;

        const all = getAllLoadedPostsParsed();
        if (!all.length) return;

        const direction = normalizeMapDirection(explicitDirection, source);
        const domSorted = sortPostsByDomY(all);
        const domKeys = [];
        const domKeySet = new Set();
        const now = Date.now();
        const nowIso = new Date(now).toISOString();
        const previousDomOrder = timelineMapOrderedKeys.filter(k => timelineMapByKey.get(k)?.inDom);
        let reorderCount = 0;

        for (const parsed of domSorted) {
            const ref = compactPostRef(parsed);
            const key = postRefKey(ref);
            if (!key || domKeySet.has(key)) continue;

            domKeySet.add(key);
            domKeys.push(key);

            const domY = getPostDomY(parsed);
            const existing = timelineMapByKey.get(key);
            const newDomIndex = domKeys.length - 1;
            const oldDomIndex = previousDomOrder.indexOf(key);

            if (oldDomIndex >= 0 && oldDomIndex !== newDomIndex) {
                reorderCount++;
            }

            if (existing) {
                existing.lastDomY = domY;
                existing.lastSeenAt = nowIso;
                existing.inDom = true;
            } else {
                timelineMapByKey.set(key, {
                    key,
                    tweetId: ref.tweetId,
                    authorHandler: ref.authorHandler,
                    isRepost: ref.isRepost,
                    timestamp: ref.timestamp,
                    lastDomY: domY,
                    lastSeenAt: nowIso,
                    inDom: true
                });
            }
        }

        for (const key of timelineMapByKey.keys()) {
            if (!domKeySet.has(key)) {
                const entry = timelineMapByKey.get(key);
                if (entry) entry.inDom = false;
            }
        }

        const previousSize = timelineMapOrderedKeys.length;
        timelineMapOrderedKeys = mergeDirectional(timelineMapOrderedKeys, domKeys, direction);
        trimTimelineMap();

        if (reorderCount > 0) {
            diagPush('MAP_REORDER', 'info', `${reorderCount} Post(s) in Landkarte umsortiert`, {
                source,
                direction,
                reorderCount,
                mapSize: timelineMapOrderedKeys.length,
            });
        }

        const added = timelineMapOrderedKeys.length - previousSize;
        if (added > 0 || reorderCount > 0) {
            debugLog('Map', `Update (${source}, ${direction}): ${timelineMapOrderedKeys.length} Einträge, +${Math.max(0, added)} neu, ${reorderCount} umsortiert`);
        }

        persistTimelineMap();
    }

    function setupTimelineMapObserver() {
        const container = document.querySelector("div[data-testid='primaryColumn']");
        if (!container) {
            setTimeout(setupTimelineMapObserver, 500);
            return;
        }

        const observer = new MutationObserver(() => {
            scheduleTimelineMapUpdate('mutation', 'neutral');
        });
        observer.observe(container, { childList: true, subtree: true });
        debugLog('Map', 'Timeline-Landkarten-Observer aktiv');
    }

    function isPostNewerThanBookmark(post, bookmark) {
        if (!post?.tweetId || !bookmark?.tweetId) return false;
        try {
            return BigInt(post.tweetId) > BigInt(bookmark.tweetId);
        } catch (e) {
            return false;
        }
    }

    function findNextOlderPostInMap(bookmark, all) {
        if (!bookmark?.tweetId || !all?.length || timelineMapOrderedKeys.length === 0) return null;

        const domByKey = new Map();
        for (const parsed of all) {
            const key = postRefKey(parsed);
            if (key) domByKey.set(key, parsed);
        }

        let startIdx = findBookmarkIndexInMap(bookmark);
        if (startIdx < 0) return null;

        let bookmarkId = null;
        try {
            bookmarkId = BigInt(bookmark.tweetId);
        } catch (e) {
            bookmarkId = null;
        }

        // Map-Index 0 = neuesten Feed-Position; höhere Indizes = ältere Posts
        for (let i = startIdx + 1; i < timelineMapOrderedKeys.length; i++) {
            const key = timelineMapOrderedKeys[i];
            const parsed = domByKey.get(key);
            if (!parsed) continue;

            if (bookmarkId !== null) {
                try {
                    if (parsed.bigId >= bookmarkId) {
                        debugLog('Resolve', `Map-Nachfolger @${parsed.authorHandler} ${parsed.tweetId} ist nicht älter — übersprungen`);
                        continue;
                    }
                } catch (e) {
                    continue;
                }
            }

            const entry = timelineMapByKey.get(key);
            return {
                post: parsed,
                confidence: 92,
                strategy: 'older',
                reason: `map-successor (@${entry?.authorHandler || parsed.authorHandler} ${parsed.tweetId})`
            };
        }

        return null;
    }

    function findBookmarkIndexInMap(bookmark) {
        if (!bookmark?.tweetId || !timelineMapOrderedKeys.length) return -1;

        const bookmarkKey = postRefKey(bookmark);
        if (!bookmarkKey) return -1;

        let idx = timelineMapOrderedKeys.indexOf(bookmarkKey);
        if (idx >= 0) return idx;

        try {
            const bookmarkId = BigInt(bookmark.tweetId);
            for (let i = 0; i < timelineMapOrderedKeys.length; i++) {
                const entry = timelineMapByKey.get(timelineMapOrderedKeys[i]);
                if (!entry?.tweetId) continue;
                try {
                    if (BigInt(entry.tweetId) === bookmarkId && !!entry.isRepost === !!bookmark.isRepost) {
                        return i;
                    }
                } catch (e) {
                    continue;
                }
            }
        } catch (e) {
            return -1;
        }

        const computedIdx = computeBookmarkIdxInOrderedKeys(timelineMapOrderedKeys, bookmark);
        if (computedIdx >= 0 && computedIdx < timelineMapOrderedKeys.length) {
            return computedIdx;
        }

        return -1;
    }

    function refreshMapForLesestelle(source = 'mark', direction = 'neutral') {
        updateTimelineMap(source, direction);
    }

    /**
     * Oberster Post laut aktualisierter Landkarte:
     * unter sichtbaren Posts der mit dem niedrigsten Map-Index (neuesten Feed-Position).
     */
    function getTopPostFromUpdatedMap() {
        if (!timelineMapOrderedKeys.length) {
            return getTopVisiblePost();
        }

        const visible = getVisiblePosts();
        let bestEl = null;
        let bestMapIdx = Infinity;

        for (const vis of visible) {
            if (!vis?.tweetId) continue;
            const idx = findBookmarkIndexInMap(vis);
            if (idx >= 0 && idx < bestMapIdx) {
                bestMapIdx = idx;
                bestEl = vis.element;
            }
        }

        if (bestEl) return bestEl;

        for (const key of timelineMapOrderedKeys) {
            const entry = timelineMapByKey.get(key);
            if (!entry?.inDom) continue;
            const el = findPostElementInDOM(entry.tweetId, entry.authorHandler);
            if (el) return el;
        }

        return getTopVisiblePost();
    }

    function findInsertIndexFromHistory(bookmark) {
        if (!postHistoryCache?.length) return -1;

        const bKey = postRefKey(bookmark);
        let histIdx = -1;
        for (let i = 0; i < postHistoryCache.length; i++) {
            if (postRefKey(postHistoryCache[i]) === bKey) {
                histIdx = i;
                break;
            }
        }
        if (histIdx < 0) {
            try {
                const bId = BigInt(bookmark.tweetId);
                for (let i = 0; i < postHistoryCache.length; i++) {
                    const h = postHistoryCache[i];
                    if (!h?.tweetId) continue;
                    try {
                        if (BigInt(h.tweetId) === bId && !!h.isRepost === !!bookmark.isRepost) {
                            histIdx = i;
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            } catch (e) {
                return -1;
            }
        }
        if (histIdx < 0) return -1;

        // History: früher gelesen = niedrigerer Index = neuer im Feed = niedrigerer Map-Index
        let newerMapIdx = -1;
        for (let i = histIdx - 1; i >= 0; i--) {
            const idx = findBookmarkIndexInMap(postHistoryCache[i]);
            if (idx >= 0) {
                newerMapIdx = idx;
                break;
            }
        }

        let olderMapIdx = -1;
        for (let i = histIdx + 1; i < postHistoryCache.length; i++) {
            const idx = findBookmarkIndexInMap(postHistoryCache[i]);
            if (idx >= 0) {
                olderMapIdx = idx;
                break;
            }
        }

        if (newerMapIdx >= 0 && olderMapIdx >= 0) {
            return newerMapIdx + 1 <= olderMapIdx ? newerMapIdx + 1 : olderMapIdx;
        }
        if (newerMapIdx >= 0) return newerMapIdx + 1;
        if (olderMapIdx >= 0) return olderMapIdx;
        return -1;
    }

    function computeBookmarkIdxInOrderedKeys(orderedKeys, bookmark) {
        if (!bookmark?.tweetId || !orderedKeys?.length) return -1;

        const key = postRefKey(bookmark);
        const listIdx = key ? orderedKeys.indexOf(key) : -1;

        try {
            const targetId = BigInt(bookmark.tweetId);
            const targetRepost = !!bookmark.isRepost;
            // Landkarte: Index 0 = neueste Posts, höhere Indizes = älter
            let idIdx = orderedKeys.length;

            for (let i = 0; i < orderedKeys.length; i++) {
                const entry = timelineMapByKey.get(orderedKeys[i]);
                if (!entry?.tweetId) continue;
                const entryRepost = !!entry.isRepost;
                const entryId = BigInt(entry.tweetId);

                if (entryId === targetId && entryRepost === targetRepost) {
                    idIdx = i;
                    break;
                }
                // Eintrag älter als Bookmark → Bookmark gehört davor (niedrigerer Index)
                if (entryId < targetId) {
                    idIdx = i;
                    break;
                }
            }

            if (listIdx >= 0 && Math.abs(listIdx - idIdx) > 20) {
                debugLog('Search', `Bookmark-Index korrigiert: ${listIdx} → ${idIdx} (Tweet-ID @${bookmark.authorHandler})`);
            } else if (idIdx <= 2 && listIdx < 0 && orderedKeys.length > 80) {
                debugLog('Search', `Bookmark-Index ${idIdx} (@${bookmark.authorHandler}) — prüfe Chronologie in Landkarte`);
            }
            return idIdx;
        } catch (e) {
            return listIdx;
        }
    }

    function ensureBookmarkInMap(bookmark) {
        if (!bookmark?.tweetId) return -1;

        const key = postRefKey(bookmark);
        if (!key) return -1;

        const existingIdx = findBookmarkIndexInMap(bookmark);
        if (existingIdx >= 0) {
            const entry = timelineMapByKey.get(key);
            if (entry) {
                entry.authorHandler = bookmark.authorHandler || entry.authorHandler;
                entry.timestamp = bookmark.timestamp || entry.timestamp;
            }
            const correctIdx = computeBookmarkIdxInOrderedKeys(timelineMapOrderedKeys, bookmark);
            if (correctIdx >= 0 && Math.abs(existingIdx - correctIdx) > 20) {
                timelineMapOrderedKeys.splice(existingIdx, 1);
                const insertAt = Math.min(Math.max(0, correctIdx > existingIdx ? correctIdx - 1 : correctIdx), timelineMapOrderedKeys.length);
                timelineMapOrderedKeys.splice(insertAt, 0, key);
                debugLog('Map', `Lesestelle per Tweet-ID verschoben: ${existingIdx} → ${insertAt}`);
                persistTimelineMap(true);
                return insertAt;
            }
            return existingIdx;
        }

        const nowIso = new Date().toISOString();
        timelineMapByKey.set(key, {
            key,
            tweetId: bookmark.tweetId,
            authorHandler: bookmark.authorHandler,
            isRepost: !!bookmark.isRepost,
            timestamp: bookmark.timestamp,
            lastDomY: null,
            lastSeenAt: nowIso,
            inDom: false
        });

        let insertIdx = findInsertIndexFromHistory(bookmark);
        if (insertIdx < 0) {
            insertIdx = timelineMapOrderedKeys.length;
            debugLog('Map', `Lesestelle ohne History-Anker ans Ende gesetzt (idx ${insertIdx})`);
        } else {
            debugLog('Map', `Lesestelle via History-Anker eingefügt (idx ${insertIdx}, ghost)`);
        }

        timelineMapOrderedKeys.splice(insertIdx, 0, key);
        trimTimelineMap();
        persistTimelineMap(true);
        return insertIdx;
    }

    function getVisibleMapIndexRange() {
        const visible = getVisiblePosts();
        if (!visible.length || !timelineMapOrderedKeys.length) {
            return { min: -1, max: -1 };
        }

        let min = Infinity;
        let max = -1;
        for (const vis of visible) {
            const idx = findBookmarkIndexInMap(vis);
            if (idx >= 0) {
                min = Math.min(min, idx);
                max = Math.max(max, idx);
            }
        }

        if (min === Infinity) return { min: -1, max: -1 };
        return { min, max };
    }

    function getLoadedDomMapIndexRange() {
        let newest = -1;
        let oldest = -1;

        for (let i = 0; i < timelineMapOrderedKeys.length; i++) {
            const entry = timelineMapByKey.get(timelineMapOrderedKeys[i]);
            if (!entry?.inDom) continue;
            if (newest < 0) newest = i;
            oldest = i;
        }

        return { newest, oldest, min: newest, max: oldest };
    }

    function getDomIndexRangeInSnapshotOrder(orderedKeys) {
        if (!orderedKeys?.length) return { newest: -1, oldest: -1, min: -1, max: -1 };

        const keyToIdx = new Map(orderedKeys.map((key, idx) => [key, idx]));
        let newest = -1;
        let oldest = -1;

        for (const parsed of getAllLoadedPostsParsed()) {
            const key = postRefKey(parsed);
            if (!key || !keyToIdx.has(key)) continue;
            const idx = keyToIdx.get(key);
            if (newest < 0 || idx < newest) newest = idx;
            if (oldest < 0 || idx > oldest) oldest = idx;
        }

        return { newest, oldest, min: newest, max: oldest };
    }

    function isBookmarkWithinLoadedMapRange(bookmark) {
        const idx = findBookmarkIndexInMap(bookmark);
        if (idx < 0) return false;
        const { newest, oldest } = getLoadedDomMapIndexRange();
        if (newest < 0) return false;
        return idx >= newest && idx <= oldest;
    }

    function captureMapSnapshotForSearch(bookmark = lastReadPost) {
        scrollState.mapSnapshotOrderedKeys = [...timelineMapOrderedKeys];
        scrollState.mapSnapshotAtSearchStart = new Set(scrollState.mapSnapshotOrderedKeys);
        scrollState.mapSnapshotTweetIdToIdx = new Map();
        for (let i = 0; i < scrollState.mapSnapshotOrderedKeys.length; i++) {
            const entry = timelineMapByKey.get(scrollState.mapSnapshotOrderedKeys[i]);
            if (!entry?.tweetId) continue;
            scrollState.mapSnapshotTweetIdToIdx.set(`${entry.tweetId}-${!!entry.isRepost}`, i);
        }
        scrollState.mapSnapshotBookmarkKey = bookmark ? postRefKey(bookmark) : null;
        scrollState.mapSnapshotBookmarkIdx = bookmark
            ? computeBookmarkIdxInOrderedKeys(scrollState.mapSnapshotOrderedKeys, bookmark)
            : -1;
        scrollState.searchCoarseDirection = null;
        scrollState.largeScrollCount = 0;
        scrollState.isSlowScrollMode = false;
        scrollState.slowScrollLockedDirection = null;
        scrollState.slowScrollFineAttempts = 0;
        scrollState.searchTopRetryDone = false;
        debugLog('Search', `Landkarten-Snapshot: ${scrollState.mapSnapshotAtSearchStart.size} Einträge, Ziel-idx ${scrollState.mapSnapshotBookmarkIdx} (eingefroren, Tweet-ID)`);
    }

    function clearMapSnapshotForSearch() {
        scrollState.mapSnapshotAtSearchStart = null;
        scrollState.mapSnapshotOrderedKeys = null;
        scrollState.mapSnapshotTweetIdToIdx = null;
        scrollState.mapSnapshotBookmarkKey = null;
        scrollState.mapSnapshotBookmarkIdx = -1;
        scrollState.searchCoarseDirection = null;
        scrollState.slowScrollLockedDirection = null;
        scrollState.slowScrollFineAttempts = 0;
        scrollState.searchTopRetryDone = false;
    }

    function isSearchFineZoneDistance(mapDistance) {
        return mapDistance !== null && mapDistance <= CONFIG.SEARCH_FINE_ZONE_HYSTERESIS;
    }

    function isSearchFineZoneActive(mapDistance) {
        if (!isSearchFineZoneDistance(mapDistance)) return false;
        const frozenIdx = getFrozenSearchBookmarkIdx();
        const nearTopTarget = frozenIdx >= 0 && frozenIdx < CONFIG.SEARCH_TOP_RETRY_MAX_IDX;
        return scrollState.isSlowScrollMode ||
            scrollState.slowScrollLockedDirection !== null ||
            scrollState.slowScrollFineAttempts > 0 ||
            nearTopTarget;
    }

    async function landExactSearchHit(searchBookmark, postElement, diagCode, onCleanup) {
        debugLog('Search', `Exakter Treffer (${diagCode}):`, searchBookmark);
        lastReadPost.found = true;
        updateHighlightedPost();
        setTimeout(() => scrollToPostWithHighlight(postElement), 250);
        activateRestoreSuppression(searchBookmark.tweetId);
        markTopVisiblePost(false);
        diagEndFlow('ok', diagCode, 'Ziel exakt gefunden', { target: diagBookmark(searchBookmark) });
        clearMapSnapshotForSearch();
        endManualSearchSession();
        dismissActionPopup();
        if (typeof onCleanup === 'function') onCleanup();
    }

    async function finishSearchWhenFineExhausted(searchBookmark, onCleanup) {
        const frozenIdx = getFrozenSearchBookmarkIdx();
        if (frozenIdx >= 0 && frozenIdx < CONFIG.SEARCH_TOP_RETRY_MAX_IDX && !scrollState.searchTopRetryDone) {
            scrollState.searchTopRetryDone = true;
            debugLog('Search', `Feinbereich erschöpft — Timeline-Top laden (Ziel-idx ${frozenIdx})`);
            window.scrollTo({ top: 0, behavior: 'auto' });
            await new Promise(r => setTimeout(r, 700));
            const topExact = findBookmarkExactInDom(searchBookmark);
            if (topExact?.element) {
                await landExactSearchHit(searchBookmark, topExact.element, 'SEARCH_TOP_RETRY_EXACT', onCleanup);
                return true;
            }
        }

        const resolved = resolveReadingPosition(searchBookmark);
        if (resolved?.strategy === 'exact' && resolved?.post?.element) {
            await applyResolvedReadingPosition(resolved, {
                adopt: false,
                expectedBookmark: searchBookmark,
                verifySource: 'search-fine-exhausted',
            });
            diagEndFlow('ok', 'SEARCH_FINE_RESOLVE_EXACT', 'Resolve exakt nach Feinbereich', {
                target: diagBookmark(searchBookmark),
            });
            clearMapSnapshotForSearch();
            endManualSearchSession();
            dismissActionPopup();
            if (typeof onCleanup === 'function') onCleanup();
            return true;
        }

        debugLog('Search', 'Feinbereich ohne Treffer — kein Emergency-Adopt');
        showPopup('tweetIdNotFound', 6000, {
            authorHandler: searchBookmark.authorHandler,
            tweetId: searchBookmark.tweetId,
        });
        diagEndFlow('warn', 'SEARCH_FINE_EXHAUSTED', 'Feinbereich ohne exakten Treffer', {
            target: diagBookmark(searchBookmark),
            resolveStrategy: resolved?.strategy ?? null,
            resolveConfidence: resolved?.confidence ?? null,
        });
        clearMapSnapshotForSearch();
        endManualSearchSession();
        dismissActionPopup();
        if (typeof onCleanup === 'function') onCleanup();
        return false;
    }

    function getFrozenSearchBookmarkIdx() {
        return scrollState.mapSnapshotBookmarkIdx >= 0 ? scrollState.mapSnapshotBookmarkIdx : -1;
    }

    function getSearchViewportIndexRange() {
        const ordered = scrollState.mapSnapshotOrderedKeys;
        if (!ordered?.length) {
            return getVisibleMapIndexRange();
        }

        const keyToIdx = new Map(ordered.map((key, idx) => [key, idx]));
        const tweetIdToIdx = scrollState.mapSnapshotTweetIdToIdx;
        const visible = getVisiblePosts();
        const indices = [];

        for (const vis of visible) {
            if (!vis?.tweetId) continue;
            let idx = -1;
            const key = postRefKey(vis);
            if (key && keyToIdx.has(key)) {
                idx = keyToIdx.get(key);
            } else if (tweetIdToIdx?.size) {
                idx = tweetIdToIdx.get(`${vis.tweetId}-${!!vis.isRepost}`) ?? -1;
            }
            if (idx >= 0) indices.push(idx);
        }

        if (!indices.length) return { min: -1, max: -1, hits: 0 };

        if (indices.length >= 3) {
            indices.sort((a, b) => a - b);
            const median = indices[Math.floor(indices.length / 2)];
            const cluster = indices.filter(i => Math.abs(i - median) <= 40);
            if (cluster.length >= 2) {
                return {
                    min: Math.min(...cluster),
                    max: Math.max(...cluster),
                    hits: cluster.length
                };
            }
        }

        return {
            min: Math.min(...indices),
            max: Math.max(...indices),
            hits: indices.length
        };
    }

    function resolveSearchDirection(bookmark, bookmarkIdx, viewportMin, viewportMax) {
        let snapshotDirection = null;
        let distance = 0;

        if (bookmarkIdx >= 0 && viewportMin >= 0) {
            if (bookmarkIdx < viewportMin) {
                snapshotDirection = 'up';
                distance = viewportMin - bookmarkIdx;
            } else if (bookmarkIdx > viewportMax) {
                snapshotDirection = 'down';
                distance = bookmarkIdx - viewportMax;
            } else {
                distance = 0;
                snapshotDirection = bookmarkIdx <= (viewportMin + viewportMax) / 2 ? 'up' : 'down';
            }
        }

        const tweetDirection = inferSearchDirectionFromTweetId(bookmark);

        if (snapshotDirection && tweetDirection && snapshotDirection !== tweetDirection) {
            if (bookmarkIdx < 30 && viewportMin > 80) {
                debugLog('Search', `Richtung per Tweet-ID (Bookmark idx ${bookmarkIdx} verdächtig): ${tweetDirection}`);
                return { direction: tweetDirection, distance: Math.max(distance, Math.abs(viewportMin - bookmarkIdx)) };
            }
            if (distance > 12) {
                debugLog('Search', `Richtungs-Korrektur: Snapshot=${snapshotDirection} ≠ Tweet-ID=${tweetDirection} (Abstand ${distance}) → Tweet-ID`);
                return { direction: tweetDirection, distance: distance || 99 };
            }
        }
        if (snapshotDirection) {
            return { direction: snapshotDirection, distance };
        }
        return { direction: tweetDirection, distance: 99 };
    }

    function inferSearchDirectionFromTweetId(bookmark) {
        if (!bookmark?.tweetId) return 'down';

        const visible = getVisiblePosts();
        if (!visible.length) return 'down';

        let visMin = null;
        let visMax = null;
        for (const vis of visible) {
            if (!vis?.tweetId) continue;
            try {
                const id = BigInt(vis.tweetId);
                if (visMin === null || id < visMin) visMin = id;
                if (visMax === null || id > visMax) visMax = id;
            } catch (e) {
                continue;
            }
        }

        try {
            const targetId = BigInt(bookmark.tweetId);
            if (visMax !== null && targetId > visMax) return 'up';
            if (visMin !== null && targetId < visMin) return 'down';
        } catch (e) {
            return 'down';
        }

        return 'down';
    }

    function getHistoricalMapOverlapInDom() {
        const snapshot = scrollState.mapSnapshotAtSearchStart;
        if (!snapshot?.size) return { count: 0, keys: [] };

        const hits = [];
        const seen = new Set();
        for (const parsed of getAllLoadedPostsParsed()) {
            const key = postRefKey(parsed);
            if (!key || !snapshot.has(key) || seen.has(key)) continue;
            seen.add(key);
            hits.push(key);
        }
        return { count: hits.length, keys: hits };
    }

    /**
     * Nach vielen neuen Posts (z. B. über Nacht) sind zunächst nur unbekannte Beiträge im DOM.
     * In diesem Zustand dürfen normale Such-Limits nicht zum Notfall-Landing führen —
     * erst wenn historische Landkarten-Posts sichtbar werden, greifen wieder die üblichen Limits.
     */
    function isAwaitingHistoricalMapAnchors(bookmark = lastReadPost) {
        if (!searchControl.isSearching || !bookmark?.tweetId) return false;

        const snapshot = scrollState.mapSnapshotAtSearchStart;
        if (!snapshot?.size || snapshot.size < 2) return false;

        const bookmarkIdx = scrollState.mapSnapshotBookmarkIdx >= 0
            ? scrollState.mapSnapshotBookmarkIdx
            : findBookmarkIndexInMap(bookmark);
        if (bookmarkIdx < 0) return false;

        const { oldest } = scrollState.mapSnapshotOrderedKeys?.length
            ? getDomIndexRangeInSnapshotOrder(scrollState.mapSnapshotOrderedKeys)
            : getLoadedDomMapIndexRange();
        if (oldest < 0 || bookmarkIdx <= oldest) return false;

        const overlap = getHistoricalMapOverlapInDom();
        if (overlap.count > 0) {
            debugLog('Search', `Historische Landkarten-Posts im DOM (${overlap.count}) — normale Such-Limits aktiv`);
            return false;
        }

        debugLog('Search', `Noch keine historischen Landkarten-Posts (Ziel-idx ${bookmarkIdx}, geladen bis idx ${oldest})`);
        return true;
    }

    function updateSearchDirectionFromMap(bookmark) {
        const useSnapshot = searchControl.isSearching && scrollState.mapSnapshotOrderedKeys?.length;
        let bookmarkIdx = useSnapshot ? getFrozenSearchBookmarkIdx() : findBookmarkIndexInMap(bookmark);

        if (bookmarkIdx < 0) {
            if (!useSnapshot) {
                ensureBookmarkInMap(bookmark);
                bookmarkIdx = findBookmarkIndexInMap(bookmark);
            }
        }

        const viewport = useSnapshot ? getSearchViewportIndexRange() : getVisibleMapIndexRange();
        const { min, max } = viewport;
        const resolved = resolveSearchDirection(bookmark, bookmarkIdx, min, max);
        const { direction: newDirection, distance } = resolved;

        if (min < 0) {
            scrollState.searchDirection = newDirection;
            scrollState.isSlowScrollMode = false;
            scrollState.searchCoarseDirection = distance > 12 ? newDirection : null;
            debugLog('Search', `Kein Viewport-Anker im Snapshot — Richtung: ${newDirection}`);
            return null;
        }

        const coarseThreshold = 12;
        if (distance > coarseThreshold) {
            scrollState.slowScrollLockedDirection = null;
            scrollState.slowScrollFineAttempts = 0;
            scrollState.searchCoarseDirection = newDirection;
            scrollState.searchDirection = newDirection;
            scrollState.isSlowScrollMode = false;
            scrollState.largeScrollCount = 0;
            const label = useSnapshot ? 'Snapshot-Viewport' : 'Viewport';
            debugLog('Search', `${label}: Ziel idx ${bookmarkIdx} außerhalb (${min}–${max}, Abstand ${distance}) → grob ${newDirection}`);
        } else if (distance > 0) {
            const nearTopTarget = bookmarkIdx >= 0 && bookmarkIdx < CONFIG.SEARCH_TOP_RETRY_MAX_IDX;
            const inFineHysteresis = distance <= CONFIG.SEARCH_FINE_ZONE_HYSTERESIS &&
                (nearTopTarget ||
                    scrollState.slowScrollLockedDirection !== null ||
                    scrollState.slowScrollFineAttempts > 0);
            if (inFineHysteresis) {
                scrollState.isSlowScrollMode = true;
                if (scrollState.slowScrollLockedDirection === null) {
                    scrollState.slowScrollLockedDirection = newDirection;
                }
                scrollState.searchDirection = scrollState.slowScrollLockedDirection;
                scrollState.searchCoarseDirection = null;
                debugLog('Search', `Feinbereich-Hysterese (Ziel idx ${bookmarkIdx}, ${min}–${max}, Abstand ${distance}) → ${scrollState.searchDirection}`);
            } else {
                scrollState.slowScrollLockedDirection = null;
                scrollState.slowScrollFineAttempts = 0;
                scrollState.searchDirection = newDirection;
                scrollState.isSlowScrollMode = scrollState.largeScrollCount >= scrollState.maxLargeScrolls;
                scrollState.searchCoarseDirection = null;
                debugLog('Search', `Annäherung: Ziel idx ${bookmarkIdx} nahe Viewport (${min}–${max}, Abstand ${distance}) → ${newDirection}`);
            }
        } else {
            scrollState.searchCoarseDirection = null;
            scrollState.isSlowScrollMode = true;
            if (scrollState.slowScrollLockedDirection === null) {
                const distToTop = bookmarkIdx - min;
                const distToBottom = max - bookmarkIdx;
                scrollState.slowScrollLockedDirection = distToTop <= distToBottom ? 'up' : 'down';
            }
            scrollState.searchDirection = scrollState.slowScrollLockedDirection;
            debugLog('Search', `Slow-Scroll fein (Ziel idx ${bookmarkIdx} in Viewport-Spanne ${min}–${max}, Richtung ${scrollState.searchDirection})`);
        }

        return null;
    }

    function getMapDistanceToTarget(bookmark) {
        const useSnapshot = searchControl.isSearching && scrollState.mapSnapshotOrderedKeys?.length;
        const idx = useSnapshot ? getFrozenSearchBookmarkIdx() : findBookmarkIndexInMap(bookmark);
        if (idx < 0) return null;

        const viewport = useSnapshot ? getSearchViewportIndexRange() : getVisibleMapIndexRange();
        const { min, max } = viewport;
        if (min >= 0) {
            if (idx < min) return min - idx;
            if (idx > max) return idx - max;
            return 0;
        }

        if (!useSnapshot) {
            const { newest, oldest } = getLoadedDomMapIndexRange();
            if (newest < 0) return null;
            if (idx < newest) return newest - idx;
            if (idx > oldest) return idx - oldest;
        }

        return null;
    }

    // ============================================================
    // Reading Position Resolve Engine
    // exact → older (Landkarte) → emergency (Landkarte)
    // classifyFeedState für Popups/Diagnose
    // ============================================================

    function compactPostRef(parsed) {
        if (!parsed) return null;
        return {
            tweetId: parsed.tweetId,
            authorHandler: parsed.authorHandler,
            isRepost: parsed.isRepost,
            timestamp: parsed.timestamp
        };
    }

    function postRefKey(ref) {
        if (!ref?.tweetId) return null;
        return `${ref.tweetId}-${!!ref.isRepost}`;
    }

    function captureReadingContext(anchorElement) {
        const empty = { neighborsBefore: [], neighborsAfter: [], visibleAtSave: [] };
        if (!anchorElement) return empty;

        const all = getAllLoadedPostsParsed();
        if (!all.length) return empty;

        const anchorParsed = parseLoadedPost(anchorElement);
        if (!anchorParsed) return empty;

        const docSorted = [...all].sort((a, b) => {
            const aY = a.element.getBoundingClientRect().top + window.scrollY;
            const bY = b.element.getBoundingClientRect().top + window.scrollY;
            return aY - bY;
        });

        const anchorKey = `${anchorParsed.tweetId}-${anchorParsed.isRepost}`;
        const anchorIdx = docSorted.findIndex(p => `${p.tweetId}-${p.isRepost}` === anchorKey);
        const n = CONFIG.CONTEXT_NEIGHBOR_COUNT;

        let neighborsBefore = [];
        let neighborsAfter = [];
        if (anchorIdx >= 0) {
            neighborsBefore = docSorted
                .slice(Math.max(0, anchorIdx - n), anchorIdx)
                .map(compactPostRef)
                .filter(Boolean);
            neighborsAfter = docSorted
                .slice(anchorIdx + 1, anchorIdx + 1 + n)
                .map(compactPostRef)
                .filter(Boolean);
        }

        const visibleAtSave = getVisiblePosts()
            .map(v => compactPostRef(parseLoadedPost(v.element)))
            .filter(Boolean);

        return { neighborsBefore, neighborsAfter, visibleAtSave };
    }

    function classifyFeedState(bookmark = lastReadPost) {
        const all = getAllLoadedPostsParsed();

        if (pendingNewPosts >= CONFIG.MASS_INFLUX_PENDING_THRESHOLD) {
            return 'MASS_INFLUX';
        }

        if (bookmark?.tweetId && all.length >= 40) {
            try {
                const bookmarkId = BigInt(bookmark.tweetId);
                const ids = all.map(p => p.bigId);
                const newest = ids.reduce((max, id) => (id > max ? id : max), ids[0]);
                const loadedSpan = Number(newest - ids.reduce((min, id) => (id < min ? id : min), ids[0]));
                const gapFromBookmark = Number(newest - bookmarkId);
                if (loadedSpan > 0 && gapFromBookmark > loadedSpan * 0.6 && all.length >= 80) {
                    return 'MASS_INFLUX';
                }
            } catch (e) {
                debugLog('Resolve', 'classifyFeedState ID-Vergleich fehlgeschlagen:', e);
            }
        }

        if (postHistoryCache.length >= 5) {
            const recent = postHistoryCache.slice(-20);
            const domKeys = new Set(all.map(p => `${p.tweetId}-${p.isRepost}`));
            const found = recent.filter(e => domKeys.has(`${e.tweetId}-${!!e.isRepost}`)).length;
            if (recent.length > 0 && found / recent.length < 0.35) {
                return 'DEGRADED';
            }
        }

        const ctx = bookmark?.context;
        if (ctx && bookmark?.tweetId) {
            const anchorPresent = all.some(p =>
                p.tweetId === bookmark.tweetId &&
                p.authorHandler === bookmark.authorHandler &&
                p.isRepost === !!bookmark.isRepost
            );
            if (!anchorPresent) {
                const refs = [...(ctx.neighborsBefore || []), ...(ctx.neighborsAfter || [])];
                const domKeys = new Set(all.map(p => `${p.tweetId}-${p.isRepost}`));
                const surviving = refs.filter(r => domKeys.has(postRefKey(r))).length;
                if (surviving >= 2) {
                    return 'REORDER';
                }
            }
        }

        return 'NORMAL';
    }

    function matchByContext(bookmark, all, feedState = 'NORMAL') {
        const ctx = bookmark?.context;
        if (!ctx || all.length === 0) return null;

        const contextRefs = [];
        const seen = new Set();
        for (const ref of [
            ...(ctx.neighborsBefore || []),
            ...(ctx.neighborsAfter || []),
            ...(ctx.visibleAtSave || [])
        ]) {
            const key = postRefKey(ref);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            contextRefs.push(ref);
        }
        if (contextRefs.length === 0) return null;

        const docSorted = [...all].sort((a, b) => {
            const aY = a.element.getBoundingClientRect().top + window.scrollY;
            const bY = b.element.getBoundingClientRect().top + window.scrollY;
            return aY - bY;
        });

        const refPositions = new Map();
        docSorted.forEach((p, idx) => {
            refPositions.set(`${p.tweetId}-${p.isRepost}`, idx);
        });

        const beforePositions = (ctx.neighborsBefore || [])
            .map(postRefKey)
            .filter(k => refPositions.has(k))
            .map(k => refPositions.get(k));
        const afterPositions = (ctx.neighborsAfter || [])
            .map(postRefKey)
            .filter(k => refPositions.has(k))
            .map(k => refPositions.get(k));

        const overshootPenalty = feedState === 'MASS_INFLUX' ? 8 : 15;
        let bookmarkId = null;
        try {
            bookmarkId = BigInt(bookmark.tweetId);
        } catch (e) {
            bookmarkId = null;
        }

        let best = null;
        let bestScore = 0;

        for (let i = 0; i < docSorted.length; i++) {
            const candidate = docSorted[i];
            let score = 0;

            for (const ref of contextRefs) {
                const key = postRefKey(ref);
                const refIdx = refPositions.get(key);
                if (refIdx === undefined) continue;
                const distance = Math.abs(refIdx - i);
                if (distance <= 2) score += 25;
                else if (distance <= 5) score += 12;
                else score += 4;
            }

            if ((ctx.visibleAtSave || []).some(v => postRefKey(v) === `${candidate.tweetId}-${candidate.isRepost}`)) {
                score += 15;
            }

            if (beforePositions.length > 0) {
                const maxBefore = Math.max(...beforePositions);
                if (i >= maxBefore && i <= maxBefore + 2) score += 20;
            }
            if (afterPositions.length > 0) {
                const minAfter = Math.min(...afterPositions);
                if (i <= minAfter && i >= minAfter - 2) score += 20;
            }

            if (bookmarkId !== null && candidate.bigId > bookmarkId) {
                score -= overshootPenalty;
            }

            if (score > bestScore) {
                bestScore = score;
                best = candidate;
            }
        }

        if (!best || bestScore < CONFIG.CONTEXT_MATCH_MIN_SCORE) return null;

        const maxPossible = contextRefs.length * 25 + 55;
        const confidence = Math.max(45, Math.min(85, Math.round((bestScore / Math.max(maxPossible, 1)) * 100)));

        return {
            post: best,
            confidence,
            strategy: 'context',
            reason: `neighbor-overlap (${bestScore} pts, ${feedState})`
        };
    }

    function parseLoadedPost(postElement) {
        if (!postElement) return null;
        const tweetId = getPostTweetId(postElement);
        const authorHandler = getPostAuthorHandler(postElement);
        const timestamp = getPostTimestamp(postElement);
        const repostFlag = isRepost(postElement);
        if (!tweetId || !authorHandler || !timestamp) return null;
        const postTime = new Date(timestamp).getTime();
        if (isNaN(postTime)) return null;
        try {
            return {
                element: postElement,
                tweetId,
                authorHandler,
                timestamp,
                isRepost: repostFlag,
                bigId: BigInt(tweetId),
                postTime
            };
        } catch (e) {
            return null;
        }
    }

    function getAllLoadedPostsParsed() {
        return Array.from(document.querySelectorAll('article'))
            .map(parseLoadedPost)
            .filter(Boolean);
    }

    function findNextOlderPostInDom(bookmark, all) {
        ensureBookmarkInMap(bookmark);
        const fromMap = findNextOlderPostInMap(bookmark, all);
        if (fromMap) {
            diagPush('MAP_OLDER_HIT', 'info', fromMap.reason, {
                bookmark: diagBookmark(bookmark),
                mapSize: timelineMapOrderedKeys.length,
            });
            return fromMap;
        }

        return null;
    }

    function emergencyLandReadingPosition(bookmark = lastReadPost) {
        const all = getAllLoadedPostsParsed();
        if (!all.length) return null;

        const domByKey = new Map();
        for (const parsed of all) {
            const key = postRefKey(parsed);
            if (key) domByKey.set(key, parsed);
        }

        if (bookmark?.tweetId && timelineMapOrderedKeys.length) {
            const bookmarkIdx = ensureBookmarkInMap(bookmark);
            if (bookmarkIdx >= 0) {
                for (let offset = 0; offset < timelineMapOrderedKeys.length; offset++) {
                    const candidates = offset === 0
                        ? [bookmarkIdx]
                        : [bookmarkIdx - offset, bookmarkIdx + offset];
                    for (const i of candidates) {
                        if (i < 0 || i >= timelineMapOrderedKeys.length) continue;
                        const parsed = domByKey.get(timelineMapOrderedKeys[i]);
                        if (!parsed) continue;
                        return {
                            post: parsed,
                            confidence: offset === 0 ? 95 : Math.max(15, 55 - offset * 4),
                            strategy: offset === 0 ? 'exact' : 'older',
                            reason: offset === 0 ? 'map-exact-emergency' : `map-nearest (offset ${offset})`
                        };
                    }
                }
            }
        }

        const visibleParsed = getVisiblePosts()
            .map(v => parseLoadedPost(v.element))
            .filter(Boolean);

        if (visibleParsed.length > 0) {
            const pick = visibleParsed[Math.floor(visibleParsed.length / 2)];
            return {
                post: pick,
                confidence: 15,
                strategy: 'emergency',
                reason: 'viewport-middle'
            };
        }

        const sorted = [...all].sort((a, b) => {
            const aTop = a.element.getBoundingClientRect().top;
            const bTop = b.element.getBoundingClientRect().top;
            return Math.abs(aTop - CONFIG.RESTORE_SCROLL_OFFSET) - Math.abs(bTop - CONFIG.RESTORE_SCROLL_OFFSET);
        });
        return {
            post: sorted[0],
            confidence: 10,
            strategy: 'emergency',
            reason: 'nearest-to-restore-offset'
        };
    }

    function snapshotLoadedPostKeys() {
        const keys = new Set();
        for (const parsed of getAllLoadedPostsParsed()) {
            const key = postRefKey(parsed);
            if (key) keys.add(key);
        }
        return keys;
    }

    function collectNewPostsSinceBaseline(bookmark, baselineKeys) {
        if (!bookmark?.tweetId || !baselineKeys?.size) return [];

        let bookmarkId = null;
        try {
            bookmarkId = BigInt(bookmark.tweetId);
        } catch (e) {
            return [];
        }

        const candidates = [];
        const seen = new Set();
        for (const parsed of getAllLoadedPostsParsed()) {
            const key = postRefKey(parsed);
            if (!key || seen.has(key)) continue;
            const isNewByKey = !baselineKeys.has(key);
            let isNewById = false;
            try {
                isNewById = (parsed.bigId ?? BigInt(parsed.tweetId)) > bookmarkId;
            } catch (e) {
                continue;
            }
            // Nur wirklich neue Beiträge (höhere ID + nicht in Baseline).
            // Ältere Posts, die beim Scrollen nachgeladen werden, sind kein „Neue Beiträge“-Injekt.
            if (isNewByKey && isNewById) {
                seen.add(key);
                candidates.push(parsed);
            }
        }
        return candidates;
    }

    function pickOldestNewPost(candidates) {
        if (!candidates?.length) return null;
        return candidates.reduce((oldest, post) => {
            try {
                const id = post.bigId ?? BigInt(post.tweetId);
                const oldId = oldest.bigId ?? BigInt(oldest.tweetId);
                return id < oldId ? post : oldest;
            } catch (e) {
                return oldest;
            }
        });
    }

    function mergeNewPostCandidates(existing, incoming) {
        const merged = [...existing];
        const seen = new Set(existing.map(p => postRefKey(p)).filter(Boolean));
        for (const post of incoming) {
            const key = postRefKey(post);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            merged.push(post);
        }
        return merged;
    }

    /**
     * Nach „Neue Beiträge“: nach unten scrollen bis Lesestelle gefunden
     * oder keine weiteren Posts mehr geladen werden → sonst ältester neuer Post.
     */
    async function restoreReadingPositionAfterNewPosts(bookmark, baselineKeys) {
        if (!bookmark?.tweetId) return null;

        let bookmarkId = null;
        try {
            bookmarkId = BigInt(bookmark.tweetId);
        } catch (e) {
            return null;
        }

        const maxSteps = CONFIG.NEW_POSTS_SCROLL_SEARCH_MAX_ATTEMPTS;
        debugLog('Restore', `New-Posts: Scroll nach unten (max ${maxSteps}) — Ziel @${bookmark.authorHandler}`);
        diagPush('NEWPOSTS_SCROLL_SEARCH', 'info', 'New-Posts Scroll-Restore gestartet', {
            frozen: diagBookmark(bookmark),
            baselinePosts: baselineKeys?.size ?? 0,
            maxSteps,
        });

        await new Promise(r => setTimeout(r, 450));

        let newPostCandidates = collectNewPostsSinceBaseline(bookmark, baselineKeys);
        let lastArticleCount = document.querySelectorAll('article').length;
        let lastScrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight;
        let stagnantLoads = 0;
        let stagnantScroll = 0;

        searchControl.isAutoScrolling = true;
        try {
            for (let step = 0; step <= maxSteps; step++) {
                const exact = findBookmarkExactInDom(bookmark);
                if (exact) {
                    debugLog('Restore', `Lesestelle gefunden (Schritt ${step}): @${bookmark.authorHandler}`);
                    return {
                        post: exact,
                        confidence: 100,
                        strategy: 'exact',
                        reason: step === 0 ? 'new-posts-immediate' : `new-posts-scroll (step ${step})`,
                        adopt: false,
                        feedState: classifyFeedState(bookmark),
                    };
                }

                newPostCandidates = mergeNewPostCandidates(
                    newPostCandidates,
                    collectNewPostsSinceBaseline(bookmark, baselineKeys)
                );

                if (step > 0) {
                    const articleCount = document.querySelectorAll('article').length;
                    const scrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight;
                    const atBottom = window.scrollY + window.innerHeight >= scrollHeight - 80;

                    stagnantLoads = articleCount === lastArticleCount ? stagnantLoads + 1 : 0;
                    stagnantScroll = scrollHeight === lastScrollHeight ? stagnantScroll + 1 : 0;
                    lastArticleCount = articleCount;
                    lastScrollHeight = scrollHeight;

                    if (stagnantLoads >= CONFIG.NEW_POSTS_SCROLL_STAGNANT_LOADS &&
                        stagnantScroll >= CONFIG.NEW_POSTS_SCROLL_STAGNANT_HEIGHT &&
                        atBottom) {
                        debugLog('Restore', `Keine weiteren Posts (${articleCount} articles, scrollHeight ${scrollHeight})`);
                        break;
                    }
                }

                if (step >= maxSteps) break;

                window.scrollBy({ top: CONFIG.NEW_POSTS_SCROLL_STEP_PX, behavior: 'auto' });
                await new Promise(r => setTimeout(r, CONFIG.NEW_POSTS_SCROLL_SETTLE_MS));
                updateTimelineMap('new-posts-restore-scroll', 'down');
            }
        } finally {
            searchControl.isAutoScrolling = false;
            scrollState.programmaticScrollEndedAt = Date.now();
        }

        const finalExact = findBookmarkExactInDom(bookmark);
        if (finalExact) {
            return {
                post: finalExact,
                confidence: 100,
                strategy: 'exact',
                reason: 'new-posts-scroll-final',
                adopt: false,
                feedState: classifyFeedState(bookmark),
            };
        }

        newPostCandidates = mergeNewPostCandidates(
            newPostCandidates,
            collectNewPostsSinceBaseline(bookmark, baselineKeys)
        );
        const oldestNew = pickOldestNewPost(newPostCandidates);
        if (oldestNew) {
            debugLog('Restore', `Lesestelle nicht gefunden — ältester neuer Post: @${oldestNew.authorHandler} ${oldestNew.tweetId} (${newPostCandidates.length} Kandidaten)`);
            diagPush('NEWPOSTS_OLDEST_NEW', 'warn', 'Lesestelle ersetzt durch ältesten neuen Post', {
                frozen: diagBookmark(bookmark),
                adopted: diagBookmark(oldestNew),
                candidateCount: newPostCandidates.length,
            });
            return {
                post: oldestNew,
                confidence: 78,
                strategy: 'new-posts-oldest',
                reason: 'oldest-injected-post-after-scroll',
                adopt: true,
                feedState: classifyFeedState(bookmark),
            };
        }

        debugLog('Restore', 'Weder Lesestelle noch neue Posts erkannt');
        return null;
    }

    function resolveReadingPosition(bookmark = lastReadPost) {
        const all = getAllLoadedPostsParsed();
        const feedState = classifyFeedState(bookmark);
        debugLog('Resolve', `Feed-State: ${feedState}`);

        if (!bookmark || !bookmark.tweetId) {
            return emergencyLandReadingPosition(bookmark);
        }

        ensureBookmarkInMap(bookmark);

        const bookmarkIsRepost = !!bookmark.isRepost;

        const exact = all.find(p =>
            p.tweetId === bookmark.tweetId &&
            p.authorHandler === bookmark.authorHandler &&
            p.isRepost === bookmarkIsRepost
        );
        if (exact) {
            return { post: exact, confidence: 100, strategy: 'exact', reason: 'tweet-id-match', feedState };
        }

        const older = findNextOlderPostInDom(bookmark, all);
        if (older) {
            older.feedState = feedState;
            debugLog('Resolve', `Exakter Post fehlt — nächst älterer (Landkarte): @${older.post.authorHandler} ${older.post.tweetId}`);
            return older;
        }

        debugLog('Resolve', 'Kein älterer Post in Landkarte — Emergency-Landing');
        const emergency = emergencyLandReadingPosition(bookmark);
        if (emergency) emergency.feedState = feedState;
        return emergency;
    }

    function getResolveStrategyLabel(strategy, lang) {
        const labels = {
            de: { exact: 'exakt', older: 'nächster älterer', context: 'Kontext', trail: 'Verlauf', temporal: 'Zeit', emergency: 'Notfall', 'new-posts-oldest': 'ältester neuer Post' },
            en: { exact: 'exact', older: 'next older', context: 'context', trail: 'history', temporal: 'time', emergency: 'emergency', 'new-posts-oldest': 'oldest new post' }
        };
        const table = labels[lang] || labels.en;
        return table[strategy] || strategy;
    }

    function getResolvePopupKey(resolved) {
        if (!resolved || resolved.strategy === 'exact') return null;
        if (resolved.feedState === 'DEGRADED' || resolved.feedState === 'MASS_INFLUX') {
            return 'feedStronglyChanged';
        }
        if (resolved.confidence >= 40) return 'approximatePosition';
        return 'tweetIdNotFound';
    }

    function findBookmarkExactInDom(bookmark) {
        if (!bookmark?.tweetId) return null;
        const bookmarkIsRepost = !!bookmark.isRepost;
        return getAllLoadedPostsParsed().find(p =>
            p.tweetId === bookmark.tweetId &&
            p.authorHandler === bookmark.authorHandler &&
            p.isRepost === bookmarkIsRepost
        ) || null;
    }

    function shouldScrollSearchForBookmark(bookmark) {
        if (!bookmark?.tweetId) return false;
        // Manuelle Suche: nur ohne Scroll-Suche beenden, wenn exakter Treffer im DOM liegt.
        // Context/Trail/Temporal können „nah dran“ liegen, während der Ziel-Post wenige Einträge entfernt ist.
        return findBookmarkExactInDom(bookmark) === null;
    }

    async function applyResolvedReadingPosition(resolved, options = {}) {
        const { adopt = true, scroll = true, expectedBookmark = null, verifySource = 'resolve' } = options;
        if (!resolved?.post?.element) {
            diagPush('LANDING_FAIL', 'error', 'applyResolvedReadingPosition: kein Post-Element', {
                strategy: resolved?.strategy,
                snapshot: diagSnapshot(),
            });
            return false;
        }

        const { post, confidence, strategy } = resolved;

        const fresh = resolveFreshPostElement(post.element, post.tweetId, post.authorHandler) || post.element;

        let skipScroll = scroll && isPostAtReadingOffset(fresh);
        if (skipScroll && verifySource === 'new-posts-restore' && expectedBookmark) {
            // Nach New-Posts: nur ohne Scroll beenden, wenn der eingefrorene Bookmark wirklich am 175px-Ziel liegt
            skipScroll = topPostMatchesBookmark(fresh, expectedBookmark) && isPostAtReadingOffset(fresh);
            if (!skipScroll) {
                debugLog('Position', 'New-Posts-Restore: Scroll erzwungen (Bookmark nicht am Ziel-Offset)');
            }
        }

        if (skipScroll) {
            debugLog('Position', 'Restore-Scroll übersprungen — bereits am Ziel-Offset');
            diagPush('POSITION_SKIP', 'info', 'Restore ohne Scroll (bereits am Offset)', {
                deviation: Math.round(getPostOffsetDeviation(fresh)),
            });
            applyHighlightToPost(fresh, { confidence, strategy });
        } else if (scroll) {
            const scrollOpts = verifySource === 'new-posts-restore'
                ? { ignoreAnchorStale: true }
                : {};
            await new Promise(resolve => scrollToPostWithHighlight(post.element, resolve, scrollOpts));
            applyHighlightToPost(fresh, { confidence, strategy });
        } else {
            applyHighlightToPost(fresh, { confidence, strategy });
        }

        if (adopt) {
            await adoptFallbackPost(fresh);
            if (lastReadPost) {
                lastReadPost.resolveStrategy = strategy;
                lastReadPost.resolveConfidence = confidence;
            }
        } else if (verifySource === 'new-posts-restore' && expectedBookmark?.tweetId) {
            scheduleHighlightRetries(expectedBookmark.tweetId, expectedBookmark.authorHandler, [0, 300, 900, 2000, 3500]);
        }

        log('Resolve', `Landing (${strategy}, ${confidence}%): @${post.authorHandler} ${post.tweetId}`);
        if (expectedBookmark) {
            diagVerifyLanding(expectedBookmark, resolved, verifySource);
        }
        return true;
    }

    async function landReadingPositionFromResolve(reason = '', bookmark = lastReadPost) {
        if (reason) {
            debugLog('Resolve', `Start: ${reason}`);
        }

        let resolved = resolveReadingPosition(bookmark);
        if (!resolved) {
            await new Promise(r => setTimeout(r, 900));
            resolved = resolveReadingPosition(bookmark);
        }

        searchControl.isFallbackSearching = true;

        if (resolved) {
            await applyResolvedReadingPosition(resolved, {
                expectedBookmark: bookmark,
                verifySource: reason || 'land-resolve',
            });
            dismissActionPopup();

            const popupKey = getResolvePopupKey(resolved);
            if (popupKey) {
                const lang = getUserLanguage();
                showPopup(popupKey, 6000, {
                    strategy: getResolveStrategyLabel(resolved.strategy, lang)
                });
            }
        } else {
            log('Resolve', 'Kein article im DOM — Landing nicht möglich');
            diagPush('RESOLVE_EMPTY_DOM', 'error', `Kein Landing möglich (${reason})`, {
                expected: diagBookmark(bookmark),
                snapshot: diagSnapshot(),
            });
            dismissActionPopup();
            showPopup('searchNoPosition', 5000);
        }

        endManualSearchSession();
        searchControl.isFallbackSearching = false;
        return !!resolved;
    }

    /**
     * Zentralisierte Scroll-Logik inklusive Stagnationserkennung.
     * Wird an mehreren Stellen innerhalb der Suche verwendet.
     */
    async function performScrollAndContinue(continueFn, onStagnationCleanup = null) {
        const currentScrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight;

        if (currentScrollHeight === scrollState.lastScrollHeight) {
            scrollState.stagnantScrollCount++;
            const awaitingAnchors = isAwaitingHistoricalMapAnchors();
            const stagnantLimit = awaitingAnchors
                ? CONFIG.MAP_ANCHOR_SEARCH_MAX_STAGNANT
                : CONFIG.MAX_STAGNANT_SCROLLS;

            if (scrollState.stagnantScrollCount > stagnantLimit) {
                log('Search', `Suche abgebrochen: Keine neuen Posts nach Stagnation (${stagnantLimit}).`);
                diagPush('SEARCH_STAGNATION', 'warn', 'Scroll-Suche stagniert — Fallback-Resolve', {
                    stagnantScrolls: scrollState.stagnantScrollCount,
                    awaitingMapAnchors: awaitingAnchors,
                    snapshot: diagSnapshot(),
                });
                clearMapSnapshotForSearch();
                endManualSearchSession();
                updateActionPopup('tweetIdNotFound', {
                    authorHandler: lastReadPost?.authorHandler,
                    tweetId: lastReadPost?.tweetId
                });
                void landReadingPositionFromResolve('stagnation');

                if (typeof onStagnationCleanup === 'function') {
                    try { onStagnationCleanup(); } catch (e) { /* ignore */ }
                }
                return;
            }

            if (awaitingAnchors && scrollState.stagnantScrollCount > CONFIG.MAX_STAGNANT_SCROLLS) {
                debugLog('Search', `Stagnation (${scrollState.stagnantScrollCount}), warte weiter auf historische Landkarten-Posts…`);
            }
        } else {
            scrollState.stagnantScrollCount = 0;
        }

        scrollState.lastScrollHeight = currentScrollHeight;

        const scrollStep = calculateScrollStep();
        window.scrollBy({ top: scrollStep, behavior: 'smooth' });

        await new Promise(resolve => setTimeout(resolve, 300));
        if (continueFn) {
            requestAnimationFrame(() => setTimeout(continueFn, 300));
        }
    }


    /**
     * Zentralisiert alle gängigen Abbruchbedingungen der Suche.
     * Gibt true zurück, wenn die Suche abgebrochen werden soll (inkl. Side-Effects wie Cleanup).
     * Mit optionale reason für besseres Logging während Punkt 4 Refactoring.
     */
    function shouldAbortSearch(reason = '', currentScrollCount = 0, onCleanup = null) {
        const logPrefix = reason ? `[${reason}] ` : '';
        const doCleanup = (dismissPopup = true) => {
            endManualSearchSession();
            if (dismissPopup) dismissActionPopup();
            if (typeof onCleanup === 'function') {
                try { onCleanup(); } catch (e) { /* ignore cleanup errors */ }
            }
        };

        const startFallbackSearch = () => {
            clearMapSnapshotForSearch();
            endManualSearchSession();
            updateActionPopup('tweetIdNotFound', {
                authorHandler: lastReadPost?.authorHandler,
                tweetId: lastReadPost?.tweetId
            });
            void landReadingPositionFromResolve('search-abort');
            if (typeof onCleanup === 'function') {
                try { onCleanup(); } catch (e) { /* ignore cleanup errors */ }
            }
        };

        if (searchControl.isSearchCancelled) {
            debugLog('Search', `${logPrefix}Suche abgebrochen durch Benutzer.`);
            diagPush('SEARCH_CANCELLED', 'warn', 'Suche vom User abgebrochen', { reason, snapshot: diagSnapshot() });
            doCleanup(true);
            return true;
        }

        if (!searchControl.isSearching) {
            debugLog('Search', `${logPrefix}Suche bereits beendet.`);
            diagPush('SEARCH_ALREADY_ENDED', 'anomaly', `Suche-Schleife lief obwohl isSearching=false (${reason})`, {
                manualSearchActive: searchControl.manualSearchActive,
                snapshot: diagSnapshot(),
            });
            doCleanup(true);
            return true;
        }

        const awaitingAnchors = isAwaitingHistoricalMapAnchors();
        const scrollAttemptLimit = awaitingAnchors
            ? CONFIG.MAP_ANCHOR_SEARCH_MAX_ATTEMPTS
            : CONFIG.MAX_SCROLL_ATTEMPTS;
        const loadedPostLimit = awaitingAnchors
            ? CONFIG.MAP_ANCHOR_SEARCH_MAX_LOADED
            : CONFIG.MAX_LOADED_POSTS_BEFORE_FALLBACK;

        if (currentScrollCount > scrollAttemptLimit) {
            log('Search', `${logPrefix}Maximale Scroll-Versuche erreicht (${scrollAttemptLimit}), starte Fallback.`);
            diagPush('SEARCH_MAX_ATTEMPTS', 'warn', 'Max Scroll-Versuche erreicht', {
                scrollCount: currentScrollCount,
                awaitingMapAnchors: awaitingAnchors,
                snapshot: diagSnapshot(),
            });
            startFallbackSearch();
            return true;
        }

        if (scrollState.totalLoadedPosts > loadedPostLimit) {
            debugLog('Search', `${logPrefix}Über ${loadedPostLimit} Posts geladen – Suche abgebrochen.`);
            diagPush('SEARCH_TOO_MANY_POSTS', 'warn', 'Zu viele Posts geladen — Fallback', {
                loaded: scrollState.totalLoadedPosts,
                awaitingMapAnchors: awaitingAnchors,
                snapshot: diagSnapshot(),
            });
            startFallbackSearch();
            return true;
        }

        if (awaitingAnchors &&
            (currentScrollCount > CONFIG.MAX_SCROLL_ATTEMPTS ||
                scrollState.totalLoadedPosts > CONFIG.MAX_LOADED_POSTS_BEFORE_FALLBACK)) {
            debugLog('Search', `${logPrefix}Normale Limits überschritten — Suche fortsetzen bis historische Landkarten-Posts erscheinen (${scrollState.totalLoadedPosts} geladen, Versuch ${currentScrollCount}).`);
        }

        return false;
    }


    async function startRefinedSearchForLastReadPost(fromFile = false) {
    debugLog('Search', 'Starte optimierte Suche für letzte Leseposition...');
    beginManualSearchSession();
    diagBeginFlow('manual-search', { fromFile });

    // Wichtig: Such-/Scroll-State zurücksetzen (Punkt 4)
    scrollState.scrollCyclePhase = 0;
    scrollState.hasCompletedCycle = false;
    scrollState.stagnantScrollCount = 0;
    scrollState.largeScrollCount = 0;
    scrollState.isSlowScrollMode = false;
    scrollState.searchDirection = 'down';
    scrollState.lastScrollHeight = 0;
    clearMapSnapshotForSearch();

    try {
    if (!isScriptActivated) {
        showPopup('searchScrollPrompt', 5000);
        diagEndFlow('warn', 'SEARCH_NOT_ACTIVATED', 'Skript nicht aktiviert');
        endManualSearchSession();
        return;
    }
    let storedData = null;
    const account = await getCurrentUserHandle();
    if (!fromFile) {
        await loadLastReadPost(async (data) => {
            if (!data) {
                debugLog('Search', `Keine Leseposition für Account ${account} gefunden.`);
                showPopup('searchNoPosition', 5000);
                diagEndFlow('fail', 'SEARCH_NO_BOOKMARK', 'Keine Leseposition gespeichert');
                endManualSearchSession();
                return;
            }
            storedData = data;
            debugLog('Search', `Geladene Leseposition für Account ${account}:`, storedData);
        });
    } else {
        storedData = lastReadPost;
    }
    if (!storedData || !storedData.tweetId || !storedData.authorHandler || !storedData.timestamp) {
        log('Search', 'Ungültige Leseposition:', storedData);
        showPopup('invalidPosition', 5000);
        diagEndFlow('fail', 'SEARCH_INVALID_BOOKMARK', 'Ungültige Leseposition', { storedData });
        endManualSearchSession();
        return;
    }
    lastReadPost = storedData;
    const searchBookmark = {
        tweetId: storedData.tweetId,
        authorHandler: storedData.authorHandler,
        timestamp: storedData.timestamp,
        isRepost: !!storedData.isRepost,
        readAt: storedData.readAt || storedData.timestamp,
        account: storedData.account
    };
    if (!lastReadPost.readAt) {
        lastReadPost.readAt = lastReadPost.timestamp;
    }
    const effectiveForAge = getEffectiveReadTimestamp(storedData);
    const positionAge = Date.now() - new Date(effectiveForAge).getTime();
    const ageThreshold = 24 * 60 * 60 * 1000;
    if (positionAge > ageThreshold) {
        const continueSearch = confirm(getTranslatedMessage('oldPositionWarning', getUserLanguage()));
        if (!continueSearch) {
            debugLog('Search', 'Suche abgebrochen: Benutzer hat alte Position abgelehnt.');
            diagEndFlow('warn', 'SEARCH_OLD_DECLINED', 'User lehnte alte Position ab');
            await landReadingPositionFromResolve('old-position-declined', searchBookmark);
            return;
        }
    }
    diagPush('BOOKMARK_TARGET', 'info', 'Such-Ziel gesetzt', { target: diagBookmark(searchBookmark) });
    debugLog('Search', `Suche für Account ${account}:`, lastReadPost);
    persistTimelineMap(true);
    updateTimelineMap('search-init', 'neutral');
    ensureBookmarkInMap(searchBookmark);
    captureMapSnapshotForSearch(searchBookmark);
    const exactInDom = findBookmarkExactInDom(searchBookmark);
    if (exactInDom) {
        debugLog('Search', 'Beitrag bereits im DOM gefunden, scrolle direkt.');
        lastReadPost.found = true;
        updateHighlightedPost();
        const finishExactDomSearch = () => {
            markTopVisiblePost(false);
            diagEndFlow('ok', 'SEARCH_EXACT_DOM', 'Exakter Treffer im DOM', { target: diagBookmark(searchBookmark) });
            clearMapSnapshotForSearch();
            endManualSearchSession();
        };
        activateRestoreSuppression(searchBookmark.tweetId);
        if (isPostAtReadingOffset(exactInDom.element)) {
            debugLog('Position', 'Exakter Treffer bereits am Lesestellen-Offset — Scroll übersprungen');
            diagPush('POSITION_SKIP', 'info', 'Lupe: kein Scroll nötig (bereits am Offset)', {
                deviation: Math.round(getPostOffsetDeviation(exactInDom.element)),
            });
            scheduleHighlightRetries(searchBookmark.tweetId, searchBookmark.authorHandler, [0, 300, 900, 2000, 3500]);
            finishExactDomSearch();
        } else {
            setTimeout(() => {
                scrollToPostWithHighlight(exactInDom.element, finishExactDomSearch);
            }, 450);
        }
        return;
    }

    if (!shouldScrollSearchForBookmark(searchBookmark)) {
        log('Search', 'Resolve-Landing ohne Scroll-Suche.');
        diagEndFlow('warn', 'SEARCH_PRE_RESOLVE', 'Kein exakter DOM-Treffer — Resolve ohne Scroll');
        await landReadingPositionFromResolve('search-pre-resolve', searchBookmark);
        return;
    }

    updateSearchDirectionFromMap(searchBookmark);
    const frozenIdx = getFrozenSearchBookmarkIdx();
    const viewport = getSearchViewportIndexRange();
    const inViewportRange = frozenIdx >= 0 && viewport.min >= 0 &&
        frozenIdx >= viewport.min && frozenIdx <= viewport.max;
    log('Search', inViewportRange
        ? `Ziel idx ${frozenIdx} im Viewport (${viewport.min}–${viewport.max}) — Feinsuche.`
        : `Ziel idx ${frozenIdx} außerhalb Viewport (${viewport.min}–${viewport.max}) — ${scrollState.searchDirection === 'up' ? 'nach oben' : 'nach unten'}.`);
    popup = createSearchPopup(searchBookmark);
    if (!popup) {
        log('Search', 'Popup konnte nicht erstellt werden.');
        diagEndFlow('fail', 'SEARCH_NO_POPUP', 'Such-Popup konnte nicht erstellt werden');
        endManualSearchSession();
        return;
    }
    const checkedTweetIds = new Set();
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const post = entry.target;
                const parsed = parseLoadedPost(post);
                if (parsed &&
                    parsed.tweetId === searchBookmark.tweetId &&
                    parsed.authorHandler === searchBookmark.authorHandler &&
                    parsed.isRepost === searchBookmark.isRepost) {
                    debugLog('Search', 'Beitrag via IntersectionObserver gefunden:', searchBookmark);
                    lastReadPost.found = true;
                    updateHighlightedPost(); // Border sofort

                    // Auch hier eine kleine Verzögerung, falls der Observer feuert, während noch gescrollt wird
                    setTimeout(() => {
                        scrollToPostWithHighlight(post);
                    }, 300);

                    activateRestoreSuppression(searchBookmark.tweetId);
                    markTopVisiblePost(false);

                    diagEndFlow('ok', 'SEARCH_IO_FOUND', 'Ziel via IntersectionObserver', {
                        target: diagBookmark(searchBookmark),
                    });
                    clearMapSnapshotForSearch();
                    endManualSearchSession();
                    dismissActionPopup();
                    window.removeEventListener('keydown', handleSpaceKey);
                    io.disconnect();
                }
            }
        });
    }, { threshold: 0.2 });
    function handleSpaceKey(event) {
        if (event.code === 'Space' && (searchControl.isSearching || searchControl.isFallbackSearching)) {
            searchControl.isSearchCancelled = true;
            dismissActionPopup();
            showPopup('fallbackSearchCancelled', 5000);
            debugLog('Search', 'Lupe-Suche per Space abgebrochen — Skript bleibt aktiv (Auto-Save/New-Posts normal).');
            endManualSearchSession();
            searchControl.isFallbackSearching = false;
            clearMapSnapshotForSearch();
            if (isNearTimelineTop() && !isReadingPositionAtTargetOffset()) {
                newPostsState.autoLoadPaused = false;
            }
            window.removeEventListener('keydown', handleSpaceKey);
            io.disconnect();
        }
    }
    window.addEventListener('keydown', handleSpaceKey);
    let scrollCount = 0;
    const search = async () => {
        scrollCount++;

        if (!searchControl.manualSearchActive) {
            debugLog('Search', 'Manuelle Suche beendet — Scroll-Schleife stoppt.');
            diagPush('SEARCH_LOOP_STOP', 'info', 'Scroll-Schleife sauber beendet');
            clearMapSnapshotForSearch();
            window.removeEventListener('keydown', handleSpaceKey);
            if (io) io.disconnect();
            return;
        }

        if (shouldAbortSearch('initial', scrollCount, () => {
            window.removeEventListener('keydown', handleSpaceKey);
            if (io) io.disconnect();
        })) return;

        let posts = getVisiblePosts().map(p => p.element);
        scrollState.totalLoadedPosts = Array.from(document.querySelectorAll('article')).length;
        debugLog('Search', `Prüfe ${posts.length} sichtbare Posts (Gesamt: ${scrollState.totalLoadedPosts}). Scroll-Versuch: ${scrollState.stagnantScrollCount + 1}, Zyklusphase: ${scrollState.scrollCyclePhase}`);

        if (shouldAbortSearch('loaded-posts', scrollCount, () => {
            window.removeEventListener('keydown', handleSpaceKey);
            if (io) io.disconnect();
        })) return;

        if (posts.length === 0) {
            debugLog('Search', 'Keine sichtbaren Posts im DOM, warte auf Laden...');
            await performScrollAndContinue(search, () => {
                window.removeEventListener('keydown', handleSpaceKey);
                if (io) io.disconnect();
            });
            return;
        }
        posts.forEach(post => io.observe(post));
        let found = false;
        for (const post of posts) {
            const parsed = parseLoadedPost(post);
            if (!parsed?.tweetId) continue;
            const checkKey = `${parsed.tweetId}-${parsed.isRepost}`;
            if (checkedTweetIds.has(checkKey)) continue;
            checkedTweetIds.add(checkKey);
            if (parsed.tweetId === searchBookmark.tweetId &&
                parsed.authorHandler === searchBookmark.authorHandler &&
                parsed.isRepost === searchBookmark.isRepost) {
                debugLog('Search', 'Beitrag gefunden:', searchBookmark);
                lastReadPost.found = true;
                updateHighlightedPost();

                setTimeout(() => {
                    scrollToPostWithHighlight(post);
                }, 250);

                activateRestoreSuppression(searchBookmark.tweetId);
                markTopVisiblePost(false);

                diagEndFlow('ok', 'SEARCH_LOOP_FOUND', 'Ziel in Scroll-Schleife gefunden', {
                    target: diagBookmark(searchBookmark),
                });
                clearMapSnapshotForSearch();
                endManualSearchSession();
                dismissActionPopup();
                window.removeEventListener('keydown', handleSpaceKey);
                io.disconnect();
                found = true;
                return;
            }
        }
        if (found) return;

        const mapDistance = getMapDistanceToTarget(searchBookmark);
        const searchCleanup = () => {
            window.removeEventListener('keydown', handleSpaceKey);
            io.disconnect();
        };

        if (isSearchFineZoneDistance(mapDistance)) {
            const domExact = findBookmarkExactInDom(searchBookmark);
            if (domExact?.element) {
                await landExactSearchHit(searchBookmark, domExact.element, 'SEARCH_FINE_DOM', searchCleanup);
                return;
            }

            scrollState.slowScrollFineAttempts++;
            if (scrollState.slowScrollFineAttempts > CONFIG.SLOW_SEARCH_FINE_MAX_ATTEMPTS) {
                await finishSearchWhenFineExhausted(searchBookmark, searchCleanup);
                return;
            }
        }

        updateSearchDirectionFromMap(searchBookmark);

        await performScrollAndContinue(search, () => {
            window.removeEventListener('keydown', handleSpaceKey);
            if (io) io.disconnect();
        });
    };
    await new Promise(resolve => setTimeout(resolve, 300));
    search();

    } catch (err) {
        log('Search', 'Unerwarteter Fehler in startRefinedSearchForLastReadPost:', err);
        diagEndFlow('fail', 'SEARCH_EXCEPTION', String(err?.message || err), { snapshot: diagSnapshot() });
        endManualSearchSession();
    }
}

    function calculateScrollStep() {
    const baseStep = window.innerHeight * 1.5;
    let step;
    if (scrollState.isSlowScrollMode) {
        step = baseStep * 0.5;
    } else {
        step = baseStep * 3;
    }

    let hoursDiff;
    const mapDistance = getMapDistanceToTarget(lastReadPost);
    const fineZoneActive = isSearchFineZoneActive(mapDistance);
    if (fineZoneActive) {
        step = CONFIG.SLOW_SEARCH_FINE_STEP_PX;
        scrollState.isSlowScrollMode = true;
    }
    if (mapDistance !== null && mapDistance > 12) {
        scrollState.isSlowScrollMode = false;
    }
    if (mapDistance !== null && mapDistance > 0 && !fineZoneActive) {
        let distanceFactor = Math.min(mapDistance / 5, 10);
        distanceFactor = Math.min(distanceFactor, CONFIG.MAX_SEARCH_DISTANCE_FACTOR);
        if (mapDistance > 12) {
            distanceFactor = Math.max(distanceFactor, 2.5);
        }
        step *= distanceFactor;
        hoursDiff = mapDistance / 4;
        debugLog('Search', `Landkarten-Distanz-Faktor: ${distanceFactor.toFixed(2)} (idx-Abstand: ${mapDistance}, Snapshot: ${!!scrollState.mapSnapshotOrderedKeys})`);
    }

    // Absoluter Cap auf Schrittgröße.
    // Bei weit entfernten Lesestellen (hoher hoursDiff) bewusst größere Sprünge erlauben.
    // Overshoot-Schutz nach "Neue Beiträge" passiert primär durch Force-Slow + Bracketing.
    let effectiveMaxVh = scrollState.isSlowScrollMode ? 1.4 : CONFIG.MAX_SEARCH_STEP_VH;
    // (hoursDiff ist im aktuellen Scope verfügbar)
    if (typeof hoursDiff !== 'undefined' && hoursDiff > 2 && scrollState.isSlowScrollMode) {
        effectiveMaxVh = Math.max(effectiveMaxVh, 2.4);
    }
    const maxStep = window.innerHeight * effectiveMaxVh;
    const sign = step < 0 ? -1 : 1;
    step = sign * Math.min(Math.abs(step), maxStep);

    // Landkarten-Index-Abstand steuert Scroll-Schrittgröße (größere Sprünge bei weit entfernten Zielen).

    if (scrollState.searchDirection === 'up') {
        step = -step;
    }
    if (!scrollState.isSlowScrollMode) {
        scrollState.largeScrollCount++;

        const inCoarsePhase = mapDistance !== null && mapDistance > 12;
        if (!inCoarsePhase && scrollState.largeScrollCount >= scrollState.maxLargeScrolls) {
            scrollState.isSlowScrollMode = true;
            debugLog('Search', 'Max große Scrolls erreicht → Wechsel zu Slow-Scroll-Mode');
        }
    }
    debugLog('Search', `Scroll-Schritt: ${step}px (Slow: ${scrollState.isSlowScrollMode}, Dir: ${scrollState.searchDirection})`);
    return step;
}

    function getPostOffsetDeviation(element) {
        if (!element?.getBoundingClientRect) return Infinity;
        return Math.abs(element.getBoundingClientRect().top - CONFIG.RESTORE_SCROLL_OFFSET);
    }

    function isPostAtReadingOffset(element, tolerance = CONFIG.POSITION_CORRECTION_TOLERANCE) {
        return getPostOffsetDeviation(element) <= tolerance;
    }

    function topPostMatchesBookmark(topPost, bookmark) {
        if (!topPost || !bookmark?.tweetId) return false;
        const tweetId = getPostTweetId(topPost);
        const authorHandler = getPostAuthorHandler(topPost);
        return tweetId === bookmark.tweetId &&
            authorHandler === bookmark.authorHandler &&
            !!isRepost(topPost) === !!bookmark.isRepost;
    }

    function isReadingPositionAtTargetOffset(bookmark = lastReadPost) {
        const restoreBookmark = snapshotReadingBookmark(bookmark);
        if (!restoreBookmark) return false;
        const anchorPost = getPostAtReadingOffset(150) || getTopVisiblePost();
        return !!(anchorPost &&
            topPostMatchesBookmark(anchorPost, restoreBookmark) &&
            isPostAtReadingOffset(anchorPost));
    }

    function logNewPostsAutoLoadPausedOnce() {
        const now = Date.now();
        if (now - newPostsState.lastPausedLogAt < 60000) return;
        newPostsState.lastPausedLogAt = now;
        debugLog('NewPosts', `Top-Post am Ziel-Offset (${CONFIG.RESTORE_SCROLL_OFFSET}px) — Auto-Laden pausiert`);
        diagPush('NEWPOSTS_ALREADY_POSITIONED', 'info', 'Auto-Laden pausiert (bereits am Offset)', {
            snapshot: diagSnapshot(),
        });
    }

    function isNewPostsAutoLoadPaused() {
        if (!isNearTimelineTop()) {
            newPostsState.autoLoadPaused = false;
            return false;
        }
        // Lesestelle am Ziel-Offset: pausieren, auch wenn darüber neuere Posts sichtbar sind
        // (erwartet nach erfolgreichem New-Posts-Restore — sonst Doppel-Klick-Schleife).
        if (isReadingPositionAtTargetOffset()) {
            if (!newPostsState.autoLoadPaused) {
                newPostsState.autoLoadPaused = true;
                logNewPostsAutoLoadPausedOnce();
            }
            return true;
        }
        if (findNewestVisiblePostNewerThanBookmark(lastReadPost)) {
            newPostsState.autoLoadPaused = false;
            return false;
        }
        newPostsState.autoLoadPaused = false;
        return false;
    }

    function tryAutoClickNewPosts() {
        if (!isScriptActivated ||
            searchControl.isSearching ||
            searchControl.isFallbackSearching ||
            searchControl.isAutoScrolling ||
            searchControl.newPostsRestoreActive ||
            !isNearTimelineTop()) {
            return;
        }
        if (Date.now() - newPostsState.lastRestoreCompletedAt < 6000) {
            return;
        }
        if (isNewPostsAutoLoadPaused()) {
            return;
        }
        const indicator = getNewPostsIndicator();
        if (indicator && indicator.dataset.processed !== 'true') {
            clickNewPostsIndicator();
        }
    }

    function finishPostHighlightAtOffset(element, anchorTweetId, anchorAuthor, onComplete, reason, options = {}) {
        const { ignoreAnchorStale = false } = options;
        if (!ignoreAnchorStale && isScrollAnchorStale(anchorTweetId, anchorAuthor)) {
            debugLog('Position', 'Scroll-Highlight abgebrochen — Lesestelle wurde zwischendurch aktualisiert');
            searchControl.isAutoScrolling = false;
            scrollState.programmaticScrollEndedAt = Date.now();
            syncHighlightIfDrifted();
            if (onComplete) onComplete();
            return;
        }
        const freshPost = resolveFreshPostElement(element, anchorTweetId, anchorAuthor) || element;
        debugLog('Position', reason);
        searchControl.isAutoScrolling = false;
        scrollState.programmaticScrollEndedAt = Date.now();
        updateHighlightedPost(freshPost);
        applyHighlightToPost(freshPost);
        if (anchorTweetId && anchorAuthor) {
            scheduleHighlightRetries(anchorTweetId, anchorAuthor, [0, 300, 900, 2000, 3500]);
        }
        if (onComplete) onComplete();
    }

    async function reinstateFrozenReadingBookmark(bookmark, options = {}) {
        const { save = true, highlight = true } = options;
        const frozen = snapshotReadingBookmark(bookmark);
        if (!frozen?.tweetId || !frozen.authorHandler) return false;

        const account = frozen.account || await getCurrentUserHandle();
        lastReadPost = { ...frozen, account };
        currentPost = lastReadPost;
        invalidateHighlightRetries();

        if (highlight) {
            const el = findPostElementInDOM(frozen.tweetId, frozen.authorHandler);
            if (el) {
                applyHighlightToPost(el);
                scheduleHighlightRetries(frozen.tweetId, frozen.authorHandler, [0, 300, 900, 2000, 3500]);
            } else {
                updateHighlightedPost();
            }
        }

        if (save) {
            await saveLastReadPost(lastReadPost, { force: true });
        }
        return true;
    }

    function scrollToPostWithHighlight(post, onComplete = null, options = {}) {
    const { ignoreAnchorStale = false } = options;
    if (!post) {
        log('Search', 'Kein Beitrag zum Scrollen.');
        endManualSearchSession();
        searchControl.isFallbackSearching = false;
        if (onComplete) onComplete();
        return;
    }
    const anchorTweetId = getPostTweetId(post);
    const anchorAuthor = getPostAuthorHandler(post);
    if (!ignoreAnchorStale && isScrollAnchorStale(anchorTweetId, anchorAuthor)) {
        debugLog('Position', 'Scroll übersprungen — Lesestelle wurde vor Positionierung aktualisiert');
        searchControl.isAutoScrolling = false;
        syncHighlightIfDrifted();
        if (onComplete) onComplete();
        return;
    }
    const activePostInitial = resolveFreshPostElement(post, anchorTweetId, anchorAuthor) || post;

    if (isPostAtReadingOffset(activePostInitial)) {
        finishPostHighlightAtOffset(
            activePostInitial,
            anchorTweetId,
            anchorAuthor,
            onComplete,
            `Bereits am Ziel (rect.top≈${CONFIG.RESTORE_SCROLL_OFFSET}px, Δ=${Math.round(getPostOffsetDeviation(activePostInitial))}px) — kein Scroll`,
            options
        );
        return;
    }

    searchControl.isAutoScrolling = true;
    const maxPositionAttempts = CONFIG.MAX_POSITION_ATTEMPTS;
    let positionAttempts = 0;
    let lastMeasuredTop = null;
    const tryPositionPost = () => {
        const activePost = resolveFreshPostElement(post, anchorTweetId, anchorAuthor) || post;

        if (isPostAtReadingOffset(activePost)) {
            doPrecisePositioning();
            return;
        }

        // Grob-Scroll nur wenn der Post weit vom Ziel-Offset entfernt ist (nicht bei Top-Post ≈175px).
        if (positionAttempts === 0) {
            const roughRect = activePost.getBoundingClientRect();
            const deviation = Math.abs(roughRect.top - CONFIG.RESTORE_SCROLL_OFFSET);
            const roughScrollThreshold = Math.max(220, window.innerHeight * 0.22);

            if (deviation < roughScrollThreshold) {
                doPrecisePositioning();
                return;
            }

            const currentScroll = window.scrollY;
            const roughTarget = currentScroll + roughRect.top - (window.innerHeight * 0.55);
            window.scrollTo({ top: roughTarget, behavior: 'auto' });

            setTimeout(() => {
                doPrecisePositioning();
            }, 900);
            return;
        }

        doPrecisePositioning();
    };

    const finishPositioning = (reason) => {
        finishPostHighlightAtOffset(post, anchorTweetId, anchorAuthor, onComplete, reason, options);
    };

    const doPrecisePositioning = () => {
        const activePost = resolveFreshPostElement(post, anchorTweetId, anchorAuthor) || post;
        const rect = activePost.getBoundingClientRect();
        const scrollY = window.scrollY;
        const offset = CONFIG.RESTORE_SCROLL_OFFSET;
        const targetY = scrollY + rect.top - offset;
        const deviation = Math.abs(rect.top - offset);

        debugLog('Position', `rect.top:${rect.top} scrollY:${scrollY} targetY:${targetY} Δ:${Math.round(deviation)} Versuch:${positionAttempts+1}`);

        if (!ignoreAnchorStale && isScrollAnchorStale(anchorTweetId, anchorAuthor)) {
            finishPostHighlightAtOffset(
                activePost,
                anchorTweetId,
                anchorAuthor,
                onComplete,
                'Positionierung abgebrochen — Lesestelle hat sich geändert',
                options
            );
            return;
        }

        applyHighlightToPost(activePost);

        if (deviation <= CONFIG.POSITION_CORRECTION_TOLERANCE) {
            finishPositioning(`Beitrag bereits nah am Ziel (rect.top=${rect.top}, Ziel=${offset}px).`);
            return;
        }

        window.scrollTo({ top: targetY, behavior: 'smooth' });

        setTimeout(() => {
            const freshPost = resolveFreshPostElement(post, anchorTweetId, anchorAuthor) || post;
            const newRect = freshPost.getBoundingClientRect();
            const postDeviation = Math.abs(newRect.top - offset);
            const isWellPositioned = postDeviation <= CONFIG.POSITION_CORRECTION_TOLERANCE;
            const isStuckAtTop = lastMeasuredTop !== null
                && Math.abs(newRect.top - lastMeasuredTop) < 2
                && postDeviation <= CONFIG.POSITION_CORRECTION_TOLERANCE + 5;

            if (isWellPositioned || isStuckAtTop) {
                finishPositioning(`Beitrag positioniert (rect.top=${newRect.top}, Ziel=${offset}px).`);
            } else if (positionAttempts < maxPositionAttempts - 1) {
                positionAttempts++;
                lastMeasuredTop = newRect.top;
                const correction = (newRect.top - offset) * 0.8;
                window.scrollBy({ top: -correction, behavior: 'smooth' });
                debugLog('Position', `Korrigiere um ${-correction}px (Versuch ${positionAttempts+1})`);
                setTimeout(tryPositionPost, 550);
            } else {
                log('Position', 'Maximale Positionierungsversuche erreicht. rect.top:', newRect.top);
                finishPositioning('Positionierung mit Toleranz abgeschlossen.');
            }
        }, 850);
    };

    tryPositionPost();
}

    async function findAndSetClosestPost() {
        scrollState.scrollCyclePhase = 0;
        scrollState.hasCompletedCycle = false;
        scrollState.stagnantScrollCount = 0;
        scrollState.largeScrollCount = 0;
        scrollState.isSlowScrollMode = false;
        scrollState.searchDirection = 'down';
        scrollState.lastScrollHeight = 0;
        await landReadingPositionFromResolve('legacy-fallback');
    }

    function createSearchPopup(position) {
    const messageKey = searchControl.isFallbackSearching ? 'tweetIdNotFound' : 'searchPopup';
    const actionPopup = showActionPopup(messageKey, {
        authorHandler: position.authorHandler,
        tweetId: position.tweetId
    });
    if (!actionPopup) {
        log('Search', 'document.body nicht verfügbar für createSearchPopup.');
    }
    return actionPopup;
}

    function isNearTimelineTop() {
        // Zentrale Prüfung: User ist nah am "Live-Top" der Timeline (nicht tief gescrollt).
        // Wird verwendet, um automatisches Laden neuer Beiträge nur dann zu erlauben,
        // wenn es sinnvoll ist (nicht wenn User bewusst ältere Posts liest).
        return window.scrollY < CONFIG.NEAR_TOP_SCROLL_THRESHOLD &&
               window.location.href.includes('/home');
    }

    function observeForNewPosts() {

    if (window.newPostsObserver) window.newPostsObserver.disconnect();

    const timelineContainer = document.querySelector('div[data-testid="primaryColumn"]') ||
                              document.querySelector('main[role="main"]') ||
                              document.documentElement;

    let lastCheck = 0;
    const THROTTLE_MS = 120;

    window.newPostsObserver = new MutationObserver(() => {
        const now = Date.now();
        if (now - lastCheck < THROTTLE_MS) return;
        lastCheck = now;

        const indicator = getNewPostsIndicator();
        if (indicator) {
            if (isNearTimelineTop()) {
                if (isNewPostsAutoLoadPaused()) {
                    debugLog('NewPosts', 'Indicator gesehen — Auto-Click pausiert (bereits am Offset, warte auf neuere Posts).');
                    return;
                }
                debugLog('NewPosts', 'Indicator erkannt – Auto-Click in 600ms (nach Lesestellen-Prüfung)');
                setTimeout(() => {
                    if (searchControl.manualSearchActive) {
                        debugLog('NewPosts', 'Auto-Click übersprungen — manuelle Suche aktiv.');
                        return;
                    }
                    if (searchControl.newPostsRestoreActive) {
                        debugLog('NewPosts', 'Auto-Click übersprungen — Restore läuft.');
                        diagBlocked('GUARD_OBSERVER_DEBOUNCE', 'Observer-Auto-Click während Restore blockiert');
                        return;
                    }
                    tryAutoClickNewPosts();
                }, 600);
                window.newPostsObserver.disconnect();
            } else {
                debugLog('NewPosts', 'Indicator gesehen bei scrollY=' + Math.round(window.scrollY) + ' – ignoriert (nicht nah am Top, kein Auto-Laden).');
                window.newPostsObserver.disconnect();
            }
        }
    });

    window.newPostsObserver.observe(timelineContainer, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    log('NewPosts', 'Observer gestartet (throttled + targeted)');
}

    function getNewPostsIndicator() {

    const postIndicatorPattern = /\b(new posts|neue posts(?:\s+sehen)?|neue posts sind verfügbar|neue Beiträge|nouveaux tweets|nuevos tweets|新しい投稿|Новые посты|novos posts|منشورات جديدة|nuovi post|새 게시물|new tweets|post anzeigen|posts anzeigen|show \d+ post|show \d+ posts)\b/i;
    const excludePattern = /\b(teilen|share|posten|veröffentlichen|grok)\b/i;

    const matchesNewPostsText = (text) => {
        const normalized = (text || '').toLowerCase().trim();
        return postIndicatorPattern.test(normalized) && !excludePattern.test(normalized);
    };

    // Live-Crawl 06/2026: Pill-Button mit data-testid="pillLabel" + „Neue Posts sehen“
    const pillLabel = document.querySelector('[data-testid="pillLabel"]');
    if (pillLabel) {
        const btn = pillLabel.closest('button, [role="button"]');
        if (btn && btn.dataset.processed !== 'true') {
            const combined = ((pillLabel.textContent || '') + ' ' + (btn.getAttribute('aria-label') || '')).trim();
            if (matchesNewPostsText(combined)) {
                const numMatch = combined.match(/(\d+)/);
                pendingNewPosts = numMatch ? parseInt(numMatch[1], 10) : 1;
                return btn;
            }
        }
    }

    const selectors = [
        'button[data-testid*="new-tweets"], button[data-testid*="new-posts"]',
        'button[aria-label*="Neue Posts"], button[aria-label*="neue Posts"], button[aria-label*="new posts"], button[aria-label*="neue Beiträge"]',
        'div[data-testid="cellInnerDiv"] button[role="button"][class*="css-175oi2r r-1777fci"]',
        'button[role="button"][class*="css-175oi2r"]',
        'button[aria-label*="nouveaux tweets"], button[aria-label*="nuevos tweets"], button[aria-label*="new tweets"]',
        'button span[class*="css-"][dir="ltr"]',
        'div[role="button"] span[data-testid*="new-tweet"], div[role="button"] span[aria-label*="posts"]'
    ];

    for (const selector of selectors) {
        const btn = document.querySelector(selector);
        if (btn && btn.dataset.processed !== 'true') {
            const span = getSelectorFallback(btn, ['span', '[data-testid="pillLabel"]']);
            const textContent = (span ? span.textContent : btn.getAttribute('aria-label') || '').toLowerCase().trim();

            if (matchesNewPostsText(textContent)) {
                const numMatch = textContent.match(/(\d+)/);
                pendingNewPosts = numMatch ? parseInt(numMatch[1], 10) : 1;
                return btn;
            }
        }
    }

    // Robust text-based fallback (X.com ändert häufig die DOM-Struktur)
    const candidates = document.querySelectorAll('button, [role="button"]');
    for (const el of candidates) {
        const txt = (el.textContent || el.getAttribute('aria-label') || '').toLowerCase().trim();
        if (matchesNewPostsText(txt)) {
            const rect = el.getBoundingClientRect();
            // Nur Elemente nah am oberen Rand des Viewports berücksichtigen
            if (rect.top > -100 && rect.top < 350 && rect.width > 50) {
                if (el.dataset.processed !== 'true') {
                    const numMatch = txt.match(/(\d+)/);
                    pendingNewPosts = numMatch ? parseInt(numMatch[1], 10) : 1;
                    return el;
                }
            }
        }
    }

    return null;
}

    async function ensureViewportLesestelleBeforeNewPosts() {
        if (searchControl.manualSearchActive) {
            debugLog('NewPosts', 'Lesestellen-Sync übersprungen — manuelle Suche aktiv.');
            return false;
        }
        if (!window.location.href.includes('/home')) return true;

        const anchorPost = getLesestelleAnchorPost();
        if (!anchorPost) {
            log('NewPosts', 'Kein Post im Viewport – Neue Beiträge zurückgestellt');
            return false;
        }

        const tweetId = getPostTweetId(anchorPost);
        const authorHandler = getPostAuthorHandler(anchorPost);
        const timestamp = getPostTimestamp(anchorPost);
        const repostFlag = isRepost(anchorPost);

        if (!tweetId || !authorHandler || !timestamp) {
            log('NewPosts', 'Top-Post im Viewport unvollständig – Neue Beiträge zurückgestellt');
            return false;
        }

        const matchesCurrent = lastReadPost &&
            lastReadPost.tweetId === tweetId &&
            lastReadPost.authorHandler === authorHandler &&
            !!lastReadPost.isRepost === repostFlag;

        if (matchesCurrent) {
            const logKey = `${tweetId}-${authorHandler}-${repostFlag}`;
            if (newPostsState.lastLesestelleLogKey !== logKey) {
                newPostsState.lastLesestelleLogKey = logKey;
                debugLog('NewPosts', `Lesestelle = Top-Post (@${authorHandler} ${tweetId})`);
            }
            return true;
        }

        const viewportCandidate = {
            tweetId,
            authorHandler,
            timestamp,
            isRepost: repostFlag
        };

        if (lastReadPost?.tweetId && BigInt(tweetId) < BigInt(lastReadPost.tweetId)) {
            // Am Timeline-Top ist ein älterer Viewport erwartbar (hochgescrollt, Lesestelle tiefer).
            // Bookmark wird in clickNewPostsIndicator eingefroren — kein Sync, aber Laden erlauben.
            if (isNearTimelineTop()) {
                debugLog('NewPosts',
                    `Viewport-Top (@${authorHandler} ${tweetId}) älter als Lesestelle (@${lastReadPost.authorHandler} ${lastReadPost.tweetId}) — am Top OK, Bookmark wird eingefroren.`);
                return true;
            }
            log('NewPosts', `Viewport-Top (@${authorHandler} ${tweetId}) ist älter als Lesestelle (@${lastReadPost.authorHandler} ${lastReadPost.tweetId}) — kein Auto-Laden/Restore.`);
            diagPush('BOOKMARK_OLDER_SKIPPED', 'warn',
                'Viewport-Top ist älter als Lesestelle — kein Sync vor New-Posts', {
                    viewport: diagBookmark(viewportCandidate),
                    bookmark: diagBookmark(lastReadPost),
                    snapshot: diagSnapshot(),
                });
            return false;
        }

        log('NewPosts', `Lesestelle weicht ab – synchronisiere @${authorHandler} ${tweetId} vor Neue-Beiträge`);

        suppressionState.until = 0;
        suppressionState.pastTweetId = null;

        if (isCandidateNewer(viewportCandidate, lastReadPost)) {
            const account = await getCurrentUserHandle();
            invalidateHighlightRetries();
            lastReadPost = {
                tweetId,
                authorHandler,
                timestamp,
                isRepost: repostFlag,
                account,
                readAt: new Date().toISOString()
            };
            await saveLastReadPost(lastReadPost);
            updateHighlightedPost();
            log('Save', 'Lesestelle vor New-Posts synchronisiert: @' + authorHandler, tweetId);
            diagPush('BOOKMARK_OVERWRITE', 'info', 'Lesestelle vor New-Posts aktualisiert', {
                newBookmark: diagBookmark(lastReadPost),
            });
        }

        return true;
    }

    async function clickNewPostsIndicator() {

    if (searchControl.manualSearchActive) {
        debugLog('NewPosts', 'Neue Beiträge übersprungen — manuelle Suche aktiv.');
        diagBlocked('GUARD_MANUAL_SEARCH', 'New-Posts während manueller Suche blockiert');
        return;
    }

    if (searchControl.newPostsRestoreActive) {
        debugLog('NewPosts', 'New-Posts-Restore läuft — Auto-Click übersprungen.');
        diagBlocked('GUARD_RESTORE_RUNNING', 'Doppelter New-Posts-Klick blockiert (Restore läuft)');
        return;
    }

    if (isNewPostsAutoLoadPaused() || isReadingPositionAtTargetOffset()) {
        if (!newPostsState.autoLoadPaused) {
            newPostsState.autoLoadPaused = true;
            logNewPostsAutoLoadPausedOnce();
        }
        return;
    }

    const ready = await ensureViewportLesestelleBeforeNewPosts();
    if (!ready) {
        return;
    }

    // Snapshot NACH Viewport-Sync: ensureViewport kann lastReadPost auf den
    // aktuell sichtbar-neuesten Post heben — ein früherer Snapshot würde sonst
    // nach New-Posts auf einen älteren Post zurückspringen (frozen ≠ live).
    const restoreBookmark = snapshotReadingBookmark();
    if (!restoreBookmark) {
        debugLog('NewPosts', 'Kein Bookmark — Neue Beiträge übersprungen.');
        diagBlocked('GUARD_NO_BOOKMARK', 'New-Posts ohne gespeichertes Bookmark blockiert');
        return;
    }

    if (isReadingPositionAtTargetOffset(restoreBookmark)) {
        newPostsState.autoLoadPaused = true;
        return;
    }

    const viewportAnchor = getLesestelleAnchorPost();
    const viewportTweetId = viewportAnchor ? getPostTweetId(viewportAnchor) : null;
    if (viewportTweetId && restoreBookmark?.tweetId &&
        BigInt(viewportTweetId) < BigInt(restoreBookmark.tweetId) &&
        !isNearTimelineTop()) {
        debugLog('NewPosts', 'Auto-Laden übersprungen — Viewport zeigt älteren Post als Lesestelle.');
        diagBlocked('GUARD_VIEWPORT_OLDER', 'New-Posts blockiert (Viewport älter als Bookmark)');
        return;
    }

    const btn = getNewPostsIndicator();
    if (!btn) {
        debugLog('NewPosts', 'Kein Button gefunden');
        return;
    }

    const postsBeforeNewPosts = snapshotLoadedPostKeys();
    debugLog('NewPosts', `Baseline vor Laden: ${postsBeforeNewPosts.size} Posts im DOM`);

    searchControl.newPostsRestoreActive = true;
    searchControl.isSearching = true;
    diagBeginFlow('new-posts-restore', { frozenBookmark: diagBookmark(restoreBookmark) });
    diagPush('BOOKMARK_FROZEN', 'info', 'Restore-Bookmark eingefroren', {
        frozen: diagBookmark(restoreBookmark),
        live: diagBookmark(lastReadPost),
    });
    const domBaseline = {
        baselinePostCount: document.querySelectorAll('article').length,
        baselineCellCount: document.querySelectorAll("div[data-testid='cellInnerDiv']").length,
        baselineScrollHeight: document.body.scrollHeight || document.documentElement.scrollHeight,
    };

    btn.dataset.processed = 'true';
    btn.click();

    log('NewPosts', 'Button automatisch geklickt');
    debugLog('Restore', `Bookmark eingefroren für Restore: @${restoreBookmark.authorHandler} ${restoreBookmark.tweetId}`);
    newPostsState.autoLoadPaused = false;
    pendingNewPosts = 0;
    suppressionState.until = Date.now() + CONFIG.NEW_POSTS_GRACE_MS;
    scrollState.hasScrolledUp = false; // Nach Feed-Sprung durch "Neue Beiträge" kein automatisches Hochscrollen annehmen

    // === Wichtiger Pfad: Nach automatischem Laden neuer Beiträge die letzte Lesestelle wiederherstellen ===
    log('Restore', 'Nach neuen Beiträgen: Warte auf DOM-Stabilisierung und versuche letzte Lesestelle wiederherzustellen...');

    waitForNewPosts(() => {
        setTimeout(async () => {
            try {
                const resolved = await restoreReadingPositionAfterNewPosts(restoreBookmark, postsBeforeNewPosts);
                if (!resolved) {
                    diagPush('NEWPOSTS_EMPTY_FEED', 'error', 'Kein Treffer nach New-Posts Scroll-Restore', {
                        frozen: diagBookmark(restoreBookmark),
                        snapshot: diagSnapshot(),
                    });
                    showPopup('tweetIdNotFound', 6000, {
                        authorHandler: restoreBookmark.authorHandler,
                        tweetId: restoreBookmark.tweetId
                    });
                    diagEndFlow('fail', 'NEWPOSTS_NO_RESOLVE', 'Weder Lesestelle noch neue Posts');
                    return;
                }

                const adopt = resolved.adopt === true || resolved.strategy === 'new-posts-oldest';
                log('Restore', `New-Posts Restore (${resolved.strategy}, adopt=${adopt}) → @${resolved.post.authorHandler} ${resolved.post.tweetId}`);
                const landingOk = await applyResolvedReadingPosition(resolved, {
                    adopt,
                    expectedBookmark: restoreBookmark,
                    verifySource: 'new-posts-restore',
                });

                const popupKey = getResolvePopupKey(resolved);
                if (popupKey) {
                    const lang = getUserLanguage();
                    showPopup(popupKey, 5000, {
                        strategy: getResolveStrategyLabel(resolved.strategy, lang)
                    });
                }

                if (landingOk) {
                    if (!adopt) {
                        await reinstateFrozenReadingBookmark(restoreBookmark);
                    }
                    newPostsState.lastRestoreCompletedAt = Date.now();
                    updateTimelineMap('new-posts-restore', 'up');
                    if (resolved.strategy === 'exact' && isReadingPositionAtTargetOffset(restoreBookmark)) {
                        newPostsState.autoLoadPaused = true;
                    }
                    diagEndFlow('ok', 'NEWPOSTS_RESTORE_OK', 'Restore abgeschlossen', {
                        strategy: resolved.strategy,
                        frozen: diagBookmark(restoreBookmark),
                    });
                } else {
                    diagEndFlow('fail', 'NEWPOSTS_RESTORE_FAIL', 'Restore ohne gültiges Landing');
                }
            } catch (err) {
                log('Restore', 'Fehler beim New-Posts Restore:', err);
                diagPush('NEWPOSTS_RESTORE_ERROR', 'error', String(err?.message || err), {
                    frozen: diagBookmark(restoreBookmark),
                    snapshot: diagSnapshot(),
                });
                await landReadingPositionFromResolve('new-posts-error', restoreBookmark);
                diagEndFlow('fail', 'NEWPOSTS_RESTORE_EXCEPTION', 'Restore mit Exception beendet');
            } finally {
                searchControl.isSearching = false;
                searchControl.newPostsRestoreActive = false;
                flushDeferredTimelineMapUpdate('new-posts-restore');
                lastScrollY = window.scrollY;
                scrollState.lastMapScrollY = window.scrollY;
                scrollState.hasScrolledUp = false;
                setTimeout(() => {
                    void reinstateFrozenReadingBookmark(restoreBookmark, { save: false });
                }, 500);
            }
        }, 400);
    }, {
        ...domBaseline,
        aggressiveScroll: false,
        fallbackMs: 3000,
        settleMs: 1200,
    });

    setTimeout(observeForNewPosts, 800);
}

    function createButtons() {
    const observer = new MutationObserver(() => {
        if (document.body) {
            observer.disconnect();
            try {
                const buttonContainer = document.createElement('div');
                buttonContainer.style.position = 'fixed';
                buttonContainer.style.bottom = '100px';
                buttonContainer.style.left = '10px';
                buttonContainer.style.zIndex = '10000';
                buttonContainer.style.display = 'flex';
                buttonContainer.style.flexDirection = 'column';
                buttonContainer.style.alignItems = 'flex-start';
                buttonContainer.style.visibility = 'visible';
                const buttonsConfig = [
                    {
                        icon: 'search',
                        title: 'Start manual search',
                        onClick: () => {
                            log('UI', 'Manuelle Suche gestartet.');
                            if (!isScriptActivated) {
                                isScriptActivated = true;
                                log('UI', 'Skript durch Lupen-Klick aktiviert.');
                                observeForNewPosts();
                            }
                            redirectToHomeAndSearch();
                        },
                    },
                    {
                        icon: 'save',
                        title: 'Save current position',
                        onClick: () => {
                            // Expliziter manueller Save darf auch ältere Reposts als Lesestelle setzen
                            markTopVisiblePost(true, true);
                            log('Save', 'Manuell gespeichert');
                        },
                    },
                    {
                        icon: 'load',
                        title: 'Load last read position',
                        onClick: () => {
                            loadLastReadPostFromFile();
                        },
                    },
                    {
                        icon: 'toggle',
                        title: 'Toggle auto-save',
                        onClick: () => {
                            toggleAutoSave();
                            setTimeout(() => updateToggleButtonState(), 50);
                        },
                    }
                ];

                function updateToggleButtonState() {
                    if (window.autoSaveToggleBtn) {
                        const isActive = typeof autoDownloadEnabled !== 'undefined' ? autoDownloadEnabled : true;
                        updateAutoSaveButtonVisual();
                        window.autoSaveToggleBtn.title = isActive ? 'Auto-Save: AKTIV (klick zum Deaktivieren)' : 'Auto-Save: INAKTIV (klick zum Aktivieren)';
                    }
                }

                buttonsConfig.forEach((config, index) => {
                    const btn = createButton(config.icon, config.title, config.onClick);
                    if (index === 3) {
                        window.autoSaveToggleBtn = btn;
                    }
                    buttonContainer.appendChild(btn);
                });

                document.body.appendChild(buttonContainer);
                setTimeout(updateToggleButtonState, 100);
                debugLog('UI', 'Buttons mit Auto-Save Toggle erstellt');

            } catch (e) {
                log('UI', 'Fehler beim Erstellen der Buttons:', e);
            }
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
}

    function toggleAutoSave() {
    autoDownloadEnabled = !autoDownloadEnabled;
    GM_setValue(AUTO_DOWNLOAD_KEY, autoDownloadEnabled);
    log('UI', `Auto-Save ${autoDownloadEnabled ? 'AKTIVIERT' : 'DEAKTIVIERT'}`);
    updateAutoSaveButtonVisual();

}

function updateAutoSaveButtonVisual() {
    if (!window.autoSaveToggleBtn) return;
    const btn = window.autoSaveToggleBtn;

    // Clear any old content
    while (btn.firstChild) btn.removeChild(btn.firstChild);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', autoDownloadEnabled ? '#ffffff' : '#ff6b6b');
    svg.setAttribute('stroke-width', '2.25');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    if (autoDownloadEnabled) {
        // Power symbol (On)
        svg.innerHTML = `
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="6" x2="12" y2="12"></line>
        `;
        btn.style.opacity = '1';
        btn.style.filter = 'none';
    } else {
        // Power symbol with slash (Off)
        svg.innerHTML = `
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="6" x2="12" y2="12"></line>
            <line x1="5" y1="5" x2="19" y2="19"></line>
        `;
        btn.style.opacity = '0.5';
        btn.style.filter = 'grayscale(50%)';
    }

    btn.appendChild(svg);
}

    function createButton(iconType, title, onClick) {
        const button = document.createElement('div');
        button.style.width = '44px';
        button.style.height = '44px';
        button.style.backgroundColor = 'rgba(29, 155, 240, 0.18)';
        button.style.border = '1px solid rgba(255,255,255,0.15)';
        button.style.borderRadius = '50%';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.35)';
        button.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        button.style.zIndex = '10001';
        button.style.marginBottom = '10px';
        button.style.backdropFilter = 'blur(4px)';
        button.title = title;
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', title);

        // Create SVG icon
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '22');
        svg.setAttribute('height', '22');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', '#ffffff');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');

        let path = '';

        switch (iconType) {
            case 'search': // Magnifier
                path = 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z';
                break;
            case 'save': // Floppy disk / Save
                path = 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8';
                break;
            case 'load': // Folder / Load
                path = 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z';
                break;
            case 'toggle': // Circular arrows
                path = 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.058 11H1M20 12v5h-.582M4.058 11H1M12 21v-4M12 3v4';
                break;
            default:
                path = 'M12 6v12M6 12h12'; // fallback plus
        }

        svg.innerHTML = `<path d="${path}"></path>`;
        button.appendChild(svg);

        // Hover effects
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgba(29, 155, 240, 0.35)';
            button.style.transform = 'scale(1.12)';
            button.style.boxShadow = '0 4px 14px rgba(29, 155, 240, 0.45)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'rgba(29, 155, 240, 0.18)';
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.35)';
        });

        button.addEventListener('click', () => {
            button.style.transform = 'scale(0.9)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 120);
            onClick();
        });

        return button;
    }

    function showPopup(messageKey, duration = 5000, params = {}) {

    const lang = getUserLanguage();
    const message = getTranslatedMessage(messageKey, lang, params);

    const displayDuration = 5000;
    const fadeDuration = 1000;

    let localPopup = document.createElement('div');
    Object.assign(localPopup.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        padding: (messageKey === 'autoDownloadToggled') ? '20px 40px' : '10px 20px',
        borderRadius: '8px',
        fontSize: (messageKey === 'autoDownloadToggled') ? '22px' : '14px',
        boxShadow: '0 0 10px rgba(246, 146, 25, 0.8)',
        zIndex: '10000',
        maxWidth: '500px',
        whiteSpace: 'pre-wrap',
        transition: `opacity ${fadeDuration / 1000}s ease`,
        opacity: '1'
    });

    localPopup.textContent = message;

    if (document.body) {
        document.body.appendChild(localPopup);

        setTimeout(() => {
            if (localPopup) {
                localPopup.style.opacity = '0';
                setTimeout(() => {
                    if (localPopup && localPopup.parentNode) {
                        localPopup.parentNode.removeChild(localPopup);
                    }
                }, fadeDuration + 200);
            }
        }, displayDuration);
    } else {
        log('UI', 'document.body nicht verfügbar für showPopup.');
    }
}

    function promptManualFallback(data) {
        const content = JSON.stringify(data);
        showPopup('downloadClipboardFailed', 10000);
        log('Load', 'Bitte manuell speichern (Clipboard-Fallback):', content);
    }

    // =====================================================
    // Medien-Download (Bilder & Videos) — inspiriert von Twitter Click'n'Save
    // =====================================================

    const MEDIA_DOWNLOAD_STYLE_ID = 'xts-media-download-style';
    const TWEET_RESULT_BY_REST_ID_QUERY = 'zAz9764BcLZOJ0JU2wrd1A';
    const TWITTER_BEARER = 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
    const mediaApiCache = new Map();
    const mediaVideoIndexByArticle = new WeakMap();
    let mediaDownloadScheduleScan = null;

    function getCookieValue(name) {
        const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : '';
    }

    function injectMediaDownloadStyles() {
        if (document.getElementById(MEDIA_DOWNLOAD_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = MEDIA_DOWNLOAD_STYLE_ID;
        style.textContent = `
            .xts-media-download-btn {
                position: absolute;
                top: 8px;
                left: 8px;
                width: 34px;
                height: 34px;
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,0.35);
                background: rgba(15, 20, 25, 0.82);
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 100;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.15s ease, transform 0.15s ease, background 0.15s ease;
                backdrop-filter: blur(4px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
            }
            .xts-media-download-btn svg {
                width: 18px;
                height: 18px;
                stroke: currentColor;
                fill: none;
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            article:hover .xts-media-download-btn,
            article[role="article"]:hover .xts-media-download-btn,
            li[role="listitem"]:hover .xts-media-download-btn,
            .xts-media-download-host:hover .xts-media-download-btn,
            a[href*="/photo/"]:hover .xts-media-download-btn,
            a[href*="/video/"]:hover .xts-media-download-btn,
            [data-testid="videoComponent"]:hover .xts-media-download-btn,
            .xts-media-download-btn:hover,
            .xts-media-download-btn.xts-media-downloading {
                opacity: 1;
                pointer-events: auto;
            }
            .xts-media-download-btn:hover {
                background: rgba(29, 155, 240, 0.85);
                transform: scale(1.06);
            }
            .xts-media-download-btn.xts-media-downloading {
                cursor: wait;
                background: rgba(29, 155, 240, 0.55);
            }
            .xts-media-download-btn.xts-media-downloaded {
                background: rgba(0, 186, 124, 0.75);
            }
        `.trim();
        document.head.appendChild(style);
    }

    function createMediaDownloadButton(isVideo = false) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'xts-media-download-btn';
        btn.dataset.isVideo = isVideo ? '1' : '0';
        btn.title = isVideo ? 'Video herunterladen' : 'Bild herunterladen';
        btn.setAttribute('aria-label', btn.title);
        btn.innerHTML = isVideo
            ? '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path></svg>'
            : '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7"></path><path d="M17 3l4 4-9 9H8v-4z"></path></svg>';
        return btn;
    }

    function ensureMediaDownloadHost(element) {
        if (!element) return null;
        if (!element.classList.contains('xts-media-download-host')) {
            element.classList.add('xts-media-download-host');
        }
        return element;
    }

    function getTweetContextFromMediaElement(innerElem) {
        const statusLink = innerElem.closest('a[href*="/status/"]');
        if (statusLink) {
            const href = statusLink.getAttribute('href') || statusLink.href || '';
            const idMatch = href.match(/\/status\/(\d+)/);
            const authorMatch = href.match(/^\/([^/]+)\/status\//) || href.match(/(?:twitter|x)\.com\/([^/]+)\/status\//);
            if (idMatch) {
                return {
                    tweetId: idMatch[1],
                    author: authorMatch ? authorMatch[1] : null
                };
            }
        }

        const article = innerElem.closest("article[data-testid='tweet']") || innerElem.closest('article');
        if (article) {
            return {
                tweetId: getPostTweetId(article),
                author: getPostAuthorHandler(article)
            };
        }

        const pathMatch = location.pathname.match(/^\/([^/]+)\/status\/(\d+)/);
        if (pathMatch) {
            return { author: pathMatch[1], tweetId: pathMatch[2] };
        }

        return null;
    }

    function isVideoPosterImage(img) {
        const src = img.src || '';
        return src.includes('ext_tw_video_thumb')
            || src.includes('amplify_video_thumb')
            || src.includes('tweet_video_thumb');
    }

    function shouldSkipMediaImage(img) {
        if (!img || img.dataset.xtsMediaHandled === '1') return true;
        if (!img.src || img.src.endsWith('.svg')) return true;
        if (img.closest('[data-testid="Tweet-User-Avatar"]')) return true;
        if (img.src.includes('/profile_banners/')) return true;
        if (img.src.includes('/emoji/')) return true;
        if (img.closest('[data-testid="UserAvatar"]')) return true;
        if (img.src.includes('profile_images')) return true;
        if ((img.width || 0) > 0 && img.width < 140) return true;
        return false;
    }

    function isTweetMediaImage(img) {
        const src = img?.src || '';
        if (!src.includes('pbs.twimg.com/media/')) return false;
        if (isVideoPosterImage(img)) return false;
        return Boolean(
            img.closest('[data-testid="tweetPhoto"]')
            || img.closest('a[href*="/photo/"]')
        );
    }

    function getImageDownloadHost(img) {
        return img.closest('a[href*="/photo/"]');
    }

    function getVideoDownloadHost(video) {
        return video.closest('a[href*="/video/"]')
            || video.closest('a[href*="/photo/"]')
            || video.closest('[data-testid="videoComponent"]')?.parentElement
            || null;
    }

    function scheduleImageDownloadRetry(img) {
        if (!img || img.dataset.xtsMediaPending === '1') return;
        img.dataset.xtsMediaPending = '1';
        const finalize = () => {
            delete img.dataset.xtsMediaPending;
            if (typeof mediaDownloadScheduleScan === 'function') {
                mediaDownloadScheduleScan();
            }
        };
        if (img.complete) {
            setTimeout(finalize, 120);
            return;
        }
        img.addEventListener('load', finalize, { once: true });
        img.addEventListener('error', () => {
            img.dataset.xtsMediaHandled = '1';
            delete img.dataset.xtsMediaPending;
        }, { once: true });
    }

    function getImageDownloadUrlCandidates(url) {
        const urlObj = new URL(url);
        const originals = ['orig', '4096x4096'];
        const samples = ['large', '900x900', 'medium', 'small'];
        const candidates = [];

        for (const name of originals) {
            const copy = new URL(urlObj.toString());
            copy.searchParams.set('name', name);
            if (copy.searchParams.get('format') === 'webp') {
                copy.searchParams.set('format', 'jpg');
            }
            candidates.push(copy.toString());
        }

        const previewSize = urlObj.searchParams.get('name');
        if (previewSize && !originals.includes(previewSize) && !samples.includes(previewSize)) {
            samples.unshift(previewSize);
        }

        for (const name of samples) {
            const copy = new URL(urlObj.toString());
            copy.searchParams.set('name', name);
            if (copy.searchParams.get('format') === 'webp') {
                copy.searchParams.set('format', 'jpg');
            }
            candidates.push(copy.toString());
        }

        if (!urlObj.searchParams.has('name') && url.includes('pbs.twimg.com/media/')) {
            const parts = url.split('.');
            const ext = parts.pop();
            const base = parts.join('.');
            candidates.unshift(`${base}?format=${ext}&name=orig`);
        }

        return [...new Set(candidates)];
    }

    function extensionFromMime(mimeType) {
        if (!mimeType) return 'bin';
        let ext = mimeType.split('/').pop() || 'bin';
        return ext === 'jpeg' ? 'jpg' : ext;
    }

    function buildMediaFilename({ author, tweetId, baseName, extension, isSample = false }) {
        const datePart = new Date().toISOString().slice(0, 10);
        const samplePrefix = isSample ? 'sample_' : '';
        const safeAuthor = (author || 'unknown').replace(/[^\w.-]+/g, '_');
        const safeName = (baseName || 'media').replace(/[^\w.-]+/g, '_');
        return `${samplePrefix}${safeAuthor}_${datePart}_${tweetId || 'tweet'}_${safeName}.${extension}`;
    }

    async function fetchMediaBlob(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        if (!blob.size) {
            throw new Error('Empty blob');
        }
        const contentType = response.headers.get('content-type') || blob.type || '';
        const pathname = new URL(url).pathname;
        const filenamePart = pathname.split('/').pop() || 'media';
        const baseName = filenamePart.replace(/\.[^.]+$/, '') || 'media';
        return {
            blob,
            extension: extensionFromMime(contentType),
            baseName,
            status: response.status
        };
    }

    function triggerBlobDownload(blob, filename) {
        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(blob);
        anchor.download = filename;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        setTimeout(() => {
            anchor.remove();
            URL.revokeObjectURL(anchor.href);
        }, 30000);
    }

    async function downloadImageFromUrl(url, context) {
        const candidates = getImageDownloadUrlCandidates(url);
        let lastError = null;

        for (let i = 0; i < candidates.length; i++) {
            try {
                const result = await fetchMediaBlob(candidates[i]);
                const isSample = i > 0;
                const filename = buildMediaFilename({
                    author: context.author,
                    tweetId: context.tweetId,
                    baseName: result.baseName,
                    extension: result.extension,
                    isSample
                });
                triggerBlobDownload(result.blob, filename);
                return filename;
            } catch (err) {
                lastError = err;
            }
        }

        throw lastError || new Error('Image download failed');
    }

    function unwrapTweetResult(result) {
        if (!result) return null;
        return result.tweet || result;
    }

    function parseTweetLegacyMedias(tweetResult) {
        if (!tweetResult) return [];
        const tweetLegacy = tweetResult.legacy;
        const tweetUser = tweetResult.core?.user_results?.result;
        if (!tweetLegacy) return [];

        let sourceMedias = [];
        if (tweetLegacy.extended_entities?.media) {
            sourceMedias = tweetLegacy.extended_entities.media;
        } else if (tweetResult.card?.legacy?.binding_values) {
            try {
                const unified = tweetResult.card.legacy.binding_values.find((bv) => bv.key === 'unified_card');
                if (unified?.value?.string_value) {
                    const value = JSON.parse(unified.value.string_value);
                    sourceMedias = Object.values(value.media_entities || {});
                }
            } catch (e) {
                debugLog('Media', 'unified_card parse failed', e);
            }
        }

        const screenName = tweetUser?.legacy?.screen_name || tweetUser?.core?.screen_name || 'unknown';
        const tweetId = tweetResult.rest_id || tweetLegacy.id_str;
        const medias = [];

        for (const media of sourceMedias) {
            let downloadUrl = null;
            let previewUrl = media.media_url_https;

            if (media.video_info?.variants) {
                const best = media.video_info.variants
                    .filter((v) => v.bitrate !== undefined)
                    .reduce((acc, cur) => (!acc || cur.bitrate > acc.bitrate ? cur : acc), null);
                downloadUrl = best?.url || null;
            } else if (previewUrl) {
                if (previewUrl.includes('?format=')) {
                    downloadUrl = previewUrl;
                } else {
                    const parts = previewUrl.split('.');
                    const ext = parts.pop();
                    downloadUrl = `${parts.join('.')}?format=${ext}&name=orig`;
                }
            }

            if (!downloadUrl) continue;

            medias.push({
                screen_name: screenName,
                tweet_id: tweetId,
                download_url: downloadUrl,
                preview_url: previewUrl,
                type: media.type === 'animated_gif' ? 'video' : media.type
            });
        }

        return medias;
    }

    async function fetchTweetMedias(tweetId) {
        if (!tweetId) return [];
        if (mediaApiCache.has(tweetId)) {
            return mediaApiCache.get(tweetId);
        }

        const variables = {
            tweetId,
            withCommunity: false,
            includePromotedContent: false,
            withVoice: false
        };
        const features = {
            creator_subscriptions_tweet_preview_api_enabled: true,
            communities_web_enable_tweet_community_results_fetch: true,
            c9s_tweet_anatomy_moderator_badge_enabled: true,
            responsive_web_edit_tweet_api_enabled: true,
            graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
            view_counts_everywhere_api_enabled: true,
            longform_notetweets_consumption_enabled: true,
            responsive_web_twitter_article_tweet_consumption_enabled: true,
            tweet_awards_web_tipping_enabled: false,
            responsive_web_grok_image_annotation_enabled: true,
            responsive_web_graphql_timeline_navigation_enabled: true,
            responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
            responsive_web_enhance_cards_enabled: false
        };
        const fieldToggles = {
            withArticleRichContentState: true,
            withArticlePlainText: false
        };

        const url = new URL(`https://x.com/i/api/graphql/${TWEET_RESULT_BY_REST_ID_QUERY}/TweetResultByRestId`);
        url.searchParams.set('variables', JSON.stringify(variables));
        url.searchParams.set('features', JSON.stringify(features));
        url.searchParams.set('fieldToggles', JSON.stringify(fieldToggles));

        const headers = {
            authorization: TWITTER_BEARER,
            'x-csrf-token': getCookieValue('ct0'),
            'x-twitter-client-language': 'en',
            'x-twitter-active-user': 'yes',
            'content-type': 'application/json'
        };
        const guestToken = getCookieValue('gt');
        if (guestToken) {
            headers['x-guest-token'] = guestToken;
        } else {
            headers['x-twitter-auth-type'] = 'OAuth2Session';
        }

        const response = await fetch(url.toString(), { headers });
        const json = await response.json();
        const tweetResult = unwrapTweetResult(json?.data?.tweetResult?.result);
        let medias = parseTweetLegacyMedias(tweetResult);

        const quoted = tweetResult?.quoted_status_result?.result;
        if (quoted) {
            medias = medias.concat(parseTweetLegacyMedias(unwrapTweetResult(quoted)));
        }

        mediaApiCache.set(tweetId, medias);
        if (mediaApiCache.size > 24) {
            mediaApiCache.delete(mediaApiCache.keys().next().value);
        }

        return medias;
    }

    function stripUrlSearchParams(url) {
        try {
            const parsed = new URL(url);
            return parsed.origin + parsed.pathname;
        } catch (e) {
            return url.split('?')[0];
        }
    }

    async function downloadVideoForButton(btn, posterUrl, context) {
        const medias = await fetchTweetMedias(context.tweetId);
        const posterBase = stripUrlSearchParams(posterUrl || '');
        let mediaEntry = medias.find((m) => stripUrlSearchParams(m.preview_url || '').startsWith(posterBase) || posterBase.startsWith(stripUrlSearchParams(m.preview_url || '')));

        if (!mediaEntry) {
            mediaEntry = medias.find((m) => m.type === 'video' || m.type === 'animated_gif');
        }

        if (!mediaEntry?.download_url) {
            throw new Error('No video URL');
        }

        const result = await fetchMediaBlob(mediaEntry.download_url);
        const filename = buildMediaFilename({
            author: mediaEntry.screen_name || context.author,
            tweetId: mediaEntry.tweet_id || context.tweetId,
            baseName: result.baseName,
            extension: result.extension
        });
        triggerBlobDownload(result.blob, filename);
        return filename;
    }

    async function onMediaDownloadClick(event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const btn = event.currentTarget;
        if (btn.classList.contains('xts-media-downloading')) return;

        const lang = getUserLanguage();
        const context = getTweetContextFromMediaElement(btn);
        if (!context?.tweetId) {
            showPopup('mediaDownloadNoMedia', 4000);
            return;
        }

        btn.classList.add('xts-media-downloading');
        showPopup('mediaDownloadInProgress', 2500);

        try {
            let filename;
            if (btn.dataset.isVideo === '1') {
                filename = await downloadVideoForButton(btn, btn.dataset.posterUrl || '', context);
            } else {
                filename = await downloadImageFromUrl(btn.dataset.mediaUrl || '', context);
            }
            btn.classList.remove('xts-media-downloading');
            btn.classList.add('xts-media-downloaded');
            showPopup('mediaDownloadSuccess', 5000, { fileName: filename });
            debugLog('Media', `Download OK: ${filename}`);
        } catch (err) {
            btn.classList.remove('xts-media-downloading');
            log('Media', 'Download fehlgeschlagen:', err);
            showPopup('mediaDownloadFailed', 5000);
        }
    }

    function attachMediaDownloadButton(host, btn, selector = ':scope > .xts-media-download-btn') {
        if (!host || host.querySelector(selector)) return;
        ensureMediaDownloadHost(host);
        btn.addEventListener('click', onMediaDownloadClick);
        host.appendChild(btn);
    }

    function getNextVideoIndex(article) {
        if (!article) return 0;
        const current = mediaVideoIndexByArticle.get(article);
        const next = current === undefined ? 0 : current + 1;
        mediaVideoIndexByArticle.set(article, next);
        return next;
    }

    function processMediaImages() {
        const images = document.querySelectorAll('article img[src*="pbs.twimg.com/media/"]:not([data-xts-media-handled])');
        for (const img of images) {
            if (shouldSkipMediaImage(img)) {
                img.dataset.xtsMediaHandled = '1';
                continue;
            }

            if (!isTweetMediaImage(img)) {
                img.dataset.xtsMediaHandled = '1';
                continue;
            }

            if (!img.complete || img.naturalWidth === 0) {
                scheduleImageDownloadRetry(img);
                continue;
            }

            const host = getImageDownloadHost(img);
            if (!host) {
                img.dataset.xtsMediaHandled = '1';
                continue;
            }

            const isVideo = isVideoPosterImage(img);
            if (isVideo && img.closest('article')?.querySelector('video')) {
                img.dataset.xtsMediaHandled = '1';
                continue;
            }

            const selector = isVideo
                ? '.xts-media-download-btn[data-is-video="1"]'
                : '.xts-media-download-btn[data-is-video="0"]';
            if (host.querySelector(selector)) {
                img.dataset.xtsMediaHandled = '1';
                continue;
            }

            const btn = createMediaDownloadButton(isVideo);
            btn.dataset.mediaUrl = img.src;
            if (isVideo) {
                btn.dataset.posterUrl = img.src;
            }
            attachMediaDownloadButton(host, btn, selector);
            img.dataset.xtsMediaHandled = '1';
        }
    }

    function processMediaVideos() {
        const videos = document.querySelectorAll('article video:not([data-xts-media-handled])');
        for (const video of videos) {
            const host = getVideoDownloadHost(video);
            if (!host) {
                video.dataset.xtsMediaHandled = '1';
                continue;
            }

            const selector = '.xts-media-download-btn[data-is-video="1"]';
            if (host.querySelector(selector)) {
                video.dataset.xtsMediaHandled = '1';
                continue;
            }

            getNextVideoIndex(video.closest('article'));

            const btn = createMediaDownloadButton(true);
            btn.dataset.posterUrl = video.getAttribute('poster') || '';
            attachMediaDownloadButton(host, btn, selector);
            video.dataset.xtsMediaHandled = '1';
        }
    }

    function scanMediaDownloadTargets() {
        processMediaImages();
        processMediaVideos();
    }

    function initMediaDownloadButtons() {
        injectMediaDownloadStyles();

        let debounceTimer = null;
        const scheduleScan = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                debounceTimer = null;
                scanMediaDownloadTargets();
            }, 500);
        };
        mediaDownloadScheduleScan = scheduleScan;

        scheduleScan();

        const observer = new MutationObserver((mutations) => {
            const relevant = mutations.some((m) => {
                if (m.type !== 'childList' || m.addedNodes.length === 0) return false;
                for (const node of m.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.matches?.('article, img, video, [data-testid="tweetPhoto"], [data-testid="videoComponent"]')) {
                        return true;
                    }
                    if (node.querySelector?.('article img, video, [data-testid="tweetPhoto"], [data-testid="videoComponent"]')) {
                        return true;
                    }
                }
                return false;
            });
            if (relevant) scheduleScan();
        });
        const startObserver = () => {
            const feed = document.querySelector("main[role='main']") || document.body;
            if (!feed) {
                requestAnimationFrame(startObserver);
                return;
            }
            observer.observe(feed, { childList: true, subtree: true });
        };
        startObserver();

        debugLog('Media', 'Medien-Download-Buttons aktiv');
    }

    window.addEventListener('load', initMediaDownloadButtons);
})();

