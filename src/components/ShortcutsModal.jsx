import React, { useEffect } from 'react';

export default function ShortcutsModal({ isOpen, onClose, modalData, onPlayTrack }) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {modalData ? (
          // Track Details View
          <>
            <div className="modal-header">
              <div>
                <span className="pill-badge badge-bpm" style={{ marginBottom: '6px' }}>
                  {modalData.bpm} BPM
                </span>
                <h3 className="modal-title" style={{ fontSize: '20px' }}>{modalData.title}</h3>
                <div style={{ color: 'var(--active-accent)', fontSize: '13.5px', fontWeight: 600 }}>
                  {modalData.version}
                </div>
              </div>
              <button className="modal-close-btn" onClick={onClose}>&times;</button>
            </div>

            <div className="intel-grid" style={{ marginTop: '10px' }}>
              <div className="intel-box">
                <div className="intel-label">Genre</div>
                <div className="intel-value">{modalData.genre}</div>
              </div>
              <div className="intel-box">
                <div className="intel-label">Tone &amp; Key</div>
                <div className="intel-value">{modalData.key_tone}</div>
              </div>
              <div className="intel-box" style={{ gridColumn: 'span 2' }}>
                <div className="intel-label">Rhythm &amp; Beat Pattern</div>
                <div className="intel-value">{modalData.beat_type}</div>
              </div>
            </div>

            <div className="intel-description" style={{ marginTop: '12px', fontSize: '13.5px', lineHeight: 1.6 }}>
              {modalData.description}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
              <button
                className="header-action-btn"
                style={{ background: 'var(--active-accent)', color: '#05070e', fontWeight: 700 }}
                onClick={() => {
                  onPlayTrack(modalData);
                  onClose();
                }}
              >
                Play This Song Now
              </button>
            </div>
          </>
        ) : (
          // Keyboard Shortcuts View
          <>
            <div className="modal-header">
              <h3 className="modal-title">Keyboard Shortcuts</h3>
              <button className="modal-close-btn" onClick={onClose}>&times;</button>
            </div>

            <div>
              <div className="shortcut-row">
                <span>Play / Pause</span>
                <span className="kbd-badge">Space</span>
              </div>
              <div className="shortcut-row">
                <span>Next Track</span>
                <span className="kbd-badge">L / Right Arrow</span>
              </div>
              <div className="shortcut-row">
                <span>Previous Track</span>
                <span className="kbd-badge">J / Left Arrow</span>
              </div>
              <div className="shortcut-row">
                <span>Toggle Shuffle</span>
                <span className="kbd-badge">S</span>
              </div>
              <div className="shortcut-row">
                <span>Toggle Repeat Mode</span>
                <span className="kbd-badge">R</span>
              </div>
              <div className="shortcut-row">
                <span>Cycle Visualizer Mode</span>
                <span className="kbd-badge">V</span>
              </div>
              <div className="shortcut-row">
                <span>Volume Up / Down</span>
                <span className="kbd-badge">&uarr; / &darr;</span>
              </div>
              <div className="shortcut-row">
                <span>Toggle Mute</span>
                <span className="kbd-badge">M</span>
              </div>
              <div className="shortcut-row">
                <span>Fullscreen Visualizer</span>
                <span className="kbd-badge">F</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

