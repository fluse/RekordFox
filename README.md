<div align="center">
  <img src="./resources/logo-rekordfox-light.svg" alt="RekordFox Logo" width="250" />

  <h1>RekordFox</h1>
  
  <p><strong>The modern, intuitive, and fast DJ library management alternative to Rekordbox.</strong></p>

[![Build Status](https://img.shields.io/github/actions/workflow/status/fluse/rekordfox/release.yml?branch=main)](https://github.com/fluse/rekordfox/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 🎵 About the Project

RekordFox was born out of a simple frustration: established DJ software like Rekordbox has become bloated, cluttered, and sluggish to navigate over the years.

**RekordFox puts an end to this.** It is a lightweight, cross-platform (Windows, macOS, Linux) Electron app focused on what truly matters: managing your music library efficiently, quickly, and with an outstanding user experience.

## ✨ Features

- **🎧 Intuitive UI:** No visual noise. A clean, custom-titlebar interface with light/dark mode and multiple accent color schemes.
- **⚡ Fast, Cross-Playlist Search:** Find tracks in milliseconds, across your whole library, with clickable artist links.
- **📂 Drag & Drop Workflow:** Reorder tracks, drag them between playlists, and build local playlists on the fly.
- **🎵 Playlists:** Create local playlists, sync playlists from Spotify, or link a YouTube playlist/URL and download it for offline playback.
- **🔍 Discover:** Find tracks similar to a given track or playlist to keep exploring your library.
- **🎚️ Analysis:** Automatic BPM, beatgrid, key (Camelot), and energy analysis for every track.
- **▶️ Preview Player:** A floating, draggable preview player with BPM/pitch control that persists across app restarts.
- **🔀 Smart Harmonic Shuffle:** Queue mode that chains tracks by harmonic (Camelot) compatibility and energy.
- **💿 CDJ / USB Export:** Export playlists straight into a rekordbox `export.pdb` on a USB stick, with auto-detected drives and a guided one-time CDJ/USB setup.
- **📤 rekordbox XML Export:** Export your library/playlists as a rekordbox-compatible XML.
- **🌍 Multi-language:** Available in English, German, Spanish, and French.
- **💻 Cross-Platform:** Built with Electron, runs smoothly on Mac, Windows, and Linux.

## 🚀 Installation & Development

Want to run RekordFox locally or contribute to its development? Here is how to set up the project:

### Prerequisites

- [Node.js](https://nodejs.org/) (v24 or higher recommended)
- Git

### Setup

1. **Clone the repository**

````bash
   git clone [https://github.com/fluse/rekordfox.git](https://github.com/fluse/rekordfox.git)
   cd rekordfox

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
````

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
