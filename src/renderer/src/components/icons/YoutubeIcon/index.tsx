import React from 'react'

// lucide-react ships no brand icons, so the YouTube glyph used to mark 'youtube-oauth'
// playlists/UI throughout the app is a small inline SVG instead.
export default function YoutubeIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="1" y="4" width="22" height="16" rx="5" fill="#FF0033" />
      <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="white" />
    </svg>
  )
}
