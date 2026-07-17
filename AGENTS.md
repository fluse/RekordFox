# AGENTS.md — RekordFox Engineering Guide

This document defines binding best practices for working on RekordFox — an Electron/React/TypeScript application for DJ library management. It targets both AI coding agents and human contributors. It complements [.agents/rules/rekordfox-guidelines.md](.agents/rules/rekordfox-guidelines.md) (project vision & baseline rules) — this document goes deeper into concrete architecture and code patterns as they actually exist in the repo.

## Tech Stack (current state)

- **Shell:** Electron 39, built with `electron-vite` (three build targets: `main`, `preload`, `renderer`)
- **UI:** React 19, TypeScript 5.9, Tailwind CSS 4 (`@tailwindcss/vite`)
- **State:** Zustand 5 (partly with `persist` middleware, e.g. `useMixerStore`)
- **Persistence:** a custom JSON file format in `src/main/db.ts` (no real SQL despite the `better-sqlite3` dependency)
- **better-sqlite3:** used exclusively for the Pioneer USB export (`PioneerDbUpdater.ts`) to write Rekordbox-compatible `.pdb` files — **not** the app database
- **Audio analysis:** `music-tempo` (BPM), custom key detection, `ffmpeg`/`ffprobe` via `@ffmpeg-installer`/`@ffprobe-installer`
- **Download:** the `yt-dlp` binary is downloaded at runtime and invoked via `execFile`/`spawn` (no `shell: true`)
- **Tooling:** ESLint 9 (flat config, `@electron-toolkit`), Prettier (`singleQuote`, `semi: false`, `printWidth: 100`)

Node version: v24+ recommended (see README), but **not** enforced via `package.json#engines` — be careful when adding Node-24-only APIs, or add the field.

## Architecture: Main / Preload / Renderer

Strict process separation is non-negotiable:

- The renderer has **no** direct access to Node APIs (`fs`, `path`, `child_process`). `contextIsolation: true` and `nodeIntegration: false` apply (the `@electron-toolkit` default).
- All communication goes through `contextBridge` in [src/preload/index.ts](src/preload/index.ts) → `window.api`. Renderer code only ever calls `window.api.*`, never `ipcRenderer` directly.
- `sandbox: false` is currently set in [src/main/index.ts](src/main/index.ts) (`BrowserWindow` `webPreferences`). This is a deliberate but security-relevant deviation from the Electron default — keep it in mind for new preload APIs and don't compound it by adding further Node access in the preload context.
- Path aliases (`electron.vite.config.ts`): `@main`, `@preload`, `@shared` (main+preload+renderer), `@renderer` (renderer only). **Always use aliases instead of `../../../`.** `@shared` exists as an alias, but `src/shared/` is currently missing from the repo — before using it, create the folder rather than cross-importing main/renderer types.

### IPC Conventions

Channel naming follows `domain:action` (`playlists:get`, `tracks:update-bpm`, `dialog:select-directory`, `pioneer:export-start`). Keep new channels on this scheme.

The response shape for `invoke` handlers is consistently `{ success: boolean; error?: string; ...payload }` (see all handlers in `src/main/index.ts`). Follow this pattern for new handlers instead of throwing raw exceptions over IPC.

Preload event listeners (`onXyz`) always return an unsubscribe function:

```ts
onTracksUpdated: (callback: () => void) => {
  const subscription = () => callback()
  ipcRenderer.on('tracks-updated', subscription)
  return () => ipcRenderer.removeListener('tracks-updated', subscription)
}
```

Clean this up in the corresponding `useEffect` in React hooks (`return unsubscribe`). Never call `ipcRenderer.on` without a matching `removeListener`.

