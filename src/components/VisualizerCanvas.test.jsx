import React, { createRef } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import VisualizerCanvas from './VisualizerCanvas.jsx';

afterEach(cleanup);

function setup(ref) {
  const audioRef = { current: null };
  return render(<VisualizerCanvas ref={ref} audioRef={audioRef} isPlaying={false} accentColor="#00f0ff" secondaryColor="#7000ff" />);
}

describe('VisualizerCanvas', () => {
  it('defaults to Spectrum mode and switches active mode on button click', () => {
    setup();
    expect(screen.getByTitle('Glass Equalizer Pillars')).toHaveClass('active');
    expect(screen.getByTitle('Flowing Sinusoidal Silk')).not.toHaveClass('active');

    fireEvent.click(screen.getByTitle('3D Orbiting Particle Nebula'));
    expect(screen.getByTitle('3D Orbiting Particle Nebula')).toHaveClass('active');
    expect(screen.getByTitle('Glass Equalizer Pillars')).not.toHaveClass('active');
  });

  it('exposes cycleMode() through a ref and wraps around after the last mode', () => {
    const ref = createRef();
    setup(ref);
    expect(ref.current).toBeTruthy();

    const order = [
      'Cybernetic Pulsar Reactor',
      '360° Circular Soundwave',
      '3D Orbiting Particle Nebula',
      'Flowing Sinusoidal Silk',
      'Glass Equalizer Pillars' // wraps back to the default mode
    ];

    for (const title of order) {
      act(() => ref.current.cycleMode());
      expect(screen.getByTitle(title)).toHaveClass('active');
    }
  });

  it('ref.toggleFullscreen() requests fullscreen on the container (the trigger button now lives in App.jsx\'s nav row)', () => {
    const ref = createRef();
    const { container } = setup(ref);
    const requestFullscreenSpy = vi.fn().mockResolvedValue(undefined);
    container.querySelector('.visualizer-container').requestFullscreen = requestFullscreenSpy;

    act(() => ref.current.toggleFullscreen());
    expect(requestFullscreenSpy).toHaveBeenCalledTimes(1);
  });

  it('exit-fullscreen button lives inside the container (true native fullscreen only renders the fullscreened element\'s own subtree, so the nav-row trigger is unreachable once active) and calls exitFullscreen', () => {
    const { container } = setup();
    const visualizer = container.querySelector('.visualizer-container');
    const exitFullscreenSpy = vi.fn().mockResolvedValue(undefined);
    document.exitFullscreen = exitFullscreenSpy;
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: visualizer });

    fireEvent.click(screen.getByTitle('Exit Fullscreen (F)'));
    expect(exitFullscreenSpy).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null });
  });
});
