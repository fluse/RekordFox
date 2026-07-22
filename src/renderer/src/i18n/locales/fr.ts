export const fr = {
  // App General
  'app.name': 'RekordFox',
  'app.tagline': 'Votre station de synchronisation DJ',
  'app.selectPlaylistPrompt':
    'Sélectionnez une playlist ou ajoutez-en une nouvelle pour voir les pistes.',

  // Title Bar
  'titlebar.minimize': 'Réduire',
  'titlebar.maximize': 'Agrandir',
  'titlebar.restore': 'Restaurer',
  'titlebar.close': 'Fermer',

  // Mixer
  'mixer.show': 'Afficher le mixeur',
  'mixer.hide': 'Masquer le mixeur',
  'mixer.center': 'CENTER',
  'mixer.master': 'MASTER',

  // Sidebar
  'sidebar.playlists': 'Playlists',
  'sidebar.loadingDetails': 'Chargement des détails de la playlist...',
  'sidebar.noPlaylists': 'Aucune playlist',
  'sidebar.addNow': 'Ajouter maintenant',
  'sidebar.settings': 'Paramètres',
  'sidebar.discover': 'Découvrir',

  // Add Playlist Modal
  'addPlaylist.title': 'Ajouter une playlist YouTube',
  'addPlaylist.label': 'URL de la playlist',
  'addPlaylist.placeholder': 'https://www.youtube.com/playlist?list=...',
  'addPlaylist.errorInvalidUrl':
    'Veuillez saisir une URL de playlist YouTube valide (doit contenir "list=").',
  'addPlaylist.errorAddFailed': "Erreur lors de l'ajout de la playlist.",
  'addPlaylist.cancel': 'Annuler',
  'addPlaylist.add': 'Ajouter',
  'addPlaylist.loading': 'Chargement...',

  // Settings Modal
  'settings.title': 'Paramètres',
  'settings.categoryGeneral': 'Général',
  'settings.categoryLibrary': 'Bibliothèque',
  'settings.categoryDownloads': 'Téléchargements et synchro',
  'settings.categoryShortcuts': 'Raccourcis',
  'settings.saved': 'Paramètre enregistré',
  'settings.theme': 'Schéma de couleurs',
  'settings.themeDark': 'Sombre',
  'settings.themeLight': 'Clair',
  'settings.downloadPathLabel': 'Emplacement de stockage des playlists',
  'settings.downloadPathSyncingTooltip':
    "L'emplacement ne peut pas être modifié pendant la synchronisation",
  'settings.downloadPathSelectTooltip': 'Sélectionner un autre dossier',
  'settings.downloadPathSelect': 'Choisir',
  'settings.downloadPathOpenTooltip': 'Ouvrir le dossier dans le Finder/Explorateur',
  'settings.downloadPathOpen': 'Ouvrir',
  'settings.downloadPathSyncingWarning':
    "⚠️ L'emplacement de stockage ne peut pas être modifié pendant une synchronisation active.",
  'settings.downloadPathHelp':
    'Tous les MP3 et images de couverture de vos playlists YouTube sont enregistrés ici.',
  'settings.concurrentDownloads': 'Téléchargements simultanés',
  'settings.workersCount': '{{count}} Workers',
  'settings.concurrentDownloadsHelp':
    "Définit le nombre de pistes d'une playlist téléchargées simultanément (1 à 12).",
  'settings.languageLabel': 'Langue',
  'settings.close': 'Fermer',
  'settings.errorChangePath': "Erreur lors de la modification de l'emplacement.",
  'settings.errorChangeTheme': 'Erreur lors du changement de thème.',
  'settings.errorChangeWorkers': 'Erreur lors du changement du nombre de workers.',
  'settings.errorChangeLanguage': 'Erreur lors du changement de langue.',
  'settings.filenameTemplateLabel': 'Format de nom de fichier',
  'settings.filenameTemplateDefault': 'Standard (ID/Cryptique)',
  'settings.filenameTemplateCustom': 'Lisible (Position-Artiste-Piste-BPM-Hash)',
  'settings.filenameTemplateHelp':
    'Détermine comment les fichiers MP3 téléchargés sont nommés dans votre dossier de stockage.',
  'settings.errorChangeFilenameTemplate': 'Erreur lors du changement de format de nom de fichier.',
  'settings.renamingIndicator': 'Renommer... ({{current}}/{{total}})',
  'settings.renamingIndicatorText': 'Renommer les fichiers...',
  'settings.rekordboxXmlLabel': 'Auto-exportation XML Rekordbox',
  'settings.rekordboxXmlHelp':
    'Si configuré, RekordFox exportera automatiquement un fichier rekordbox.xml à chaque modification pour synchroniser vos playlists dans Rekordbox.',
  'settings.rekordboxXmlSelect': 'Choisir',
  'settings.rekordboxXmlSelectTooltip': "Sélectionner le fichier XML pour l'exportation",
  'settings.rekordboxXmlClear': 'Effacer',
  'settings.rekordboxXmlClearTooltip': "Supprimer le chemin d'exportation XML",
  'settings.rekordboxXmlExportNow': 'Exporter maintenant',
  'settings.rekordboxXmlExportNowTooltip':
    'Exporter manuellement toute la collection en XML maintenant',
  'settings.rekordboxXmlSuccess': 'XML Rekordbox exporté avec succès !',
  'settings.rekordboxXmlError': "Échec de l'exportation XML : {{error}}",
  'settings.historyLimitLabel': "Taille de l'historique",
  'settings.historyLimitCount': '{{count}} titres',
  'settings.historyLimitHelp':
    "Définit le nombre de titres récemment écoutés conservés dans l'historique (10 à 500).",
  'settings.errorChangeHistoryLimit': "Erreur lors du changement de taille de l'historique.",
  'settings.shortcuts.title': "Raccourcis du lecteur d'aperçu",
  'settings.shortcuts.help':
    "Clique sur un raccourci puis appuie sur la touche souhaitée pour le réattribuer. Ils fonctionnent dans toute l'app tant qu'un titre est chargé.",
  'settings.shortcuts.previewPlayPause': 'Lecture / Pause',
  'settings.shortcuts.previewNext': 'Titre suivant',
  'settings.shortcuts.previewPrevious': 'Titre précédent',
  'settings.shortcuts.previewVolumeUp': 'Augmenter le volume',
  'settings.shortcuts.previewVolumeDown': 'Baisser le volume',
  'settings.shortcuts.previewMute': 'Couper le son',
  'settings.shortcuts.previewSeekForward': 'Avance rapide',
  'settings.shortcuts.previewSeekBackward': 'Retour rapide',
  'settings.shortcuts.previewToggleQueue': "Afficher/masquer la file d'attente",
  'settings.shortcuts.previewToggleDock': 'Basculer le mode ancré',
  'settings.shortcuts.change': 'Modifier',
  'settings.shortcuts.reset': 'Réinitialiser',
  'settings.shortcuts.resetAll': 'Tout réinitialiser',
  'settings.shortcuts.pressKey': 'Appuie sur une touche... (Échap pour annuler)',
  'settings.shortcuts.conflict': 'Déjà attribué à "{{action}}"',

  // Deck
  'deck.loadingWaveform': "Décodage de la forme d'onde...",
  'deck.noTrackLoaded': 'Aucune piste chargée',
  'deck.setCueTooltip': 'Définir la position actuelle comme Cue',
  'deck.autoloop': 'Autoloop (Beats)',

  // Track Row
  'track.waiting': 'Attente...',
  'track.downloading': 'Téléchargement ({{percent}}%)',
  'track.queued': 'En attente...',
  'track.downloadFailedLabel': 'Indisponible',
  'track.downloadFailedHint':
    "Ce titre n'a pas pu être téléchargé et est exclu des files d'attente et du mode shuffle intelligent.",
  'track.newLabel': 'NOUV.',

  // Tracklist
  'tracklist.usbExport': 'Export USB',
  'tracklist.searchPlaceholder': 'Rechercher par titre, artiste...',
  'tracklist.clearSearch': 'Effacer la recherche',
  'tracklist.colPosition': '#',
  'tracklist.colCover': 'Couverture',
  'tracklist.colTitle': 'Titre / Artiste',
  'tracklist.colRating': 'Rating',
  'tracklist.colBpm': 'BPM',
  'tracklist.colKey': 'Key',
  'tracklist.colFormat': 'Format / Qualité',
  'tracklist.colDateAdded': "Date d'ajout",
  'tracklist.colDuration': 'Durée',
  'tracklist.colLoadDeck': 'Charger dans le Deck',
  'tracklist.noTracksFound': 'Aucune piste trouvée',
  'tracklist.customizeColumns': 'Personnaliser les colonnes',

  // USB Export Modal
  'usbExport.title': 'Export USB',
  'usbExport.playlistLabel': 'Playlist: {{title}}',
  'usbExport.scanning': 'Recherche de clés USB disponibles...',
  'usbExport.noStickDetectedTitle': 'Aucune clé USB détectée',
  'usbExport.noStickDetectedDesc':
    "Veuillez connecter une clé USB et vous assurer qu'elle est montée.",
  'usbExport.singleDriveLabel': 'Clé USB détectée',
  'usbExport.multiDriveLabel': 'Sélectionner la clé USB',
  'usbExport.cancel': 'Annuler',
  'usbExport.scanAgain': 'Rechercher à nouveau',
  'usbExport.exportBtn': 'Exporter',
  'usbExport.playlistExistsTitle': 'La playlist existe déjà',
  'usbExport.playlistExistsDesc':
    'La playlist "{{title}}" existe déjà sur la clé USB {{driveName}}. Voulez-vous la remplacer ?',
  'usbExport.overwriteConfirm': 'Oui, remplacer',
  'usbExport.exporting': 'Exportation des pistes...',
  'usbExport.preparing': 'Préparation...',
  'usbExport.initializing': "Initialisation de l'exportation...",
  'usbExport.successTitle': 'Exportation terminée !',
  'usbExport.successDesc':
    'La playlist a été transférée avec succès sur {{driveName}} dans une structure compatible Rekordbox.',
  'usbExport.doneBtn': 'Terminé',
  'usbExport.failedTitle': "L'exportation a échoué",
  'usbExport.failedError': "L'exportation a échoué.",
  'usbExport.closeBtn': 'Fermer',
  'usbExport.tryAgainBtn': 'Réessayer',
  'usbExport.errorScanDrives': 'Erreur lors de la recherche des clés USB.',
  'usbExport.notInitializedWarning':
    "⚠️ Ce lecteur n'a pas encore été initialisé avec Rekordbox. L'exportation fonctionnera toujours (les fichiers musicaux seront copiés), mais les formes d'onde ne se chargeront pas sur les CDJ tant que le lecteur ne sera pas préparé dans Rekordbox.",

  // Actions & Confirmations (useApp)
  'actions.confirmDeletePlaylist':
    'Voulez-vous vraiment supprimer cette playlist et tous les fichiers MP3 locaux associés ?',
  'actions.errorDeletePlaylist': 'Erreur lors de la suppression: {{error}}',
  'actions.errorRenamePlaylist': 'Erreur lors du renommage de la playlist : {{error}}',
  'actions.errorReorderTracks': 'Erreur lors du réordonnancement des pistes: {{error}}',
  'actions.errorSyncPlaylist': 'Erreur lors de la synchronisation: {{error}}',
  'actions.errorUpdateSettings': 'Erreur lors de la mise à jour des paramètres: {{error}}',
  'actions.errorUpdateSettingsGeneral': 'Erreur lors de la mise à jour des paramètres.',
  'actions.successMigrate':
    'Emplacement de stockage modifié avec succès et fichiers déplacés si nécessaire !',
  'actions.errorMigrate': 'Erreur lors de la migration: {{error}}',
  'actions.errorMigrateGeneral': 'Erreur lors de la migration.',

  // Preview Player
  'preview.title': 'Lecteur de préécoute',
  'preview.volume': 'Volume',
  'preview.close': 'Fermer',
  'preview.controls.previous': 'Précédent',
  'preview.controls.next': 'Suivant',
  'preview.controls.smartModeEnable': 'Activer le mode intelligent (trier par BPM et tonalité)',
  'preview.controls.smartModeDisable': 'Désactiver le mode intelligent',
  'preview.smartMode.bpmTolerance.label': 'Tolérance BPM',
  'preview.smartMode.bpmTolerance.strict': 'Stricte',
  'preview.smartMode.bpmTolerance.normal': 'Normale',
  'preview.smartMode.bpmTolerance.loose': 'Large',
  'preview.smartMode.targetEnergy.label': 'Énergie',
  'preview.smartMode.targetEnergy.chill': 'Chill',
  'preview.smartMode.targetEnergy.balanced': 'Équilibrée',
  'preview.smartMode.targetEnergy.highEnergy': 'Haute énergie',
  'preview.smartMode.setProfile.label': 'Courbe du set',
  'preview.smartMode.setProfile.classicPeak': 'Pic classique',
  'preview.smartMode.setProfile.rollercoaster': 'Montagnes russes',
  'preview.smartMode.setProfile.steady': 'Stable',
  'preview.dock.toSidebar': 'Ancrer en barre latérale',
  'preview.dock.toFloating': 'Détacher en fenêtre flottante',
  'preview.queue.toggle': "File d'attente",
  'preview.queue.nextUp': 'À suivre',
  'preview.queue.fallback': 'Ensuite',
  'preview.queue.fallbackHint': 'généré automatiquement',
  'preview.queue.empty': "La file d'attente est vide. Glissez des titres ici.",

  // Context Menu
  'contextMenu.playNow': 'Lire maintenant',
  'contextMenu.addToQueue': "Ajouter à la file d'attente",
  'contextMenu.removeFromQueue': "Retirer de la file d'attente",
  'contextMenu.searchDiscogs': "Rechercher l'artiste sur Discogs",
  'contextMenu.searchBandcamp': "Rechercher l'artiste sur Bandcamp",
  'contextMenu.searchYoutube': "Rechercher l'artiste sur YouTube",
  'contextMenu.openYoutubeVideo': 'Ouvrir la vidéo YouTube',
  'contextMenu.findSimilar': 'Trouver des titres similaires',

  // History
  'sidebar.history': 'Écoutés récemment',
  'history.title': 'Écoutés récemment',
  'history.subtitle': 'Les {{count}} derniers titres écoutés',
  'history.empty': 'Aucun titre écouté pour le moment.',

  // Discover
  'discover.title': 'Découvrir',
  'discover.subtitle': 'De nouveaux titres qui correspondent musicalement à ta playlist.',
  'discover.selectPlaylistLabel': 'Playlist',
  'discover.selectPlaylistPlaceholder': 'Choisir une playlist...',
  'discover.basedOnArtists': 'Basé sur les principaux artistes de cette playlist.',
  'discover.seedTrackLabel': 'Similaire à « {{title}} »',
  'discover.clearSeedTrack': 'Revenir à toute la playlist',
  'discover.refresh': 'Actualiser',
  'discover.loading': 'Recherche de titres correspondants...',
  'discover.empty': 'Aucune recommandation trouvée.',
  'discover.emptyHint': "Essaie une autre playlist ou synchronise d'abord quelques titres.",
  'discover.needTracksFirst':
    "Cette playlist ne contient pas encore de titres. Synchronise-la d'abord pour obtenir des recommandations.",
  'discover.noPlaylists': "Crée d'abord une playlist pour obtenir des recommandations.",
  'discover.errorLoading': 'Erreur lors du chargement des recommandations : {{error}}',
  'discover.blacklistButton': 'Pas intéressé — ne plus suggérer',
  'discover.blacklistedToast': '« {{title}} » ne sera plus suggéré.',
  'discover.blacklistErrorToast': 'Erreur lors du masquage de « {{title}} » : {{error}}',
  'discover.undo': 'Annuler',
  'discover.addButton': 'Ajouter',
  'discover.added': 'Ajouté',
  'discover.addedToast':
    '« {{title}} » a été ajouté à « {{playlist}} » et est en cours de téléchargement.',
  'discover.addErrorToast': "Erreur lors de l'ajout de « {{title}} » : {{error}}",
  'discover.selectAll': 'Tout sélectionner',
  'discover.clearSelection': 'Désélectionner',
  'discover.addSelected': 'Ajouter la sélection ({{count}})'
}
