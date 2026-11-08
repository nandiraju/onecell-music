# 1CELL.AI // Neural Audio Station 🎵⚛️

An ultra-modern, glossy, cybernetic **React web application** built with **React 19 + Vite** for the **1Cell AI Audio Collection**. Features real-time Web Audio API visualizers, seamless background playback with system media controls, intelligent acoustic descriptions, and rocket-fast performance.

---

## ⚡ Quick Start

The React application is currently running live at:  
👉 **[http://localhost:8080](http://localhost:8080)**

To run or build the app at any time:
```bash
# Start Vite React development server:
npm run dev
# or with bun:
bun run dev

# Build for production:
npm run build

# Preview production build:
npm run preview
```

---

## 🎧 Song Catalog & Acoustic Intelligence

All original audio files have been renamed into clean canonical names, and acoustic profiling was performed to catalog their BPM, musical tone, rhythm patterns, and genre descriptions:

| # | File Name | Title & Mix Edition | BPM | Musical Tone & Character | Beat & Rhythm Structure |
|---|---|---|:---:|---|---|
| **01** | `01_One_Cell_One_Future_Cyber_Anthem.mp3` | **One Cell, One Future** *(Cyber Anthem Mix)* | **129** | Energizing, Futuristic & Uplifting | Driving 4-on-the-Floor Electronic Pulse with crisp hi-hats |
| **02** | `02_One_Cell_One_Future_Progressive_Tech.mp3` | **One Cell, One Future** *(Progressive Tech-House Mix)* | **125** | Hypnotic, Deep Focus & Melodic | Rolling Tech-House Groove with Sub-Bass Swells |
| **03** | `03_One_Cell_One_Future_Chillwave_Horizon.mp3` | **One Cell, One Future** *(Chillwave Horizon Edition)* | **65** | Warm, Spacious & Contemplative | Half-Time Lo-Fi Organic Beat & Sub Swoops |
| **04** | `04_One_Cell_One_Future_Electro_Funk.mp3` | **One Cell, One Future** *(Electro-Funk Odyssey)* | **114** | Upbeat, Shimmering & Playful | Syncopated Four-Floor Funky Groove |
| **05** | `05_One_Cell_One_Future_Stadium_Anthem.mp3` | **One Cell, One Future** *(Peak-Time Stadium Anthem)* | **129** | Euphoric, Explosive & Maximum Energy | Pounding Stadium Kick with Rapid Snare Builds |
| **06** | `06_One_Cell_AI_Deep_Resonance.mp3` | **One Cell A.I.** *(Deep Neural Bass Resonance)* | **129** | Dark, Menacing & Precision Engineered | Heavy Sub-Bass 808s with Crisp Trap Hats |
| **07** | `06b_One_Cell_AI_Deep_Resonance_Dub.mp3` | **One Cell A.I.** *(Deep Resonance Dub Mix)* | **129** | Heavy, Hypnotic & Bass-Loaded | Staccato 808 Thump & Metallic Snare Snaps |
| **08** | `07_One_Cell_AI_Synthwave_Matrix.mp3` | **One Cell A.I.** *(Synthwave Matrix Drive)* | **129** | Nostalgic, Velocity-Driven & Retro | Relentless 16th-Note Bassline & Retro Electronic Kit |
| **09** | `08_One_Cell_Pure_Energy_Core.mp3` | **One Cell** *(Pure Energy Electro Core)* | **129** | Punchy, Direct & Dynamic | Compressed 4/4 Punch with Snappy Claps |
| **10** | `09_Single_Cell_Dawn_Solar_Groove.mp3` | **Single Cell Dawn** *(Solar Synth Groove)* | **99** | Warm, Hopeful, Sunny & Organic | Steady 99 BPM Mid-Tempo Pocket Groove |
| **11** | `10_Single_Cell_Dawn_Aurora_Flow.mp3` | **Single Cell Dawn** *(Aurora Ambient Flow)* | **101** | Ethereal, Floating & Majestic | Fluid Cinematic Beat with Ambient Reverb Splashes |

---

## 🌟 Architecture & Component Tree

Built with pure React component architecture:
- `src/App.jsx`: Global playback state, shuffle/repeat queue management, theme synchronization, hotkey listeners.
- `src/components/Header.jsx`: Branding, status indicator, background audio & wake lock toggle, shortcuts button.
- `src/components/VisualizerCanvas.jsx`: 5-mode Web Audio API canvas visualizer (Nebula, Liquid, Spectrum, Orbital, Radial) with 60/120 FPS requestAnimationFrame.
- `src/components/ActiveTrackHero.jsx`: Spinning holographic vinyl disc, active track badges, and metadata.
- `src/components/TrackIntelligence.jsx`: Acoustic breakdown drawer (BPM, genre, musical tone, beat type, description).
- `src/components/WaveformScrubber.jsx`: Interactive 70-bar audio waveform with real-time progress and seeking.
- `src/components/TransportControls.jsx`: Shuffle, repeat mode, previous, play/pause, next, speed selector, volume/mute.
- `src/components/Playlist.jsx`: Instant search, filter chips (`High-Energy`, `Focus & Flow`, `Chillout`, `Dark & Bass`, `Groovy`, `Synthwave`), and track cards with mini animated equalizers.
- `src/components/ShortcutsModal.jsx`: Modal for keyboard shortcuts and deep-dive track acoustic profiles.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Function |
|:---:|---|
| <kbd>Space</kbd> | Play / Pause |
| <kbd>→</kbd> / <kbd>L</kbd> | Next Track |
| <kbd>←</kbd> / <kbd>J</kbd> | Previous Track (or restart current track) |
| <kbd>S</kbd> | Toggle Shuffle Mode |
| <kbd>R</kbd> | Cycle Repeat Mode (All → One → Off) |
| <kbd>V</kbd> | Cycle Visualizer Engines |
| <kbd>F</kbd> | Fullscreen Visualizer |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Volume Up / Down |
| <kbd>M</kbd> | Mute / Unmute |
| <kbd>?</kbd> | Show Keyboard Shortcuts |
