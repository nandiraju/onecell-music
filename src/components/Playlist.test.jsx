import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Playlist from './Playlist.jsx';

afterEach(cleanup);

const FIXTURE_TRACKS = [
  { id: 't-1', title: 'Alpha Pulse', version: 'Radio Edit', genre: 'Techno', bpm: 128, beat_type: 'Four on the floor', key_tone: 'Bright', vibe: 'High-Energy', duration: '3:00' },
  { id: 't-2', title: 'Beta Flow', version: 'Extended Mix', genre: 'Tech House', bpm: 124, beat_type: 'Rolling groove', key_tone: 'Focused', vibe: 'Focus & Flow', duration: '4:10' },
  { id: 't-3', title: 'Gamma Rest', version: 'Ambient Mix', genre: 'Downtempo', bpm: 80, beat_type: 'Soft pulse', key_tone: 'Calm', vibe: 'Chillout', duration: '2:45' },
  { id: 't-4', title: 'Delta Drop', version: 'VIP Mix', genre: 'Trap', bpm: 140, beat_type: '808 heavy', key_tone: 'Menacing', vibe: 'Dark & Bass', duration: '3:20' },
  { id: 't-5', title: 'Epsilon Groove', version: 'Club Mix', genre: 'Funk', bpm: 112, beat_type: 'Syncopated', key_tone: 'Playful', vibe: 'Groovy', duration: '3:35' },
  { id: 't-6', title: 'Zeta Drive', version: 'Night Mix', genre: 'Synthwave', bpm: 132, beat_type: 'Arpeggiated', key_tone: 'Retro', vibe: 'Synthwave', duration: '2:50' }
];

function setup(overrides = {}) {
  const props = {
    tracks: FIXTURE_TRACKS,
    currentTrackIndex: 0,
    isPlaying: false,
    searchQuery: '',
    onSearchChange: vi.fn(),
    currentFilter: 'all',
    onFilterChange: vi.fn(),
    onSelectTrack: vi.fn(),
    onOpenTrackModal: vi.fn(),
    ...overrides
  };
  const utils = render(<Playlist {...props} />);
  return { ...utils, props };
}

describe('Playlist', () => {
  it('shows the total track count', () => {
    setup();
    expect(screen.getByText('6 tracks')).toBeInTheDocument();
  });

  it('renders every track when filter is "all" and query is empty', () => {
    const { container } = setup();
    expect(container.querySelectorAll('.track-item-card')).toHaveLength(6);
  });

  it('filters by title substring, case-insensitively', () => {
    const { container } = setup({ searchQuery: 'alpha' });
    const cards = container.querySelectorAll('.track-item-card');
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent('Alpha Pulse');
  });

  it('filters by genre, version, key_tone, beat_type, and bpm substrings', () => {
    expect(setup({ searchQuery: 'tech house' }).container.querySelectorAll('.track-item-card')).toHaveLength(1);
    expect(setup({ searchQuery: 'vip mix' }).container.querySelectorAll('.track-item-card')).toHaveLength(1);
    expect(setup({ searchQuery: 'menacing' }).container.querySelectorAll('.track-item-card')).toHaveLength(1);
    expect(setup({ searchQuery: '808 heavy' }).container.querySelectorAll('.track-item-card')).toHaveLength(1);
    expect(setup({ searchQuery: '132' }).container.querySelectorAll('.track-item-card')).toHaveLength(1);
  });

  it('shows the empty state when nothing matches', () => {
    setup({ searchQuery: 'nonexistent-song-xyz' });
    expect(screen.getByText('No songs match your search or filter.')).toBeInTheDocument();
  });

  it.each([
    ['High-Energy', 'Alpha Pulse'],
    ['Focus', 'Beta Flow'],
    ['Chillout', 'Gamma Rest'],
    ['dark', 'Delta Drop'],
    ['Groovy', 'Epsilon Groove'],
    ['Synthwave', 'Zeta Drive']
  ])('filter chip id "%s" isolates the matching vibe track', (chipId, expectedTitle) => {
    const { container } = setup({ currentFilter: chipId });
    const cards = container.querySelectorAll('.track-item-card');
    expect(cards).toHaveLength(1);
    expect(cards[0]).toHaveTextContent(expectedTitle);
  });

  it('search and filter combine with AND semantics', () => {
    const { container } = setup({ currentFilter: 'High-Energy', searchQuery: 'gamma' });
    expect(container.querySelectorAll('.track-item-card')).toHaveLength(0);
    expect(screen.getByText('No songs match your search or filter.')).toBeInTheDocument();
  });

  it('clicking a filter chip calls onFilterChange with its id', () => {
    const { props } = setup();
    fireEvent.click(screen.getByText('Dark & Bass'));
    expect(props.onFilterChange).toHaveBeenCalledWith('dark');
  });

  it('typing in the search box calls onSearchChange', () => {
    const { props } = setup();
    fireEvent.change(screen.getByPlaceholderText('Search title, genre, BPM, tone...'), { target: { value: 'delta' } });
    expect(props.onSearchChange).toHaveBeenCalledWith('delta');
  });

  it('clicking a track card selects it by its index in the UNFILTERED tracks array', () => {
    // Regression guard: after filtering, the visible list is reordered/shortened,
    // but onSelectTrack must still receive the index into the original tracks array.
    const { props } = setup({ searchQuery: 'delta' }); // only "Delta Drop" (index 3) is visible
    fireEvent.click(screen.getByText('Delta Drop'));
    expect(props.onSelectTrack).toHaveBeenCalledWith(3);
  });

  it('clicking the info button opens the track modal without selecting the track', () => {
    const { props, container } = setup();
    const firstCard = container.querySelectorAll('.track-item-card')[0];
    fireEvent.click(firstCard.querySelector('.track-item-info-btn'));
    expect(props.onOpenTrackModal).toHaveBeenCalledWith(FIXTURE_TRACKS[0]);
    expect(props.onSelectTrack).not.toHaveBeenCalled();
  });

  it('marks the currently playing track active and shows the mini equalizer instead of its number', () => {
    const { container } = setup({ currentTrackIndex: 2, isPlaying: true });
    const cards = container.querySelectorAll('.track-item-card');
    expect(cards[2]).toHaveClass('active');
    expect(cards[2].querySelector('.mini-eq')).toBeInTheDocument();
    expect(cards[0].querySelector('.mini-eq')).not.toBeInTheDocument();
    expect(cards[0]).toHaveTextContent('01');
  });

  it('does not show the mini equalizer on the active track when paused', () => {
    const { container } = setup({ currentTrackIndex: 2, isPlaying: false });
    expect(container.querySelectorAll('.track-item-card')[2].querySelector('.mini-eq')).not.toBeInTheDocument();
  });
});
