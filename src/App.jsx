import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ListMusic, Disc3, Settings as SettingsIcon, Maximize2 } from 'lucide-react';
import { TRACKS_DATA } from './data/tracks.js';
import { trackUrl } from './utils/trackUrl.js';
import VisualizerCanvas from './components/VisualizerCanvas.jsx';
import ActiveTrackHero from './components/ActiveTrackHero.jsx';
import TransportControls from './components/TransportControls.jsx';
import Playlist from './components/Playlist.jsx';
import ShortcutsModal from './components/ShortcutsModal.jsx';
import SettingsScreen, { COLOR_SCHEME_OPTIONS } from './components/SettingsScreen.jsx';
import IntroSplash from './components/IntroSplash.jsx';

const SETTINGS_STORAGE_KEY = '1cell-settings';
const DEFAULT_SETTINGS = { visualizerMode: 'spectrum', colorScheme: 'auto' };

function loadSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.warn('Could not read saved settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [introForce, setIntroForce] = useState(false);
  const [tracks] = useState(TRACKS_DATA);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('all'); // 'all', 'one', 'off'
  const [volume, setVolume] = useState(0.85);
  const [lastVolume, setLastVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Screen navigation: Now Playing <-> Library/Settings, each its own 3D cube face
  const [activeScreen, setActiveScreen] = useState('player'); // 'player' | 'library' | 'settings'
  const [isCubeAnimating, setIsCubeAnimating] = useState(false);

  // User preferences, persisted to localStorage
  const [settings, setSettings] = useState(loadSettings);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');

  // Modal & Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Audio & Wake Lock Refs
  const audioRef = useRef(null);
  const visualizerRef = useRef(null);
  const shuffleQueueRef = useRef([]);
  const shufflePointerRef = useRef(0);
  const toastTimerRef = useRef(null);
  const cubeTimerRef = useRef(null);
  const pendingAutoplayRef = useRef(false);

  const currentTrack = tracks[currentIndex] || tracks[0];

  // Switch between the "Now Playing" and "Library" screens, on any viewport
  // size. The cube's rotation is driven purely declaratively (a CSS class +
  // `transition: transform` on .cube, see index.css) — activeScreen flips
  // immediately so the class/transform target updates right away and the
  // browser animates to it on its own; isCubeAnimating just tracks when
  // that's in flight so the nav button and face interactivity stay locked
  // until it settles.
  const switchScreen = useCallback((target) => {
    if (isCubeAnimating || target === activeScreen) return;
    setIsCubeAnimating(true);
    setActiveScreen(target);

    // Safety fallback: if transitionEnd fails to fire (e.g. background tab or reduced motion),
    // ensure cube animation lock is released.
    if (cubeTimerRef.current) clearTimeout(cubeTimerRef.current);
    cubeTimerRef.current = setTimeout(() => {
      setIsCubeAnimating(false);
    }, 1000);
  }, [isCubeAnimating, activeScreen]);

  // Re-run the boot splash on demand (Settings > About). The cube is hidden
  // underneath the full-screen intro overlay regardless of which face is
  // active, so this just lands back on Player for when it reveals the app.
  const handleReplayIntro = useCallback(() => {
    if (cubeTimerRef.current) clearTimeout(cubeTimerRef.current);
    setIsCubeAnimating(false);
    setActiveScreen('player');
    setIntroForce(true);
    setShowIntro(true);
  }, []);

  // Show Toast
  const showToast = useCallback((msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 2400);
  }, []);

  // Handle audio error gracefully
  const handleAudioError = useCallback(() => {
    setIsPlaying(false);
    showToast('⚠️ Could not load or decode audio track');
  }, [showToast]);

  // `volume` has no HTML content attribute (unlike `muted`) — it's a
  // pure IDL property, so it must be pushed onto the element imperatively.
  // Without this, the <audio> element silently stays at its native default
  // (100%) until the user's first mute/keyboard-volume interaction.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Theme update — per-track color unless the user picked a fixed scheme
  // in Settings, in which case that scheme always wins over the track's own colors.
  useEffect(() => {
    if (!currentTrack) return;
    const scheme = COLOR_SCHEME_OPTIONS.find((s) => s.id === settings.colorScheme);
    const primary = (scheme && scheme.primary) || currentTrack.color || '#00f0ff';
    const secondary = (scheme && scheme.secondary) || currentTrack.accent || '#7000ff';

    document.documentElement.style.setProperty('--active-accent', primary);
    document.documentElement.style.setProperty('--active-secondary', secondary);
    document.documentElement.style.setProperty(
      '--active-glow',
      hexToRgba(primary, 0.4)
    );
  }, [currentTrack, settings.colorScheme]);

  // Persist settings and keep the already-mounted visualizer's live mode in
  // sync whenever the user changes it from the Settings screen.
  const handleChangeVisualizerMode = useCallback((mode) => {
    setSettings((prev) => {
      const next = { ...prev, visualizerMode: mode };
      try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Could not save settings:', e);
      }
      return next;
    });
    visualizerRef.current?.setMode(mode);
  }, []);

  const handleChangeColorScheme = useCallback((schemeId) => {
    setSettings((prev) => {
      const next = { ...prev, colorScheme: schemeId };
      try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Could not save settings:', e);
      }
      return next;
    });
  }, []);

  // Build Shuffle Queue
  const buildShuffleQueue = useCallback((startIdx) => {
    const indices = tracks.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const currPos = indices.indexOf(startIdx);
    if (currPos > -1) {
      indices.splice(currPos, 1);
      indices.unshift(startIdx);
    }
    shuffleQueueRef.current = indices;
    shufflePointerRef.current = 0;
  }, [tracks]);

  // Audio Play / Pause
  const playAudio = useCallback(() => {
    if (!audioRef.current) return;
    const promise = audioRef.current.play();
    if (promise !== undefined) {
      promise
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback prevented by browser policy, user interaction needed:', err);
          setIsPlaying(false);
        });
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }, [isPlaying, playAudio, pauseAudio]);

  // Play Track by Index
  const selectTrack = useCallback((index, autoPlay = true) => {
    if (index < 0) index = tracks.length - 1;
    if (index >= tracks.length) index = 0;

    setCurrentIndex(index);
    setCurrentTime(0);

    if (audioRef.current) {
      // Assigning `.src` alone (even with no explicit `.load()` call)
      // already kicks off the browser's internal resource-selection
      // algorithm for the new source. Calling `.play()` synchronously right
      // after races that in-flight algorithm and gets rejected with
      // "AbortError: the play() request was interrupted by a new load
      // request" — confirmed live, this is exactly what was silently
      // swallowed by playAudio()'s catch and made Next/Prev/auto-advance
      // look like they "did nothing" until Play was clicked by hand.
      // Fix: don't call play() until the browser actually confirms the new
      // source is ready — the onLoadedMetadata handler below flips
      // pendingAutoplayRef and fires playAudio() at that point instead.
      audioRef.current.src = trackUrl(tracks[index].filename);
      if (autoPlay) {
        pendingAutoplayRef.current = true;
      } else {
        pendingAutoplayRef.current = false;
        pauseAudio();
      }
    }
  }, [tracks, pauseAudio]);

  // Next Track
  const playNextTrack = useCallback(() => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        playAudio();
      }
      return;
    }

    if (isShuffle) {
      shufflePointerRef.current++;
      if (shufflePointerRef.current >= shuffleQueueRef.current.length) {
        if (repeatMode === 'all') {
          buildShuffleQueue(currentIndex);
        } else {
          pauseAudio();
          showToast('Shuffle playlist finished');
          return;
        }
      }
      const nextIdx = shuffleQueueRef.current[shufflePointerRef.current];
      selectTrack(nextIdx, true);
    } else {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= tracks.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          pauseAudio();
          showToast('Reached end of playlist');
          return;
        }
      }
      selectTrack(nextIndex, true);
    }
  }, [repeatMode, isShuffle, currentIndex, tracks.length, selectTrack, buildShuffleQueue, playAudio, pauseAudio, showToast]);

  // Previous Track
  const playPrevTrack = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3.0) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (isShuffle) {
      shufflePointerRef.current = Math.max(0, shufflePointerRef.current - 1);
      selectTrack(shuffleQueueRef.current[shufflePointerRef.current], true);
    } else {
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) prevIndex = tracks.length - 1;
      selectTrack(prevIndex, true);
    }
  }, [isShuffle, currentIndex, tracks.length, selectTrack]);

  // Shuffle Toggle
  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      if (next) {
        buildShuffleQueue(currentIndex);
        showToast('🔀 Shuffle Mode Enabled');
      } else {
        showToast('➡️ Sequential Playback Enabled');
      }
      return next;
    });
  }, [buildShuffleQueue, currentIndex, showToast]);

  // Cycle Repeat Mode
  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'all') {
        showToast('🔂 Repeat One (Current Track)');
        return 'one';
      }
      if (prev === 'one') {
        showToast('⏹️ Repeat Off (Stop at End)');
        return 'off';
      }
      showToast('🔁 Repeat All (Loop Playlist)');
      return 'all';
    });
  }, [showToast]);

  // Volume & Mute
  const handleVolumeChange = useCallback((newVol) => {
    setVolume(newVol);
    // Only remember non-zero levels — muting calls this with 0, and it must
    // not clobber the level toggleMute is about to restore on unmute.
    if (newVol > 0) setLastVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      setLastVolume(volume);
      handleVolumeChange(0);
    } else {
      handleVolumeChange(lastVolume || 0.85);
    }
  }, [volume, lastVolume, handleVolumeChange]);

  // Lock-screen / OS media-control seek (Control Center, keyboard media keys)
  const handleSeek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  // Scrubber drag — mirrors handleSeek but also updates currentTime
  // immediately so the thumb tracks the finger/cursor without waiting for
  // the next native timeupdate tick (~every 250ms).
  const handleScrub = useCallback((time) => {
    setCurrentTime(time);
    handleSeek(time);
  }, [handleSeek]);

  // MediaSession API for macOS lock screen, keyboard media keys, AirPods
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${currentTrack.title} (${currentTrack.version})`,
        artist: currentTrack.artist || '1Cell AI Audio Lab',
        album: '1Cell AI Future Collection (React)',
        artwork: [
          {
            src: `${typeof window !== "undefined" ? window.location.origin : ""}/1cell-logo.svg`,
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => playAudio());
      navigator.mediaSession.setActionHandler('pause', () => pauseAudio());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) handleSeek(details.seekTime);
      });
    }
  }, [currentTrack, playAudio, pauseAudio, playPrevTrack, playNextTrack, handleSeek]);

  // Keep the OS media-control surface (Control Center, Android notification,
  // lock screen) in sync with actual playback state — some mobile browsers
  // use this to decide whether background audio stays eligible to keep
  // running at all, not just what icon to show.
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Screen Wake Lock — keeps the display from auto-dimming/auto-locking
  // while a track is playing, which is the only part of "plays through a
  // phone lock" actually within a web page's control: it can't override a
  // manual power-button press, and whether audio itself survives a locked
  // screen or backgrounded tab from there is down to the OS/browser (helped
  // by the MediaSession wiring above, which marks this as a real media
  // session rather than a page that just happens to have an <audio> tag).
  useEffect(() => {
    if (!('wakeLock' in navigator)) return undefined;
    let wakeLockSentinel = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          sentinel.release();
          return;
        }
        wakeLockSentinel = sentinel;
      } catch (e) {
        // Permission denied / not allowed in this context — nothing to do.
      }
    };

    const handleVisibilityChange = () => {
      // The OS releases the lock whenever the tab is backgrounded; if
      // playback is still going when it becomes visible again, grab it
      // back rather than leaving the screen free to sleep.
      if (document.visibilityState === 'visible' && isPlaying && !wakeLockSentinel) {
        acquire();
      }
    };

    if (isPlaying) acquire();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockSentinel) wakeLockSentinel.release()?.catch?.(() => {});
    };
  }, [isPlaying]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['input', 'textarea'].includes(document.activeElement?.tagName.toLowerCase())) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
        case 'KeyL':
          e.preventDefault();
          playNextTrack();
          break;
        case 'ArrowLeft':
        case 'KeyJ':
          e.preventDefault();
          playPrevTrack();
          break;
        case 'KeyS':
          toggleShuffle();
          break;
        case 'KeyR':
          cycleRepeatMode();
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyV':
          visualizerRef.current?.cycleMode();
          break;
        case 'KeyF':
          e.preventDefault();
          visualizerRef.current?.toggleFullscreen();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.05));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, playNextTrack, playPrevTrack, toggleShuffle, cycleRepeatMode, toggleMute, volume, handleVolumeChange]);

  return (
    <>
      {showIntro && (
        <IntroSplash
          force={introForce}
          onComplete={() => { setShowIntro(false); setIntroForce(false); }}
        />
      )}
      <div className="app-container">
      {/* Dynamic Ambient Background Glow */}
      <div className="ambient-glow" />

      {/* HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={trackUrl(currentTrack.filename)}
        preload="metadata"
        crossOrigin="anonymous"
        onError={handleAudioError}
        onEnded={playNextTrack}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration || 0);
          if (pendingAutoplayRef.current) {
            pendingAutoplayRef.current = false;
            playAudio();
          }
        }}
      />

      {/* Main Dashboard */}
      <main className="dashboard-grid">

        {/* These three panes are faces of a 3D cube, on every viewport size
            — only one is ever shown at a time. Library sits to the cube's
            right (cube rotates -90 to reach it), Settings to its left
            (cube rotates +90) — both are only ever one hop from Player, so
            the cube never has to spin past a third face to get anywhere.
            The rotation is pure CSS (transition: transform on .cube);
            toggling the .cube--to-library / .cube--to-settings class is
            the only thing JS ever does to it. */}
        <div className="cube-viewport">
          <div
            className={`cube ${activeScreen === 'library' ? 'cube--to-library' : ''} ${activeScreen === 'settings' ? 'cube--to-settings' : ''}`}
            onTransitionEnd={(e) => {
              if (e.target === e.currentTarget && e.propertyName === 'transform') {
                if (cubeTimerRef.current) clearTimeout(cubeTimerRef.current);
                setIsCubeAnimating(false);
              }
            }}
          >

            <div
              className={`cube-face cube-face--player ${!isCubeAnimating && activeScreen !== 'player' ? 'cube-face--settled-back' : ''}`}
              inert={isCubeAnimating || activeScreen !== 'player'}
            >
              {/* Visualizer Stage */}
              <section className="stage-card">
                <VisualizerCanvas
                  ref={visualizerRef}
                  audioRef={audioRef}
                  isPlaying={isPlaying}
                  accentColor={currentTrack.color}
                  secondaryColor={currentTrack.accent}
                  defaultMode={settings.visualizerMode}
                />

                <div className="active-track-panel">
                  <ActiveTrackHero track={currentTrack} isPlaying={isPlaying} />

                  <TransportControls
                    isPlaying={isPlaying}
                    isShuffle={isShuffle}
                    repeatMode={repeatMode}
                    volume={volume}
                    onTogglePlayPause={togglePlayPause}
                    onPlayNext={playNextTrack}
                    onPlayPrev={playPrevTrack}
                    onToggleShuffle={toggleShuffle}
                    onCycleRepeat={cycleRepeatMode}
                    onToggleMute={toggleMute}
                  />

                  <div className="seek-bar-wrap">
                    <input
                      type="range"
                      className="seek-slider"
                      aria-label="Seek"
                      title="Seek"
                      min="0"
                      max={duration || 0}
                      step="0.01"
                      value={Math.min(currentTime, duration || 0)}
                      onChange={(e) => handleScrub(parseFloat(e.target.value))}
                      style={{
                        background: (() => {
                          const pct = duration ? (Math.min(currentTime, duration) / duration) * 100 : 0;
                          return `linear-gradient(to right, var(--active-accent) ${pct}%, rgba(255, 255, 255, 0.15) ${pct}%)`;
                        })()
                      }}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div
              className={`cube-face cube-face--library ${!isCubeAnimating && activeScreen !== 'library' ? 'cube-face--settled-back' : ''}`}
              inert={isCubeAnimating || activeScreen !== 'library'}
            >
              {/* Track Library */}
              <Playlist
                tracks={tracks}
                currentTrackIndex={currentIndex}
                isPlaying={isPlaying}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                currentFilter={currentFilter}
                onFilterChange={setCurrentFilter}
                onSelectTrack={(idx) => selectTrack(idx, true)}
                onOpenTrackModal={(track) => {
                  setModalData(track);
                  setIsModalOpen(true);
                }}
              />
            </div>

            <div
              className={`cube-face cube-face--settings ${!isCubeAnimating && activeScreen !== 'settings' ? 'cube-face--settled-back' : ''}`}
              inert={isCubeAnimating || activeScreen !== 'settings'}
            >
              <SettingsScreen
                settings={settings}
                onChangeVisualizerMode={handleChangeVisualizerMode}
                onChangeColorScheme={handleChangeColorScheme}
                onReplayIntro={handleReplayIntro}
              />
            </div>

          </div>
        </div>

      </main>

      {/* Floating nav: hop between the Now Playing, Library and Settings
          cube faces. Library/Settings only ever lead back to Player. */}
      {activeScreen === 'player' ? (
        <>
          <button
            className="view-nav-btn"
            onClick={() => switchScreen('library')}
            disabled={isCubeAnimating}
            title="View track library"
          >
            <ListMusic size={16} /> Library
          </button>
          <button
            className="settings-nav-btn"
            onClick={() => switchScreen('settings')}
            disabled={isCubeAnimating}
            title="Settings"
          >
            <SettingsIcon size={16} />
          </button>
          <button
            className="vis-fullscreen-nav-btn"
            onClick={() => visualizerRef.current?.toggleFullscreen()}
            title="Fullscreen Visualizer (F)"
          >
            <Maximize2 size={16} />
          </button>
        </>
      ) : (
        <button
          className="view-nav-btn"
          onClick={() => switchScreen('player')}
          disabled={isCubeAnimating}
          title="Back to Now Playing"
        >
          <Disc3 size={16} /> Now Playing
        </button>
      )}

      {/* Interactive Modal */}
      <ShortcutsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalData={modalData}
        onPlayTrack={(track) => {
          const idx = tracks.findIndex((t) => t.id === track.id);
          if (idx !== -1) selectTrack(idx, true);
        }}
      />

      {/* Toast Notice */}
      <div className={`toast-notice ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>
      </div>
    </>
  );
}

function hexToRgba(hex, alpha) {
  let c = (hex || '#00f0ff').replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

