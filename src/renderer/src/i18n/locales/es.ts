export const es = {
  // App General
  'app.name': 'RekordFox',
  'app.tagline': 'Tu estación de sincronización DJ',
  'app.selectPlaylistPrompt':
    'Selecciona una lista de reproducción o añade una nueva para ver los temas.',

  // Title Bar
  'titlebar.minimize': 'Minimizar',
  'titlebar.maximize': 'Maximizar',
  'titlebar.restore': 'Restaurar',
  'titlebar.close': 'Cerrar',

  // Mixer
  'mixer.show': 'Mostrar mezclador',
  'mixer.hide': 'Ocultar mezclador',
  'mixer.center': 'CENTER',
  'mixer.master': 'MASTER',

  // Sidebar
  'sidebar.playlists': 'Listas de reproducción',
  'sidebar.loadingDetails': 'Cargando detalles de la lista de reproducción...',
  'sidebar.noPlaylists': 'Sin listas de reproducción',
  'sidebar.addNow': 'Añadir ahora',
  'sidebar.settings': 'Ajustes',

  // Add Playlist Modal
  'addPlaylist.title': 'Añadir lista de reproducción de YouTube',
  'addPlaylist.label': 'URL de la lista de reproducción',
  'addPlaylist.placeholder': 'https://www.youtube.com/playlist?list=...',
  'addPlaylist.errorInvalidUrl':
    'Introduce una URL de lista de reproducción de YouTube válida (debe contener "list=").',
  'addPlaylist.errorAddFailed': 'Error al añadir la lista de reproducción.',
  'addPlaylist.cancel': 'Cancelar',
  'addPlaylist.add': 'Añadir',
  'addPlaylist.loading': 'Cargando...',

  // Settings Modal
  'settings.title': 'Ajustes',
  'settings.categoryGeneral': 'General',
  'settings.categoryLibrary': 'Biblioteca',
  'settings.categoryDownloads': 'Descargas y sincronización',
  'settings.categoryShortcuts': 'Atajos',
  'settings.theme': 'Esquema de colores',
  'settings.themeDark': 'Oscuro',
  'settings.themeLight': 'Claro',
  'settings.downloadPathLabel': 'Lugar de almacenamiento de las listas',
  'settings.downloadPathSyncingTooltip':
    'El lugar de almacenamiento no se puede cambiar durante la sincronización',
  'settings.downloadPathSelectTooltip': 'Seleccionar otra carpeta',
  'settings.downloadPathSelect': 'Seleccionar',
  'settings.downloadPathOpenTooltip': 'Abrir carpeta en Finder/Explorador',
  'settings.downloadPathOpen': 'Abrir',
  'settings.downloadPathSyncingWarning':
    '⚠️ El lugar de almacenamiento no se puede cambiar durante una sincronización activa.',
  'settings.downloadPathHelp':
    'Todos los MP3 e imágenes de portada de tus listas de reproducción de YouTube se guardan aquí.',
  'settings.concurrentDownloads': 'Descargas simultáneas',
  'settings.workersCount': '{{count}} Workers',
  'settings.concurrentDownloadsHelp':
    'Establece cuántos temas de una lista se descargan simultáneamente (1 a 12).',
  'settings.languageLabel': 'Idioma',
  'settings.close': 'Cerrar',
  'settings.errorChangePath': 'Error al cambiar el lugar de almacenamiento.',
  'settings.errorChangeTheme': 'Error al cambiar el tema.',
  'settings.errorChangeWorkers': 'Error al cambiar la cantidad de workers.',
  'settings.errorChangeLanguage': 'Error al cambiar el idioma.',
  'settings.filenameTemplateLabel': 'Formato del nombre del archivo',
  'settings.filenameTemplateDefault': 'Estándar (ID/Criptográfico)',
  'settings.filenameTemplateCustom': 'Legible (Posición-Artista-Pista-BPM-Hash)',
  'settings.filenameTemplateHelp':
    'Determina cómo se nombran los archivos MP3 descargados en tu carpeta de almacenamiento.',
  'settings.errorChangeFilenameTemplate': 'Error al cambiar el formato del nombre de archivo.',
  'settings.renamingIndicator': 'Renombrando... ({{current}}/{{total}})',
  'settings.renamingIndicatorText': 'Renombrando archivos...',
  'settings.rekordboxXmlLabel': 'Auto-exportación XML de Rekordbox',
  'settings.rekordboxXmlHelp':
    'Si está configurado, RekordFox exportará automáticamente un archivo rekordbox.xml con cada cambio para mantener tus listas de reproducción en Rekordbox sincronizadas.',
  'settings.rekordboxXmlSelect': 'Seleccionar',
  'settings.rekordboxXmlSelectTooltip': 'Seleccionar archivo XML para exportar',
  'settings.rekordboxXmlClear': 'Borrar',
  'settings.rekordboxXmlClearTooltip': 'Eliminar ruta de exportación XML',
  'settings.rekordboxXmlExportNow': 'Exportar ahora',
  'settings.rekordboxXmlExportNowTooltip': 'Exportar manualmente toda la colección a XML ahora',
  'settings.rekordboxXmlSuccess': '¡XML de Rekordbox exportado con éxito!',
  'settings.rekordboxXmlError': 'Fallo al exportar XML: {{error}}',
  'settings.historyLimitLabel': 'Tamaño del historial',
  'settings.historyLimitCount': '{{count}} pistas',
  'settings.historyLimitHelp':
    'Establece cuántas pistas reproducidas recientemente se guardan en el historial (10 a 200).',
  'settings.errorChangeHistoryLimit': 'Error al cambiar el tamaño del historial.',
  'settings.shortcuts.title': 'Atajos del reproductor de vista previa',
  'settings.shortcuts.help':
    'Haz clic en un atajo y pulsa la tecla que quieras asignarle. Funcionan en toda la app mientras haya una pista cargada.',
  'settings.shortcuts.previewPlayPause': 'Reproducir / Pausar',
  'settings.shortcuts.previewNext': 'Pista siguiente',
  'settings.shortcuts.previewPrevious': 'Pista anterior',
  'settings.shortcuts.previewVolumeUp': 'Subir volumen',
  'settings.shortcuts.previewVolumeDown': 'Bajar volumen',
  'settings.shortcuts.previewMute': 'Silenciar',
  'settings.shortcuts.previewSeekForward': 'Avanzar',
  'settings.shortcuts.previewSeekBackward': 'Retroceder',
  'settings.shortcuts.previewToggleQueue': 'Mostrar/ocultar cola',
  'settings.shortcuts.previewToggleDock': 'Alternar modo anclado',
  'settings.shortcuts.change': 'Cambiar',
  'settings.shortcuts.reset': 'Restablecer',
  'settings.shortcuts.resetAll': 'Restablecer todo',
  'settings.shortcuts.pressKey': 'Pulsa una tecla... (Esc para cancelar)',
  'settings.shortcuts.conflict': 'Ya asignado a "{{action}}"',

  // Deck
  'deck.loadingWaveform': 'Decodificando forma de onda...',
  'deck.noTrackLoaded': 'Ningún tema cargado',
  'deck.setCueTooltip': 'Establecer posición actual como Cue',
  'deck.autoloop': 'Autoloop (Beats)',

  // Track Row
  'track.waiting': 'Esperando...',
  'track.downloading': 'Descargando ({{percent}}%)',
  'track.queued': 'En cola...',
  'track.downloadFailedLabel': 'No disponible',
  'track.downloadFailedHint':
    'Este tema no se pudo descargar y queda excluido de las colas y del modo aleatorio inteligente.',
  'track.newLabel': 'NUEVO',

  // Tracklist
  'tracklist.usbExport': 'Exportar USB',
  'tracklist.searchPlaceholder': 'Buscar por título, artista...',
  'tracklist.clearSearch': 'Borrar búsqueda',
  'tracklist.colPosition': '#',
  'tracklist.colCover': 'Portada',
  'tracklist.colTitle': 'Título / Artista',
  'tracklist.colRating': 'Rating',
  'tracklist.colBpm': 'BPM',
  'tracklist.colKey': 'Key',
  'tracklist.colFormat': 'Formato / Calidad',
  'tracklist.colDateAdded': 'Añadido el',
  'tracklist.colDuration': 'Duración',
  'tracklist.colLoadDeck': 'Cargar en Deck',
  'tracklist.noTracksFound': 'No se encontraron temas',
  'tracklist.customizeColumns': 'Personalizar columnas',

  // USB Export Modal
  'usbExport.title': 'Exportar USB',
  'usbExport.playlistLabel': 'Lista de reproducción: {{title}}',
  'usbExport.scanning': 'Buscando memorias USB disponibles...',
  'usbExport.noStickDetectedTitle': 'No se ha detectado ninguna memoria USB',
  'usbExport.noStickDetectedDesc':
    'Por favor, conecta una memoria USB y asegúrate de que esté montada.',
  'usbExport.singleDriveLabel': 'Memoria USB detectada',
  'usbExport.multiDriveLabel': 'Seleccionar memoria USB',
  'usbExport.cancel': 'Cancelar',
  'usbExport.scanAgain': 'Buscar de nuevo',
  'usbExport.exportBtn': 'Exportar',
  'usbExport.playlistExistsTitle': 'La lista de reproducción ya existe',
  'usbExport.playlistExistsDesc':
    'La lista de reproducción "{{title}}" ya existe en la memoria USB {{driveName}}. ¿Quieres sobrescribirla?',
  'usbExport.overwriteConfirm': 'Sí, sobrescribir',
  'usbExport.exporting': 'Exportando temas...',
  'usbExport.preparing': 'Preparando...',
  'usbExport.initializing': 'Inicializando exportación...',
  'usbExport.successTitle': '¡Exportación completada!',
  'usbExport.successDesc':
    'La lista de reproducción se ha transferido correctamente a {{driveName}} en una estructura compatible con Rekordbox.',
  'usbExport.doneBtn': 'Hecho',
  'usbExport.failedTitle': 'Exportación fallida',
  'usbExport.failedError': 'Exportación fallida.',
  'usbExport.closeBtn': 'Cerrar',
  'usbExport.tryAgainBtn': 'Reintentar',
  'usbExport.errorScanDrives': 'Error al buscar memorias USB.',
  'usbExport.notInitializedWarning':
    '⚠️ Esta unidad no ha sido inicializada con Rekordbox todavía. La exportación funcionará (los archivos se copiarán), pero las formas de onda no se cargarán en los CDJ hasta que prepares la unidad en Rekordbox.',

  // Actions & Confirmations (useApp)
  'actions.confirmDeletePlaylist':
    '¿Realmente quieres borrar esta lista de reproducción y todos los archivos MP3 locales asociados?',
  'actions.errorDeletePlaylist': 'Error al borrar: {{error}}',
  'actions.errorRenamePlaylist': 'Error al renombrar la lista de reproducción: {{error}}',
  'actions.errorReorderTracks': 'Error al reordenar las pistas: {{error}}',
  'actions.errorSyncPlaylist': 'Error al sincronizar: {{error}}',
  'actions.errorUpdateSettings': 'Error al actualizar los ajustes: {{error}}',
  'actions.errorUpdateSettingsGeneral': 'Error al actualizar los ajustes.',
  'actions.successMigrate':
    '¡Lugar de almacenamiento cambiado con éxito y archivos movidos si correspondía!',
  'actions.errorMigrate': 'Error en la migración: {{error}}',
  'actions.errorMigrateGeneral': 'Error en la migración.',

  // Preview Player
  'preview.title': 'Reproductor de vista previa',
  'preview.volume': 'Volumen',
  'preview.close': 'Cerrar',
  'preview.controls.previous': 'Anterior',
  'preview.controls.next': 'Siguiente',
  'preview.controls.smartModeEnable': 'Activar modo inteligente (ordenar por BPM y tonalidad)',
  'preview.controls.smartModeDisable': 'Desactivar modo inteligente',
  'preview.smartMode.bpmTolerance.label': 'Tolerancia de BPM',
  'preview.smartMode.bpmTolerance.strict': 'Estricta',
  'preview.smartMode.bpmTolerance.normal': 'Normal',
  'preview.smartMode.bpmTolerance.loose': 'Amplia',
  'preview.smartMode.targetEnergy.label': 'Energía',
  'preview.smartMode.targetEnergy.chill': 'Relajada',
  'preview.smartMode.targetEnergy.balanced': 'Equilibrada',
  'preview.smartMode.targetEnergy.highEnergy': 'Alta energía',
  'preview.smartMode.setProfile.label': 'Curva del set',
  'preview.smartMode.setProfile.classicPeak': 'Pico clásico',
  'preview.smartMode.setProfile.rollercoaster': 'Montaña rusa',
  'preview.smartMode.setProfile.steady': 'Constante',
  'preview.dock.toSidebar': 'Anclar como barra lateral',
  'preview.dock.toFloating': 'Convertir en ventana flotante',
  'preview.queue.toggle': 'Cola',
  'preview.queue.nextUp': 'A continuación',
  'preview.queue.fallback': 'Después',
  'preview.queue.fallbackHint': 'generado automáticamente',
  'preview.queue.empty': 'La cola está vacía. Arrastra pistas aquí.',

  // Context Menu
  'contextMenu.playNow': 'Reproducir ahora',
  'contextMenu.addToQueue': 'Añadir a la cola',
  'contextMenu.removeFromQueue': 'Quitar de la cola',
  'contextMenu.searchDiscogs': 'Buscar artista en Discogs',
  'contextMenu.searchBandcamp': 'Buscar artista en Bandcamp',
  'contextMenu.searchYoutube': 'Buscar artista en YouTube',

  // History
  'sidebar.history': 'Reproducidos recientemente',
  'history.title': 'Reproducidos recientemente',
  'history.subtitle': 'Las últimas {{count}} pistas reproducidas',
  'history.empty': 'Aún no se ha reproducido ninguna pista.'
}
