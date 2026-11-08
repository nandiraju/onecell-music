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
  volume,
  onTogglePlayPause,
  onPlayNext,
  onPlayPrev,
  onToggleShuffle,
  onCycleRepeat,
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

      {/* Right: mute toggle only — speed selector and volume slider removed
          (unused real estate; volume is still adjustable via ArrowUp/Down). */}
      <div className="dock-right">
        <button
          className="ctrl-btn"
          onClick={onToggleMute}
          title="Mute / Unmute (M)"
        >
          {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

    </div>
  );
}

