Du bist ein Senior Software Engineer für unsere DJ-App "rekordfox". Wir haben bereits einen hochkomplexen "Smart Mode" (Harmonic Chaining Algorithmus mit 4-Phasen-Spannungskurve) implementiert.

Nun steht ein großes neues Feature an: **YouTube OAuth Integration & Playlist Source Management**. 
Ziel ist es, dass User ihre YouTube-Playlisten in Rekordfox importieren, mit dem Smart Mode harmonisch sortieren und die neue Reihenfolge zu YouTube zurück synchronisieren können. Später soll auch SoundCloud unterstützt werden.

Bitte implementiere dieses Feature strukturiert in den folgenden Phasen.

### PHASE 1: Datenmodell & Source Management
Wir müssen die Medien-Ökosysteme strikt trennen, um Edge-Cases zu vermeiden.
1. Erweitere das `Playlist`-Interface um ein `source` Property (`'local' | 'youtube' | 'soundcloud'`). Bestehende Playlisten sind default `'local'`.
2. Implementiere eine strikte Drag & Drop Restriktion: Schreibe eine Helper-Funktion (z.B. `canDropTrack`), die verhindert, dass lokale Tracks in eine YouTube-Playlist gezogen werden. Das UI muss dies blockieren. Nur YouTube-Tracks dürfen in YouTube-Playlisten existieren.

### PHASE 2: OAuth & Onboarding UI
1. Baue einen Einstiegspunkt für die YouTube-Verbindung (z.B. in den Einstellungen oder unter der Playlist-Sektion in der Sidebar).
2. Erstelle ein modales Erklär-Fenster, das die Vorteile kommuniziert (z.B. "Sortiere deine YouTube-Sets harmonisch perfekt" und "Synchronisiere deine Track-Reihenfolge").
3. Bereite die OAuth 2.0 Logik vor, um den Scope `https://www.googleapis.com/auth/youtube` anzufordern, damit wir Playlisten bearbeiten dürfen.

### PHASE 3: Sidebar UI & Rendering
1. Baue die Sidebar so um, dass Playlisten je nach `source` visuell getrennt oder markiert werden. 
2. Externe Playlisten (YouTube) sollen in der Sidebar ein kleines YouTube-Icon erhalten, passend zum dunklen Theme der App.
3. Nutze visuelle Indikatoren (wie einen grünen Haken), um den erfolgreichen Sync-Status anzuzeigen.

### PHASE 4: Synchronisation & Smart Mode Kompatibilität
1. Baue einen "Zu YouTube synchronisieren" Button im Header der Playlist-Ansicht (neben dem bestehenden "USB Export" Button). Dieser darf nur aktiv sein, wenn lokale Änderungen an der Liste vorgenommen wurden.
2. Der Sync darf nicht bei jedem Drag & Drop passieren, sondern nur gebündelt beim Klick auf den Sync-Button (YouTube Data API v3 `playlistItems.update`).
3. **WICHTIG:** Stelle sicher, dass der bestehende "Smart Mode" (mit unserer 4-Phasen-Spannungskurve und dem Camelot Wheel Scoring) reibungslos auf diese YouTube-Playlisten angewendet werden kann, bevor der User auf "Sync" drückt.
