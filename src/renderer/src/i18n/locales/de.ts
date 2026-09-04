export const de = {
  // App General
  'app.name': 'RekordFox',
  'app.tagline': 'Deine DJ-Sync-Station',
  'app.selectPlaylistPrompt':
    'Wähle eine Playlist aus oder füge eine neue hinzu, um Tracks anzuzeigen.',

  // Onboarding (first run – shown when no playlists exist)
  'onboarding.welcomeTitle': 'Willkommen bei RekordFox',
  'onboarding.welcomeSubtitle':
    'Deine DJ-Sync-Station – importiere YouTube- und Spotify-Playlists, verwalte deine Tracks und exportiere sie für CDJs & USB.',
  'onboarding.whatToExpectTitle': 'Das erwartet dich',
  'onboarding.feature1Title': 'Playlists importieren',
  'onboarding.feature1Desc':
    'Importiere deine Playlists von YouTube oder Spotify direkt in RekordFox.',
  'onboarding.feature2Title': 'Tracks verwalten & downloaden',
  'onboarding.feature2Desc':
    'Lade Tracks als MP3 herunter, analysiere BPM & Tonart und sortiere deine Sets harmonisch.',
  'onboarding.feature3Title': 'Export für CDJs & USB',
  'onboarding.feature3Desc':
    'Exportiere deine Playlists Rekordbox-kompatibel auf USB-Sticks für Pioneer-CDJs.',
  'onboarding.setupTitle': 'Schnelle Einrichtung',
  'onboarding.tryTitle': 'Probier es aus',
  'onboarding.tryDesc':
    'Probiere es aus und importiere diese Beispiel-Playlist einmal testweise, um zu sehen, wie der Download funktioniert.',
  'onboarding.importExample': 'Beispiel-Playlist importieren',
  'onboarding.importing': 'Importiere…',
  'onboarding.getStarted': 'Eigene Playlist hinzufügen',
  'onboarding.close': 'Onboarding schließen',

  // Title Bar
  'titlebar.minimize': 'Minimieren',
  'titlebar.maximize': 'Maximieren',
  'titlebar.restore': 'Wiederherstellen',
  'titlebar.close': 'Schließen',

  // Mixer
  'mixer.show': 'Mixer einblenden',
  'mixer.hide': 'Mixer ausblenden',
  'mixer.center': 'CENTER',
  'mixer.master': 'MASTER',

  // Sidebar
  'sidebar.playlists': 'Playlists',
  'sidebar.loadingDetails': 'Playlist-Details werden geladen...',
  'sidebar.noPlaylists': 'Keine Playlists',
  'sidebar.addNow': 'Jetzt hinzufügen',
  'sidebar.settings': 'Einstellungen',
  'sidebar.discover': 'Entdecken',
  'sidebar.dropBlockedYoutube':
    'Lokale Tracks können nicht in eine YouTube-Playlist gezogen werden.',
  'sidebar.trackAddedToPlaylist': 'Track zur Playlist hinzugefügt.',
  'sidebar.trackAlreadyInPlaylist': 'Dieser Track ist bereits in der Playlist.',
  'sidebar.trackAddFailed': 'Fehler beim Hinzufügen des Tracks: {{error}}',
  'sidebar.youtubeSourceTooltip': 'Importiert von YouTube (OAuth)',
  'sidebar.pushSyncedTooltip': 'Mit YouTube synchronisiert',
  'sidebar.connectedTooltip': 'Mit deinem YouTube-Konto verbunden',
  'sidebar.localSourceTooltip': 'YouTube-Playlist (nur Download)',
  'sidebar.spotifySourceTooltip': 'Spotify-Playlist (auf YouTube gesucht und heruntergeladen)',
  'sidebar.allDownloadedTooltip': 'Alle {{count}} Tracks heruntergeladen',
  'sidebar.someMissingTooltip': '{{downloaded}} von {{total}} Tracks heruntergeladen',
  'sidebar.syncErrorTooltip': 'Letzte Synchronisierung fehlgeschlagen',
  'sidebar.orphanedTooltip':
    'YouTube-Konto getrennt — erneut in den Einstellungen verbinden, um wieder zu synchronisieren',
  'sidebar.needsReauthTooltip':
    'YouTube-Anmeldung abgelaufen — Konto in den Einstellungen erneut verbinden',
  'sidebar.pushPendingTooltip': 'Ungespeicherte Änderungen — noch nicht zu YouTube synchronisiert',
  'sidebar.addPlaylistTooltip': 'Playlist hinzufügen',
  'sidebar.renamePlaylistTooltip': 'Playlist umbenennen',
  'sidebar.syncPlaylistTooltip': 'Playlist synchronisieren',
  'sidebar.deletePlaylistTooltip': 'Playlist löschen',

  // Add Playlist Modal
  'addPlaylist.title': 'Playlist hinzufügen',
  'addPlaylist.platformLabel': 'Plattform',
  'addPlaylist.platformYoutube': 'YouTube',
  'addPlaylist.platformSpotify': 'Spotify',
  'addPlaylist.label': 'Playlist URL',
  'addPlaylist.placeholder': 'https://www.youtube.com/playlist?list=...',
  'addPlaylist.placeholderSpotify': 'https://open.spotify.com/playlist/...',
  'addPlaylist.errorInvalidUrlSpotify': 'Bitte eine gültige Spotify-Playlist-URL eingeben.',
  'addPlaylist.errorInvalidUrl':
    'Bitte gib eine gültige YouTube-Playlist-URL ein (muss "list=" enthalten).',
  'addPlaylist.errorAddFailed': 'Fehler beim Hinzufügen der Playlist.',
  'addPlaylist.cancel': 'Abbrechen',
  'addPlaylist.add': 'Hinzufügen',
  'addPlaylist.loading': 'Wird geladen...',
  'addPlaylist.closeTooltip': 'Schließen',

  // Settings Modal
  'settings.title': 'Einstellungen',
  'settings.categoryGeneral': 'Allgemein',
  'settings.categoryLibrary': 'Bibliothek',
  'settings.categoryDownloads': 'Downloads & Sync',
  'settings.categoryShortcuts': 'Shortcuts',
  'settings.categoryConnections': 'Verbindungen',
  'settings.saved': 'Einstellung gespeichert',
  'settings.appearanceMode': 'Erscheinungsbild',
  'settings.themeModeLabel': 'Modus',
  'settings.themeDark': 'Dunkel',
  'settings.themeLight': 'Hell',
  'settings.colorScheme': 'Farbschema',
  'settings.colorSchemePurple': 'Violett',
  'settings.colorSchemeBlue': 'Blau',
  'settings.colorSchemeGreen': 'Grün',
  'settings.colorSchemeOrange': 'Orange',
  'settings.colorSchemeRose': 'Rosé',
  'settings.colorSchemeTeal': 'Türkis',
  'settings.colorSchemeForest': 'Waldgrün',
  'settings.colorSchemeAmber': 'Bernstein',
  'settings.colorSchemeCyan': 'Cyan',
  'settings.colorSchemeFuchsia': 'Fuchsia',
  'settings.colorSchemeCustom': 'Eigene Farbe',
  'settings.errorChangeColorScheme': 'Fehler beim Ändern des Farbschemas.',
  'settings.downloadPathLabel': 'Speicherort der Playlisten',
  'settings.downloadPathSyncingTooltip':
    'Speicherort kann während der Synchronisation nicht geändert werden',
  'settings.downloadPathSelectTooltip': 'Anderen Ordner auswählen',
  'settings.downloadPathSelect': 'Wählen',
  'settings.downloadPathOpenTooltip': 'Ordner im Finder/Explorer öffnen',
  'settings.downloadPathOpen': 'Öffnen',
  'settings.downloadPathSyncingWarning':
    '⚠️ Der Speicherort kann während einer aktiven Synchronisation nicht geändert werden.',
  'settings.downloadPathHelp':
    'Hier werden alle MP3s und Coverbilder deiner YouTube-Playlists gespeichert.',
  'settings.concurrentDownloads': 'Gleichzeitige Downloads',
  'settings.workersCount': '{{count}} Worker',
  'settings.concurrentDownloadsHelp':
    'Legt fest, wie viele Tracks einer Playliste gleichzeitig heruntergeladen werden (1 bis 12).',
  'settings.storageSectionLabel': 'Speicherplatz',
  'settings.storageDownloadsLabel': 'Heruntergeladene Tracks',
  'settings.storageDownloadsValue': '{{count}} Tracks · {{size}}',
  'settings.storageCacheLabel': 'Cache (Cover-Bilder)',
  'settings.storageCacheValue': '{{size}}',
  'settings.storageHelp':
    'Zeigt, wie viel Speicherplatz deine heruntergeladenen Tracks und der Cover-Bild-Cache aktuell belegen.',
  'settings.languageLabel': 'Sprache',
  'settings.sectionOnboarding': 'Onboarding',
  'settings.showOnboardingButton': 'Onboarding anzeigen',
  'settings.showOnboardingHelp':
    'Zeigt den Willkommens-Screen erneut an, den du beim ersten Start gesehen hast.',
  'settings.sectionTooltips': 'Tooltips',
  'settings.tooltipsEnabledLabel': 'Tooltips anzeigen',
  'settings.tooltipsEnabledHelp':
    'Zeigt Hinweistexte an, wenn du mit der Maus über Buttons und Icons fährst.',
  'settings.errorChangeTooltipsEnabled': 'Fehler beim Ändern der Tooltip-Einstellung.',
  'settings.tooltipDelayLabel': 'Tooltip-Verzögerung',
  'settings.tooltipDelayMs': '{{count}} ms',
  'settings.errorChangeTooltipDelay': 'Fehler beim Ändern der Tooltip-Verzögerung.',
  'settings.close': 'Schließen',
  'settings.errorChangePath': 'Fehler beim Ändern des Speicherorts.',
  'settings.errorChangeTheme': 'Fehler beim Ändern des Themes.',
  'settings.errorChangeWorkers': 'Fehler beim Ändern der Worker-Anzahl.',
  'settings.errorChangeLanguage': 'Fehler beim Ändern der Sprache.',
  'settings.filenameTemplateLabel': 'Dateinamen-Format',
  'settings.filenameTemplateDefault': 'Standard (ID/Kryptisch)',
  'settings.filenameTemplateCustom': 'Lesbar (Position-Artist-Track-BPM-Hash)',
  'settings.filenameTemplateHelp':
    'Bestimmt, wie heruntergeladene MP3-Dateien in deinem Speicherort benannt werden.',
  'settings.errorChangeFilenameTemplate': 'Fehler beim Ändern des Dateinamen-Formats.',
  'settings.renamingIndicator': 'Umbenennen... ({{current}}/{{total}})',
  'settings.renamingIndicatorText': 'Dateien werden umbenannt...',
  'settings.rekordboxXmlLabel': 'Rekordbox XML Auto-Export',
  'settings.rekordboxXmlHelp':
    'Wenn konfiguriert, exportiert RekordFox bei jeder Änderung automatisch eine rekordbox.xml, um deine Playlisten in Rekordbox synchron zu halten.',
  'settings.rekordboxXmlSelect': 'Wählen',
  'settings.rekordboxXmlSelectTooltip': 'XML-Datei für den Export auswählen',
  'settings.rekordboxXmlClear': 'Löschen',
  'settings.rekordboxXmlClearTooltip': 'XML-Exportpfad entfernen',
  'settings.rekordboxXmlExportNow': 'Jetzt exportieren',
  'settings.rekordboxXmlExportNowTooltip': 'Gesamte Kollektion jetzt manuell als XML exportieren',
  'settings.rekordboxXmlSuccess': 'Rekordbox XML erfolgreich exportiert!',
  'settings.rekordboxXmlError': 'Fehler beim XML-Export: {{error}}',
  'settings.historyLimitLabel': 'Verlaufsgröße',
  'settings.historyLimitCount': '{{count}} Tracks',
  'settings.historyLimitHelp':
    'Legt fest, wie viele zuletzt abgespielte Tracks im Verlauf behalten werden (10 bis 500).',
  'settings.errorChangeHistoryLimit': 'Fehler beim Ändern der Verlaufsgröße.',
  'settings.shortcuts.title': 'Vorschau-Player Shortcuts',
  'settings.shortcuts.help':
    'Klicke auf einen Shortcut und drücke die gewünschte Taste, um ihn neu zu belegen. Sie funktionieren app-weit, solange ein Track geladen ist.',
  'settings.shortcuts.previewPlayPause': 'Play / Pause',
  'settings.shortcuts.previewNext': 'Nächster Titel',
  'settings.shortcuts.previewPrevious': 'Vorheriger Titel',
  'settings.shortcuts.previewVolumeUp': 'Lauter',
  'settings.shortcuts.previewVolumeDown': 'Leiser',
  'settings.shortcuts.previewMute': 'Stumm schalten',
  'settings.shortcuts.previewSeekForward': 'Vorspulen',
  'settings.shortcuts.previewSeekBackward': 'Zurückspulen',
  'settings.shortcuts.previewToggleQueue': 'Warteschlange ein-/ausblenden',
  'settings.shortcuts.previewToggleDock': 'Dock-Modus umschalten',
  'settings.shortcuts.change': 'Ändern',
  'settings.shortcuts.reset': 'Zurücksetzen',
  'settings.shortcuts.resetAll': 'Alle zurücksetzen',
  'settings.shortcuts.pressKey': 'Taste drücken... (Esc zum Abbrechen)',
  'settings.shortcuts.conflict': 'Bereits belegt von "{{action}}"',

  // Connections Settings (YouTube OAuth)
  'connections.title': 'YouTube',
  'connections.subtitle':
    'Verbinde dein YouTube-Konto, um eigene Playlists zu importieren, harmonisch zu sortieren und die neue Reihenfolge zurück zu synchronisieren.',
  'connections.credentialsTitle': 'Google OAuth Zugangsdaten',
  'connections.clientIdLabel': 'Google OAuth Client-ID',
  'connections.clientIdPlaceholder': 'xxxxxxxx.apps.googleusercontent.com',
  'connections.clientSecretLabel': 'Google OAuth Client-Secret',
  'connections.clientSecretPlaceholder': 'GOCSPX-...',
  'connections.credentialsHelp':
    'Erstelle ein OAuth-Client in der Google Cloud Console (Typ „Desktop-App“) mit Zugriff auf die YouTube Data API v3 und trage die Zugangsdaten hier ein.',
  'connections.spotifyTitle': 'Spotify',
  'connections.spotifySubtitle':
    'Füge Spotify-Playlists hinzu — Tracks werden auf YouTube gesucht und von dort heruntergeladen.',
  'connections.spotifyCredentialsTitle': 'Spotify API Zugangsdaten',
  'connections.spotifyClientIdLabel': 'Spotify Client-ID',
  'connections.spotifyClientIdPlaceholder': 'Spotify Client-ID',
  'connections.spotifyClientSecretLabel': 'Spotify Client-Secret',
  'connections.spotifyClientSecretPlaceholder': 'Spotify Client-Secret',
  'connections.spotifyCredentialsHelp':
    'Erstelle eine App im Spotify Developer Dashboard, trage die in der Anleitung unten gezeigte Redirect-URI ein und hinterlege hier die Client-ID/Secret. Zum Lesen von Playlists muss zusätzlich unten dein Spotify-Konto verbunden werden.',
  'connections.spotifyConnectButton': 'Mit Spotify verbinden',
  'connections.spotifyConnectedAccountTitle': 'Verbundenes Konto',
  'connections.spotifyNoAccount': 'Noch kein Spotify-Konto verbunden.',
  'connections.errorConnectSpotify': 'Fehler beim Verbinden mit Spotify: {{error}}',
  'connections.errorDisconnectSpotify': 'Fehler beim Trennen des Spotify-Kontos: {{error}}',
  'connections.connectButton': 'Mit Google verbinden',
  'connections.connecting': 'Warte auf Anmeldung im Browser...',
  'connections.copyLink': 'Link kopieren',
  'connections.copyLinkTooltip':
    'Anmelde-Link in die Zwischenablage kopieren, um ihn in einem beliebigen Browser/Profil zu öffnen',
  'connections.linkCopied': 'Anmelde-Link in die Zwischenablage kopiert.',
  'connections.missingCredentials': 'Bitte zuerst Client-ID und Client-Secret eintragen.',
  'connections.testConnection': 'Verbindung testen',
  'connections.testing': 'Wird getestet…',
  'connections.testSuccess': 'Verbindung erfolgreich — die Zugangsdaten sind gültig.',
  'connections.testError': 'Verbindung fehlgeschlagen: {{error}}',
  'connections.connectedAccountsTitle': 'Verbundene Konten',
  'connections.disconnectButton': 'Trennen',
  'connections.noAccounts': 'Noch kein YouTube-Konto verbunden.',
  'connections.importPlaylistsTitle': 'Playlist importieren',
  'connections.loadPlaylistsButton': 'Aktualisieren',
  'connections.importButton': 'Importieren',
  'connections.importing': 'Importiere Playlist...',
  'connections.noRemotePlaylists': 'Keine Playlists in diesem YouTube-Konto gefunden.',
  'connections.errorConnect': 'Fehler beim Verbinden mit YouTube: {{error}}',
  'connections.errorDisconnect': 'Fehler beim Trennen des Kontos: {{error}}',
  'connections.errorLoadPlaylists': 'Fehler beim Laden der YouTube-Playlists: {{error}}',
  'connections.errorImport': 'Fehler beim Importieren der Playlist: {{error}}',
  'connections.playlistsLinked':
    '{{count}} bestehende Playlist(s) gehören zu diesem Konto und wurden verknüpft.',
  'connections.noNewPlaylistsLinked':
    'Keine weiteren Playlists gefunden, die verknüpft werden können.',
  'connections.reconcileButton': 'Bestehende Playlists mit diesem Konto abgleichen',
  'connections.errorReconcile': 'Fehler beim Abgleichen der Playlists: {{error}}',

  // Google OAuth Setup Guide (Connections)
  'oauthGuide.toggle': 'Anleitung: Google OAuth einrichten',
  'oauthGuide.openLink': 'In Google Cloud Console öffnen',
  'oauthGuide.step1.title': '1. Google-Cloud-Projekt erstellen',
  'oauthGuide.step1.description':
    'Lege ein neues, kostenloses Google-Cloud-Projekt an (keine Kreditkarte für die YouTube-API nötig). Gib ihm einen beliebigen Namen, z. B. „RekordFox".',
  'oauthGuide.step2.title': '2. YouTube Data API v3 aktivieren',
  'oauthGuide.step2.description':
    'Öffne die YouTube Data API v3 in der API-Bibliothek deines Projekts und klicke auf „Aktivieren".',
  'oauthGuide.step3.title': '3. OAuth-Zustimmungsbildschirm einrichten',
  'oauthGuide.step3.description':
    'Wähle als Nutzertyp „Extern" und vergib einen App-Namen und deine E-Mail-Adresse als Kontakt. Speichere und gehe weiter zum Abschnitt „Bereiche" (Scopes).',
  'oauthGuide.step4.title': '4. Benötigte Bereiche (Scopes) hinzufügen',
  'oauthGuide.step4.description':
    'Klicke auf „Bereiche hinzufügen oder entfernen" und aktiviere genau diese drei Bereiche:\n\n• .../auth/userinfo.email (nicht sensibel)\n• .../auth/userinfo.profile (nicht sensibel)\n• .../auth/youtube (sensibel, „YouTube-Konto verwalten")\n\nWeitere YouTube-Bereiche wie readonly, force-ssl oder download werden von RekordFox nicht benötigt — lasse sie deaktiviert. Klicke danach auf „Aktualisieren" und speichere.',
  'oauthGuide.step5.title': '5. Wichtig: Dich selbst als Testnutzer eintragen',
  'oauthGuide.step5.description':
    'Da die App von Google nicht verifiziert ist, funktioniert die Anmeldung nur mit Konten, die explizit als „Testnutzer" hinterlegt sind. Trage auf derselben Seite unter „Testnutzer" deine eigene Google-Mail-Adresse ein — sonst schlägt die Anmeldung mit „Diese App wurde nicht verifiziert" fehl.',
  'oauthGuide.step6.title': '6. OAuth-Client-ID erstellen',
  'oauthGuide.step6.description':
    'Klicke auf „Anmeldedaten erstellen" → „OAuth-Client-ID". Wähle als Anwendungstyp unbedingt „Desktop-App" — nur dieser Typ erlaubt RekordFox die lokale Anmeldung ohne feste Redirect-URI.',
  'oauthGuide.step7.title': '7. Client-ID & Secret übernehmen',
  'oauthGuide.step7.description':
    'Google zeigt dir jetzt Client-ID und Client-Secret an. Kopiere beide Werte und trage sie oben in RekordFox ein.',
  'oauthGuide.step8.title': '8. Was beim Verbinden passiert',
  'oauthGuide.step8.description':
    'Klickst du in RekordFox auf „Verbinden", öffnet sich dein Browser zur Google-Anmeldung. Danach leitet Google dich zu einer Adresse auf deinem eigenen Rechner weiter, z. B. http://127.0.0.1:51234/oauth/callback — diese Seite wird von RekordFox selbst lokal gehostet, nicht von Google, und verlässt deinen Rechner nie. Sie bestätigt die Verbindung und schließt sich nach ein paar Sekunden von selbst; du kannst dann zu RekordFox zurückwechseln.',

  // Spotify API Anleitung
  'spotifyGuide.toggle': 'Anleitung: Spotify-API-Zugang einrichten',
  'spotifyGuide.openLink': 'Im Spotify Developer Dashboard öffnen',
  'spotifyGuide.step1.title': '1. Spotify Developer Dashboard öffnen',
  'spotifyGuide.step1.description':
    'Melde dich mit deinem normalen Spotify-Konto an — Free oder Premium funktionieren beide, ein spezielles Entwicklerkonto ist nicht nötig.',
  'spotifyGuide.step2.title': '2. App erstellen',
  'spotifyGuide.step2.description':
    'Klicke auf „Create app". Trage einen beliebigen App-Namen und eine Beschreibung ein — beides wird nur dir angezeigt. Bei „Redirect URI" trage genau http://127.0.0.1:8888/callback ein — RekordFox nutzt diese URI, um deine Anmeldung zu empfangen, sie muss also exakt übereinstimmen. Hake „Web API" bei den genutzten APIs an, akzeptiere die Bedingungen und speichere.',
  'spotifyGuide.step3.title': '3. Wichtig: dich selbst als erlaubten Nutzer hinzufügen',
  'spotifyGuide.step3.description':
    'Da die App nicht von Spotify geprüft wurde, funktioniert die Anmeldung nur für hier explizit hinzugefügte Konten (bis zu 25). Öffne die Settings der App, gehe zu „User Management" und trage die E-Mail-Adresse deines eigenen Spotify-Kontos ein — sonst schlägt die Anmeldung fehl.',
  'spotifyGuide.step4.title': '4. Einstellungen der App öffnen',
  'spotifyGuide.step4.description':
    'Klicke auf deine neue App und dann rechts oben auf „Settings".',
  'spotifyGuide.step5.title': '5. Client-ID kopieren',
  'spotifyGuide.step5.description':
    'Kopiere die oben angezeigte Client-ID und trage sie in RekordFox oben in das Feld „Spotify Client-ID" ein.',
  'spotifyGuide.step6.title': '6. Client-Secret anzeigen und kopieren',
  'spotifyGuide.step6.description':
    'Klicke auf „View client secret", kopiere den Wert und trage ihn in das Feld „Spotify Client-Secret" oben ein. Halte ihn geheim — wer ihn kennt, kann dein Spotify-API-Kontingent nutzen.',
  'spotifyGuide.step7.title': '7. Was beim Verbinden passiert',
  'spotifyGuide.step7.description':
    'Klickst du in RekordFox auf „Verbinden", öffnet sich dein Browser zur Spotify-Anmeldung. Danach leitet Spotify dich zu http://127.0.0.1:8888/callback weiter — genau die Adresse, die du in Schritt 2 als Redirect URI eingetragen hast. Diese Seite wird von RekordFox selbst lokal auf deinem Rechner gehostet, nicht von Spotify, und verlässt deinen Rechner nie. Sie bestätigt die Verbindung und schließt sich nach ein paar Sekunden von selbst.',

  // Generic Setup Guide Stepper (used by Google OAuth, Spotify & Rekordbox XML guides)
  'setupGuide.stepIndicator': 'Schritt {{current}} von {{total}}',
  'setupGuide.back': 'Zurück',
  'setupGuide.next': 'Weiter',
  'setupGuide.finish': 'Fertig — von vorne beginnen',

  // Rekordbox XML Setup Guide (Downloads)
  'rekordboxGuide.toggle': 'Anleitung: XML in rekordbox einbinden',
  'rekordboxGuide.step1.title': '1. rekordbox-Einstellungen öffnen',
  'rekordboxGuide.step1.description':
    'Öffne rekordbox und gehe über das rekordbox-Menü (bzw. das Zahnrad-Symbol) zu „Einstellungen" (Preferences).',
  'rekordboxGuide.step2.title': '2. Zum Reiter „Erweitert" → „Datenbank" wechseln',
  'rekordboxGuide.step2.description':
    'Wechsle im Einstellungsfenster zum Reiter „Erweitert" (Advanced) und wähle dort den Abschnitt „Datenbank" (Database).',
  'rekordboxGuide.step3.title': '3. rekordbox-xml-Datei verknüpfen',
  'rekordboxGuide.step3.description':
    'Aktiviere die Option „rekordbox xml" und klicke auf „Durchsuchen", um genau die XML-Datei auszuwählen, die RekordFox exportiert (den Pfad findest du oben in diesen Einstellungen). Mit „OK" bestätigen.',
  'rekordboxGuide.step4.title': '4. Playlists im Browser finden',
  'rekordboxGuide.step4.description':
    'Im linken Browserbereich von rekordbox erscheint jetzt der Eintrag „rekordbox xml" mit deinen exportierten Playlists und Tracks.',
  'rekordboxGuide.step5.title': '5. In die eigene Sammlung übernehmen',
  'rekordboxGuide.step5.description':
    'Rechtsklick auf eine Playlist unter „rekordbox xml" → „Zur Sammlung hinzufügen" (Import To Collection), um Tracks und Playlist-Struktur wirklich in deine rekordbox-Bibliothek zu kopieren.',
  'rekordboxGuide.step6.title': '6. Wichtig: nach jedem Export erneut aktualisieren',
  'rekordboxGuide.step6.description':
    'Sobald RekordFox die XML-Datei erneut exportiert (z. B. über „Jetzt exportieren"), zeigt rekordbox den aktuellen Stand unter „rekordbox xml" an. Bereits importierte Playlists musst du danach erneut per „Zur Sammlung hinzufügen" übernehmen, damit Änderungen in deine Bibliothek übernommen werden.',

  // Pioneer / CDJ USB-Stick Initialisierung (Anleitung)
  'pioneerInitGuide.toggle': 'Anleitung: USB-Stick einmalig für CDJs einrichten',
  'pioneerInitGuide.step1.title': '1. USB-Stick als FAT32 formatieren',
  'pioneerInitGuide.step1.description':
    'Pioneer-CDJs lesen USB-Sticks nur im Dateisystem FAT32 (oder HFS+). Formatiere den Stick vorher entsprechend. Achtung: Beim Formatieren werden alle Daten auf dem Stick gelöscht – sichere ggf. vorhandene Dateien.',
  'pioneerInitGuide.step2.title': '2. rekordbox öffnen und in den „Export"-Modus wechseln',
  'pioneerInitGuide.step2.description':
    'Starte rekordbox auf dem Computer. Stelle oben links den Modus-Umschalter auf „Export" (nicht „Performance"). Nur im Export-Modus lassen sich USB-Sticks für CDJs vorbereiten.',
  'pioneerInitGuide.step2.link': 'rekordbox herunterladen',
  'pioneerInitGuide.step3.title': '3. USB-Stick anschließen',
  'pioneerInitGuide.step3.description':
    'Stecke den Stick ein. Er erscheint in rekordbox in der linken Seitenleiste unter „Geräte" (Devices) mit dem Namen des Sticks.',
  'pioneerInitGuide.step4.title': '4. Einen Titel analysieren und auf das Gerät exportieren',
  'pioneerInitGuide.step4.description':
    'Ziehe einen beliebigen (analysierten) Titel oder eine Playlist per Drag & Drop aus deiner rekordbox-Sammlung auf das Gerät in der Seitenleiste. rekordbox legt dabei einmalig den Ordner „PIONEER" mit der Datenbank an. Warte, bis der Export abgeschlossen ist.',
  'pioneerInitGuide.step5.title': '5. Gerät sicher auswerfen',
  'pioneerInitGuide.step5.description':
    'Wirf den Stick in rekordbox über das Auswurf-Symbol neben dem Gerät (oder im Betriebssystem) sicher aus, damit die Datenbank vollständig geschrieben wird.',
  'pioneerInitGuide.step6.title': '6. Zurück zu RekordFox',
  'pioneerInitGuide.step6.description':
    'Stecke den Stick wieder ein und wähle ihn hier erneut aus. Der Hinweis verschwindet nun, und beim Pioneer-Export werden auch die Waveforms geschrieben, die die CDJs anzeigen. Diese Einrichtung ist nur einmal pro Stick nötig.',

  // Deck
  'deck.loadingWaveform': 'Dekodiere Welle...',
  'deck.noTrackLoaded': 'Kein Track geladen',
  'deck.setCueTooltip': 'Aktuelle Position als Cue setzen',
  'deck.autoloop': 'Autoloop (Beats)',
  'deck.pitchBendUpTooltip': 'Pitch Bend +',
  'deck.pitchBendDownTooltip': 'Pitch Bend -',
  'deck.keyShiftUpTooltip': 'Tonart einen Halbton höher',
  'deck.keyShiftDownTooltip': 'Tonart einen Halbton tiefer',

  // Track Row
  'track.waiting': 'Warte...',
  'track.downloading': 'Lade herunter ({{percent}}%)',
  'track.queued': 'In Warteschlange...',
  'track.downloadFailedLabel': 'Nicht verfügbar',
  'track.downloadFailedHint':
    'Dieser Track konnte nicht heruntergeladen werden und wird bei Warteschlangen und Smart Shuffle nicht berücksichtigt.',
  'track.newLabel': 'NEU',

  // Tracklist
  'tracklist.usbExport': 'USB Export',
  'tracklist.searchPlaceholder': 'Suchen nach Titel, Interpret...',
  'tracklist.clearSearch': 'Suche löschen',
  'tracklist.colPosition': '#',
  'tracklist.colCover': 'Cover',
  'tracklist.colTitle': 'Titel / Interpret',
  'tracklist.colRating': 'Rating',
  'tracklist.colBpm': 'BPM',
  'tracklist.colKey': 'Key',
  'tracklist.colFormat': 'Format / Qualität',
  'tracklist.colDateAdded': 'Hinzugefügt',
  'tracklist.colDuration': 'Dauer',
  'tracklist.colLoadDeck': 'In Deck laden',
  'tracklist.noTracksFound': 'Keine Tracks gefunden',
  'tracklist.customizeColumns': 'Spalten anpassen',
  'tracklist.syncToYoutube': 'Zu YouTube synchronisieren',
  'tracklist.syncingToYoutube': 'Synchronisiere...',
  'tracklist.syncToYoutubeSuccess': 'Reihenfolge erfolgreich zu YouTube synchronisiert.',
  'tracklist.syncToYoutubeError': 'Fehler beim Synchronisieren zu YouTube: {{error}}',
  'tracklist.syncPlaylistSuccess': 'Playlist mit YouTube synchronisiert.',
  'tracklist.previewPlayTooltip': 'Track abspielen',
  'tracklist.previewStopTooltip': 'Wiedergabe stoppen',
  'tracklist.rateTooltip': '{{count}} Sterne vergeben',
  'tracklist.loadDeckTooltip': 'In Deck {{deck}} laden',

  // USB Export Modal
  'usbExport.title': 'USB-Export',
  'usbExport.playlistLabel': 'Playlist: {{title}}',
  'usbExport.scanning': 'Scanne nach verfügbaren USB-Sticks...',
  'usbExport.noStickDetectedTitle': 'Kein USB-Stick erkannt',
  'usbExport.noStickDetectedDesc':
    'Bitte schließe einen USB-Stick an und stelle sicher, dass er gemountet ist.',
  'usbExport.singleDriveLabel': 'Erkannter USB-Stick',
  'usbExport.multiDriveLabel': 'USB-Stick auswählen',
  'usbExport.cancel': 'Abbrechen',
  'usbExport.scanAgain': 'Erneut scannen',
  'usbExport.exportBtn': 'Exportieren',
  'usbExport.playlistExistsTitle': 'Playlist existiert bereits',
  'usbExport.playlistExistsDesc':
    'Die Playlist "{{title}}" existiert bereits auf dem USB-Stick {{driveName}}. Möchtest du sie überschreiben?',
  'usbExport.overwriteConfirm': 'Ja, überschreiben',
  'usbExport.exporting': 'Exportiere Titel...',
  'usbExport.preparing': 'Vorbereiten...',
  'usbExport.initializing': 'Export wird initialisiert...',
  'usbExport.successTitle': 'Export abgeschlossen!',
  'usbExport.successDesc': 'Die Playlist wurde Rekordbox-kompatibel auf {{driveName}} übertragen.',
  'usbExport.doneBtn': 'Fertig',
  'usbExport.failedTitle': 'Export failed',
  'usbExport.failedError': 'Export fehlgeschlagen.',
  'usbExport.closeBtn': 'Schließen',
  'usbExport.tryAgainBtn': 'Erneut versuchen',
  'usbExport.errorScanDrives': 'Fehler beim Scannen der USB-Sticks.',
  'usbExport.closeTooltip': 'Schließen',
  'usbExport.refreshBtn': 'Aktualisieren',
  'usbExport.refreshTooltip': 'Erneut nach USB-Sticks suchen',
  'usbExport.checking': 'Suche…',
  'usbExport.autoDetectHint': 'Stick einstecken – wird automatisch erkannt.',
  'usbExport.notInitializedWarning':
    '⚠️ Dieser Stick wurde noch nicht mit Rekordbox initialisiert. Der Export funktioniert (Musikdateien werden kopiert), aber die Waveforms können auf CDJs erst nach einer Rekordbox-Vorbereitung geladen werden.',

  // Actions & Confirmations (useApp)
  'actions.confirmDeletePlaylist':
    'Möchtest du diese Playlist und alle dazugehörigen lokalen MP3s wirklich löschen?',
  'actions.errorDeletePlaylist': 'Fehler beim Löschen: {{error}}',
  'actions.errorRenamePlaylist': 'Fehler beim Umbenennen der Playlist: {{error}}',
  'actions.errorReorderTracks': 'Fehler beim Sortieren der Tracks: {{error}}',
  'actions.errorSyncPlaylist': 'Fehler beim Synchronisieren: {{error}}',
  'actions.errorUpdateSettings': 'Fehler beim Aktualisieren der Einstellungen: {{error}}',
  'actions.errorUpdateSettingsGeneral': 'Fehler beim Aktualisieren der Einstellungen.',
  'actions.successMigrate': 'Speicherort erfolgreich geändert und Dateien ggf. verschoben!',
  'actions.errorMigrate': 'Fehler bei der Migration: {{error}}',
  'actions.errorMigrateGeneral': 'Fehler bei der Migration.',

  // Preview Player
  'preview.title': 'Vorschau-Player',
  'preview.volume': 'Lautstärke',
  'preview.close': 'Schließen',
  'preview.controls.previous': 'Vorheriger Titel',
  'preview.controls.next': 'Nächster Titel',
  'preview.controls.smartModeEnable': 'Smart-Modus aktivieren (nach BPM & Tonart sortieren)',
  'preview.controls.smartModeDisable': 'Smart-Modus deaktivieren',
  'preview.controls.play': 'Abspielen',
  'preview.controls.pause': 'Pause',
  'preview.controls.mute': 'Stumm schalten',
  'preview.controls.unmute': 'Stummschaltung aufheben',
  'preview.smartMode.bpmTolerance.label': 'BPM-Toleranz',
  'preview.smartMode.bpmTolerance.strict': 'Streng',
  'preview.smartMode.bpmTolerance.normal': 'Normal',
  'preview.smartMode.bpmTolerance.loose': 'Locker',
  'preview.smartMode.targetEnergy.label': 'Energie',
  'preview.smartMode.targetEnergy.chill': 'Chill',
  'preview.smartMode.targetEnergy.balanced': 'Ausgewogen',
  'preview.smartMode.targetEnergy.highEnergy': 'High-Energy',
  'preview.smartMode.setProfile.label': 'Set-Verlauf',
  'preview.smartMode.setProfile.classicPeak': 'Klassischer Peak',
  'preview.smartMode.setProfile.rollercoaster': 'Achterbahn',
  'preview.smartMode.setProfile.steady': 'Konstant',
  'preview.dock.toSidebar': 'Als Seitenleiste anheften',
  'preview.dock.toFloating': 'Als schwebendes Fenster lösen',
  'preview.queue.toggle': 'Warteschlange',
  'preview.queue.nextUp': 'Als Nächstes',
  'preview.queue.fallback': 'Danach',
  'preview.queue.fallbackHint': 'automatisch erstellt',
  'preview.queue.empty': 'Warteschlange ist leer. Ziehe Tracks hierher.',
  'preview.queue.removeTooltip': 'Aus Warteschlange entfernen',

  // Context Menu
  'contextMenu.playNow': 'Track abspielen',
  'contextMenu.addToQueue': 'Zur Warteschlange hinzufügen',
  'contextMenu.removeFromQueue': 'Aus Warteschlange entfernen',
  'contextMenu.searchDiscogs': 'Interpret auf Discogs suchen',
  'contextMenu.searchBandcamp': 'Interpret auf Bandcamp suchen',
  'contextMenu.searchYoutube': 'Interpret auf YouTube suchen',
  'contextMenu.openYoutubeVideo': 'YouTube Video öffnen',
  'contextMenu.findSimilar': 'Ähnliche Tracks finden',

  // History
  'sidebar.history': 'Zuletzt abgespielt',
  'history.title': 'Zuletzt abgespielt',
  'history.subtitle': 'Die letzten {{count}} abgespielten Tracks',
  'history.empty': 'Noch keine Tracks abgespielt.',

  // Discover
  'discover.title': 'Entdecken',
  'discover.subtitle': 'Neue Tracks, die musikalisch zu deiner Playlist passen.',
  'discover.selectPlaylistLabel': 'Playlist',
  'discover.selectPlaylistPlaceholder': 'Playlist auswählen...',
  'discover.basedOnArtists': 'Basierend auf den Haupt-Interpreten dieser Playlist.',
  'discover.seedTrackLabel': 'Ähnlich wie „{{title}}“',
  'discover.clearSeedTrack': 'Zurück zur ganzen Playlist',
  'discover.refresh': 'Neu laden',
  'discover.loading': 'Suche nach passenden Tracks...',
  'discover.empty': 'Keine Empfehlungen gefunden.',
  'discover.emptyHint':
    'Versuche es mit einer anderen Playlist oder synchronisiere zuerst ein paar Tracks.',
  'discover.needTracksFirst':
    'Diese Playlist enthält noch keine Tracks. Synchronisiere sie zuerst, um Empfehlungen zu erhalten.',
  'discover.noPlaylists': 'Lege zuerst eine Playlist an, um Empfehlungen zu erhalten.',
  'discover.errorLoading': 'Fehler beim Laden der Empfehlungen: {{error}}',
  'discover.blacklistButton': 'Nicht interessiert — nie wieder vorschlagen',
  'discover.blacklistedToast': '„{{title}}“ wird nicht mehr vorgeschlagen.',
  'discover.blacklistErrorToast': 'Fehler beim Ausblenden von „{{title}}“: {{error}}',
  'discover.undo': 'Rückgängig',
  'discover.addButton': 'Hinzufügen',
  'discover.added': 'Hinzugefügt',
  'discover.addedToast':
    '„{{title}}“ wurde zu „{{playlist}}“ hinzugefügt und wird jetzt heruntergeladen.',
  'discover.addErrorToast': 'Fehler beim Hinzufügen von „{{title}}“: {{error}}',
  'discover.selectAll': 'Alle auswählen',
  'discover.clearSelection': 'Auswahl aufheben',
  'discover.addSelected': 'Ausgewählte hinzufügen ({{count}})',

  // Track entfernen / verschieben
  'tracklist.colRemove': 'Löschen',
  'tracklist.removeTrackTooltip': 'Aus Playlist entfernen',
  'tracklist.trackRemoved': 'Track aus der Playlist entfernt.',
  'tracklist.trackRemoveFailed': 'Fehler beim Entfernen des Tracks: {{error}}',
  'tracklist.trashDropLabel': 'Zum Entfernen hierher ziehen',
  'tracklist.trashDropHint': 'Löscht den Track aus dieser Playlist',
  'tracklist.trashDropActive': 'Loslassen zum Entfernen',
  'sidebar.dropChoiceTitle': 'Zu „{{playlist}}“ hinzufügen',
  'sidebar.dropChoiceQuestion': 'Möchtest du den Track kopieren oder verschieben?',
  'sidebar.dropChoiceCopy': 'Kopieren',
  'sidebar.dropChoiceCopyDesc': 'Track bleibt auch in der ursprünglichen Playlist.',
  'sidebar.dropChoiceMove': 'Verschieben',
  'sidebar.dropChoiceMoveDesc': 'Track wird aus der ursprünglichen Playlist entfernt.',
  'sidebar.dropChoiceCancel': 'Abbrechen',
  'sidebar.trackMovedToPlaylist': 'Track in Playlist verschoben.'
}
