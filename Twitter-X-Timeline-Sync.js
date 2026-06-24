// ==UserScript==
// @name Twitter/X Timeline Sync
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
// @namespace https://github.com/Copiis/x-timeline-sync
// @version 2026.6.24a
// @author Copiis
// @license MIT
// @match https://x.com/*
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_registerMenuCommand
// @downloadURL https://raw.githubusercontent.com/Copiis/x-timeline-sync/master/Twitter-X-Timeline-Sync.user.js
// @updateURL https://raw.githubusercontent.com/Copiis/x-timeline-sync/master/Twitter-X-Timeline-Sync.user.js
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
        NEW_POSTS_GRACE_MS: 1800,            // Nach "Neue Beiträge" (etwas länger wegen Feed-Sprung)

        // === Positionierung beim Wiederherstellen ===
        READING_POSITION_TOP_OFFSET: 5,      // Ab welchem Abstand von oben ein Post als neue Lesestelle gespeichert wird (5px unter Oberkante)
        RESTORE_SCROLL_OFFSET: 50,           // Ziel: obere Kante des Posts 50px unter Viewport-Oberkante (Zentrierung beim Wiederherstellen)
        POSITION_CORRECTION_TOLERANCE: 35,   // Toleranz in scrollToPostWithHighlight
        FALLBACK_POSITION_TOLERANCE: 40,     // Toleranz in findAndSetClosestPost Feinjustierung

        // === DOM-Heuristiken ===
        SMALL_SVG_MAX_SIZE: 22,              // Max. Breite/Höhe für Repost-Icon-Erkennung

        // === Such-Verhalten (Balance zwischen Geschwindigkeit bei weit entfernten Zielen und Overshoot-Schutz) ===
        MAX_SEARCH_DISTANCE_FACTOR: 3.2,     // Etwas höher als früher, damit weit entfernte Lesestellen schneller erreicht werden
        MAX_SEARCH_STEP_VH: 3.8,             // Deutlich größere Sprünge erlaubt für weit entfernte Lesestellen (vorher zu konservativ)
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

        let log = GM_getValue(key, []);

        // Deduplication
        const isDuplicate = log.some(entry => 
            entry.reposter === repostData.reposter &&
            entry.originalAuthor === repostData.originalAuthor &&
            Math.abs(new Date(entry.repostDate).getTime() - new Date(repostData.repostDate).getTime()) < 1000 * 60 * 60 * 24
        );

        if (isDuplicate) {
            debugLog('Repost', 'Duplicate skipped for', repostData.reposter, '→', repostData.originalAuthor);
            return;
        }

        log.push({
            reposter: repostData.reposter,
            originalAuthor: repostData.originalAuthor,
            repostDate: repostData.repostDate,
            discoveredAt: repostData.discoveredAt || new Date().toISOString()
        });

        if (log.length > MAX_REPOST_LOG) {
            log = log.slice(-MAX_REPOST_LOG);
        }

        GM_setValue(key, log);
        log('Repost', `Repost erfasst: @${repostData.reposter} → @${repostData.originalAuthor}`);
        debugLog('Repost', 'Total reposts logged for account', account, '=', log.length);
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
            saveError: "❌ Save failed after retries. Data may be lost."
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
            saveError: "❌ Speichern fehlgeschlagen nach Wiederholungen. Daten könnten verloren gehen."
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
    };

    // === Search Control Flags ===
    const searchControl = {
        isSearching: false,
        isFallbackSearching: false,
        isSearchCancelled: false,
        isAutoScrolling: false,
    };

    // === Suppression / Restore Protection (Punkt 3) ===
    const suppressionState = {
        until: 0,
        pastTweetId: null,
    };

    // === Core Position & Highlight ===
    let lastReadPost = null;
    let lastHighlightedPost = null;

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

            // Neue Repost-Regel: Nach oben scrollen erkennen
            if (window.scrollY < lastScrollY - 40) {
                scrollState.hasScrolledUp = true;
            }
            lastScrollY = window.scrollY;

            if (isNearTimelineTop()) {
                const newPostsIndicator = getNewPostsIndicator();
                if (newPostsIndicator && !newPostsIndicator.dataset.processed) {
                    searchControl.isSearching = true;
                    clickNewPostsIndicator(newPostsIndicator);
                    suppressionState.until = Date.now() + CONFIG.NEW_POSTS_GRACE_MS;
                    // Hinweis: clickNewPostsIndicator selbst kümmert sich um waitForNewPosts + Restore.
                    // Die waitForNewPosts hier würde zu doppelten Restore-Aufrufen führen → entfernt.
                }
            }
            markTopVisiblePost(true);
        }, 150), { passive: true });

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

                // Erster sofortiger Check
                const immediateIndicator = getNewPostsIndicator();
                if (immediateIndicator && !immediateIndicator.dataset.processed) {
                    searchControl.isSearching = true;
                    clickNewPostsIndicator(immediateIndicator);
                    suppressionState.until = Date.now() + CONFIG.NEW_POSTS_GRACE_MS;
                    return;
                }

                // Mehrere schnelle Checks, weil der "New Posts"-Button oft erst beim Fokussieren gerendert wird
                const checkNewPostsOnFocus = (attempt = 0) => {
                    if (attempt > 8) return;

                    setTimeout(() => {
                        const newPostsIndicator = getNewPostsIndicator();
                        if (newPostsIndicator && !newPostsIndicator.dataset.processed) {
                            searchControl.isSearching = true;
                            clickNewPostsIndicator(newPostsIndicator);
                            suppressionState.until = Date.now() + CONFIG.NEW_POSTS_GRACE_MS;
                            // waitForNewPosts + exakte Restore-Logik wird jetzt zentral von clickNewPostsIndicator übernommen (vermeidet Doppel-Starts von waitForNewPosts).
                        } else {
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

                // Erster sofortiger Check (keine Verzögerung)
                const indicatorImmediate = getNewPostsIndicator();
                if (indicatorImmediate && !indicatorImmediate.dataset.processed) {
                    searchControl.isSearching = true;
                    clickNewPostsIndicator(indicatorImmediate);
                    suppressionState.until = Date.now() + CONFIG.NEW_POSTS_GRACE_MS;
                    return;
                }

                // Mehrere schnelle Versuche, weil der New-Posts-Button oft erst beim Sichtbar-Werden gerendert wird
                const checkOnVisibility = (attempt = 0) => {
                    if (attempt > 8) return;

                    setTimeout(() => {
                        const indicator = getNewPostsIndicator();
                        if (indicator && !indicator.dataset.processed) {
                            searchControl.isSearching = true;
                            clickNewPostsIndicator(indicator);
                            suppressionState.until = Date.now() + CONFIG.NEW_POSTS_GRACE_MS;
                        } else {
                            checkOnVisibility(attempt + 1);
                        }
                    }, 280 + (attempt * 110));
                };

                checkOnVisibility(0);
            }
        });

        const checkNewPostsInterval = setInterval(() => {
            if (!isScriptActivated || searchControl.isSearching || searchControl.isFallbackSearching || searchControl.isAutoScrolling || !isNearTimelineTop()) return;
            const newPostsIndicator = getNewPostsIndicator();
            if (newPostsIndicator && !newPostsIndicator.dataset.processed) {
                searchControl.isSearching = true;
                clickNewPostsIndicator(newPostsIndicator);
                suppressionState.until = Date.now() + CONFIG.NEW_POSTS_GRACE_MS;
                // Hinweis: waitForNewPosts + Restore-Logik wird zentral in clickNewPostsIndicator gehandhabt.
                // Doppelte waitFor-Aufrufe wurden entfernt, um doppeltes "Neue Beiträge laden" + doppelte Restore-Suchen zu vermeiden.
            }
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

    log('Init', 'Initialisiere Skript auf /home...');

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

    function applyHighlightToPost(postElement) {
        if (!postElement || !postElement.isConnected) return false;
        if (lastHighlightedPost && lastHighlightedPost !== postElement) {
            lastHighlightedPost.style.boxShadow = 'none';
            lastHighlightedPost.style.outline = 'none';
        }
        const glow = '0 0 20px 10px rgba(246, 146, 25, 0.9)';
        postElement.style.setProperty('box-shadow', glow, 'important');
        postElement.style.setProperty('outline', '3px solid rgba(246, 146, 25, 0.95)', 'important');
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
        delays.forEach(delay => {
            setTimeout(() => {
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
            debugLog('Highlight', 'Glühender Rand auf bevorzugtes Element gesetzt');
            return;
        }

        if (!lastReadPost || !lastReadPost.tweetId || !lastReadPost.authorHandler) {
            debugLog('Highlight', 'Keine gültige Leseposition für Rahmen.');
            return;
        }
        const lastReadElement = findPostElementInDOM(lastReadPost.tweetId, lastReadPost.authorHandler);
        if (lastReadElement) {
            applyHighlightToPost(lastReadElement);
            debugLog('Highlight', 'Glühender Rand auf Leseposition gesetzt');
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
            adoptedFromFallback: true
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
        scrollState.hasScrolledUp = false; // Nach Restore/ manueller Suche kein "Hochscrollen" mehr annehmen
        debugLog('Restore', `Grace ${CONFIG.RESTORE_GRACE_MS}ms aktiviert für ${tweetId}`);
    }

    async function markTopVisiblePost(save = true, allowOlderRegression = false) {
    try {

    if (!window.location.href.includes('/home') || searchControl.isSearching || searchControl.isFallbackSearching) {
        return;
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
            // Grace abgelaufen, aber wir haben noch eine "wiederhergestellte" ID
            const currentTop = getTopVisiblePost();
            if (currentTop) {
                const currentId = getPostTweetId(currentTop);
                if (currentId && BigInt(currentId) <= BigInt(suppressionState.pastTweetId)) {
                    // User ist noch bei oder oberhalb der wiederhergestellten Position → weiter schützen
                    suppress = true;
                } else {
                    // User hat zu einem neueren Post gescrollt → sofort freigeben
                    suppressionState.until = 0;
                    suppressionState.pastTweetId = null;
                    debugLog('Restore', 'Grace frühzeitig aufgehoben (User hat zu neuerem Post gescrollt)');
                }
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

    const topPost = getTopVisiblePost();
    if (!topPost) return;

    const postTweetId = getPostTweetId(topPost);
    const postTimestamp = getPostTimestamp(topPost);
    const postAuthorHandler = getPostAuthorHandler(topPost);
    const repostFlag = isRepost(topPost);

    // === Starker History-Gedächtnis-Check (User-Wunsch) ===
    // Ein Post/RePost darf **nur** dann als neue Lesestelle gesetzt werden,
    // wenn er noch NICHT in der History bekannt ist.
    // Das ist die primäre Regel für echtes Gedächtnis beim normalen Scrollen (rauf/runter).
    const positionKey = `${postTweetId}-${repostFlag}`;

    if (knownMarkedKeys.has(positionKey) && !allowOlderRegression) {
        debugLog('Save', `Bereits in History bekannt (${positionKey}) – Lesestelle wird nicht neu gesetzt (Gedächtnis)`);
        // Harter Skip für die gesamte Lesestellen-Logik bei bekannten Positionen.
        // Reconcile wird für diesen Durchlauf deaktiviert, um keine alten History-Einträge zurückzuholen.
        return;
    }

    // Repost-Tracking: interne Liste anlegen
    // (defensiv gewrappt – schützt vor historischen Stale-Variablen wie dem früheren
    //  "skipLesestelleUpdate" ReferenceError, der in älteren geladenen Versionen nach
    //  der Punkt-3-Cleanup-Phase auftrat; siehe log.txt 30.05.2026)
    try {
        if (repostFlag && postAuthorHandler) {
            const reposter = getReposterHandler(topPost);
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
            readAt: nowIso
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
            if (lastHighlightedPost && lastHighlightedPost !== savedElement) {
                lastHighlightedPost.style.boxShadow = 'none';
            }
            savedElement.style.boxShadow = '0 0 20px 10px rgba(246, 146, 25, 0.9)';
            lastHighlightedPost = savedElement;
        }
    }
    } catch (err) {
        log('Highlight', 'Unerwarteter Fehler in markTopVisiblePost:', err);
        // Wichtig: isSearching wird hier NICHT angefasst – das übernimmt der Caller oder startRefinedSearch...
    }
}

    function waitForNewPosts(callback) {
    const timelineContainer = document.querySelector("div[data-testid='primaryColumn']") || document.body;
    let loadAttempts = 0;
    const maxLoadAttempts = 80;
    const initialPostCount = document.querySelectorAll('article').length;
    const initialCellCount = document.querySelectorAll("div[data-testid='cellInnerDiv']").length;
    let callbackTriggered = false;
    const observer = new MutationObserver((mutations) => {
        if (callbackTriggered || searchControl.isSearchCancelled) return;
        const currentPostCount = document.querySelectorAll('article').length;
        const currentCellCount = document.querySelectorAll("div[data-testid='cellInnerDiv']").length;
        if (currentPostCount > initialPostCount || currentCellCount > initialCellCount) {
            log('NewPosts', 'Neue Beiträge oder Zellen im DOM erkannt, starte Suche.');
            callbackTriggered = true;
            observer.disconnect();
            setTimeout(() => {
                callback();
            }, 1600); // etwas mehr Zeit für stabileres Layout nach neuen Posts (verhindert zu frühe Sprünge)
        }
    });
    observer.observe(timelineContainer, {
        childList: true,
        subtree: true,
        attributes: false
    });
    const timeoutCheck = setInterval(() => {
        loadAttempts++;
        const currentPostCount = document.querySelectorAll('article').length;
        const currentCellCount = document.querySelectorAll('div[data-testid="cellInnerDiv"]').length;
        if (callbackTriggered || searchControl.isSearchCancelled) {
            clearInterval(timeoutCheck);
            return;
        }
        if (currentPostCount > initialPostCount || currentCellCount > initialCellCount) {
            log('NewPosts', 'Neue Beiträge über Timeout erkannt, starte Suche.');
            callbackTriggered = true;
            observer.disconnect();
            clearInterval(timeoutCheck);
            setTimeout(() => {
                callback();
            }, 1600); // etwas mehr Zeit für stabileres Layout nach neuen Posts
        } else if (loadAttempts >= maxLoadAttempts) {
            log('NewPosts', 'Keine neuen Posts nach max Versuchen – starte mit aktuellen Posts.');
            callbackTriggered = true;
            observer.disconnect();
            clearInterval(timeoutCheck);
            setTimeout(() => {
                callback();
            }, 1600); // etwas mehr Zeit für stabileres Layout
        } else {
            const currentScrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            const scrollStep = viewportHeight * 0.6;
            window.scrollBy({ top: scrollStep, behavior: 'smooth' });
        }
    }, 1000);
    window.addEventListener('unload', () => {
        observer.disconnect();
        clearInterval(timeoutCheck);
        searchControl.isSearching = false;
        searchControl.isFallbackSearching = false;
    }, { once: true });
}

    function startNewPostsCheckInterval() {
        const interval = setInterval(() => {
            if (!isScriptActivated || searchControl.isSearching || searchControl.isFallbackSearching || searchControl.isAutoScrolling || !isNearTimelineTop()) return;
            const newPostsIndicator = getNewPostsIndicator();
            if (newPostsIndicator && !newPostsIndicator.dataset.processed) {
                log('NewPosts', 'Neue Beiträge über Intervall erkannt und sichtbar.');
                searchControl.isSearching = true;
                clickNewPostsIndicator(newPostsIndicator);
                // waitForNewPosts zentral in clickNewPostsIndicator
            }
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
                debugLog('Save', 'Reconcile übersprungen: Exakte aktuelle Lesestelle ist noch sichtbar (Option 2 Präferenz)');
                return; // Nicht korrigieren, solange die echte aktuelle Position noch im Viewport ist
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

    /**
     * Zentralisierte Scroll-Logik inklusive Stagnationserkennung.
     * Wird an mehreren Stellen innerhalb der Suche verwendet.
     */
    async function performScrollAndContinue(continueFn, onStagnationCleanup = null) {
        const currentScrollHeight = document.body.scrollHeight || document.documentElement.scrollHeight;

        if (currentScrollHeight === scrollState.lastScrollHeight) {
            scrollState.stagnantScrollCount++;
            if (scrollState.stagnantScrollCount > CONFIG.MAX_STAGNANT_SCROLLS) {
                log('Search', 'Suche abgebrochen: Keine neuen Posts nach Stagnation (MAX_STAGNANT_SCROLLS).');
                searchControl.isSearching = false;
                updateActionPopup('tweetIdNotFound', {
                    authorHandler: lastReadPost?.authorHandler,
                    tweetId: lastReadPost?.tweetId
                });
                findAndSetClosestPost();

                // Sicherer Cleanup über Callback (vermeidet ReferenceError auf lokale Variablen)
                if (typeof onStagnationCleanup === 'function') {
                    try { onStagnationCleanup(); } catch (e) { /* ignore */ }
                }
                return;
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
            searchControl.isSearching = false;
            if (dismissPopup) dismissActionPopup();
            if (typeof onCleanup === 'function') {
                try { onCleanup(); } catch (e) { /* ignore cleanup errors */ }
            }
        };

        const startFallbackSearch = () => {
            searchControl.isSearching = false;
            updateActionPopup('tweetIdNotFound', {
                authorHandler: lastReadPost?.authorHandler,
                tweetId: lastReadPost?.tweetId
            });
            findAndSetClosestPost();
            if (typeof onCleanup === 'function') {
                try { onCleanup(); } catch (e) { /* ignore cleanup errors */ }
            }
        };

        if (searchControl.isSearchCancelled) {
            debugLog('Search', `${logPrefix}Suche abgebrochen durch Benutzer.`);
            doCleanup(true);
            return true;
        }

        if (!searchControl.isSearching) {
            debugLog('Search', `${logPrefix}Suche bereits beendet.`);
            doCleanup(true);
            return true;
        }

        if (currentScrollCount > CONFIG.MAX_SCROLL_ATTEMPTS) {
            log('Search', `${logPrefix}Maximale Scroll-Versuche erreicht, starte Fallback.`);
            startFallbackSearch();
            return true;
        }

        if (scrollState.totalLoadedPosts > CONFIG.MAX_LOADED_POSTS_BEFORE_FALLBACK) {
            debugLog('Search', `${logPrefix}Über ${CONFIG.MAX_LOADED_POSTS_BEFORE_FALLBACK} Posts geladen – Suche abgebrochen.`);
            startFallbackSearch();
            return true;
        }

        return false;
    }


    async function startRefinedSearchForLastReadPost(fromFile = false) {
    debugLog('Search', 'Starte optimierte Suche für letzte Leseposition...');
    searchControl.isSearching = true;
    searchControl.isSearchCancelled = false;

    // Wichtig: Such-/Scroll-State zurücksetzen (Punkt 4)
    scrollState.scrollCyclePhase = 0;
    scrollState.hasCompletedCycle = false;
    scrollState.stagnantScrollCount = 0;
    scrollState.largeScrollCount = 0;
    scrollState.isSlowScrollMode = false;
    scrollState.searchDirection = 'down';
    scrollState.lastScrollHeight = 0;

    try {   // Safety wrapper: garantiert isSearching=false auch bei Fehlern nach New-Posts-Laden
    if (!isScriptActivated) {
        showPopup('searchScrollPrompt', 5000);
        searchControl.isSearching = false;
        return;
    }
    let storedData = null;
    const account = await getCurrentUserHandle();
    if (!fromFile) {
        await loadLastReadPost(async (data) => {
            if (!data) {
                debugLog('Search', `Keine Leseposition für Account ${account} gefunden.`);
                showPopup('searchNoPosition', 5000);
                searchControl.isSearching = false;
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
        searchControl.isSearching = false;
        return;
    }
    lastReadPost = storedData;
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
            findAndSetClosestPost();
            searchControl.isSearching = false;
            return;
        }
    }
    debugLog('Search', `Suche für Account ${account}:`, lastReadPost);
    const posts = Array.from(document.querySelectorAll('article'));
    for (const post of posts) {
        const postTweetId = getPostTweetId(post);
        const postAuthor = getPostAuthorHandler(post);
        if (postTweetId === lastReadPost.tweetId && postAuthor === lastReadPost.authorHandler) {
            debugLog('Search', 'Beitrag bereits im DOM gefunden, scrolle direkt.');
            lastReadPost.found = true;

            // Border sofort setzen (auch wenn das Scrollen noch nicht perfekt ist)
            updateHighlightedPost();

            // Wichtiger Fix: Nicht sofort scrollToPostWithHighlight aufrufen,
            // weil direkt nach Reload / Suchstart das Layout noch nicht stabil ist.
            // Besser: kurze Wartezeit, damit mehr Posts geladen sind und getBoundingClientRect() korrekte Werte liefert.
            setTimeout(() => {
                scrollToPostWithHighlight(post);
            }, 450);

            markTopVisiblePost(true, true); // Explizite Suche → ältere Position erlaubt

            // Nur beim ersten Finden in dieser Suche aktivieren (verhindert Re-Armen bei wiederholten internen Finds)
            if (!lastReadPost.found) {
                activateRestoreSuppression(postTweetId);
            }

            searchControl.isSearching = false;
            return;
        }
    }
    log('Search', 'Post nicht im aktuellen DOM gefunden, starte Scroll-Suche.');
    popup = createSearchPopup(lastReadPost);
    if (!popup) {
        log('Search', 'Popup konnte nicht erstellt werden.');
        searchControl.isSearching = false;
        return;
    }
    const checkedTweetIds = new Set();
    const targetTime = new Date(lastReadPost.timestamp).getTime();
    const targetId = BigInt(lastReadPost.tweetId);
    const timeDiffThreshold = 4 * 60 * 60 * 1000;
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const post = entry.target;
                const postTweetId = getPostTweetId(post);
                const postAuthor = getPostAuthorHandler(post);
                if (postTweetId === lastReadPost.tweetId && postAuthor === lastReadPost.authorHandler) {
                    debugLog('Search', 'Beitrag via IntersectionObserver gefunden:', lastReadPost);
                    lastReadPost.found = true;
                    updateHighlightedPost(); // Border sofort

                    // Auch hier eine kleine Verzögerung, falls der Observer feuert, während noch gescrollt wird
                    setTimeout(() => {
                        scrollToPostWithHighlight(post);
                    }, 300);

                    markTopVisiblePost(true, true); // Explizite Suche → ältere Position erlaubt
                    if (!lastReadPost.found) {
                        activateRestoreSuppression(lastReadPost.tweetId);
                    }

                    searchControl.isSearching = false;
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
            debugLog('Search', 'Suche gestoppt durch Benutzer.');
            searchControl.isSearching = false;
            searchControl.isFallbackSearching = false;
            window.removeEventListener('keydown', handleSpaceKey);
            io.disconnect();
        }
    }
    window.addEventListener('keydown', handleSpaceKey);
    function getTimestampFromTweetId(tweetId) {
        const TWITTER_EPOCH = 1288834974657;
        const timestamp = (Number(tweetId >> 22n) + TWITTER_EPOCH);
        return timestamp;
    }
    let scrollCount = 0;
    const search = async () => {
        scrollCount++;

        // Race-Condition-Schutz: Wenn isSearching zwischen Aufrufen von performScrollAndContinue
        // oder durch andere Handler auf false gesetzt wurde, holen wir uns die Kontrolle zurück.
        // Das verhindert den sofortigen Abbruch "Suche bereits beendet" am Anfang einer frisch gestarteten Suche
        // (besonders bei manuellem Laden älterer Positionen oder nach "Neue Beiträge").
        if (!searchControl.isSearching) {
            searchControl.isSearching = true;
            debugLog('Search', '[initial] isSearching war false – Race-Heal aktiviert.');
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
            const postTweetId = getPostTweetId(post);
            const postAuthor = getPostAuthorHandler(post);
            if (checkedTweetIds.has(postTweetId)) continue;
            checkedTweetIds.add(postTweetId);
            if (postTweetId === lastReadPost.tweetId && postAuthor === lastReadPost.authorHandler) {
                debugLog('Search', 'Beitrag gefunden:', lastReadPost);
                lastReadPost.found = true;
                updateHighlightedPost();

                setTimeout(() => {
                    scrollToPostWithHighlight(post);
                }, 250);

                markTopVisiblePost(true, true); // Explizite Suche → ältere Position erlaubt
                if (!lastReadPost.found) {
                    activateRestoreSuppression(lastReadPost.tweetId);
                }

                searchControl.isSearching = false;
                dismissActionPopup();
                window.removeEventListener('keydown', handleSpaceKey);
                io.disconnect();
                found = true;
                return;
            }
        }
        if (found) return;
        const allLoadedPosts = Array.from(document.querySelectorAll('article'));
        const allLoadedIds = allLoadedPosts
            .map(post => {
                const tweetId = getPostTweetId(post);
                return tweetId && !isNaN(tweetId) ? BigInt(tweetId) : null;
            })
            .filter(id => id !== null);
        let oldestLoadedId = BigInt(0);
        let newestLoadedId = BigInt(0);
        if (allLoadedIds.length > 0) {
            oldestLoadedId = allLoadedIds.reduce((min, id) => (id < min ? id : min), allLoadedIds[0]);
            newestLoadedId = allLoadedIds.reduce((max, id) => (id > max ? id : max), allLoadedIds[0]);
            debugLog('Search', `Älteste ID: ${oldestLoadedId}, Neueste: ${newestLoadedId}, Ziel: ${targetId}`);
        }
        if (allLoadedIds.length > 0) {
            if (targetId > newestLoadedId && scrollState.scrollCyclePhase === 0) {
                scrollState.searchDirection = 'up';
                scrollState.scrollCyclePhase = 1;
                debugLog('Search', 'Lesestelle neuer als geladene Posts → Phase 1 (nach oben)');
            } else if (targetId < oldestLoadedId && scrollState.scrollCyclePhase === 1) {
                scrollState.searchDirection = 'down';
                scrollState.scrollCyclePhase = 2;
                scrollState.hasCompletedCycle = true;
                debugLog('Search', 'Lesestelle älter als geladene Posts → Phase 2 (nach unten)');
            } else if (scrollState.hasCompletedCycle && scrollState.scrollCyclePhase === 2) {
                debugLog('Search', 'Zyklus abgeschlossen, keine passende Position gefunden.');
                searchControl.isSearching = false;
                updateActionPopup('tweetIdNotFound', {
                    authorHandler: lastReadPost?.authorHandler,
                    tweetId: lastReadPost?.tweetId
                });
                findAndSetClosestPost();
                window.removeEventListener('keydown', handleSpaceKey);
                io.disconnect();
                return;
            }
        }
        if (allLoadedIds.length > 0) {
            if (targetId >= oldestLoadedId && targetId <= newestLoadedId) {
                scrollState.isSlowScrollMode = true;
                debugLog('Search', 'Slow-Scroll-Mode aktiviert (Ziel innerhalb geladener Posts – verhindert Overshoot)');
            } else if (scrollState.largeScrollCount < scrollState.maxLargeScrolls) {
                scrollState.isSlowScrollMode = false;
            }
        } else if (scrollState.largeScrollCount < scrollState.maxLargeScrolls) {
            scrollState.isSlowScrollMode = false;
        }
        await performScrollAndContinue(search, () => {
            window.removeEventListener('keydown', handleSpaceKey);
            if (io) io.disconnect();
        });
    };
    await new Promise(resolve => setTimeout(resolve, 300));
    search();

    } catch (err) {
        log('Search', 'Unerwarteter Fehler in startRefinedSearchForLastReadPost:', err);
    } finally {
        // Immer zurücksetzen, damit markTopVisiblePost und andere Teile wieder arbeiten können
        searchControl.isSearching = false;
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

    // Einfacher, synchroner Distanz-Faktor basierend auf bereits geladenen Posts (nützlich & billig)
    function getTimestampFromTweetId(tweetId) {
        const TWITTER_EPOCH = 1288834974657n;
        return Number((BigInt(tweetId) >> 22n) + TWITTER_EPOCH);
    }

    const targetTimestamp = getTimestampFromTweetId(lastReadPost.tweetId);
    const allLoadedPosts = Array.from(document.querySelectorAll('article'));
    const allLoadedIds = allLoadedPosts
        .map(post => getPostTweetId(post))
        .filter(id => id && !isNaN(id))
        .map(id => BigInt(id));

    if (allLoadedIds.length > 0) {
        const newestLoadedId = allLoadedIds.reduce((max, id) => (id > max ? id : max), allLoadedIds[0]);
        const oldestLoadedId = allLoadedIds.reduce((min, id) => (id < min ? id : min), allLoadedIds[0]);
        const newestTimestamp = getTimestampFromTweetId(newestLoadedId);
        const oldestTimestamp = getTimestampFromTweetId(oldestLoadedId);
        const timeDiffToTarget = Math.abs(targetTimestamp - newestTimestamp) || Math.abs(targetTimestamp - oldestTimestamp);
        const hoursDiff = timeDiffToTarget / (3600 * 1000);
        let distanceFactor = Math.min(hoursDiff * 2, 10);
        // Cap um nach "viele Beiträge von neu abonniertem User" (hohe Neueste-IDs) nicht weit über die alte Lesestelle hinauszuschießen
        distanceFactor = Math.min(distanceFactor, CONFIG.MAX_SEARCH_DISTANCE_FACTOR);
        step *= distanceFactor;
        debugLog('Search', `Distanz-Faktor: ${distanceFactor.toFixed(2)} (Stunden: ${hoursDiff.toFixed(2)})`);
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

    // Hinweis: Die frühere asynchrone "Dichte-Schätzung" aus der History wurde entfernt,
    // weil sie als fire-and-forget IIFE in jedem Scroll-Schritt lief, den Faktor fast nie
    // rechtzeitig anwendete und die Konsole zugespammt hat. Der ID-basierte Distanz-Faktor
    // oben erfüllt den gleichen Zweck (größere Sprünge bei weit entfernten Zielen) synchron
    // und zuverlässig.

    if (scrollState.searchDirection === 'up') {
        step = -step;
    }
    if (!scrollState.isSlowScrollMode) {
        scrollState.largeScrollCount++;

        // (früherer toter Code "(1) > 1" wurde entfernt)
        if (scrollState.largeScrollCount >= scrollState.maxLargeScrolls) {
            scrollState.isSlowScrollMode = true;
            debugLog('Search', 'Max große Scrolls erreicht → Wechsel zu Slow-Scroll-Mode');
        }
    }
    debugLog('Search', `Scroll-Schritt: ${step}px (Slow: ${scrollState.isSlowScrollMode}, Dir: ${scrollState.searchDirection})`);
    return step;
}

    function scrollToPostWithHighlight(post, onComplete = null) {
    if (!post) {
        log('Search', 'Kein Beitrag zum Scrollen.');
        searchControl.isSearching = false;
        searchControl.isFallbackSearching = false;
        if (onComplete) onComplete();
        return;
    }
    const anchorTweetId = getPostTweetId(post);
    const anchorAuthor = getPostAuthorHandler(post);
    searchControl.isAutoScrolling = true;
    const maxPositionAttempts = CONFIG.MAX_POSITION_ATTEMPTS;
    let positionAttempts = 0;
    let lastMeasuredTop = null;
    const tryPositionPost = () => {
        // Special handling for the very first attempt: do a rough bring-into-view first.
        // This dramatically improves success rate when the post is still far away after the fallback's searching jumps.
        if (positionAttempts === 0) {
            const roughRect = post.getBoundingClientRect();
            const currentScroll = window.scrollY;

            // Rough center the post in the lower third of the screen (fast, no smooth)
            const roughTarget = currentScroll + roughRect.top - (window.innerHeight * 0.55);
            window.scrollTo({ top: roughTarget, behavior: 'auto' });

            // Give the browser and feed time to settle after the rough scroll + any ongoing mutations
            setTimeout(() => {
                // Now proceed with the normal precise measurement as attempt 0
                doPrecisePositioning();
            }, 900);
            return;
        }

        doPrecisePositioning();
    };

    const finishPositioning = (reason) => {
        debugLog('Position', reason);
        searchControl.isAutoScrolling = false;
        const freshPost = resolveFreshPostElement(post, anchorTweetId, anchorAuthor);
        updateHighlightedPost(freshPost || post);
        if (onComplete) onComplete();
    };

    const doPrecisePositioning = () => {
        const activePost = resolveFreshPostElement(post, anchorTweetId, anchorAuthor) || post;
        const rect = activePost.getBoundingClientRect();
        const scrollY = window.scrollY;
        const offset = CONFIG.RESTORE_SCROLL_OFFSET;
        const targetY = scrollY + rect.top - offset;

        debugLog('Position', `rect.top:${rect.top} scrollY:${scrollY} targetY:${targetY} Versuch:${positionAttempts+1}`);

        applyHighlightToPost(activePost);

        // Post bereits am/über dem Ziel (z. B. rect.top=0) → nicht weiter nach oben scrollen
        if (rect.top <= offset) {
            finishPositioning(`Beitrag bereits nah am Ziel (rect.top=${rect.top}, Ziel=${offset}px).`);
            return;
        }

        window.scrollTo({ top: targetY, behavior: 'smooth' });

        setTimeout(() => {
            const freshPost = resolveFreshPostElement(post, anchorTweetId, anchorAuthor) || post;
            const newRect = freshPost.getBoundingClientRect();
            const deviation = Math.abs(newRect.top - offset);
            const isWellPositioned = deviation <= CONFIG.POSITION_CORRECTION_TOLERANCE
                || newRect.top <= offset;
            const isStuckAtTop = lastMeasuredTop !== null
                && Math.abs(newRect.top - lastMeasuredTop) < 2
                && newRect.top <= offset + 5;

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
    searchControl.isFallbackSearching = true;
    searchControl.isSearchCancelled = false;

    // Auch im Fallback sauberen State sicherstellen (kann aus automatischer Suche nach New-Posts kommen)
    scrollState.scrollCyclePhase = 0;
    scrollState.hasCompletedCycle = false;
    scrollState.stagnantScrollCount = 0;
    scrollState.largeScrollCount = 0;
    scrollState.isSlowScrollMode = false;
    scrollState.searchDirection = 'down';
    scrollState.lastScrollHeight = 0;

    if (!lastReadPost || !lastReadPost.tweetId || !lastReadPost.timestamp) {
        log('Fallback', 'Keine gültige Leseposition für Fallback-Suche.');
        showPopup('tweetIdNotFound', 5000);
        searchControl.isFallbackSearching = false;
        return;
    }

    const targetTime = new Date(lastReadPost.timestamp).getTime();
    const targetId = BigInt(lastReadPost.tweetId);
    if (!popup) {
        popup = createSearchPopup(lastReadPost);
    } else {
        updateActionPopup('tweetIdNotFound', {
            authorHandler: lastReadPost.authorHandler,
            tweetId: lastReadPost.tweetId
        });
    }
    if (!popup) {
        log('Search', 'Popup konnte nicht erstellt werden.');
        searchControl.isFallbackSearching = false;
        return;
    }

    function handleSpaceKey(event) {
        if (event.code === 'Space' && (searchControl.isSearching || searchControl.isFallbackSearching)) {
            searchControl.isSearchCancelled = true;
            dismissActionPopup();
            showPopup('fallbackSearchCancelled', 5000);
            debugLog('Fallback', 'Suche gestoppt durch Benutzer.');
            searchControl.isSearching = false;
            searchControl.isFallbackSearching = false;
            window.removeEventListener('keydown', handleSpaceKey);
        }
    }
    window.addEventListener('keydown', handleSpaceKey);

    let attempts = 0;
    const maxAttempts = CONFIG.MAX_FALLBACK_ATTEMPTS;

    while (attempts < maxAttempts) {
        if (searchControl.isSearchCancelled) {
            debugLog('Fallback', 'Suche abgebrochen durch Benutzer.');
            searchControl.isFallbackSearching = false;
            dismissActionPopup();
            window.removeEventListener('keydown', handleSpaceKey);
            return;
        }

        const allLoadedPosts = Array.from(document.querySelectorAll('article')).map(post => ({
            element: post,
            tweetId: getPostTweetId(post),
            timestamp: getPostTimestamp(post),
            authorHandler: getPostAuthorHandler(post),
            isRepost: isRepost(post)
        })).filter(p => p.tweetId && p.timestamp && !isNaN(new Date(p.timestamp).getTime())).map(p => ({
            ...p,
            bigId: BigInt(p.tweetId),
            postTime: new Date(p.timestamp).getTime()
        }));

        if (allLoadedPosts.length === 0) {
            debugLog('Fallback', 'Keine geladenen Posts, warte...');
            await new Promise(resolve => setTimeout(resolve, 1200));
            attempts++;
            continue;
        }

        let closest = allLoadedPosts.reduce((prev, curr) => {
            const prevDiff = Math.abs(prev.postTime - targetTime);
            const currDiff = Math.abs(curr.postTime - targetTime);
            return currDiff < prevDiff ? curr : prev;
        });

        const timeDiff = Math.abs(closest.postTime - targetTime);

        // Machen wir den Fallback deutlich hartnäckiger:
        // Wir wollen den Post wirklich nah ans Viewport bringen, nicht nur "irgendwas innerhalb 1 Stunde" akzeptieren.
        const isVisuallyClose = Math.abs(closest.element.getBoundingClientRect().top) < window.innerHeight * 1.5;

        if ((timeDiff < 3600000 && isVisuallyClose) || attempts > 20) {
            // Sehr robuste finale "Bring this specific post close to viewport" Phase
            // Wir machen mehrere kontrollierte, mittelgroße Scrolls mit Wartezeiten,
            // bis der gewählte Post wirklich in einem guten Bereich des Viewports liegt.
            // Das verhindert den "einen großen Sprung und dann Stopp ohne richtige Zentrierung".
            let bringAttempts = 0;
            const maxBringAttempts = 7;

            while (bringAttempts < maxBringAttempts) {
                const currentRect = closest.element.getBoundingClientRect();
                const currentTop = currentRect.top;

                // Wenn der Post schon gut liegt (zwischen ca. RESTORE_SCROLL_OFFSET und 380px vom oberen Rand), aufhören.
                if (currentTop > CONFIG.RESTORE_SCROLL_OFFSET && currentTop < 380) {
                    break;
                }

                // Kontrollierter Schritt in die richtige Richtung
                const step = (currentTop > 380) ? -window.innerHeight * 0.5 : window.innerHeight * 0.4;
                window.scrollBy({ top: step, behavior: 'smooth' });

                await new Promise(resolve => setTimeout(resolve, 950)); // Wartezeit für Stabilisierung
                bringAttempts++;
            }

            const fallbackTweetId = closest.tweetId;
            const fallbackAuthor = closest.authorHandler;

            await new Promise(resolve => scrollToPostWithHighlight(closest.element, resolve));

            let finalAttempts = 0;
            const maxFinalAttempts = 4;
            while (finalAttempts < maxFinalAttempts) {
                const freshClosest = resolveFreshPostElement(closest.element, fallbackTweetId, fallbackAuthor);
                if (!freshClosest) break;

                const finalRect = freshClosest.getBoundingClientRect();
                const finalDeviation = Math.abs(finalRect.top - CONFIG.RESTORE_SCROLL_OFFSET);

                if (finalDeviation <= CONFIG.FALLBACK_POSITION_TOLERANCE || finalRect.top <= CONFIG.RESTORE_SCROLL_OFFSET) {
                    break;
                }

                const correction = (finalRect.top - CONFIG.RESTORE_SCROLL_OFFSET) * 0.7;
                window.scrollBy({ top: -correction, behavior: 'smooth' });
                await new Promise(resolve => setTimeout(resolve, 700));
                finalAttempts++;
            }

            const freshFallbackElement = resolveFreshPostElement(closest.element, fallbackTweetId, fallbackAuthor);
            await adoptFallbackPost(freshFallbackElement || closest.element);

            log('Search', `Zeitlich nächsten Post gefunden (Diff: ${Math.round(timeDiff / 60000)} min) — Fallback.`);
            dismissActionPopup();
            showPopup('postDeletedFallback', 8000);
            searchControl.isFallbackSearching = false;
            window.removeEventListener('keydown', handleSpaceKey);
            return;
        }

        // Weniger aggressive Sprünge im Fallback, damit der User nicht das Gefühl hat "großer Sprung und dann Stopp"
        const scrollStep = (attempts % 3 === 0) 
            ? -window.innerHeight * 0.75 
            : window.innerHeight * 0.65;

        window.scrollBy({ top: scrollStep, behavior: 'smooth' });
        await new Promise(resolve => setTimeout(resolve, 1600));
        attempts++;

        debugLog('Fallback', `Versuch ${attempts}/${maxAttempts}, Zeit-Diff: ${Math.round(timeDiff / 60000)} min`);
    }

    log('Search', 'Maximale Versuche erreicht, keine passende Position gefunden.');
    dismissActionPopup();
    showPopup('tweetIdNotFound', 8000);
    searchControl.isFallbackSearching = false;
    window.removeEventListener('keydown', handleSpaceKey);
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
                log('NewPosts', 'Indicator erkannt – Auto-Click in 600ms');
                setTimeout(clickNewPostsIndicator, 600);
            } else {
                debugLog('NewPosts', 'Indicator gesehen bei scrollY=' + Math.round(window.scrollY) + ' – ignoriert (nicht nah am Top, kein Auto-Laden).');
            }
            window.newPostsObserver.disconnect();
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

    function clickNewPostsIndicator() {

    const btn = getNewPostsIndicator();
    if (!btn) {
        debugLog('NewPosts', 'Kein Button gefunden');
        return;
    }

    btn.dataset.processed = 'true';
    btn.click();

    log('NewPosts', 'Button automatisch geklickt');
    pendingNewPosts = 0;
    suppressionState.until = Date.now() + CONFIG.NEW_POSTS_GRACE_MS;
    scrollState.hasScrolledUp = false; // Nach Feed-Sprung durch "Neue Beiträge" kein automatisches Hochscrollen annehmen

    // === Wichtiger Pfad: Nach automatischem Laden neuer Beiträge die letzte Lesestelle wiederherstellen ===
    if (lastReadPost && lastReadPost.tweetId) {
        searchControl.isSearching = true;

        log('Restore', 'Nach neuen Beiträgen: Warte auf DOM-Stabilisierung und versuche letzte Lesestelle wiederherzustellen...');

        waitForNewPosts(() => {
            // Etwas mehr Zeit für Layout nach neuen Posts (Bilder, Zitate, etc. verändern noch Positionen)
            setTimeout(() => {
                const posts = Array.from(document.querySelectorAll('article'));
                const foundPost = posts.find(post => {
                    const tweetId = getPostTweetId(post);
                    const author = getPostAuthorHandler(post);
                    return tweetId === lastReadPost.tweetId && author === lastReadPost.authorHandler;
                });

                if (foundPost) {
                    log('Restore', 'Letzte Lesestelle nach New-Posts direkt im DOM gefunden → markiere + zentriere.');
                    scrollToPostWithHighlight(foundPost);
                    searchControl.isSearching = false;
                } else {
                    log('Restore', 'Letzte Lesestelle nach New-Posts nicht direkt sichtbar → starte Fallback-Suche.');
                    if (searchControl.isFallbackSearching) searchControl.isFallbackSearching = false;

                    // Nach Laden vieler neuer Beiträge (z.B. neu abonniertes Konto mit hoher Post-Frequenz)
                    // konservativ starten: Slow-Mode + zurückgesetzter largeScrollCount, damit calculateScrollStep
                    // keine riesigen Sprünge macht und nicht weit über die alte Lesestelle hinausschießt.
                    scrollState.isSlowScrollMode = true;
                    scrollState.largeScrollCount = 0;
                    scrollState.scrollCyclePhase = 0;
                    startRefinedSearchForLastReadPost();
                }
            }, 400); // extra kleine Wartezeit für stabileres Layout nach neuen Posts
        });
    }

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
})();

