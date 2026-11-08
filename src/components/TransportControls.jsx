import React from 'react';
import { 
  Shuffle, 
  Repeat, 
  Repeat1, 
  SkipBack, 
  SkipForward, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX 
} from 'lucide-react';

export default function TransportControls({
  isPlaying,
  isShuffle,
  repeatMode,
  playbackRate,
  volume,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrev,
  onToggleShuffle,
  onCycleRepeat,
  onCycleSpeed,
  onVolumeChange,
  onToggleMute
}) {
  return (
    <div className="controls-dock">
      
      {/* Left controls */}
      <div className="dock-left">
        <button
          className={`ctrl-btn ${isShuffle ? 'active' : ''}`}
          onClick={onToggleShuffle}
          title="Toggle Shuffle (S)"
        >
          <Shuffle size={18} />
        </button>

        <button
          className={`ctrl-btn ${repeatMode !== 'off' ? 'active' : ''}`}
          onClick={onCycleRepeat}
          title={`Repeat: ${repeatMode.toUpperCase()} (R)`}
        >
          {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
        </button>
      </div>

      {/* Center Primary Transport */}
      <div className="dock-center">
        <button
          className="ctrl-btn"
          onClick={onPlayPrev}
          title="Previous Track (J / ←)"
        >
          <SkipBack size={18} fill="currentColor" />
        </button>

        <button
          className="play-pause-btn"
          onClick={onTogglePlayPause}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" style={{ marginLeft: '2px' }} />
          )}
        </button>

        <button
          className="ctrl-btn"
          onClick={onPlayNext}
          title="Next Track (L / →)"
        >
          <SkipForward size={18} fill="currentColor" />
        </button>
      </div>

      {/* Right Volume & Speed Controls */}
      <div className="dock-right">
        <button
          className="speed-selector"
          onClick={onCycleSpeed}
          title="Playback Speed"
        >
          {playbackRate}x
        </button>

        <div className="volume-control-wrap">
          <button
            className="ctrl-btn"
            onClick={onToggleMute}
            title="Mute / Unmute (M)"
            style={{ width: '34px', height: '34px' }}
          >
            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <input
            id="volume-slider"
            name="volume"
            aria-label="Volume"
            type="range"
            className="volume-slider"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value) / 100)}
            title="Volume Slider"
          />
        </div>
      </div>

    </div>
  );
}

