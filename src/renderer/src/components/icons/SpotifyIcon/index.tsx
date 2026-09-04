import React from 'react'

// lucide-react ships no brand icons, so the Spotify glyph used to mark 'spotify' playlists/UI
// throughout the app is a small inline SVG instead (mirrors YoutubeIcon's shape/props).
export default function SpotifyIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#1ED760" />
      <path
        d="M6.5 9.5c3.5-1 8-0.6 11 1.1"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.8 12.8c2.9-0.8 6.6-0.5 9.1 0.9"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M7.2 16c2.3-0.6 5.2-0.4 7.1 0.7"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
