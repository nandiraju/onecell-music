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
    volume: 0.85,
    onTogglePlayPause: vi.fn(),
    onPlayNext: vi.fn(),
    onPlayPrev: vi.fn(),
    onToggleShuffle: vi.fn(),
    onCycleRepeat: vi.fn(),
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

  it('mute button fires onToggleMute', () => {
    const { props } = setup();
    fireEvent.click(screen.getByTitle('Mute / Unmute (M)'));
    expect(props.onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('mute button icon reflects muted (volume 0) vs unmuted state', () => {
    const { container, rerender, props } = setup({ volume: 0.5 });
    expect(container.querySelector('.lucide-volume-2')).toBeInTheDocument();

    rerender(<TransportControls {...props} volume={0} />);
    expect(container.querySelector('.lucide-volume-x')).toBeInTheDocument();
  });

  it('does not render the speed selector or volume slider (removed)', () => {
    const { container } = setup();
    expect(screen.queryByTitle('Playback Speed')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Volume Slider')).not.toBeInTheDocument();
    expect(container.querySelector('.speed-selector')).not.toBeInTheDocument();
    expect(container.querySelector('.volume-slider')).not.toBeInTheDocument();
  });
});
