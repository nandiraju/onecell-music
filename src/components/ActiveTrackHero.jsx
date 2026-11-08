import React from 'react';
import { Zap, Music, Sparkles } from 'lucide-react';

export default function ActiveTrackHero({ track, isPlaying }) {
  if (!track) return null;

  return (
    <div className="track-hero-row">
      <div className="artwork-container">
        <div className={`hologram-disc ${isPlaying ? 'playing' : ''}`}>
          <div className="disc-ring r1"></div>
          <div className="disc-ring r2"></div>
          <div className="disc-center">
            <div className="disc-hole"></div>
          </div>
        </div>
      </div>

      <div className="track-hero-meta">
        <div className="track-hero-tags">
          <span className="pill-badge badge-bpm">
            <Zap size={12} /> {track.bpm} BPM
          </span>
          <span className="pill-badge badge-genre">
            <Music size={12} /> {track.genre}
          </span>
          <span className="pill-badge badge-vibe">
            <Sparkles size={12} /> {track.vibe}
          </span>
        </div>
        
        <h2 className="track-hero-title">{track.title}</h2>
        <div className="track-hero-version">{track.version}</div>
      </div>

      <img src="/1cell-logo.svg" alt="1Cell AI" className="track-hero-logo" />
    </div>
  );
}

