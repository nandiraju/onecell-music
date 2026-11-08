import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TransportControls from './TransportControls.jsx';

afterEach(cleanup);

function setup(overrides = {}) {
  const props = {
    isPlaying: false,
    isShuffle: false,
    repeatMode: 'all',
    playbackRate: 1.0,
    volume: 0.85,
    onTogglePlayPause: vi.fn(),
    onPlayNext: vi.fn(),
    onPlayPrev: vi.fn(),
    onToggleShuffle: vi.fn(),
    onCycleRepeat: vi.fn(),
    onCycleSpeed: vi.fn(),
    onVolumeChange: vi.fn(),
    onToggleMute: vi.fn(),
    ...overrides
  };
  const utils = render(<TransportControls {...props} />);
  return { ...utils, props };
}

describe('TransportControls', () => {
  it('play/pause button title reflects isPlaying and click toggles it', () => {
    const { props, rerender } = setup({ isPlaying: false });
    expect(screen.getByTitle('Play (Space)')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Play (Space)'));
    expect(props.onTogglePlayPause).toHaveBeenCalledTimes(1);

    rerender(<TransportControls {...props} isPlaying={true} />);
    expect(screen.getByTitle('Pause (Space)')).toBeInTheDocument();
  });

  it('previous/next buttons fire their callbacks', () => {
    const { props } = setup();
    fireEvent.click(screen.getByTitle('Previous Track (J / ←)'));
    fireEvent.click(screen.getByTitle('Next Track (L / →)'));
    expect(props.onPlayPrev).toHaveBeenCalledTimes(1);
    expect(props.onPlayNext).toHaveBeenCalledTimes(1);
  });

  it('shuffle button reflects isShuffle via active class and fires its callback', () => {
    const { props, rerender, container } = setup({ isShuffle: false });
    const shuffleBtn = screen.getByTitle('Toggle Shuffle (S)');
    expect(shuffleBtn).not.toHaveClass('active');
    fireEvent.click(shuffleBtn);
    expect(props.onToggleShuffle).toHaveBeenCalledTimes(1);

    rerender(<TransportControls {...props} isShuffle={true} />);
    expect(container.querySelector('.ctrl-btn.active')).toBeInTheDocument();
  });

  it.each(['all', 'one', 'off'])('repeat button title reflects repeatMode "%s"', (mode) => {
    setup({ repeatMode: mode });
    expect(screen.getByTitle(`Repeat: ${mode.toUpperCase()} (R)`)).toBeInTheDocument();
  });

  it('repeat button click fires onCycleRepeat', () => {
    const { props } = setup({ repeatMode: 'one' });
    fireEvent.click(screen.getByTitle('Repeat: ONE (R)'));
    expect(props.onCycleRepeat).toHaveBeenCalledTimes(1);
  });

  it('speed selector shows the current rate and cycles on click', () => {
    const { props, rerender } = setup({ playbackRate: 1.25 });
    const speedBtn = screen.getByTitle('Playback Speed');
    expect(speedBtn).toHaveTextContent('1.25x');
    fireEvent.click(speedBtn);
    expect(props.onCycleSpeed).toHaveBeenCalledTimes(1);

    rerender(<TransportControls {...props} playbackRate={2} />);
    expect(screen.getByTitle('Playback Speed')).toHaveTextContent('2x');
  });

  it('mute button fires onToggleMute', () => {
    const { props } = setup();
    fireEvent.click(screen.getByTitle('Mute / Unmute (M)'));
    expect(props.onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('volume slider reflects volume as 0-100 and reports changes as 0-1', () => {
    const { props } = setup({ volume: 0.5 });
    const slider = screen.getByTitle('Volume Slider');
    expect(slider).toHaveValue('50');

    fireEvent.change(slider, { target: { value: '30' } });
    expect(props.onVolumeChange).toHaveBeenCalledWith(0.3);
  });
});
