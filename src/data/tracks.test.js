import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';
import { TRACKS_DATA } from './tracks.js';

const PUBLIC_DIR = resolve(__dirname, '../../public');

// This file guards exactly the bug class we've hit twice already:
// a track added to the catalog with no matching mp3 in public/, or an mp3
// copied into public/ that never got a catalog entry (so it's unreachable
// from the UI). Every assertion here should fail loudly if that happens again.

describe('TRACKS_DATA integrity', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(TRACKS_DATA)).toBe(true);
    expect(TRACKS_DATA.length).toBeGreaterThan(0);
  });

  it('has a unique, non-empty id for every track', () => {
    const ids = TRACKS_DATA.map((t) => t.id);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a unique filename for every track (no two tracks point at the same audio file)', () => {
    const filenames = TRACKS_DATA.map((t) => t.filename);
    expect(new Set(filenames).size).toBe(filenames.length);
  });

  it.each(TRACKS_DATA.map((t) => [t.id, t.filename]))(
    '%s: audio file "%s" exists in public/ and is non-empty',
    (_id, filename) => {
      const filePath = resolve(PUBLIC_DIR, filename);
      expect(existsSync(filePath), `missing public/${filename}`).toBe(true);
      expect(statSync(filePath).size).toBeGreaterThan(0);
    }
  );

  it('every public/*.mp3 file is referenced by at least one track (no orphaned audio)', async () => {
    const { readdirSync } = await import('fs');
    const mp3Files = readdirSync(PUBLIC_DIR).filter((f) => f.toLowerCase().endsWith('.mp3'));
    const referenced = new Set(TRACKS_DATA.map((t) => t.filename));
    const orphaned = mp3Files.filter((f) => !referenced.has(f));
    expect(orphaned, `orphaned mp3s in public/ not in any track's filename: ${orphaned.join(', ')}`).toEqual([]);
  });

  const REQUIRED_STRING_FIELDS = [
    'title', 'version', 'artist', 'genre', 'key_tone', 'beat_type', 'vibe',
    'color', 'accent', 'description', 'duration', 'filename'
  ];

  it.each(TRACKS_DATA.map((t) => [t.id, t]))('%s: has all required non-empty string fields', (_id, track) => {
    for (const field of REQUIRED_STRING_FIELDS) {
      expect(typeof track[field], `${field} should be a string`).toBe('string');
      expect(track[field].length, `${field} should not be empty`).toBeGreaterThan(0);
    }
  });

  const KNOWN_VIBES = ['High-Energy', 'Focus & Flow', 'Chillout', 'Dark & Bass', 'Groovy', 'Synthwave'];
  it.each(TRACKS_DATA.map((t) => [t.id, t.vibe]))('%s: vibe "%s" is filterable by a known playlist chip', (_id, vibe) => {
    const matchesKnownChip = KNOWN_VIBES.some((known) =>
      vibe.toLowerCase().includes(known.toLowerCase().split(' ')[0].toLowerCase())
    );
    expect(matchesKnownChip, `vibe "${vibe}" doesn't match any filter chip in Playlist.jsx`).toBe(true);
  });

  const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
  it.each(TRACKS_DATA.map((t) => [t.id, t]))('%s: color and accent are valid hex colors', (_id, track) => {
    expect(track.color).toMatch(HEX_COLOR_RE);
    expect(track.accent).toMatch(HEX_COLOR_RE);
  });

  it.each(TRACKS_DATA.map((t) => [t.id, t]))('%s: bpm and duration_seconds are positive numbers', (_id, track) => {
    expect(typeof track.bpm).toBe('number');
    expect(track.bpm).toBeGreaterThan(0);
    expect(typeof track.duration_seconds).toBe('number');
    expect(track.duration_seconds).toBeGreaterThan(0);
  });

  it.each(TRACKS_DATA.map((t) => [t.id, t]))('%s: duration string "mm:ss" matches duration_seconds within 1s', (_id, track) => {
    const match = /^(\d+):(\d{2})$/.exec(track.duration);
    expect(match, `duration "${track.duration}" is not in mm:ss format`).not.toBeNull();
    const [, mins, secs] = match;
    const totalSeconds = Number(mins) * 60 + Number(secs);
    expect(Math.abs(totalSeconds - Math.floor(track.duration_seconds))).toBeLessThanOrEqual(1);
  });

  it.each(TRACKS_DATA.map((t) => [t.id, t]))('%s: waveform is a non-empty array of numbers between 0 and 1', (_id, track) => {
    expect(Array.isArray(track.waveform)).toBe(true);
    expect(track.waveform.length).toBeGreaterThan(0);
    for (const v of track.waveform) {
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