**Known inconsistency to clean up on next contact:** [src/types/electron.d.ts](src/types/electron.d.ts) (`IRekordFoxAPI`) does **not** correctly reflect the actual `window.api` surface from `src/preload/index.ts` (e.g. `scanLibrary`, `playTrack`, `onTrackScanned` don't exist in the preload at all; conversely, methods like `getPlaylists`, `addPlaylist`, `getSettings` are missing from the interface). Don't add new IPC methods to this stale interface without first checking whether it's still used as a contract at all — when in doubt, align the interface with the real preload export before adding further methods.

## TypeScript

- No `any`. Existing occurrences (`updateSettings: (settings: any)`, various `data: any` in event callbacks) are legacy debt, not a template — replace them with concrete types when touched, don't add further `any` spots.
- Domain types (`Track`, `Playlist`, `AppSettings`) live in `src/main/db.ts` and are imported into the renderer from there (`import type { Playlist, Track, AppSettings } from '@main/db'`). Don't create parallel definitions in renderer files.
- Type IPC payloads inline (as in `onExportProgress`, `onPioneerExportProgress`), don't pass them through as `any`/`unknown`.

## React Patterns Used in This Project

- **Business logic lives in hooks, not components:** `useApp.ts` encapsulates the entire app state (playlists, tracks, settings, sync status) and exposes a typed return API (`UseAppReturn`). Follow this pattern for new domain logic — extract it into dedicated hooks rather than into `App.tsx` or deeply nested components.
- **Zustand stores for shared, technical state** (audio graph, mixer parameters) — see `useMixerStore.ts`. Don't use a Zustand store for purely local component state (use `useState`/`useReducer` for that).
- **Component folders with barrel exports:** every feature group (`Deck/`, `Mixer/`, `Export/`, `Library/`, `Settings/`, `Layout/`) has an `index.ts`. Place new components there and export them — don't add new top-level files directly under `components/`.
- **Split large components into their own subfolder:** once a component's `.tsx` file grows past roughly 150–200 lines or mixes more than one visual section (header/body/controls) with non-trivial state, give it its own subfolder inside the feature group instead of letting it keep growing — e.g. `Library/PreviewPlayer/` with `index.tsx` (orchestrator: composes the pieces, holds only wiring), one file per visual section (`PreviewPlayerHeader.tsx`, `PreviewPlayerProgress.tsx`, `PreviewPlayerControls.tsx`, ...), and one hook per distinct piece of stateful logic (`useAudioPlayer.ts`, `useDraggablePosition.ts`). The parent barrel (`Library/index.ts`) keeps importing from `./PreviewPlayer` unchanged — folders with an `index.tsx` resolve the same as a flat file. Only the top-level component needs exporting from the feature group's barrel; sub-pieces are internal to the subfolder.
- **i18n:** translations are typed under `src/renderer/src/i18n/locales/{de,en,fr,es}.ts` with a shared `TranslationKey` type. Add new UI strings to **all four** locale files instead of hardcoding them in JSX (including German strings, as currently found in some `dialog.showMessageBox` calls in `src/main/index.ts` — that's existing debt, not a template for new code).

## Performance (top priority per [docs/roadmap/00_MASTER_ROADMAP.md](docs/roadmap/00_MASTER_ROADMAP.md))

The roadmap order is explicitly **Performance → Beatmatching precision → Effects → Hardware**. For any change to Deck/Waveform/Mixer code:

- **No React re-renders in the play loop.** Update high-frequency values (time display, waveform scroll position) via `useRef` + direct DOM manipulation (`el.current.innerText = ...`), not via `useState`.
- **Pre-render waveforms:** draw the complete waveform once onto an offscreen `<canvas>`; in `requestAnimationFrame`, only use `ctx.drawImage()` (bit-blitting) for the visible section. Don't redraw the entire waveform every frame.
- **Virtualize large track lists** (windowing) once libraries need to stay performant with thousands of tracks — not yet implemented in `Tracklist.tsx`/`TrackRow.tsx`, but the target state.
- **Don't run CPU-intensive analysis (BPM/key) synchronously/blocking in the main process.** The existing pattern in `src/main/index.ts` (staggered analysis via recursive `setTimeout(..., 200)` after app start) is a deliberate compromise to avoid blocking the event loop — evaluate `worker_threads` or child processes for real scaling instead of just shortening the stagger interval.

## Data Persistence

`src/main/db.ts` is a **JSON file**, fully re-serialized on every write (`JSON.stringify(dbData, null, 2)`) and written via `writeFileSync`. This does not scale indefinitely:

- For every new write operation, consider whether it truly needs to rewrite the entire file, or whether a more targeted operation is possible.
- Handle migrations to this format carefully (add fields rather than breaking structure), since there is no schema versioning — before structural changes, verify that existing `dbData` files remain loadable (see `migrateDownloadsFolder`, `renameAllTracksFilenameAsync` as examples of non-trivial migrations).
- **Don't confuse the two:** `better-sqlite3` is only relevant for the Pioneer/Rekordbox export. New app features that need persistent data go through `db.ts`, not a new SQLite instance — unless it's a genuine Rekordbox/USB export context.

## Security

- Keep `nodeIntegration: false` and `contextIsolation: true` (Electron security baseline).
- The custom `media://` protocol handler in `src/main/index.ts` parses raw URL strings into file paths (`decodeURIComponent`, slice operations). This is a path-traversal entry point if the renderer can construct arbitrary `media://` URLs — any extension of this handler must validate the resulting path against an allowed root directory before calling `net.fetch`/`pathToFileURL`.
- Invoke external processes (`yt-dlp`, `ffmpeg`) via `execFile`/`spawn` with argument arrays, **never** via string interpolation into a shell (`exec` with a concatenated string) — the existing pattern in `downloader.ts` is correct; keep it that way.
- User input passed to `spawn`/`execFile` (e.g. playlist URLs) stays as arguments, never shell fragments — apply the same rule to new downloader adapters (see Roadmap Phase 6: SoundCloud).
- Never hardcode paths (`C:\...`, `/Users/...`). Always use `path.join()` + `app.getPath()`.
- Use `dialog.showOpenDialog`/`showSaveDialog` for any user-initiated filesystem interaction — don't directly parse arbitrary renderer-supplied paths without prior validation in the main process.

## Styling

- Tailwind 4 (`@tailwindcss/vite`), utility-first. No CSS-in-JS, no new global CSS files beyond what's already covered in `assets/base.css`/`assets/main.css`.
- Dark theme is the default (`AppSettings.theme: 'dark' | 'light'`). New components must support both themes, not just be tested in dark mode.
- Design principle per the project vision: **no visual noise**. For UI changes, deliberately weigh against feature creep (extra badges, bars, overlays).

## Code Quality & Tooling

- Before every commit: `npm run lint`, `npm run typecheck` (`typecheck:node` + `typecheck:web` run separately, since main/renderer have different `tsconfig`s), `npm run format`.
- The ESLint config is flat (`eslint.config.mjs`) with `@electron-toolkit` + React Hooks + React Refresh rules. No inline `eslint-disable` comments without a short reason.
- Prefer small, single-purpose functions; avoid deep nesting/callback hell, use `async/await` consistently.
- Don't add new heavy dependencies when a native Web API or Node solution suffices — ask the human first (see `.agents/rules/rekordfox-guidelines.md`).

## Tests

There is currently **no test setup** (no `test` script in `package.json`, no test runner as a dependency). This is a real gap, not a deliberate architectural statement:

- Before major refactors to core logic (BPM/key analysis, Rekordbox XML export, Pioneer `.pdb` export, JSON DB migrations), verify correctness manually (e.g. via the `/verify` skill or an actual app run), since there is no test safety net.
- If introducing a test setup: pure logic (export writers, DB functions, BPM/key parsing) is the most sensible first candidate for unit tests, since it's testable without the Electron runtime — UI components are lower priority given the roadmap's focus.

## Build & Release

- `electron-vite` builds three bundles (`main`, `preload`, `renderer`) per `electron.vite.config.ts`.
- Release process: Git tag `v*` → GitHub Actions (`.github/workflows/release.yml`) → `electron-builder` for Win/Mac/Linux. No manual artifact uploads.
- `electron-builder.yml` explicitly excludes source files (`src/*`, configs) from the packaged build — when adding new root-level config files, check whether they belong in the exclude list so they don't accidentally end up in the shipped product.

## Checklist for New IPC Functionality

1. Register the handler in `src/main/index.ts` with `domain:action` naming and a `{ success, error?, ... }` response.
2. Add the corresponding preload method in `src/preload/index.ts` (mirror the signature exactly).
3. For events: return an unsubscribe function, wire it into the calling hook's `useEffect` cleanup.
4. Put types in `src/main/db.ts` (if domain data is involved) instead of duplicating them in the renderer.
5. Add new UI strings to all four `i18n/locales/*.ts` files.
6. `npm run lint && npm run typecheck` before wrapping up.
