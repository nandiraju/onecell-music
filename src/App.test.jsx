import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, within, waitFor } from '@testing-library/react';
import App from './App.jsx';
import { TRACKS_DATA } from './data/tracks.js';
import { trackUrl } from './utils/trackUrl.js';

afterEach(cleanup);

// Flush the microtask queue so audio.play()'s mocked resolved Promise (see
// src/test/setup.js) settles and its .then(() => setIsPlaying(true)) runs
// before we assert on play/pause state. Also fires the real browser's
// loadedmetadata event that a track change now waits for before calling
// play() (see pendingAutoplayRef in App.jsx) — jsdom never fires this on
// its own since it doesn't simulate media loading.
async function flush() {
  const audio = document.querySelector('audio');
  if (audio) fireEvent.loadedMetadata(audio);
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function heroTitle() {
  return document.querySelector('.track-hero-title').textContent;
}

function playPauseButton() {
  return screen.getByTitle(/^(Play|Pause) \(Space\)$/);
}

describe('App', () => {
  it('renders the full catalog and starts on the first track', () => {
    render(<App />);
    expect(screen.getByText(`${TRACKS_DATA.length} tracks`)).toBeInTheDocument();
    expect(heroTitle()).toBe(TRACKS_DATA[0].title);
    expect(document.querySelector('audio').getAttribute('src')).toBe(trackUrl(TRACKS_DATA[0].filename));
  });

  it('does not render the background-audio toggle or the waveform scrubber (removed to free up space)', () => {
    render(<App />);
    expect(document.querySelector('.floating-bg-audio-btn')).not.toBeInTheDocument();
    expect(document.querySelector('.waveform-scrubber-container')).not.toBeInTheDocument();
  });

  it('clicking play/pause calls audio.play()/pause() and flips the button title', async () => {
    render(<App />);
    const audio = document.querySelector('audio');

    act(() => { fireEvent.click(playPauseButton()); });
    await flush();
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(screen.getByTitle('Pause (Space)')).toBeInTheDocument();

    act(() => { fireEvent.click(screen.getByTitle('Pause (Space)')); });
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(screen.getByTitle('Play (Space)')).toBeInTheDocument();
  });

  it('Next/Prev transport buttons move through the catalog and wrap around', async () => {
    render(<App />);
    act(() => { fireEvent.click(screen.getByTitle('Next Track (L / →)')); });
    await flush();
    expect(heroTitle()).toBe(TRACKS_DATA[1].title);
    expect(document.querySelector('audio').getAttribute('src')).toBe(trackUrl(TRACKS_DATA[1].filename));

    act(() => { fireEvent.click(screen.getByTitle('Previous Track (J / ←)')); });
    await flush();
    expect(heroTitle()).toBe(TRACKS_DATA[0].title);

    // currentTime stays 0 under jsdom, so "previous" from the first track wraps to the last.
    act(() => { fireEvent.click(screen.getByTitle('Previous Track (J / ←)')); });
    await flush();
    expect(heroTitle()).toBe(TRACKS_DATA[TRACKS_DATA.length - 1].title);
  });

  describe('keyboard shortcuts', () => {
    it('Space toggles play/pause', async () => {
      render(<App />);
      act(() => { fireEvent.keyDown(window, { code: 'Space' }); });
      await flush();
      expect(screen.getByTitle('Pause (Space)')).toBeInTheDocument();
      act(() => { fireEvent.keyDown(window, { code: 'Space' }); });
      expect(screen.getByTitle('Play (Space)')).toBeInTheDocument();
    });

    it('ArrowRight/KeyL advance and ArrowLeft/KeyJ go back', async () => {
      render(<App />);
      act(() => { fireEvent.keyDown(window, { code: 'ArrowRight' }); });
      await flush();
      expect(heroTitle()).toBe(TRACKS_DATA[1].title);
      act(() => { fireEvent.keyDown(window, { code: 'KeyL' }); });
      await flush();
      expect(heroTitle()).toBe(TRACKS_DATA[2].title);
      act(() => { fireEvent.keyDown(window, { code: 'ArrowLeft' }); });
      await flush();
      expect(heroTitle()).toBe(TRACKS_DATA[1].title);
      act(() => { fireEvent.keyDown(window, { code: 'KeyJ' }); });
      await flush();
      expect(heroTitle()).toBe(TRACKS_DATA[0].title);
    });

    it('KeyS toggles shuffle mode and shows a toast', () => {
      render(<App />);
      act(() => { fireEvent.keyDown(window, { code: 'KeyS' }); });
      expect(screen.getByText('🔀 Shuffle Mode Enabled')).toBeInTheDocument();
      expect(screen.getByTitle('Toggle Shuffle (S)')).toHaveClass('active');

      act(() => { fireEvent.keyDown(window, { code: 'KeyS' }); });
      expect(screen.getByText('➡️ Sequential Playback Enabled')).toBeInTheDocument();
      expect(screen.getByTitle('Toggle Shuffle (S)')).not.toHaveClass('active');
    });

    it('KeyR cycles repeat mode all -> one -> off -> all', () => {
      render(<App />);
      expect(screen.getByTitle('Repeat: ALL (R)')).toBeInTheDocument();
      act(() => { fireEvent.keyDown(window, { code: 'KeyR' }); });
      expect(screen.getByTitle('Repeat: ONE (R)')).toBeInTheDocument();
      act(() => { fireEvent.keyDown(window, { code: 'KeyR' }); });
      expect(screen.getByTitle('Repeat: OFF (R)')).toBeInTheDocument();
      act(() => { fireEvent.keyDown(window, { code: 'KeyR' }); });
      expect(screen.getByTitle('Repeat: ALL (R)')).toBeInTheDocument();
    });

    it('KeyM mutes and restores the previous (non-default) volume', () => {
      render(<App />);
      const audio = document.querySelector('audio');
      expect(audio.volume).toBeCloseTo(0.85);

      // Move off the default first so a restore-to-default would be caught.
      act(() => { fireEvent.keyDown(window, { code: 'ArrowDown' }); });
      expect(audio.volume).toBeCloseTo(0.8);

      act(() => { fireEvent.keyDown(window, { code: 'KeyM' }); });
      expect(audio.volume).toBe(0);
      expect(screen.getByTitle('Mute / Unmute (M)').querySelector('.lucide-volume-x')).toBeInTheDocument();

      act(() => { fireEvent.keyDown(window, { code: 'KeyM' }); });
      expect(audio.volume).toBeCloseTo(0.8);
    });

    it('ArrowUp/ArrowDown adjust volume by 5%, clamped to [0, 100]', () => {
      render(<App />);
      const audio = document.querySelector('audio');
      expect(audio.volume).toBeCloseTo(0.85);

      act(() => { fireEvent.keyDown(window, { code: 'ArrowUp' }); });
      expect(audio.volume).toBeCloseTo(0.9);

      act(() => { fireEvent.keyDown(window, { code: 'ArrowDown' }); });
      act(() => { fireEvent.keyDown(window, { code: 'ArrowDown' }); });
      expect(audio.volume).toBeCloseTo(0.8);
    });

    it('KeyV cycles the visualizer mode (regression: shortcut was previously unwired)', () => {
      render(<App />);
      expect(screen.getByTitle('Glass Equalizer Pillars')).toHaveClass('active');
      act(() => { fireEvent.keyDown(window, { code: 'KeyV' }); });
      expect(screen.getByTitle('Cybernetic Pulsar Reactor')).toHaveClass('active');
      act(() => { fireEvent.keyDown(window, { code: 'KeyV' }); });
      expect(screen.getByTitle('360° Circular Soundwave')).toHaveClass('active');
    });

    it('KeyF requests fullscreen on the visualizer (regression: shortcut was previously unwired)', () => {
      render(<App />);
      const visualizer = document.querySelector('.visualizer-container');
      const requestFullscreenSpy = vi.fn().mockResolvedValue(undefined);
      visualizer.requestFullscreen = requestFullscreenSpy;

      act(() => { fireEvent.keyDown(window, { code: 'KeyF' }); });
      expect(requestFullscreenSpy).toHaveBeenCalledTimes(1);
    });

    it('maximize button in the bottom nav row (in line with Settings/Library) requests fullscreen', () => {
      render(<App />);
      const visualizer = document.querySelector('.visualizer-container');
      const requestFullscreenSpy = vi.fn().mockResolvedValue(undefined);
      visualizer.requestFullscreen = requestFullscreenSpy;

      expect(document.querySelector('.vis-fullscreen-nav-btn')).toBeInTheDocument();
      act(() => { fireEvent.click(screen.getByTitle('Fullscreen Visualizer (F)')); });
      expect(requestFullscreenSpy).toHaveBeenCalledTimes(1);
    });

    it('shortcuts are ignored while typing in the search box (Space must not toggle playback)', () => {
      render(<App />);
      const searchInput = screen.getByPlaceholderText('Search title, genre, BPM, tone...');
      searchInput.focus();

      act(() => { fireEvent.keyDown(searchInput, { code: 'Space' }); });

      expect(screen.getByTitle('Play (Space)')).toBeInTheDocument();
    });

    it('reaching the end of the playlist with repeat off shows a toast and stops', async () => {
      render(<App />);
      act(() => { fireEvent.keyDown(window, { code: 'KeyR' }); }); // all -> one
      act(() => { fireEvent.keyDown(window, { code: 'KeyR' }); }); // one -> off

      for (let i = 0; i < TRACKS_DATA.length - 1; i++) {
        act(() => { fireEvent.click(screen.getByTitle('Next Track (L / →)')); });
        await flush();
      }
      expect(heroTitle()).toBe(TRACKS_DATA[TRACKS_DATA.length - 1].title);

      act(() => { fireEvent.click(screen.getByTitle('Next Track (L / →)')); });
      expect(screen.getByText('Reached end of playlist')).toBeInTheDocument();
      expect(heroTitle()).toBe(TRACKS_DATA[TRACKS_DATA.length - 1].title);
    });
  });

  describe('search, selection and track theming', () => {
    it('searching for a unique track and clicking it selects the correct track, src, and theme color', async () => {
      const target = TRACKS_DATA[TRACKS_DATA.length - 1];
      render(<App />);

      act(() => {
        fireEvent.change(screen.getByPlaceholderText('Search title, genre, BPM, tone...'), {
          target: { value: target.version }
        });
      });

      const playlist = document.querySelector('.playlist-tracks-scroll');
      const matches = within(playlist).getAllByText(target.title);
      act(() => { fireEvent.click(matches[0]); });
      await flush();

      expect(heroTitle()).toBe(target.title);
      expect(document.querySelector('audio').getAttribute('src')).toBe(trackUrl(target.filename));
      expect(document.documentElement.style.getPropertyValue('--active-accent')).toBe(target.color);
    });

    it('opening a track info modal and pressing "Play This Song Now" selects it and closes the modal', async () => {
      render(<App />);
      const secondCard = document.querySelectorAll('.track-item-card')[1];
      act(() => { fireEvent.click(within(secondCard).getByTitle('View acoustic details')); });

      expect(screen.getByText(TRACKS_DATA[1].description)).toBeInTheDocument();

      act(() => { fireEvent.click(screen.getByText('Play This Song Now')); });
      expect(heroTitle()).toBe(TRACKS_DATA[1].title);
      // The modal plays a GSAP close tween before actually unmounting.
      await waitFor(() => {
        expect(screen.queryByText('Play This Song Now')).not.toBeInTheDocument();
      });
    });
  });
});
