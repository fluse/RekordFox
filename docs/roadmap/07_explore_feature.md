Act as an expert TypeScript/Node.js Developer. 

Ich möchte nun ein "Entdecken"-Feature einbauen. Die Idee: Der Nutzer wählt eine seiner bestehenden Playlisten (die aus YouTube-Video-IDs besteht) aus, und die App schlägt musikalisch passende, neue Tracks vor. Klickt der Nutzer auf "Hinzufügen", wird die neue Video-ID einfach in die bestehende Playlist-Konfiguration geschrieben und beim nächsten Sync als MP3 heruntergeladen.

**Die technische Strategie:**
Wir nutzen **nicht** die offizielle YouTube Data API (wegen der strengen Quotas) und auch keine Drittanbieter-APIs wie Spotify (da wir sonst die Tracks wieder aufwendig auf YouTube suchen müssten). 
Stattdessen nutzen wir die Bibliothek `youtubei.js` (InnerTube Wrapper), um das automatische "Radio" bzw. die "Up Next"-Empfehlungen von YouTube Music für eine gegebene Video-ID abzufragen. Das liefert uns direkt passende Musik inklusive der nötigen Video-IDs.

**Deine Aufgabe:**
Schreibe mir ein sauberes, modulares und gut dokumentiertes TypeScript-Modul, das Folgendes leistet:

1. **Initialisierung:** Eine Funktion, um den `youtubei.js` Client (`Innertube.create()`) effizient zu instanziieren.
2. **Empfehlungen abrufen:** Eine Funktion `getRecommendationsForTrack(videoId: string, limit?: number)`, die eine Video-ID entgegennimmt, die YouTube Music Metadaten abruft (`yt.music.getInfo`) und die "Up Next"-Vorschläge extrahiert.
3. **Daten-Bereinigung:** Die Funktion soll nicht das komplette unübersichtliche `youtubei.js`-Objekt zurückgeben, sondern ein sauberes Array von Objekten mit folgenden Properties mappen:
    * `videoId` (string)
    * `title` (string)
    * `artist` (string)
    * `thumbnailUrl` (string - beste verfügbare Qualität)
    * `durationMs` (number - falls verfügbar)
4. **Error Handling:** Implementiere ein robustes Error Handling (z. B. wenn eine Video-ID nicht gefunden wird oder es kein Musik-Video ist).

Bitte gib mir den fertigen Code, Hinweise zur Installation der nötigen Pakete und ein kurzes Verwendungsbeispiel (Usage Example).

---

## UI/UX-Integration in RekordFox

Kontext: RekordFox ist eine Electron/React-App ohne Router — Navigation läuft über einen `viewMode`-State (`'library' | 'history' | 'settings'`) in `src/renderer/src/App.tsx`. Playlists/Tracks liegen flach in `<userData>/db.json` (`src/main/db.ts`), Sync läuft über `src/main/sync.ts`. IPC folgt einem festen Muster: pro Domäne ein `register*Ipc()` in `src/main/ipc/*.ts`, registriert in `src/main/ipc/index.ts`, plus passende `window.api.*`-Wrapper im Preload. Es gibt bereits ein wiederverwendbares Kontextmenü (`ContextMenu/TrackContextMenu.tsx` + `useTrackContextMenu.ts`), das u. a. "Open YouTube Video" anbietet (`Tracklist/index.tsx`).

### 1. Einstiegspunkte

- **Sidebar-Eintrag "Entdecken"**: neuer Navigationspunkt (Icon: Compass/Sparkles) neben Library/History/Settings. Öffnet `viewMode: 'discover'`. Ohne Vorauswahl zeigt der View zuerst einen Playlist-Picker.
- **Kontextmenü-Erweiterung**: neuer Eintrag "Ähnliche Tracks finden" auf einzelnen Track-Zeilen (Tracklist, PreviewPlayerQueue, HistoryView). Öffnet denselben Discover-View, aber geseedet mit genau diesem einen Track statt einer ganzen Playlist — nützlich, wenn der Nutzer gezielt von einem Song ausgehend weitersuchen will.

Beide Einstiege münden in eine neue `DiscoverView.tsx` (analog zu `HistoryView.tsx`/`SettingsView.tsx`), die in `App.tsx` wie die anderen Views eingehängt wird.

### 2. Seed-Strategie für Playlist-weite Empfehlungen

`getRecommendationsForTrack` nimmt nur eine einzelne Video-ID entgegen. Für eine ganze Playlist reicht ein Single-Seed-Aufruf nicht aus:

- Playlist-Modus: 3–5 Seed-Tracks sampeln (z. B. die zuletzt hinzugefügten, optional mit Zufallsanteil für Diversität), parallel Empfehlungen abrufen, Ergebnisse mergen und nach Häufigkeit ranken (Tracks, die von mehreren Seeds vorgeschlagen werden, erscheinen zuerst).
- Einzel-Track-Modus (aus dem Kontextmenü): genau ein Seed, direkte Ausgabe von `getRecommendationsForTrack`.

### 3. Deduplizierung gegen die bestehende Library

Vorschläge, deren `videoId` bereits als Track in `db.json` existiert (in irgendeiner Playlist, nicht nur der Ziel-Playlist), werden serverseitig herausgefiltert, damit keine bereits vorhandenen Tracks erneut vorgeschlagen werden. Optional: eine persistente "Nicht interessiert"-Ausschlussliste pro Nutzer, damit einmal abgelehnte Vorschläge nicht wiederkehren.

### 4. UI-Komponenten

- Card-Grid: Thumbnail, Titel, Artist, Dauer, "+"-Button pro Karte.
- Klick auf "+": schreibt die Video-ID in die Ziel-Playlist-Konfiguration (gleicher `addTrack`-Pfad wie beim regulären Sync, Track-Status `pending`) und zeigt einen Sonner-Toast ("Hinzugefügt — wird beim nächsten Sync geladen").
- Mehrfachauswahl (Checkboxen) + Sammel-Aktion "Ausgewählte hinzufügen (n)".
- Klick auf die Karte selbst (nicht auf "+") könnte optional eine Vorschau über den bestehenden `PreviewPlayer` triggern, bevor der Nutzer sich entscheidet.
- Zustände: Loading-Skeleton (InnerTube-Abfragen sind netzwerkgebunden und können mehrere Sekunden dauern), Empty State ("keine Vorschläge gefunden"), Error State (z. B. Video nicht gefunden / kein Musik-Video — siehe Error-Handling-Anforderung im Modul oben).

### 5. Backend/IPC

Neues `src/main/ipc/explore.ts` nach bestehendem Muster, registriert in `src/main/ipc/index.ts`:

- `explore:get-recommendations` — Input: `{ seedVideoIds: string[], limit?: number }`, kapselt das oben spezifizierte `youtubei.js`-Modul inkl. Dedupe/Ranking-Logik.
- `explore:add-track` — Input: `{ playlistId: string, videoId: string, title: string, artist: string }`, ruft intern denselben `addTrack`-Pfad wie `sync.ts` auf.

Passende `window.api.explore.*`-Wrapper im Preload (`src/preload/index.ts`), analog zu den bestehenden Domänen (`playlists`, `tracks`, …).

### 6. Spätere Erweiterungen (nicht MVP)

- Settings-Sektion "Entdecken" (z. B. Toggle "Bereits vorhandene Tracks ausblenden", Anzahl Seed-Tracks konfigurierbar).
- Kleines Badge/Indicator in der Sidebar, wenn für eine Playlist neue Empfehlungen verfügbar sind (setzt periodisches Prefetching voraus — bewusst nicht Teil des MVP wegen zusätzlicher InnerTube-Last).
