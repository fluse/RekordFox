export const fr = {
  // App General
  'app.name': 'RekordFox',
  'app.tagline': 'Votre station de synchronisation DJ',
  'app.selectPlaylistPrompt':
    'Sélectionnez une playlist ou ajoutez-en une nouvelle pour voir les pistes.',

  // Onboarding (first run – shown when no playlists exist)
  'onboarding.welcomeTitle': 'Bienvenue sur RekordFox',
  'onboarding.welcomeSubtitle':
    'Votre station de synchronisation DJ : importez des playlists YouTube, gérez vos pistes et exportez-les pour les CDJ et les clés USB.',
  'onboarding.whatToExpectTitle': 'Voici ce qui vous attend',
  'onboarding.feature1Title': 'Importer des playlists',
  'onboarding.feature1Desc':
    'Connectez votre compte YouTube et importez vos playlists directement dans RekordFox.',
  'onboarding.feature2Title': 'Gérer et télécharger des pistes',
  'onboarding.feature2Desc':
    'Téléchargez des pistes en MP3, analysez le BPM et la tonalité, et triez vos sets de façon harmonique.',
  'onboarding.feature3Title': 'Exporter pour les CDJ et USB',
  'onboarding.feature3Desc':
    'Exportez vos playlists dans une structure compatible Rekordbox vers des clés USB pour les CDJ Pioneer.',
  'onboarding.setupTitle': 'Configuration rapide',
  'onboarding.tryTitle': 'Essayez',
  'onboarding.tryDesc':
    "Essayez et importez cette playlist d'exemple à titre de test pour voir comment fonctionne le téléchargement.",
  'onboarding.importExample': "Importer la playlist d'exemple",
  'onboarding.importing': 'Importation…',
  'onboarding.getStarted': 'Ajouter votre propre playlist',
  'onboarding.close': "Fermer l'introduction",

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
  'sidebar.dropBlockedYoutube':
    'Impossible de déposer des pistes locales dans une playlist YouTube.',
  'sidebar.trackAddedToPlaylist': 'Piste ajoutée à la playlist.',
  'sidebar.trackAlreadyInPlaylist': 'Cette piste est déjà dans la playlist.',
  'sidebar.trackAddFailed': "Erreur lors de l'ajout de la piste : {{error}}",
  'sidebar.connectYoutubeTooltip': 'Connecter un compte YouTube',
  'sidebar.youtubeSourceTooltip': 'Importé depuis YouTube (OAuth)',
  'sidebar.pushSyncedTooltip': 'Synchronisé avec YouTube',
  'sidebar.connectedTooltip': 'Connecté à votre compte YouTube',
  'sidebar.localSourceTooltip': 'Playlist YouTube (téléchargement seul)',
  'sidebar.allDownloadedTooltip': 'Les {{count}} titres sont téléchargés',
  'sidebar.someMissingTooltip': '{{downloaded}} titres sur {{total}} téléchargés',
  'sidebar.syncErrorTooltip': 'Échec de la dernière synchronisation',
  'sidebar.orphanedTooltip':
    'Compte YouTube déconnecté — reconnectez-le dans les Paramètres pour resynchroniser',
  'sidebar.needsReauthTooltip':
    'Connexion YouTube expirée — reconnectez le compte dans les Paramètres',
  'sidebar.pushPendingTooltip':
    'Modifications non enregistrées — pas encore synchronisées avec YouTube',
  'sidebar.addPlaylistTooltip': 'Ajouter une playlist',
  'sidebar.renamePlaylistTooltip': 'Renommer la playlist',
  'sidebar.syncPlaylistTooltip': 'Synchroniser la playlist',
  'sidebar.deletePlaylistTooltip': 'Supprimer la playlist',

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
  'addPlaylist.closeTooltip': 'Fermer',

  // Settings Modal
  'settings.title': 'Paramètres',
  'settings.categoryGeneral': 'Général',
  'settings.categoryLibrary': 'Bibliothèque',
  'settings.categoryDownloads': 'Téléchargements et synchro',
  'settings.categoryShortcuts': 'Raccourcis',
  'settings.categoryConnections': 'Connexions',
  'settings.saved': 'Paramètre enregistré',
  'settings.appearanceMode': 'Apparence',
  'settings.themeModeLabel': 'Mode',
  'settings.themeDark': 'Sombre',
  'settings.themeLight': 'Clair',
  'settings.colorScheme': 'Schéma de couleurs',
  'settings.colorSchemePurple': 'Violet',
  'settings.colorSchemeBlue': 'Bleu',
  'settings.colorSchemeGreen': 'Vert',
  'settings.colorSchemeOrange': 'Orange',
  'settings.colorSchemeRose': 'Rose',
  'settings.colorSchemeTeal': 'Turquoise',
  'settings.colorSchemeForest': 'Vert forêt',
  'settings.colorSchemeAmber': 'Ambre',
  'settings.colorSchemeCyan': 'Cyan',
  'settings.colorSchemeFuchsia': 'Fuchsia',
  'settings.colorSchemeCustom': 'Personnalisé',
  'settings.errorChangeColorScheme': 'Erreur lors du changement de schéma de couleurs.',
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
  'settings.storageSectionLabel': 'Stockage',
  'settings.storageDownloadsLabel': 'Titres téléchargés',
  'settings.storageDownloadsValue': '{{count}} titres · {{size}}',
  'settings.storageCacheLabel': 'Cache (pochettes)',
  'settings.storageCacheValue': '{{size}}',
  'settings.storageHelp':
    "Indique l'espace disque actuellement utilisé par vos titres téléchargés et le cache des pochettes.",
  'settings.languageLabel': 'Langue',
  'settings.sectionOnboarding': 'Introduction',
  'settings.showOnboardingButton': "Afficher l'introduction",
  'settings.showOnboardingHelp':
    "Affiche à nouveau l'écran de bienvenue que vous avez vu au premier lancement.",
  'settings.sectionTooltips': 'Info-bulles',
  'settings.tooltipsEnabledLabel': 'Afficher les info-bulles',
  'settings.tooltipsEnabledHelp': 'Affiche des info-bulles au survol des boutons et des icônes.',
  'settings.errorChangeTooltipsEnabled': "Erreur lors du changement du paramètre d'info-bulles.",
  'settings.tooltipDelayLabel': "Délai d'apparition des info-bulles",
  'settings.tooltipDelayMs': '{{count}} ms',
  'settings.errorChangeTooltipDelay': "Erreur lors du changement du délai d'info-bulles.",
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

  // Connections Settings (YouTube OAuth)
  'connections.title': 'Connexions',
  'connections.subtitle':
    'Connectez votre compte YouTube pour importer vos playlists, les trier harmoniquement et resynchroniser le nouvel ordre.',
  'connections.credentialsTitle': 'Identifiants Google OAuth',
  'connections.clientIdLabel': 'ID client OAuth Google',
  'connections.clientIdPlaceholder': 'xxxxxxxx.apps.googleusercontent.com',
  'connections.clientSecretLabel': 'Secret client OAuth Google',
  'connections.clientSecretPlaceholder': 'GOCSPX-...',
  'connections.credentialsHelp':
    "Créez un client OAuth dans la Google Cloud Console (type « Application de bureau ») avec accès à l'API YouTube Data v3, puis saisissez les identifiants ici.",
  'connections.connectButton': 'Se connecter avec Google',
  'connections.connecting': 'En attente de connexion dans le navigateur...',
  'connections.copyLink': 'Copier le lien',
  'connections.copyLinkTooltip':
    "Copier le lien de connexion dans le presse-papiers pour l'ouvrir dans un autre navigateur/profil",
  'connections.linkCopied': 'Lien de connexion copié dans le presse-papiers.',
  'connections.missingCredentials': "Veuillez d'abord saisir l'ID et le secret client.",
  'connections.connectedAccountsTitle': 'Comptes connectés',
  'connections.disconnectButton': 'Déconnecter',
  'connections.noAccounts': 'Aucun compte YouTube connecté pour le moment.',
  'connections.importPlaylistsTitle': 'Importer une playlist',
  'connections.loadPlaylistsButton': 'Actualiser',
  'connections.importButton': 'Importer',
  'connections.importing': 'Importation de la playlist...',
  'connections.noRemotePlaylists': 'Aucune playlist trouvée dans ce compte YouTube.',
  'connections.errorConnect': 'Erreur de connexion à YouTube : {{error}}',
  'connections.errorDisconnect': 'Erreur lors de la déconnexion du compte : {{error}}',
  'connections.errorLoadPlaylists': 'Erreur lors du chargement des playlists YouTube : {{error}}',
  'connections.errorImport': "Erreur lors de l'importation de la playlist : {{error}}",
  'connections.playlistsLinked':
    '{{count}} playlist(s) existante(s) appartiennent à ce compte et ont été liées.',
  'connections.noNewPlaylistsLinked': 'Aucune playlist supplémentaire trouvée pouvant être liée.',
  'connections.reconcileButton': 'Vérifier les playlists existantes avec ce compte',
  'connections.errorReconcile': 'Erreur lors de la vérification des playlists : {{error}}',

  // Google OAuth Setup Guide (Connections)
  'oauthGuide.toggle': 'Guide : configurer Google OAuth',
  'oauthGuide.openLink': 'Ouvrir dans Google Cloud Console',
  'oauthGuide.step1.title': '1. Créer un projet Google Cloud',
  'oauthGuide.step1.description':
    "Créez un nouveau projet Google Cloud gratuit (aucune carte bancaire requise pour l'API YouTube). Donnez-lui le nom que vous voulez, par ex. « RekordFox ».",
  'oauthGuide.step2.title': "2. Activer l'API YouTube Data v3",
  'oauthGuide.step2.description':
    "Ouvrez l'API YouTube Data v3 dans la bibliothèque d'API de votre projet et cliquez sur « Activer ».",
  'oauthGuide.step3.title': "3. Configurer l'écran de consentement OAuth",
  'oauthGuide.step3.description':
    "Choisissez « Externe » comme type d'utilisateur, donnez un nom à l'application et votre e-mail comme contact. Enregistrez et passez à la section « Champs d'application » (Scopes).",
  'oauthGuide.step4.title': '4. Ajouter les champs requis (Scopes)',
  'oauthGuide.step4.description':
    "Cliquez sur « Ajouter ou supprimer des champs d'application » et activez exactement ces trois champs :\n\n• .../auth/userinfo.email (non sensible)\n• .../auth/userinfo.profile (non sensible)\n• .../auth/youtube (sensible, « Gérer votre compte YouTube »)\n\nLes autres champs YouTube comme readonly, force-ssl ou download ne sont pas nécessaires pour RekordFox — laissez-les décochés. Cliquez ensuite sur « Mettre à jour », puis enregistrez.",
  'oauthGuide.step5.title': '5. Important : ajoutez-vous comme testeur',
  'oauthGuide.step5.description':
    "Comme l'application n'est pas vérifiée par Google, la connexion ne fonctionne que pour les comptes explicitement listés comme « Utilisateurs test ». Sur la même page, ajoutez votre propre adresse Gmail sous « Utilisateurs test » — sinon la connexion échouera avec « Cette application n'a pas été vérifiée ».",
  'oauthGuide.step6.title': "6. Créer l'ID client OAuth",
  'oauthGuide.step6.description':
    "Cliquez sur « Créer des identifiants » → « ID client OAuth ». Choisissez bien « Application de bureau » comme type d'application — seul ce type permet à RekordFox de se connecter localement sans URI de redirection fixe.",
  'oauthGuide.step7.title': "7. Copier l'ID client et le secret",
  'oauthGuide.step7.description':
    "Google affiche maintenant l'ID client et le secret client. Copiez les deux valeurs et saisissez-les ci-dessus dans RekordFox.",

  // Generic Setup Guide Stepper (used by Google OAuth & Rekordbox XML guides)
  'setupGuide.stepIndicator': 'Étape {{current}} sur {{total}}',
  'setupGuide.back': 'Précédent',
  'setupGuide.next': 'Suivant',
  'setupGuide.finish': 'Terminé — recommencer',

  // Rekordbox XML Setup Guide (Downloads)
  'rekordboxGuide.toggle': 'Guide : importer le XML dans rekordbox',
  'rekordboxGuide.step1.title': '1. Ouvrir les préférences de rekordbox',
  'rekordboxGuide.step1.description':
    'Ouvrez rekordbox et accédez aux "Préférences" via le menu rekordbox (ou l\'icône d\'engrenage).',
  'rekordboxGuide.step2.title': '2. Aller à l\'onglet "Avancé" → "Base de données"',
  'rekordboxGuide.step2.description':
    'Dans la fenêtre des préférences, allez à l\'onglet "Avancé" et sélectionnez la section "Base de données".',
  'rekordboxGuide.step3.title': '3. Lier le fichier rekordbox xml',
  'rekordboxGuide.step3.description':
    'Activez l\'option "rekordbox xml" et cliquez sur "Parcourir" pour sélectionner exactement le fichier XML exporté par RekordFox (le chemin se trouve ci-dessus dans ces paramètres). Confirmez avec "OK".',
  'rekordboxGuide.step4.title': '4. Retrouver les playlists dans le navigateur',
  'rekordboxGuide.step4.description':
    'Dans le panneau de navigation gauche de rekordbox, une entrée "rekordbox xml" apparaît maintenant avec vos playlists et pistes exportées.',
  'rekordboxGuide.step5.title': '5. Importer dans votre propre collection',
  'rekordboxGuide.step5.description':
    'Clic droit sur une playlist sous "rekordbox xml" → "Importer dans la collection" pour copier réellement les pistes et la structure de playlist dans votre bibliothèque rekordbox.',
  'rekordboxGuide.step6.title': '6. Important : actualisez après chaque export',
  'rekordboxGuide.step6.description':
    'Dès que RekordFox exporte à nouveau le fichier XML (par ex. via "Exporter maintenant"), rekordbox affiche l\'état actuel sous "rekordbox xml". Les playlists déjà importées doivent être réimportées via "Importer dans la collection" pour que les changements arrivent dans votre bibliothèque.',

  // Initialisation d'une clé USB Pioneer / CDJ (guide)
  'pioneerInitGuide.toggle': 'Guide : préparer une clé USB pour les CDJ (une seule fois)',
  'pioneerInitGuide.step1.title': '1. Formater la clé USB en FAT32',
  'pioneerInitGuide.step1.description':
    'Les CDJ Pioneer ne lisent que les clés USB formatées en FAT32 (ou HFS+). Formatez la clé en conséquence au préalable. Attention : le formatage efface toutes les données de la clé — sauvegardez les fichiers existants.',
  'pioneerInitGuide.step2.title': '2. Ouvrir rekordbox et passer en mode « Export »',
  'pioneerInitGuide.step2.description':
    'Lancez rekordbox sur l\'ordinateur. Réglez le sélecteur de mode en haut à gauche sur « Export » (pas « Performance »). Les clés USB ne peuvent être préparées pour les CDJ qu\'en mode Export.',
  'pioneerInitGuide.step2.link': 'Télécharger rekordbox',
  'pioneerInitGuide.step3.title': '3. Brancher la clé USB',
  'pioneerInitGuide.step3.description':
    'Branchez la clé. Elle apparaît dans la barre latérale gauche de rekordbox sous « Périphériques » (Devices), avec le nom de la clé.',
  'pioneerInitGuide.step4.title': '4. Analyser un titre et l\'exporter vers le périphérique',
  'pioneerInitGuide.step4.description':
    'Glissez-déposez n\'importe quel titre (analysé) ou playlist de votre collection rekordbox sur le périphérique dans la barre latérale. rekordbox crée alors une fois le dossier « PIONEER » avec la base de données. Attendez la fin de l\'export.',
  'pioneerInitGuide.step5.title': '5. Éjecter le périphérique en toute sécurité',
  'pioneerInitGuide.step5.description':
    'Éjectez la clé en toute sécurité via l\'icône d\'éjection à côté du périphérique dans rekordbox (ou dans votre système d\'exploitation) afin que la base de données soit entièrement écrite.',
  'pioneerInitGuide.step6.title': '6. Retour à RekordFox',
  'pioneerInitGuide.step6.description':
    'Rebranchez la clé et sélectionnez-la à nouveau ici. Le message disparaît, et l\'export Pioneer écrit désormais aussi les formes d\'onde affichées par les CDJ. Cette configuration n\'est nécessaire qu\'une seule fois par clé.',

  // YouTube Onboarding Modal
  'youtubeConnect.title': 'Connecter YouTube',
  'youtubeConnect.benefit1': 'Triez vos sets YouTube parfaitement avec le Smart Mode.',
  'youtubeConnect.benefit2': 'Resynchronisez le nouvel ordre des pistes vers YouTube.',
  'youtubeConnect.cta': 'Aller aux paramètres de connexions',
  'youtubeConnect.close': 'Plus tard',

  // Deck
  'deck.loadingWaveform': "Décodage de la forme d'onde...",
  'deck.noTrackLoaded': 'Aucune piste chargée',
  'deck.setCueTooltip': 'Définir la position actuelle comme Cue',
  'deck.autoloop': 'Autoloop (Beats)',
  'deck.pitchBendUpTooltip': 'Pitch Bend +',
  'deck.pitchBendDownTooltip': 'Pitch Bend -',
  'deck.keyShiftUpTooltip': "Monter la tonalité d'un demi-ton",
  'deck.keyShiftDownTooltip': "Descendre la tonalité d'un demi-ton",

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
  'tracklist.syncToYoutube': 'Synchroniser avec YouTube',
  'tracklist.syncingToYoutube': 'Synchronisation...',
  'tracklist.syncToYoutubeSuccess': 'Ordre synchronisé avec succès vers YouTube.',
  'tracklist.syncToYoutubeError': 'Erreur de synchronisation vers YouTube : {{error}}',
  'tracklist.previewPlayTooltip': 'Lire le titre',
  'tracklist.previewStopTooltip': 'Arrêter la lecture',
  'tracklist.rateTooltip': 'Noter {{count}} étoiles',
  'tracklist.loadDeckTooltip': 'Charger dans le Deck {{deck}}',

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
  'usbExport.closeTooltip': 'Fermer',
  'usbExport.refreshBtn': 'Actualiser',
  'usbExport.refreshTooltip': 'Rechercher à nouveau des clés USB',
  'usbExport.checking': 'Recherche…',
  'usbExport.autoDetectHint': 'Branchez une clé – elle sera détectée automatiquement.',
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
  'preview.controls.play': 'Lecture',
  'preview.controls.pause': 'Pause',
  'preview.controls.mute': 'Couper le son',
  'preview.controls.unmute': 'Réactiver le son',
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
  'preview.queue.removeTooltip': "Retirer de la file d'attente",

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
  'discover.addSelected': 'Ajouter la sélection ({{count}})',

  // Suppression / déplacement de piste
  'tracklist.colRemove': '',
  'tracklist.removeTrackTooltip': 'Retirer de la playlist',
  'tracklist.trackRemoved': 'Piste retirée de la playlist.',
  'tracklist.trackRemoveFailed': 'Erreur lors du retrait de la piste : {{error}}',
  'tracklist.trashDropLabel': 'Glissez ici pour retirer',
  'tracklist.trashDropHint': 'Retire la piste de cette playlist',
  'tracklist.trashDropActive': 'Relâchez pour retirer',
  'sidebar.dropChoiceTitle': 'Ajouter à « {{playlist}} »',
  'sidebar.dropChoiceQuestion': 'Voulez-vous copier ou déplacer cette piste ?',
  'sidebar.dropChoiceCopy': 'Copier',
  'sidebar.dropChoiceCopyDesc': 'Conserver aussi la piste dans la playlist d’origine.',
  'sidebar.dropChoiceMove': 'Déplacer',
  'sidebar.dropChoiceMoveDesc': 'Retirer la piste de la playlist d’origine.',
  'sidebar.dropChoiceCancel': 'Annuler',
  'sidebar.trackMovedToPlaylist': 'Piste déplacée vers la playlist.'
}
