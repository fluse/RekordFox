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