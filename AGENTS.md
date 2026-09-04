# AGENTS.md — RekordFox Engineering Guide

Binding conventions for anyone (human or AI agent) writing code in this repo — an Electron/React/TypeScript app for DJ library management. Follow these unless a specific user instruction overrides them.

## Language

- **All code artifacts are English, always:** identifiers, comments, log messages, error messages thrown in code, commit messages, doc files. Never introduce German (or any other language) into source files — this includes fallback strings in main-process code (existing exceptions, e.g. a Windows volume-label fallback in `usb.ts`, are legacy, not a template).
- **User-facing UI text is never hardcoded.** It goes into `src/renderer/src/i18n/locales/{en,de,es,fr}.ts` as a typed key and is looked up via the i18n hook — add the key to **all four** locale files in the same change. This applies even to strings generated in the main process (e.g. dialog messages, sync errors) that end up visible to the user — pass a translation key or pre-translated string from the renderer instead of duplicating language-switch logic in `src/main`.

## Architecture: Main / Preload / Renderer

- Strict Electron process separation: the renderer has no direct Node access (`fs`, `path`, `child_process`, `electron` internals). All communication goes through `contextBridge` in [src/preload/index.ts](src/preload/index.ts) → `window.api`. Renderer code calls `window.api.*` only, never `ipcRenderer` directly.
- `sandbox: false` is set deliberately in [src/main/window.ts](src/main/window.ts). Don't compound this by adding further raw Node access into the preload context — keep the preload surface a thin, typed wrapper.
- Path aliases (`tsconfig.web.json` / `tsconfig.node.json` / `electron.vite.config.ts`): `@renderer/*`, `@main/*`, `@preload/*`, `@shared/*`. **Always use aliases, never `../../../`.** `@shared` is configured but `src/shared/` doesn't exist yet — create it there before cross-importing types between main and renderer instead of duplicating them.
- Domain types (`Track`, `Playlist`, `AppSettings`, `OAuthAccount`, …) live in [src/main/db.ts](src/main/db.ts) and are imported into the renderer from there. Don't redefine parallel shapes in renderer files.

### IPC conventions

- One `src/main/ipc/<domain>.ts` file per domain (`playlists`, `tracks`, `settings`, `spotify`, `youtubeAuth`, …), each exporting a `register<Domain>Ipc()` called once from [src/main/ipc/index.ts](src/main/ipc/index.ts). New domains follow this same shape.
- Channel names follow `domain:action` (`settings:get`, `spotify-oauth:connect`, `tracks:update-bpm`).
- Wrap handler bodies in `ipcTry()` ([src/main/errors.ts](src/main/errors.ts)) instead of hand-rolled try/catch — it produces the standard `{ success: true, ...payload } | { success: false, error }` response shape. Match this shape for any new handler.
- Event listeners exposed on `window.api` (`onXyz`) must return an unsubscribe function; the corresponding React hook must call it in its `useEffect` cleanup. Never `ipcRenderer.on` without a matching `removeListener`.
- Mirror every preload method's signature exactly between [src/preload/index.ts](src/preload/index.ts) (implementation) and [src/preload/index.d.ts](src/preload/index.d.ts) (types) — update both in the same change.

## TypeScript

- No `any`. Type IPC payloads and event callback data explicitly.
- `strict` compiler settings apply via `@electron-toolkit/tsconfig` — don't relax them.
- Run `npm run typecheck` (which runs `typecheck:node` and `typecheck:web` separately, since main and renderer use different `tsconfig`s) before considering a change done.

## React: component size & structure

Keep components small and focused. **Once a component's `.tsx` file mixes more than one visual section (header/body/controls) with non-trivial state, or grows past roughly 150–200 lines, split it into its own subfolder** instead of letting it keep growing:

```
components/Library/PreviewPlayer/
├── index.tsx                   # Orchestrator: composes the pieces, holds only wiring
├── PreviewPlayerHeader.tsx     # Sub-component (one visual section)
├── PreviewPlayerControls.tsx   # Sub-component (one visual section)
├── useAudioPlayer.ts           # Co-located hook — one piece of stateful/business logic
├── previewPlayerUtils.ts       # Co-located pure helpers (formatting, calculations)
└── PreviewPlayer.test.tsx      # Co-located tests, if/when present
```

Rules of thumb for where logic goes:

