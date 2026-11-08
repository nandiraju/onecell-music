import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ShortcutsModal from './ShortcutsModal.jsx';

afterEach(cleanup);

const TRACK = {
  id: 't-1',
  title: 'Alpha Pulse',
  version: 'Radio Edit',
  genre: 'Techno',
  bpm: 128,
  key_tone: 'Bright',
  beat_type: 'Four on the floor',
  description: 'A driving techno cut.'
};

describe('ShortcutsModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ShortcutsModal isOpen={false} onClose={vi.fn()} modalData={null} onPlayTrack={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the keyboard shortcuts list when open with no modalData', () => {
    render(<ShortcutsModal isOpen={true} onClose={vi.fn()} modalData={null} onPlayTrack={vi.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    // Lock the documented shortcut contract that App.jsx's keydown handler must honor.
    expect(screen.getByText('Play / Pause').nextSibling).toHaveTextContent('Space');
    expect(screen.getByText('Toggle Shuffle').nextSibling).toHaveTextContent('S');
    expect(screen.getByText('Toggle Repeat Mode').nextSibling).toHaveTextContent('R');
    expect(screen.getByText('Cycle Visualizer Mode').nextSibling).toHaveTextContent('V');
    expect(screen.getByText('Toggle Mute').nextSibling).toHaveTextContent('M');
    expect(screen.getByText('Fullscreen Visualizer').nextSibling).toHaveTextContent('F');
  });

  it('shows track detail view when modalData is provided', () => {
    render(<ShortcutsModal isOpen={true} onClose={vi.fn()} modalData={TRACK} onPlayTrack={vi.fn()} />);
    expect(screen.getByText('Alpha Pulse')).toBeInTheDocument();
    expect(screen.getByText('Radio Edit')).toBeInTheDocument();
    expect(screen.getByText('Techno')).toBeInTheDocument();
    expect(screen.getByText('128 BPM')).toBeInTheDocument();
    expect(screen.getByText('Bright')).toBeInTheDocument();
    expect(screen.getByText('Four on the floor')).toBeInTheDocument();
    expect(screen.getByText('A driving techno cut.')).toBeInTheDocument();
  });

  it('"Play This Song Now" plays the track and closes the modal', () => {
    const onPlayTrack = vi.fn();
    const onClose = vi.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} modalData={TRACK} onPlayTrack={onPlayTrack} />);
    fireEvent.click(screen.getByText('Play This Song Now'));
    expect(onPlayTrack).toHaveBeenCalledWith(TRACK);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('close button and overlay click call onClose; the modal card itself does not', () => {
    const onClose = vi.fn();
    const { container } = render(<ShortcutsModal isOpen={true} onClose={onClose} modalData={null} onPlayTrack={vi.fn()} />);

    fireEvent.click(container.querySelector('.modal-card'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('.modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('pressing Escape key calls onClose', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} modalData={null} onPlayTrack={vi.fn()} />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
