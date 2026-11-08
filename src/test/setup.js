import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom has no real media pipeline — HTMLMediaElement.play/pause/load throw
// "not implemented" by default. Stub them so components under test can call
// audio.play()/.pause()/.load() like a real browser would.
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined)
});
Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn()
});
Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
  configurable: true,
  value: vi.fn()
});

// Canvas 2D context: jsdom doesn't implement canvas rendering at all.
// VisualizerCanvas just needs enough of the API surface to not throw.
const canvasContextStub = {
  scale: vi.fn(),
  setTransform: vi.fn(),
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  getContext: vi.fn()
};
window.HTMLCanvasElement.prototype.getContext = vi.fn(() => canvasContextStub);

// requestAnimationFrame / cancelAnimationFrame — jsdom has no rendering loop.
window.requestAnimationFrame = vi.fn((cb) => setTimeout(() => cb(Date.now()), 0));
window.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// Fullscreen API — unimplemented in jsdom.
window.HTMLElement.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

// matchMedia — used indirectly by some libraries; not implemented in jsdom.
window.matchMedia = window.matchMedia || vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}));

// Screen Wake Lock API — not implemented in jsdom.
Object.defineProperty(navigator, 'wakeLock', {
  configurable: true,
  value: {
    request: vi.fn().mockResolvedValue({
      released: false,
      release: vi.fn(),
      addEventListener: vi.fn()
    })
  }
});

// MediaSession API — not implemented in jsdom.
if (!('mediaSession' in navigator)) {
  Object.defineProperty(navigator, 'mediaSession', {
    configurable: true,
    value: {
      metadata: null,
      setActionHandler: vi.fn()
    }
  });
}
if (typeof window.MediaMetadata === 'undefined') {
  window.MediaMetadata = class MediaMetadata {
    constructor(init) {
      Object.assign(this, init);
    }
  };
}

// AudioContext / Web Audio API — not implemented in jsdom.
class FakeAnalyserNode {
  constructor() {
    this.fftSize = 2048;
    this.frequencyBinCount = 1024;
    this.smoothingTimeConstant = 0.8;
  }
  connect() {}
  disconnect() {}
  getByteFrequencyData(arr) {
    arr.fill(0);
  }
}
class FakeAudioContext {
  constructor() {
    this.state = 'running';
    this.destination = {};
  }
  createAnalyser() {
    return new FakeAnalyserNode();
  }
  createMediaElementSource() {
    return { connect: vi.fn(), disconnect: vi.fn() };
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}
window.AudioContext = window.AudioContext || FakeAudioContext;
window.webkitAudioContext = window.webkitAudioContext || FakeAudioContext;

// ResizeObserver — not implemented in jsdom. The mobile cube transition uses
// it to keep the 3D face depth in sync with the viewport's actual width.
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver || FakeResizeObserver;
