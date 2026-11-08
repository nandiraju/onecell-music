import React from 'react';
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
              onClick={() => onFilterChange(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Track List */}
      <div className="playlist-tracks-scroll">
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