- **Business/stateful logic → a hook** (`useXyz.ts`), not inline in the component. Example: [useApp.ts](src/renderer/src/hooks/useApp.ts) encapsulates the app's playlists/tracks/settings/sync state behind a typed return value; `App.tsx` just calls it and renders. Do the same for any new non-trivial domain logic — don't let it accumulate in `index.tsx` or a page-level component.
- **Pure, stateless logic → a helper/util function**, co-located next to the component if it's only used there (`previewPlayerUtils.ts` style), or in `src/renderer/src/utils/` if it's shared across features.
- **Shared, cross-feature technical state → a Zustand store** (`src/renderer/src/store/`, e.g. `useMixerStore.ts`). Don't reach for Zustand for state that's local to one component tree — plain `useState`/`useReducer` there.
- **One barrel per feature folder:** feature groups under `components/` (`Deck/`, `Mixer/`, `Export/`, `Library/`, `Settings/`, `Layout/`) export their public component from an `index.ts`/`index.tsx`. Only the top-level component of a subfolder needs to be exported from the feature's barrel — internal sub-pieces stay private to the subfolder.
- Prefer several small, named sub-components over one large component with many conditional blocks — it makes diffs and reviews smaller too.

## Styling

- Tailwind CSS v4 (`@tailwindcss/vite`), utility-first, no CSS-in-JS. UI primitives come from shadcn/ui in `src/renderer/src/components/ui/` ([components.json](components.json)) — reuse/extend those instead of hand-rolling new primitives (buttons, dialogs, inputs, etc.).
- Dark theme is the default; new/changed UI must look correct in both `light` and `dark` (`AppSettings.theme`).
- Design principle: no visual noise — weigh new badges/bars/overlays against that before adding them.

## Data persistence

- [src/main/db.ts](src/main/db.ts) is a single JSON file, fully re-serialized (`JSON.stringify(dbData, null, 2)`) and written via `writeFileSync` on every write. There is no schema versioning — structural changes must keep older `dbData` files loadable (see `migrateDownloadsFolder` as an example migration).
- `better-sqlite3` is used **only** for the Pioneer/Rekordbox USB export (writing `.pdb` files). New app features persist through `db.ts`, not a new SQLite instance.

## Security

- Keep the Electron baseline: `contextIsolation` on, `nodeIntegration` off. `sandbox: false` is an existing, deliberate exception — don't extend the preload's Node access footprint further.
- Invoke external binaries (`yt-dlp`, `ffmpeg`) via `execFile`/`spawn` with argument arrays, never string-interpolated into a shell. User input (playlist URLs, filenames) stays an argument, never a shell fragment — this applies to any new downloader/sync adapter too.
- Never hardcode absolute paths — use `path.join()` and `app.getPath()`.
- The `media://` custom protocol handler (in `src/main`) resolves renderer-supplied strings into filesystem paths — any change here must keep validating the resolved path against an allowed root before touching the filesystem.

## Code quality & tooling

- Before finishing any change: `npm run lint`, `npm run typecheck`, `npm run format`, `npm test`.
- Prettier: single quotes, no semicolons, no trailing commas, 100-char print width ([.prettierrc.yaml](.prettierrc.yaml)) — let the formatter enforce this, don't hand-format against it.
- ESLint is flat-config based (`@electron-toolkit` + React Hooks + React Refresh rules). No `eslint-disable` without a short reason comment.
- Don't add a new dependency when a native Web/Node API already covers the need.

## Tests

Vitest is configured ([vitest.config.ts](vitest.config.ts)) for pure-logic unit tests — it does not spin up the Electron runtime, so it only covers plain TS/TSX modules (export writers, DB functions, BPM/key parsing, sync diffing, harmonic chaining, etc.), not IPC handlers or React rendering.

- **New pure logic must ship with tests.** Any new or changed function with non-trivial branching (parsing, scoring, diffing, filtering, formatting) needs a co-located `*.test.ts` covering its normal case and its edge cases (empty/null input, boundary values). Bug fixes in existing pure logic should add a regression test for the fixed case.
- Co-locate tests next to the code they cover (`harmonicChaining.ts` → `harmonicChaining.test.ts`), matching the co-location convention used for components ([React: component size & structure](#react-component-size--structure)).
- Run `npm test` (or `npm run test:watch` while iterating) before considering a change done, alongside `npm run lint`/`npm run typecheck`.
- Code that's inherently Electron/IPC/DOM-bound (main-process handlers, React components with side effects, anything touching `window.api`) has no test harness yet — for that, keep verifying manually by running the app (`npm run dev`) as before.

## Checklist for new IPC functionality

1. Add the handler in `src/main/ipc/<domain>.ts` (`domain:action` naming, wrapped in `ipcTry`).
2. Register it in `src/main/ipc/index.ts` if it's a new domain module.
3. Add the matching method in `src/preload/index.ts`, typed in `src/preload/index.d.ts`.
4. For events: return an unsubscribe function, wire it into the calling hook's `useEffect` cleanup.
5. Put shared types in `src/main/db.ts` (or `src/shared/` for main+renderer-only types) instead of duplicating them.
6. Add any new UI strings to all four `i18n/locales/*.ts` files.
7. Cover any new pure logic (validation, diffing, payload shaping) with a co-located `*.test.ts` — see [Tests](#tests).
8. `npm run lint && npm run typecheck && npm test` before wrapping up.
