import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function ShortcutsModal({ isOpen, onClose, modalData, onPlayTrack }) {
  // Keep the modal mounted a moment past isOpen:false so the close tween
  // can finish before it actually leaves the DOM.
  const [shouldRender, setShouldRender] = useState(isOpen);
  const overlayRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (isOpen) setShouldRender(true);
  }, [isOpen]);

  useEffect(() => {
    if (!shouldRender) return;
    const overlay = overlayRef.current;
    const card = cardRef.current;
    if (!overlay || !card) return;

    if (isOpen) {
      gsap.set(overlay, { opacity: 0 });
      gsap.set(card, { opacity: 0, scale: 0.86, y: 26 });
      gsap.to(overlay, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      // The "buttery spring": scale/position overshoot past 1 and settle —
      // opacity itself stays a plain fade, springing opacity reads as flicker.
      gsap.to(card, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        ease: 'back.out(1.7)'
      });
    } else {
      gsap.to(overlay, { opacity: 0, duration: 0.2, ease: 'power1.in' });
      gsap.to(card, {
        opacity: 0,
        scale: 0.92,
        y: 16,
        duration: 0.22,
        ease: 'power2.in',
        onComplete: () => setShouldRender(false)
      });
    }

    return () => {
      gsap.killTweensOf([overlay, card]);
    };
  }, [isOpen, shouldRender]);

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

  if (!shouldRender) return null;

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" ref={cardRef} onClick={(e) => e.stopPropagation()}>
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

