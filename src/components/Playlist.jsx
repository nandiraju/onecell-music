import React, { useRef, useLayoutEffect, useEffect } from 'react';
import gsap from 'gsap';
import { ListMusic, Search, Info } from 'lucide-react';

export default function Playlist({
  tracks = [],
  currentTrackIndex,
  isPlaying,
  searchQuery,
  onSearchChange,
  currentFilter,
  onFilterChange,
  onSelectTrack,
  onOpenTrackModal
}) {
  const listRef = useRef(null);

  const filterChips = [
    { label: 'All', id: 'all' },
    { label: 'High-Energy', id: 'High-Energy' },
    { label: 'Focus & Flow', id: 'Focus' },
    { label: 'Chillout', id: 'Chillout' },
    { label: 'Dark & Bass', id: 'dark' },
    { label: 'Groovy', id: 'Groovy' },
    { label: 'Synthwave', id: 'Synthwave' }
  ];

  const filteredTracks = tracks.filter((t) => {
    const matchFilter =
      currentFilter === 'all' ||
      t.vibe.toLowerCase().includes(currentFilter.toLowerCase()) ||
      (currentFilter === 'dark' && t.vibe.toLowerCase().includes('dark'));

    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.version.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q) ||
      t.beat_type.toLowerCase().includes(q) ||
      t.key_tone.toLowerCase().includes(q) ||
      t.bpm.toString().includes(q);

    return matchFilter && matchSearch;
  });

  // Motion: whenever the filter/search criteria change — not just a
  // re-render for some other reason (e.g. selecting a track) — give the
  // resulting list a buttery staggered reveal instead of a flat snap.
  useLayoutEffect(() => {
    const cards = listRef.current?.querySelectorAll('.track-item-card');
    if (!cards || !cards.length) return;
    gsap.fromTo(
      cards,
      { opacity: 0, y: 16, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: 'power3.out',
        stagger: { each: 0.035, from: 'start' },
        overwrite: true
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilter, searchQuery]);

  // Motion: a quick spring pulse on whichever card just became active, so
  // picking a track (from here or from the Now Playing screen) reads as a
  // deliberate, physical selection rather than an instant CSS color swap.
  useEffect(() => {
    const active = listRef.current?.querySelector('.track-item-card.active');
    if (!active) return;
    gsap.fromTo(
      active,
      { scale: 1.05 },
      { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.55)', overwrite: true }
    );
  }, [currentTrackIndex]);

  return (
    <aside className="playlist-panel">
      {/* Header & Search */}
      <div className="playlist-header">
        <div className="playlist-title-row">
          <span className="playlist-title">
            <ListMusic size={16} />
            Neural Track Catalog
          </span>
          <span className="playlist-count">{tracks.length} tracks</span>
        </div>

        {/* Search */}
        <div className="search-box-wrap">
          <Search className="search-icon" size={14} />
          <input
            id="search-tracks"
            name="search"
            aria-label="Search tracks"
            type="text"
            className="search-input"
            placeholder="Search title, genre, BPM, tone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter chips */}
        <div className="filter-chips-row">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              className={`filter-chip ${currentFilter === chip.id ? 'active' : ''}`}
              onClick={(e) => {
                onFilterChange(chip.id);
                gsap.fromTo(
                  e.currentTarget,
                  { scale: 0.88 },
                  { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)', overwrite: true }
                );
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Track List */}
      <div className="playlist-tracks-scroll" ref={listRef}>
        {filteredTracks.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No songs match your search or filter.
          </div>
        ) : (
          filteredTracks.map((track) => {
            const actualIndex = tracks.findIndex((t) => t.id === track.id);
            const isCurrent = actualIndex === currentTrackIndex;

            return (
              <div
                key={track.id}
                className={`track-item-card ${isCurrent ? 'active' : ''}`}
                onClick={() => onSelectTrack(actualIndex)}
              >
                <div className="track-num-eq">
                  {isCurrent && isPlaying ? (
                    <div className="mini-eq">
                      <div className="eq-bar"></div>
                      <div className="eq-bar"></div>
                      <div className="eq-bar"></div>
                    </div>
                  ) : (
                    <span className="track-num-text">
                      {String(actualIndex + 1).padStart(2, '0')}
                    </span>
                  )}
                </div>

                <div className="track-item-details">
                  <div className="track-item-top">
                    <span className="track-item-title">{track.title}</span>
                  </div>
                  <div className="track-item-version">{track.version}</div>
                  <div className="track-item-meta-row">
                    <span className="mini-badge mini-badge-bpm">{track.bpm} BPM</span>
                    <span className="mini-badge mini-badge-genre">{track.genre}</span>
                  </div>
                </div>

                <div className="track-item-side">
                  <span className="track-item-duration">{track.duration}</span>
                  <button
                    className="track-item-info-btn"
                    title="View acoustic details"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTrackModal(track);
                    }}
                  >
                    <Info size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

