export const de = {
  // App General
  'app.name': 'RekordFox',
  'app.tagline': 'Deine DJ-Sync-Station',
  'app.selectPlaylistPrompt':
    'Wähle eine Playlist aus oder füge eine neue hinzu, um Tracks anzuzeigen.',

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

  // Add Playlist Modal
  'addPlaylist.title': 'YouTube Playlist hinzufügen',
  'addPlaylist.label': 'Playlist URL',
  'addPlaylist.placeholder': 'https://www.youtube.com/playlist?list=...',
  'addPlaylist.errorInvalidUrl':
    'Bitte gib eine gültige YouTube-Playlist-URL ein (muss "list=" enthalten).',
  'addPlaylist.errorAddFailed': 'Fehler beim Hinzufügen der Playlist.',
  'addPlaylist.cancel': 'Abbrechen',
  'addPlaylist.add': 'Hinzufügen',
  'addPlaylist.loading': 'Wird geladen...',

  // Settings Modal
  'settings.title': 'Einstellungen',
  'settings.theme': 'Farbschema',
  'settings.themeDark': 'Dunkel',
  'settings.themeLight': 'Hell',
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
  'settings.languageLabel': 'Sprache',
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

  // Deck
  'deck.loadingWaveform': 'Dekodiere Welle...',
  'deck.noTrackLoaded': 'Kein Track geladen',
  'deck.setCueTooltip': 'Aktuelle Position als Cue setzen',
  'deck.autoloop': 'Autoloop (Beats)',

  // Track Row
  'track.waiting': 'Warte...',
  'track.downloading': 'Lade herunter ({{percent}}%)',
  'track.queued': 'In Warteschlange...',
  'track.newLabel': 'NEU',

  // Tracklist
  'tracklist.usbExport': 'USB Export',
  'tracklist.searchPlaceholder': 'Suchen nach Titel, Interpret...',
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
  'preview.queue.toggle': 'Warteschlange',
  'preview.queue.nextUp': 'Als Nächstes',
  'preview.queue.fallback': 'Danach',
  'preview.queue.fallbackHint': 'automatisch erstellt',
  'preview.queue.empty': 'Warteschlange ist leer. Ziehe Tracks hierher.',

  // Context Menu
  'contextMenu.playNow': 'Track abspielen',
  'contextMenu.addToQueue': 'Zur Warteschlange hinzufügen',
  'contextMenu.removeFromQueue': 'Aus Warteschlange entfernen',

  // History
  'sidebar.history': 'Zuletzt abgespielt',
  'history.title': 'Zuletzt abgespielt',
  'history.subtitle': 'Die letzten 50 abgespielten Tracks',
  'history.empty': 'Noch keine Tracks abgespielt.'
}
