// Renders the tiny HTML page shown in the system browser at the end of an OAuth loopback flow
// (see youtubeOAuth.ts / spotifyOAuth.ts). Styled to match the app's own dark theme (see
// src/renderer/src/assets/main.css) so it doesn't look like a bare, unbranded error page — this
// is served by RekordFox's own short-lived local HTTP server, never by Google or Spotify.

export type CallbackPageLanguage = 'de' | 'en' | 'fr' | 'es'

interface CallbackPageOptions {
  status: 'success' | 'error'
  lang: CallbackPageLanguage
  detail?: string
  closeSeconds?: number
}

const COPY: Record<
  CallbackPageLanguage,
  {
    success: { heading: string; body: string }
    error: { heading: string; body: string }
    closing: string
    manualHint: string
  }
> = {
  de: {
    success: {
      heading: 'Erfolgreich verbunden!',
      body: 'Du kannst jetzt zu RekordFox zurückwechseln.'
    },
    error: {
      heading: 'Anmeldung fehlgeschlagen',
      body: 'Du kannst dieses Fenster schließen und es in RekordFox erneut versuchen.'
    },
    closing: 'Dieses Fenster schließt sich automatisch in',
    manualHint: 'Falls nicht, kannst du es auch einfach manuell schließen.'
  },
  en: {
    success: {
      heading: 'Successfully connected!',
      body: 'You can switch back to RekordFox now.'
    },
    error: {
      heading: 'Sign-in failed',
      body: 'You can close this window and try again in RekordFox.'
    },
    closing: 'This window closes automatically in',
    manualHint: 'If not, you can also just close it manually.'
  },
  es: {
    success: {
      heading: '¡Conectado correctamente!',
      body: 'Ya puedes volver a RekordFox.'
    },
    error: {
      heading: 'Error al iniciar sesión',
      body: 'Puedes cerrar esta ventana e intentarlo de nuevo en RekordFox.'
    },
    closing: 'Esta ventana se cerrará automáticamente en',
    manualHint: 'Si no lo hace, también puedes cerrarla manualmente.'
  },
  fr: {
    success: {
      heading: 'Connexion réussie !',
      body: 'Vous pouvez revenir à RekordFox dès maintenant.'
    },
    error: {
      heading: 'Échec de la connexion',
      body: 'Vous pouvez fermer cette fenêtre et réessayer dans RekordFox.'
    },
    closing: 'Cette fenêtre se fermera automatiquement dans',
    manualHint: 'Sinon, vous pouvez aussi la fermer manuellement.'
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// The app's light (white-fill) logomark — see src/renderer/src/assets/logo-rekordfox-light.svg —
// inlined here since this page is generated as a plain string in the main process, outside the
// Vite-bundled renderer.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="528 42.667 993.333 1065.333"><path fill="#fff" d="M1428.14 298.633c5.04 2.177 19.28 11.179 24.48 14.297a2411 2411 0 0 1 47.19 28.598c1.52 146.264-1.42 294.018.78 439.913-128.33 79.72-253.71 165.111-381.85 245.249-30.89 19.32-64.46 40.33-94.17 61.14-14.07-10.64-44.419-29.06-60.334-39.32a7449 7449 0 0 0-120.07-76.914L547.954 781.273l.09-402.523.152-36.976c24.373-13.701 47.671-29.475 72.375-42.894 8.138 33.732 14.041 71.753 21.824 106.471l19.028 86.684c6.756 30.285 17.115 66.127 11.927 97.777-1.462 8.924-11.866 29.8-15.903 39.067a7705 7705 0 0 0-31.648 73.314c25.625 12.439 62.719 34.569 87.648 49.04a6781 6781 0 0 1 131.693 77.702c21.294 12.911 58.667 37.414 79.064 47.617 4.011 17.391 9.877 44.76 12.385 62.37 9.365 5.459 22.374 11.506 32.279 16.552a1965 1965 0 0 0 55.342 27.698c24.11-9.892 63.25-31.094 86.98-43.272 4.63-20.915 8.15-41.275 13.16-62.27 69.22-41.73 137.57-84.844 208.12-124.506 29.76-16.728 60.17-35.431 90.77-50.369-10.4-26.363-22.83-52.516-33.66-78.72-3.81-11.096-12.32-24.855-14.31-36.324-4.4-25.261 2.73-50.613 7.89-74.874a6832 6832 0 0 1 18.94-87.206 4715 4715 0 0 0 16.82-80.658c2.91-14.648 5.65-32.082 9.22-46.34"/><path fill="#fff" d="M1396.88 239.99c2.53.863 9.24 5.37 11.84 7.017-2.29 16.34-7.71 37.771-11.32 54.582l-21.86 100.998c-5.68 25.941-11.78 52.578-17.15 78.514-5.06 24.478-7.93 43.386-14.84 67.923-4.93-13.1-15.12-30.729-22.29-43.185 1.47-5.552 2.92-16.21 4.01-22.305l7.33-38.959c4.94-26.139 9.38-52.205 13.92-78.404 2.69-15.555 6.06-30.985 8.06-46.663a5995 5995 0 0 0-148.46 111.584c53.87 47.232 104.3 109.721 133.77 175.422 5.59 12.46 10.41 25.937 16.82 37.934-25.28 7.155-55.84 17.617-80.33 26.845-44.45 16.607-89.45 34.014-130.07 58.775-49.78 30.338-60.84 72.973-72.77 127.196-10.07-3.375-18.02-7.975-29.29-11.114-2.05-122.542 1.36-246.901-.36-369.373 15.53-9.219 34.22-22.39 49.48-32.686l57.03-37.798zm-290.61 473.874c57.12-15.555 87.95-35.122 119.19-86.619l.05-1.866c-2.62-.909-1.56-.739-4.38-.256-46.02 11.608-83.71 28.452-110.43 70.874-2.1 3.336-8.54 14.602-8.17 17.9 1.79.153 1.96.303 3.74-.033M649.507 240.984c3.14-.686 6.386 1.471 8.944 3.219 35.641 24.353 71.351 49.018 106.974 73.367a13794 13794 0 0 0 154.392 102.594c27.957 18.49 56.494 38.711 84.643 56.493-1.31 60.013.73 122.718.31 182.994-.44 62.089-.58 124.676.24 186.717-10.299 2.385-19.84 6.368-29.678 10.16-4.103-19.642-12.632-50.479-20.055-68.524-25.445-61.854-120.23-92.39-180.856-116.018-24.557-10.109-56.04-19.528-81.634-27.21 3.477-10.523 11.418-26.388 15.926-36.887 30.509-71.05 77.842-125.381 134.017-177.329l-92.051-69.521c-18.586-14.052-37.659-28.96-57.068-41.72 3.014 11.134 6.375 34.093 8.467 46.086l16.13 92.644c2.162 12.071 6.083 36.42 10.027 47.497a424 424 0 0 0-24.254 45.39c-2.084-24.456-14.176-72.139-19.824-98.354l-44.06-204.721zM947.11 714.558c-21.296-44.148-45.545-64.243-92.372-82.179-7.424-2.844-25.081-7.294-33.015-7.949 7.544 11.778 14.434 23.038 23.853 33.917 26.178 30.234 60.439 46.431 98.76 55.818.74.181 1.998.314 2.774.393M1023.44 62.897c5.1 1.591 21.13 12.178 26.49 15.467 14.92 9.1 29.89 18.12 44.9 27.06l234.61 140.18c-37.62 25.515-78.59 53.147-115.68 79.28-16.81-9.534-37.58-23.106-54.54-33.401l-134.13-81.693c-5.9 1.621-30.684 17.943-37.719 22.377-50.06 31.552-101.605 61.096-151.728 92.455-10.27-5.626-32.119-21.182-42.515-28.307a8222 8222 0 0 1-73.579-50.84l198.992-119.279c32.885-19.695 73.598-42.576 104.899-63.299M1022.63 871.08c8.67.062 40.75 12.216 50.91 15.854l.15 29.79c-15.13 8.899-31.76 16.543-47.17 25.447-5.45.571-44.117-21.286-52.168-25.487l1.234-29.42a655 655 0 0 1 47.044-16.184"/></svg>`

const CHECK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>'

const ERROR_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>'

// Renders the loopback callback page shown after connecting a YouTube or Spotify account.
// The status is only known once the token exchange has finished (see the callers), and the page
// tries to close itself after `closeSeconds` — browsers vary in whether a script can close a tab
// it didn't open itself via window.open(), so the manual-close hint is shown alongside it.
export function renderOAuthCallbackPage({
  status,
  lang,
  detail,
  closeSeconds = 6
}: CallbackPageOptions): string {
  const copy = COPY[lang] || COPY.de
  const isSuccess = status === 'success'
  const heading = isSuccess ? copy.success.heading : copy.error.heading
  const body = isSuccess ? copy.success.body : copy.error.body
  const message = detail ? `${body}<br/><span class="detail">${escapeHtml(detail)}</span>` : body

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="color-scheme" content="dark" />
<title>RekordFox</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    min-height: 100vh;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #09090b;
    color: #fafafa;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .card {
    width: 100%;
    max-width: 380px;
    background: #0f0f12;
    border: 1px solid #27272a;
    border-radius: 16px;
    padding: 36px 32px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  .logo { width: 40px; height: 40px; margin: 0 auto 24px; opacity: 0.85; }
  .logo svg { width: 100%; height: 100%; display: block; }
  .status-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 20px;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .status-icon svg { width: 28px; height: 28px; }
  .status-icon.success { background: rgba(109, 40, 217, 0.15); color: #a78bfa; }
  .status-icon.error { background: rgba(239, 68, 68, 0.12); color: #f87171; }
  h1 {
    font-size: 17px;
    font-weight: 600;
    margin: 0 0 10px;
    letter-spacing: -0.01em;
  }
  p.message {
    font-size: 13.5px;
    line-height: 1.6;
    color: #a1a1aa;
    margin: 0 0 24px;
  }
  p.message .detail {
    display: inline-block;
    margin-top: 8px;
    color: #71717a;
    font-size: 12.5px;
  }
  .divider { height: 1px; background: #27272a; margin: 0 0 18px; }
  p.countdown { font-size: 12px; color: #71717a; margin: 0 0 4px; }
  p.countdown strong { color: #d4d4d8; font-variant-numeric: tabular-nums; }
  p.hint { font-size: 11.5px; color: #52525b; margin: 0; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">${LOGO_SVG}</div>
    <div class="status-icon ${status}">${isSuccess ? CHECK_ICON : ERROR_ICON}</div>
    <h1>${heading}</h1>
    <p class="message">${message}</p>
    <div class="divider"></div>
    <p class="countdown">${copy.closing} <strong id="rf-countdown">${closeSeconds}</strong>s</p>
    <p class="hint">${copy.manualHint}</p>
  </div>
  <script>
    (function () {
      var remaining = ${closeSeconds};
      var el = document.getElementById('rf-countdown');
      var timer = setInterval(function () {
        remaining -= 1;
        if (el) el.textContent = String(Math.max(remaining, 0));
        if (remaining <= 0) {
          clearInterval(timer);
          window.close();
        }
      }, 1000);
    })();
  </script>
</body>
</html>`
}
