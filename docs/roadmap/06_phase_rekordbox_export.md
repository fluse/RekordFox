# Phase 6: Rekordbox USB Export & Waveform Generation (ANLZ)

**Ziel:** Generierung von Pioneer-kompatiblen Binärdateien (`ANLZ`) für die Waveforms und das Schreiben der `export.pdb` (DeviceSQL), um Tracks aus RekordFox direkt auf einen CDJ-kompatiblen USB-Stick zu exportieren.

**Benötigte KI-Agenten für diese Phase:**
- Für Audio-Analyse: `@.agents/rules/audio_engineer.md`
- Für Binär-Daten, I/O & SQLite: `@.agents/rules/data_manager.md`

---

## 1. Vorbereitung & Typisierung (Data Manager)
Pioneer ANLZ-Dateien bestehen aus strukturierten Blöcken (Tags). Wir müssen zuerst die Interfaces definieren.
- [ ] **Typen anlegen:** Erstelle in `src/types/rekordbox.ts` die Interfaces für die Pioneer-Strukturen basierend auf Deep Symmetry (Header `PMAI`, Waveform-Vorschau `PWV3`, Farb-Waveform `PWV6` / `2EX`).
- [ ] **Abhängigkeiten prüfen:** Falls wir NodeJS nutzen, stelle sicher, dass wir mit nativen `Buffer` arbeiten. Falls wir ein Tauri/Rust Backend nutzen, füge die Crate `byteorder` oder `rbox` zur `Cargo.toml` hinzu.

## 2. Der Audio-Analyzer (Audio Engineer)
Um Waveforms zu generieren, müssen wir die Audiodatei analysieren, *ohne* sie hörbar abzuspielen.
- [ ] **OfflineAudioContext Setup:** Erstelle einen Background-Service (oder Web Worker) `waveformAnalyzer.ts`. Nutze einen `OfflineAudioContext`, um die gesamte Audio-Datei in den RAM zu decodieren.
- [ ] **RMS & Peak Extraktion:** Schreibe eine Funktion, die über das decodierte `Float32Array` iteriert und den Audio-Puffer in feste Zeitfenster unterteilt (Downsampling). Extrahiere für jedes Fenster den Peak-Wert (höchster Ausschlag) und den RMS-Wert (Durchschnittliche Energie).
- [ ] **3-Band Trennung (Optional für Farbe):** Leite das Signal durch 3 parallele `BiquadFilterNode` (Lowpass, Bandpass, Highpass), um die Energie für die Bässe (Rot), Mitten (Grün) und Höhen (Blau) zu berechnen (für die farbigen CDJ-3000/NXS2 Waveforms).

## 3. Downsampling & Skalierung (Audio Engineer -> Data Manager)
Die Rohdaten müssen in das stark komprimierte Pioneer-Format gequetscht werden.
- [ ] **Overview Waveform (PWV3/PWV4):** Skaliere die Peak-Daten für die statische Vorschau-Waveform herunter (exakt 400 Bytes pro Track, unabhängig von der Länge).
- [ ] **Scrolling Waveform (PWV5/PWV6/PWV7):** Skaliere die Daten für die detaillierte, mitlaufende Waveform. Das Format nutzt oft nur 5 Bit (Werte von 0-31) pro Datenpunkt, um Platz zu sparen. Implementiere eine Funktion `scaleFloatToInt(value, maxBits)`.

## 4. Der ANLZ Binary Packer (Data Manager)
Jetzt werden die Daten in das proprietäre Binärformat geschrieben.
- [ ] **Buffer Assembler:** Erstelle eine Klasse `AnlzBuilder.ts` (oder `.rs`). Implementiere Funktionen, die NodeJS `Buffer` nutzen, um Strings in ASCII und Zahlen in `BigEndian` (Pioneer Standard!) in den Buffer zu schreiben.
- [ ] **Header & Tags schreiben:** Schreibe die Magischen Bytes (`PMAI`), gefolgt von der Länge der Datei, und hänge dann iterativ die generierten Waveform-Blöcke (PWV3, PWV4, etc.) an.
- [ ] **Datei speichern:** Schreibe den fertigen Buffer als `ANLZ0000.DAT` / `ANLZ0000.EXT` auf das Ziellaufwerk (den USB-Stick) im versteckten Ordner `/.PIONEER/USBANLZ/`.

## 5. DeviceSQL / PDB Integration (Data Manager)
Der CDJ findet die Waveform nur, wenn sie in der Datenbank des USB-Sticks eingetragen ist.
- [ ] **USB-Datenbank laden:** Schreibe eine Logik, die prüft, ob auf dem Ziel-USB-Stick bereits eine `/PIONEER/export.pdb` (SQLite) existiert.
- [ ] **Datenbank-Update:** Füge den exportierten Track in die Tabelle `djmdSong` ein.
- [ ] **Pfad-Referenzierung:** Trage den generierten Pfad der `ANLZ`-Datei (relativ zum USB-Root) in die entsprechenden Spalten (`strAnlzPath`) der Datenbank ein.

## 6. Export IPC Queue & UI (Data Manager)
Da das Schreiben hunderter Tracks auf einen USB-Stick dauert, darf die UI nicht blockieren.
- [ ] **Export Job Queue:** Erstelle einen Background-Job-Runner im Backend, der eine Liste von Tracks abarbeitet.
- [ ] **IPC Progress:** Sende über IPC regelmäßige Updates an das Frontend (z.B. `{ currentTrack: 5, total: 100, status: 'Analyzing Waveform...' }`).
- [ ] **UI Progress Bar:** Füge in React ein Modal ein, das den Fortschritt anzeigt und einen "Abbrechen"-Button besitzt.